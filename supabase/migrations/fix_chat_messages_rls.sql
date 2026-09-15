-- ================================================================
-- PokeGuide - Corrección definitiva para el sistema de mensajería privada (Chat)
-- Ejecuta este script en el Supabase SQL Editor para desbloquear el envío de mensajes.
-- ================================================================

-- 1. Asegurar estructura de tabla messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  read_at TIMESTAMPTZ,
  CONSTRAINT messages_no_self_message CHECK (sender_id <> receiver_id)
);

-- Índices de alto rendimiento para el chat
CREATE INDEX IF NOT EXISTS messages_conversation_idx 
  ON public.messages (sender_id, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_receiver_unread_idx 
  ON public.messages (receiver_id, read_at) 
  WHERE read_at IS NULL;

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas previas para evitar conflictos o bloqueos
DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;
DROP POLICY IF EXISTS "Friends can send private messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark received messages as read" ON public.messages;

-- 4. POLÍTICA SELECT:
-- Los usuarios pueden leer únicamente los mensajes donde ellos son el remitente o el destinatario
CREATE POLICY "Users can read their own messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() IN (sender_id, receiver_id));

-- 5. POLÍTICA INSERT:
-- Los usuarios autenticados pueden enviar mensajes a otros usuarios
-- Verifica:
-- a) Que el sender_id corresponda al usuario autenticado (auth.uid())
-- b) Que no se intente enviar un mensaje a sí mismo (sender_id <> receiver_id)
-- c) Que ninguno de los dos usuarios haya bloqueado al otro (respetando la tabla public.blocks)
CREATE POLICY "Authenticated users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id 
    AND sender_id <> receiver_id
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks b
      WHERE (b.blocker_id = receiver_id AND b.blocked_id = sender_id)
         OR (b.blocker_id = sender_id AND b.blocked_id = receiver_id)
    )
  );

-- 6. POLÍTICA UPDATE:
-- El destinatario puede actualizar el mensaje para marcarlo como leído (read_at)
CREATE POLICY "Recipients can mark received messages as read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- 7. Asegurar que Realtime está activo para public.messages
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; 
  END IF;
END $$;
