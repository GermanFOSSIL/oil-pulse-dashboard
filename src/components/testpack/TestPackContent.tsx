
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/services/types";
import { Tags as TagsIcon, Clock, CheckCircle, Calendar } from "lucide-react";
import TagList from "@/components/testpack/TagList";

interface TestPackContentProps {
  tags: Tag[];
  testPackId: string;
  onRefresh: () => void;
}

const TestPackContent = ({
  tags,
  testPackId,
  onRefresh
}: TestPackContentProps) => {
  // Calculate tag stats
  const totalTags = tags.length;
  const releasedTags = tags.filter(tag => tag.estado === "liberado").length;
  const progress = totalTags > 0 ? Math.round((releasedTags / totalTags) * 100) : 0;
  
  // Group tags by date
  const tagsByDate = tags.reduce((acc, tag) => {
    if (tag.estado !== "liberado" || !tag.fecha_liberacion) return acc;
    
    const date = new Date(tag.fecha_liberacion).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);
  
  // Sort dates in descending order
  const sortedDates = Object.keys(tagsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  // Format date from ISO to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TagsIcon className="h-4 w-4 text-primary" />
              Total TAGs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTags}</div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <Badge variant={totalTags > 0 ? "outline" : "secondary"} className="mr-2">
                {totalTags}
              </Badge>
              TAGs registrados
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              TAGs Liberados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{releasedTags}</div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <Badge variant={releasedTags > 0 ? "default" : "secondary"} className="mr-2 bg-green-500">
                {releasedTags}
              </Badge>
              TAGs liberados
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Timeline of released tags */}
      {sortedDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cronología de Liberaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 before:-translate-x-1/2 before:bg-muted before:h-full">
              {sortedDates.map((date) => (
                <div key={date} className="relative pl-8">
                  <div className="absolute left-0 flex items-center justify-center -translate-x-1/2 w-9 h-9 rounded-full bg-muted border border-muted-foreground/10">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="font-semibold text-md">{formatDate(date)}</div>
                  <div className="mt-2 space-y-2">
                    {tagsByDate[date].map((tag) => (
                      <div key={tag.id} className="p-2 border rounded-md bg-muted/30">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium">{tag.tag_name}</div>
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
                            Liberado
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(tag.fecha_liberacion!).toLocaleTimeString('es-ES')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <TagsIcon className="h-5 w-5" />
            TAGs 
            <span className="text-sm text-muted-foreground">
              ({tags.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TagList 
            tags={tags} 
            testPackId={testPackId}
            onRefresh={onRefresh}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPackContent;
