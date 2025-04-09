
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, File, Image } from "lucide-react";
import { uploadFile } from "@/services/storageService";

interface FileUploadProps {
  bucket: string;
  folder?: string;
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSize?: number; // en MB
}

export const FileUpload = ({
  bucket,
  folder = "",
  onUploadComplete,
  accept = "image/*,application/pdf",
  maxSize = 5, // 5MB por defecto
}: FileUploadProps) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    // Validar tamaño del archivo
    if (file.size > maxSize * 1024 * 1024) {
      setError(`El archivo excede el tamaño máximo de ${maxSize}MB`);
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Si es una imagen, mostrar vista previa
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        // Vista previa para PDF (icono)
        setPreviewUrl("pdf");
      } else {
        // Vista previa para otros archivos (icono)
        setPreviewUrl("file");
      }

      // Subir archivo a Supabase
      const url = await uploadFile(bucket, file, folder);
      if (url) {
        onUploadComplete(url);
      }
    } catch (err) {
      console.error("Error al subir archivo:", err);
      setError("Ocurrió un error al subir el archivo. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
      />

      {!previewUrl ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadCloud
              className={`h-10 w-10 ${dragging ? "text-primary" : "text-gray-400"}`}
            />
            <p className="text-sm text-gray-500">
              Arrastra y suelta o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-400">
              Tamaño máximo: {maxSize}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="relative border rounded-lg overflow-hidden">
          {previewUrl === "pdf" ? (
            <div className="flex items-center justify-center h-40 bg-gray-100">
              <File className="h-16 w-16 text-primary/60" />
              <span className="ml-2 font-medium">PDF</span>
            </div>
          ) : previewUrl === "file" ? (
            <div className="flex items-center justify-center h-40 bg-gray-100">
              <File className="h-16 w-16 text-primary/60" />
              <span className="ml-2 font-medium">Archivo</span>
            </div>
          ) : (
            <img
              src={previewUrl}
              alt="Vista previa"
              className="w-full h-40 object-cover"
            />
          )}
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              clearPreview();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}

      {uploading && (
        <div className="w-full mt-2">
          <div className="h-1 w-full bg-gray-200 rounded overflow-hidden">
            <div className="h-full bg-primary animate-pulse" style={{ width: "100%" }}></div>
          </div>
          <p className="text-xs text-center mt-1 text-gray-500">Subiendo archivo...</p>
        </div>
      )}
    </div>
  );
};
