
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Tags as TagsIcon } from "lucide-react";

interface TestPackLoadingProps {
  isNotFound?: boolean;
  onBack: () => void;
}

const TestPackLoading = ({ isNotFound, onBack }: TestPackLoadingProps) => {
  if (isNotFound) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          className="gap-2"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </Button>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
            <TagsIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Test Pack no encontrado</h3>
            <p className="text-muted-foreground mb-4">
              El Test Pack que está buscando no existe o ha sido eliminado.
            </p>
            <Button variant="default" onClick={onBack}>
              Volver a Test Packs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default TestPackLoading;
