
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, File } from "lucide-react";

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

export const FileUpload = ({
  onFilesSelected,
  disabled = false,
  maxFiles = 1,
  acceptedFileTypes = ["*/*"],
}: FileUploadProps) => {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).slice(0, maxFiles);
      onFilesSelected(filesArray);
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
      const filesArray = Array.from(e.dataTransfer.files).slice(0, maxFiles);
      onFilesSelected(filesArray);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileChange}
        disabled={disabled}
        multiple={maxFiles > 1}
      />

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={disabled ? undefined : triggerFileInput}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <UploadCloud
            className={`h-10 w-10 ${dragging ? "text-primary" : "text-gray-400"}`}
          />
          <p className="text-sm text-gray-500">
            {disabled ? 'Carga de archivos deshabilitada' : 'Arrastra y suelta o haz clic para seleccionar'}
          </p>
          <p className="text-xs text-gray-400">
            {maxFiles > 1 ? `Máximo ${maxFiles} archivos` : 'Máximo 1 archivo'}
          </p>
        </div>
      </div>
    </div>
  );
};
