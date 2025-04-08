
import { useQuery } from "@tanstack/react-query";
import { getTestPackWithTags, updateTag, Tag, TestPack } from "@/services/testPackService";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag as TagIcon } from "lucide-react";

interface TestPackTagsProps {
  testPackId: string;
  userRole: string;
  onTagRelease: (tagId: string) => void;
}

const TestPackTags = ({ 
  testPackId, 
  userRole, 
  onTagRelease 
}: TestPackTagsProps) => {
  const { data: testPack, isLoading } = useQuery({
    queryKey: ['testPack', testPackId],
    queryFn: () => getTestPackWithTags(testPackId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6 mt-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!testPack || !testPack.tags || testPack.tags.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">TAGs del Test Pack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">No hay TAGs asociados a este Test Pack.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const columns = [
    {
      header: "TAG",
      accessorKey: "tag_name",
      cell: ({ row }) => {
        const tag = row.original as Tag;
        return (
          <div className="flex items-center gap-2">
            <TagIcon className="h-4 w-4 text-muted-foreground" />
            <span>{tag.tag_name}</span>
          </div>
        );
      },
    },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: ({ row }) => {
        const tag = row.original as Tag;
        return (
          <Badge variant={tag.estado === 'liberado' ? 'default' : 'outline'}>
            {tag.estado === 'liberado' ? 'Liberado' : 'Pendiente'}
          </Badge>
        );
      },
    },
    {
      header: "Fecha Liberación",
      accessorKey: "fecha_liberacion",
      cell: ({ row }) => {
        const tag = row.original as Tag;
        return (
          <span>{tag.fecha_liberacion ? new Date(tag.fecha_liberacion).toLocaleString() : 'Pendiente'}</span>
        );
      },
    },
    {
      header: "Liberar",
      accessorKey: "actions",
      cell: ({ row }) => {
        const tag = row.original as Tag;
        return (
          <Checkbox
            checked={tag.estado === 'liberado'}
            disabled={tag.estado === 'liberado' || (userRole !== 'admin' && userRole !== 'tecnico')}
            onCheckedChange={() => onTagRelease(tag.id)}
          />
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">TAGs del Test Pack</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium">Progreso: </span>
              <span className="text-sm">{testPack.progress || 0}%</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {testPack.tags.filter(tag => tag.estado === 'liberado').length} de {testPack.tags.length} TAGs liberados
            </div>
          </div>
          <Progress value={testPack.progress || 0} className="h-2 mt-1" />
        </div>
        
        <DataTable
          columns={columns}
          data={testPack.tags}
        />
      </CardContent>
    </Card>
  );
};

export default TestPackTags;
