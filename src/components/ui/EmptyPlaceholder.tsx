
import { Card, CardContent } from "@/components/ui/card";

interface EmptyPlaceholderProps {
  title: string;
  description: string;
}

export const EmptyPlaceholder = ({ title, description }: EmptyPlaceholderProps) => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        <h3 className="mt-2 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
