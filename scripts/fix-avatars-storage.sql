-- Удаляем все существующие политики для storage
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Удаляем bucket если существует
DELETE FROM storage.buckets WHERE id = 'avatars';

-- Создаем bucket заново с публичным доступом
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Отключаем RLS для bucket avatars (упрощаем)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Или создаем простые политики для всех пользователей
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Разрешаем всем загружать в avatars bucket
CREATE POLICY "Anyone can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Разрешаем всем просматривать avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Разрешаем всем обновлять avatars
CREATE POLICY "Anyone can update avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars');

-- Разрешаем всем удалять avatars
CREATE POLICY "Anyone can delete avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars');

COMMIT;
