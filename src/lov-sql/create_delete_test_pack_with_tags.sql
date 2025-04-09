
-- Function to delete a test pack and all its associated tags in a single transaction
CREATE OR REPLACE FUNCTION public.delete_test_pack_with_tags(test_pack_id UUID)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  tag_count INTEGER;
  deleted_tag_count INTEGER;
  test_pack_name TEXT;
BEGIN
  -- First verify test pack exists and get its name
  SELECT nombre_paquete INTO test_pack_name FROM public.test_packs WHERE id = test_pack_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Count how many tags exist for this test pack
  SELECT COUNT(*) INTO tag_count FROM public.tags WHERE tags.test_pack_id = test_pack_id;
  
  -- Delete all tags associated with the test pack
  DELETE FROM public.tags WHERE tags.test_pack_id = test_pack_id;
  GET DIAGNOSTICS deleted_tag_count = ROW_COUNT;
  
  -- Log the tag deletion
  INSERT INTO public.db_activity_log (action, table_name, record_id, details)
  VALUES ('DELETE_BATCH', 'tags', test_pack_id::text, 
          jsonb_build_object('count', deleted_tag_count, 
                            'test_pack_id', test_pack_id, 
                            'test_pack_name', test_pack_name));
  
  -- Delete the test pack itself
  DELETE FROM public.test_packs WHERE id = test_pack_id;
  
  -- Log the test pack deletion
  INSERT INTO public.db_activity_log (action, table_name, record_id, details)
  VALUES ('DELETE', 'test_packs', test_pack_id::text, 
          jsonb_build_object('test_pack_id', test_pack_id, 
                            'test_pack_name', test_pack_name, 
                            'tags_deleted', deleted_tag_count));
  
  -- Return success
  RETURN TRUE;
END;
$$;
