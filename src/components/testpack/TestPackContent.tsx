
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/services/types";
import { Tags as TagsIcon, Clock, CheckCircle } from "lucide-react";
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
