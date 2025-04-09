
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tag } from "@/services/types";
import { Tags as TagsIcon } from "lucide-react";
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
  return (
    <Card>
      <CardContent>
        <div className="space-y-4 pt-6">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <TagsIcon className="h-5 w-5" />
            TAGs 
            <span className="text-sm text-muted-foreground">
              ({tags.length})
            </span>
          </h3>
          
          <TagList 
            tags={tags} 
            testPackId={testPackId}
            onRefresh={onRefresh}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TestPackContent;
