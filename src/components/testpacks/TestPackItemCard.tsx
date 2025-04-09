
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TestPack } from "@/services/testPackService";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TestPackTags from "./TestPackTags";
import { Edit, Trash2 } from "lucide-react";

interface TestPackItemCardProps {
  testPack: TestPack;
  isExpanded: boolean;
  userRole: string;
  onToggleExpand: (id: string) => void;
  onEdit: (testPack: TestPack) => void;
  onDelete: (testPack: TestPack) => void;
  onTagRelease: (tagId: string) => void;
}

export const TestPackItemCard = ({
  testPack,
  isExpanded,
  userRole,
  onToggleExpand,
  onEdit,
  onDelete,
  onTagRelease
}: TestPackItemCardProps) => {
  return (
    <Card className={isExpanded ? "ring-2 ring-primary" : ""}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap justify-between items-start">
          <div>
            <CardTitle className="text-lg">{testPack.nombre_paquete}</CardTitle>
            <CardDescription>
              ITR: {testPack.itr_name || testPack.itr_asociado} | Sistema: {testPack.sistema} | Subsistema: {testPack.subsistema}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={testPack.estado === 'listo' ? 'default' : 'outline'}>
              {testPack.estado === 'listo' ? 'Listo' : 'Pendiente'}
            </Badge>
            {userRole === 'admin' && (
              <div className="flex space-x-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onEdit(testPack)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white"
                  onClick={() => onDelete(testPack)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">Progreso:</span>
            <span className="text-sm font-medium">{testPack.progress || 0}%</span>
          </div>
          <Progress value={testPack.progress || 0} className="h-2" />
        </div>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={() => onToggleExpand(testPack.id)}
        >
          {isExpanded ? "Ocultar TAGs" : "Ver TAGs"}
        </Button>
        
        {isExpanded && (
          <div className="mt-4">
            <TestPackTags
              testPackId={testPack.id}
              userRole={userRole}
              onTagRelease={onTagRelease}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
