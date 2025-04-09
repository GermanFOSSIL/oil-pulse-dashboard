
-- Function to delete a test pack and all its associated tags in a single transaction
CREATE OR REPLACE FUNCTION public.delete_test_pack_with_tags(test_pack_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete all tags associated with the test pack
  DELETE FROM public.tags WHERE test_pack_id = $1;
  
  -- Delete the test pack itself
  DELETE FROM public.test_packs WHERE id = $1;
END;
$$;
