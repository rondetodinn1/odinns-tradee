-- Создаем bucket для скриншотов
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true);

-- Создаем политики для bucket
CREATE POLICY "Anyone can view screenshots" ON storage.objects
FOR SELECT USING (bucket_id = 'screenshots');

CREATE POLICY "Authenticated users can upload screenshots" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'screenshots' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own screenshots" ON storage.objects
FOR UPDATE USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own screenshots" ON storage.objects
FOR DELETE USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
