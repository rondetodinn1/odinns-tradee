-- Простое решение без RLS политик - просто создаем bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Отключаем RLS для этого bucket (простое решение)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'screenshots';
