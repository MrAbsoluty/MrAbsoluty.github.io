-- ================================================================
-- PokeGuide - Migración: Agregar avatar_url y Bucket de Storage
-- ================================================================

-- 1. Agregar columna avatar_url a public.profiles si no existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Crear bucket de Storage 'avatars' si no existe
-- (Público para que las imágenes de perfil puedan ser visualizadas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  10485760, -- 10 MB límite
  ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];

-- 3. Políticas de Row Level Security en storage.objects para el bucket 'avatars'

-- Política A: Lectura pública de avatares
DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Política B: Usuarios autenticados solo pueden subir a su propia carpeta (avatars/{user_id}/...)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política C: Usuarios autenticados solo pueden actualizar su propio avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política D: Usuarios autenticados solo pueden eliminar su propio avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
