
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="bg-gray-100 h-16"></CardHeader>
          <CardContent>
            <div className="h-10 bg-gray-100 rounded-md mb-2"></div>
            <div className="h-4 bg-gray-100 rounded-md w-3/4"></div>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-2 overflow-hidden">
        <CardHeader className="bg-gray-100 h-12"></CardHeader>
        <CardContent className="p-0">
          <div className="h-80 bg-gray-100"></div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gray-100 h-12"></CardHeader>
        <CardContent className="p-0">
          <div className="h-80 bg-gray-100"></div>
        </CardContent>
      </Card>
    </div>
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-100 h-12"></CardHeader>
      <CardContent className="p-0">
        <div className="h-96 bg-gray-100"></div>
      </CardContent>
    </Card>
  </div>
);
