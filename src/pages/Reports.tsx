
import { BarChart, BarChart3, FilePieChart, FileText, LineChart, PieChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and view reports for your projects
        </p>
      </div>

      <Tabs defaultValue="standard">
        <TabsList className="mb-4">
          <TabsTrigger value="standard">Standard Reports</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="standard">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-secondary" />
                  Project Status Report
                </CardTitle>
                <CardDescription>
                  Overview of all project statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Summary of status across all projects including completion rates and schedule adherence.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="mr-2">Preview</Button>
                  <Button size="sm">Generate</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-secondary" />
                  ITR Compliance Report
                </CardTitle>
                <CardDescription>
                  ITR completion and compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Detailed analysis of ITR completion rates and compliance with standards.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="mr-2">Preview</Button>
                  <Button size="sm">Generate</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <LineChart className="h-5 w-5 mr-2 text-secondary" />
                  Resource Utilization
                </CardTitle>
                <CardDescription>
                  Resource allocation and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Analysis of resource allocation and utilization across projects and systems.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="mr-2">Preview</Button>
                  <Button size="sm">Generate</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-secondary" />
                  System Health Report
                </CardTitle>
                <CardDescription>
                  Systems and subsystems health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive report on the health and performance of all systems and subsystems.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="mr-2">Preview</Button>
                  <Button size="sm">Generate</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <FilePieChart className="h-5 w-5 mr-2 text-secondary" />
                  Monthly Progress Report
                </CardTitle>
                <CardDescription>
                  Monthly analysis of progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Monthly report showing progress, deviations, and forecasts for all active projects.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="mr-2">Preview</Button>
                  <Button size="sm">Generate</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-secondary" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Analysis of key performance indicators across all projects, systems, and personnel.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="mr-2">Preview</Button>
                  <Button size="sm">Generate</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>
                Create customized reports based on your specific needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Use the custom report builder to create reports with exactly the data and metrics you need.
              </p>
              <Button>Create Custom Report</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Configure automated report generation and distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Set up scheduled reports to be automatically generated and sent to specified recipients.
              </p>
              <Button>Schedule New Report</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
