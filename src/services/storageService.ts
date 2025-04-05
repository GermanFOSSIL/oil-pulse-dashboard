
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Crear un bucket si no existe
export const createBucketIfNotExists = async (bucketName: string): Promise<void> => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true
      });
      
      if (error) throw error;
      console.log(`Bucket ${bucketName} creado exitosamente`);
    }
  } catch (error: any) {
    console.error("Error al crear bucket:", error);
    toast({
      title: "Error en almacenamiento",
      description: error.message || "Ha ocurrido un error al inicializar el almacenamiento",
      variant: "destructive",
    });
  }
};

// Subir archivo y obtener URL pública
export const uploadFile = async (bucketName: string, file: File, folder: string = ''): Promise<string | null> => {
  try {
    // Asegurarse de que el bucket existe
    await createBucketIfNotExists(bucketName);
    
    // Generar un nombre de archivo único con timestamp
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder ? `${folder}/` : ''}${timestamp}-${file.name.split('.')[0]}.${fileExt}`;
    
    // Subir el archivo
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);
      
    if (uploadError) throw uploadError;
    
    // Obtener la URL pública
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    toast({
      title: "Archivo subido",
      description: "El archivo se ha subido correctamente",
    });
    
    return data.publicUrl;
  } catch (error: any) {
    console.error("Error al subir archivo:", error);
    toast({
      title: "Error al subir archivo",
      description: error.message || "Ha ocurrido un error al subir el archivo",
      variant: "destructive",
    });
    return null;
  }
};

// Listar archivos en un bucket o carpeta
export const listFiles = async (bucketName: string, folder: string = ''): Promise<{name: string, url: string}[]> => {
  try {
    // Asegurarse de que el bucket existe
    await createBucketIfNotExists(bucketName);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folder);
      
    if (error) throw error;
    
    // Convertir a objetos con URLs
    return data.map(file => ({
      name: file.name,
      url: supabase.storage.from(bucketName).getPublicUrl(`${folder ? `${folder}/` : ''}${file.name}`).data.publicUrl
    }));
  } catch (error: any) {
    console.error("Error al listar archivos:", error);
    toast({
      title: "Error al listar archivos",
      description: error.message || "Ha ocurrido un error al obtener la lista de archivos",
      variant: "destructive",
    });
    return [];
  }
};

// Eliminar un archivo
export const deleteFile = async (bucketName: string, filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
      
    if (error) throw error;
    
    toast({
      title: "Archivo eliminado",
      description: "El archivo se ha eliminado correctamente",
    });
    
    return true;
  } catch (error: any) {
    console.error("Error al eliminar archivo:", error);
    toast({
      title: "Error al eliminar archivo",
      description: error.message || "Ha ocurrido un error al eliminar el archivo",
      variant: "destructive",
    });
    return false;
  }
};

// Inicializar los buckets necesarios para la aplicación
export const initializeStorage = async (): Promise<void> => {
  await Promise.all([
    createBucketIfNotExists('evidence'),
    createBucketIfNotExists('documents'),
    createBucketIfNotExists('avatars')
  ]);
};
