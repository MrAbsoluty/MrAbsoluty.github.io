-- ================================================================
-- PokeGuide - Migración: Sistema Social de Seguidores y Siguiendo
-- Tablas: follows, blocks, user_favorites y ajustes en profiles
-- ================================================================

-- 1. Actualizar tabla public.profiles con campos de privacidad y presentación
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
  ADD COLUMN IF NOT EXISTS favorites_visibility TEXT NOT NULL DEFAULT 'public' CHECK (favorites_visibility IN ('public', 'followers', 'private')),
  ADD COLUMN IF NOT EXISTS follow_list_visibility TEXT NOT NULL DEFAULT 'public' CHECK (follow_list_visibility IN ('public', 'private')),
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '' CHECK (char_length(bio) <= 250),
  ADD COLUMN IF NOT EXISTS featured_pokemon TEXT DEFAULT 'charizard';

-- Comentarios sobre las columnas
COMMENT ON COLUMN public.profiles.profile_visibility IS 'Control de visibilidad del perfil: public (cualquiera puede seguir y ver) o private (requiere aprobación).';
COMMENT ON COLUMN public.profiles.favorites_visibility IS 'Visibilidad de favoritos: public (todos), followers (solo seguidores aprobados) o private (solo el propietario).';
COMMENT ON COLUMN public.profiles.follow_list_visibility IS 'Visibilidad de listas de seguidores y seguidos: public o private.';

-- 2. Crear tabla public.follows (Relaciones de seguimiento)
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Regla: un usuario no puede seguirse a sí mismo
  CONSTRAINT follows_no_self_follow CHECK (follower_id <> following_id),
  -- Regla: impedir duplicados de seguimiento entre la misma pareja
  CONSTRAINT unique_follower_following UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows (follower_id, status);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows (following_id, status);

-- Trigger de updated_at para follows
DROP TRIGGER IF EXISTS update_follows_updated_at ON public.follows;
CREATE TRIGGER update_follows_updated_at
  BEFORE UPDATE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Crear tabla public.blocks (Arquitectura preparada para futuros bloqueos)
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT blocks_no_self_block CHECK (blocker_id <> blocked_id),
  CONSTRAINT unique_blocker_blocked UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS blocks_blocker_idx ON public.blocks (blocker_id);
CREATE INDEX IF NOT EXISTS blocks_blocked_idx ON public.blocks (blocked_id);

-- 4. Crear tabla public.user_favorites (Favoritos sincronizados en base de datos)
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pokemon_id INT,
  pokemon_name TEXT NOT NULL,
  added_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT unique_user_favorite UNIQUE (user_id, pokemon_name)
);

CREATE INDEX IF NOT EXISTS user_favorites_user_idx ON public.user_favorites (user_id, added_at DESC);

-- ================================================================
-- 5. Habilitar Row Level Security (RLS)
-- ================================================================
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 6. Políticas RLS para public.follows
-- ================================================================

-- SELECT en follows:
-- 1. Los usuarios pueden ver los follows donde participan (como follower o following)
-- 2. Si el follow está aceptado y el usuario inspeccionado tiene follow_list_visibility = 'public',
--    o si se consulta para verificar conteos públicos.
DROP POLICY IF EXISTS "Users can read their own follows or public follows" ON public.follows;
CREATE POLICY "Users can read their own follows or public follows"
  ON public.follows FOR SELECT
  TO authenticated, anon
  USING (
    auth.uid() = follower_id
    OR auth.uid() = following_id
    OR (
      status = 'accepted'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = public.follows.following_id
          AND p.follow_list_visibility = 'public'
      )
    )
  );

-- INSERT en follows:
-- Solo el usuario autenticado puede seguir actuando como follower_id.
-- No puede auto-seguirse (reforzado con auth.uid() <> following_id).
DROP POLICY IF EXISTS "Authenticated users can follow" ON public.follows;
CREATE POLICY "Authenticated users can follow"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = follower_id
    AND follower_id <> following_id
  );

-- UPDATE en follows:
-- Solo el usuario seguido (following_id) puede aceptar una solicitud (pasar de pending a accepted).
DROP POLICY IF EXISTS "Target user can accept follow request" ON public.follows;
CREATE POLICY "Target user can accept follow request"
  ON public.follows FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = following_id
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = following_id
    AND status = 'accepted'
  );

-- DELETE en follows:
-- El seguidor puede dejar de seguir o cancelar solicitud (follower_id = auth.uid())
-- O el seguido puede rechazar solicitud o remover seguidor (following_id = auth.uid())
DROP POLICY IF EXISTS "Users can remove follow relations" ON public.follows;
CREATE POLICY "Users can remove follow relations"
  ON public.follows FOR DELETE
  TO authenticated
  USING (
    auth.uid() = follower_id
    OR auth.uid() = following_id
  );

-- ================================================================
-- 7. Políticas RLS para public.user_favorites
-- ================================================================

-- SELECT en user_favorites:
-- 1. El dueño puede ver siempre sus favoritos
-- 2. Terceros pueden ver si favorites_visibility = 'public'
-- 3. Terceros pueden ver si favorites_visibility = 'followers' Y existe follow aceptado
DROP POLICY IF EXISTS "Favorites viewable according to privacy settings" ON public.user_favorites;
CREATE POLICY "Favorites viewable according to privacy settings"
  ON public.user_favorites FOR SELECT
  TO authenticated, anon
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = public.user_favorites.user_id
        AND (
          p.favorites_visibility = 'public'
          OR (
            p.favorites_visibility = 'followers'
            AND EXISTS (
              SELECT 1 FROM public.follows f
              WHERE f.follower_id = auth.uid()
                AND f.following_id = p.id
                AND f.status = 'accepted'
            )
          )
        )
    )
  );

-- INSERT en user_favorites: solo el propietario
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.user_favorites;
CREATE POLICY "Users can insert their own favorites"
  ON public.user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE en user_favorites: solo el propietario
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.user_favorites;
CREATE POLICY "Users can delete their own favorites"
  ON public.user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ================================================================
-- 8. Políticas RLS para public.blocks
-- ================================================================

DROP POLICY IF EXISTS "Users can manage their blocks" ON public.blocks;
CREATE POLICY "Users can manage their blocks"
  ON public.blocks FOR ALL
  TO authenticated
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id AND blocker_id <> blocked_id);

-- ================================================================
-- 9. Habilitar Supabase Realtime para public.follows
-- ================================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'follows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
  END IF;
END $$;
