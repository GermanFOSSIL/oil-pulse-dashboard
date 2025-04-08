
-- Verifica si existe la tabla test_packs
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'test_packs'
);

-- Verifica si existe la tabla tags
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'tags'
);

-- Verifica las columnas de la tabla test_packs
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'test_packs';

-- Verifica las columnas de la tabla tags
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tags';
