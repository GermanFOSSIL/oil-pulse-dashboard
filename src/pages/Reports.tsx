
import { useState, useEffect } from "react";
import { BarChart, BarChart3, FilePieChart, FileText, LineChart, PieChart, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ProjectSelector } from "@/components/ProjectSelector";
import { generateReport, getProjects, Project } from "@/services/supabaseService";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extender jsPDF para añadir autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const Reports = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Cargar información del proyecto seleccionado
    const loadProjectDetails = async () => {
      if (!selectedProjectId) {
        setSelectedProject(null);
        return;
      }
      
      try {
        const projects = await getProjects();
        const project = projects.find(p => p.id === selectedProjectId);
        setSelectedProject(project || null);
      } catch (error) {
        console.error("Error al cargar detalles del proyecto:", error);
      }
    };
    
    loadProjectDetails();
  }, [selectedProjectId]);

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  const handleGenerateReport = async (reportType: string) => {
    if (!selectedProjectId) {
      toast({
        title: "Seleccione un proyecto",
        description: "Debe seleccionar un proyecto para generar el reporte",
        variant: "destructive"
      });
      return;
    }

    setGeneratingReport(reportType);
    toast({
      title: "Generando reporte",
      description: `El reporte de ${reportType} se está generando, espere un momento`
    });

    try {
      // Llamar al servicio para generar el reporte
      const url = await generateReport(reportType, selectedProjectId);
      setReportUrl(url);
      
      // Crear un PDF con jsPDF
      const doc = new jsPDF();
      
      // Añadir título
      doc.setFontSize(18);
      doc.text(`Reporte: ${reportType}`, 14, 22);
      
      // Añadir información del proyecto
      doc.setFontSize(12);
      doc.text(`Proyecto: ${selectedProject?.name || 'No seleccionado'}`, 14, 32);
      doc.text(`Estado: ${translateStatus(selectedProject?.status || '')}`, 14, 38);
      doc.text(`Progreso: ${selectedProject?.progress || 0}%`, 14, 44);
      doc.text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 14, 50);
      
      // Añadir separador
      doc.line(14, 55, 196, 55);
      
      // Información obtenida por simulación
      const reportData = await fetch(url).then(res => res.json());
      
      // Tabla resumen de sistemas
      doc.setFontSize(14);
      doc.text('Resumen de Sistemas', 14, 65);
      
      // Crear tabla con autotable
      doc.autoTable({
        startY: 70,
        head: [['Sistema', 'Progreso', 'Subsistemas', 'ITRs']],
        body: reportData.systems.map((system: any) => {
          const subsystemsCount = reportData.subsystems.filter((s: any) => s.system_id === system.id).length;
          const itrsCount = reportData.itrs.filter((itr: any) => {
            const subsystem = reportData.subsystems.find((s: any) => s.id === itr.subsystem_id);
            return subsystem && subsystem.system_id === system.id;
          }).length;
          
          return [
            system.name,
            `${system.completion_rate || 0}%`,
            subsystemsCount.toString(),
            itrsCount.toString()
          ];
        })
      });
      
      // Añadir estadísticas de ITRs
      const totalITRs = reportData.itrs.length;
      const completedITRs = reportData.itrs.filter((itr: any) => itr.status === 'complete').length;
      const inProgressITRs = reportData.itrs.filter((itr: any) => itr.status === 'inprogress').length;
      const delayedITRs = reportData.itrs.filter((itr: any) => itr.status === 'delayed').length;
      
      const currentY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(14);
      doc.text('Estadísticas de ITRs', 14, currentY);
      
      doc.setFontSize(12);
      doc.text(`Total de ITRs: ${totalITRs}`, 14, currentY + 10);
      doc.text(`Completados: ${completedITRs} (${Math.round(completedITRs / Math.max(totalITRs, 1) * 100)}%)`, 14, currentY + 16);
      doc.text(`En Progreso: ${inProgressITRs} (${Math.round(inProgressITRs / Math.max(totalITRs, 1) * 100)}%)`, 14, currentY + 22);
      doc.text(`Retrasados: ${delayedITRs} (${Math.round(delayedITRs / Math.max(totalITRs, 1) * 100)}%)`, 14, currentY + 28);
      
      // Añadir detalle de ITRs
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Detalle de ITRs', 14, 22);
      
      doc.autoTable({
        startY: 30,
        head: [['ITR', 'Estado', 'Progreso', 'Asignado a', 'Fecha Límite']],
        body: reportData.itrs.map((itr: any) => [
          itr.name,
          translateStatus(itr.status),
          `${itr.progress || 0}%`,
          itr.assigned_to || 'No asignado',
          itr.due_date ? new Date(itr.due_date).toLocaleDateString('es-ES') : 'Sin fecha'
        ])
      });
      
      // Guardar el PDF y crear URL para descarga
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Descargar automáticamente el archivo
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `${reportType.toLowerCase().replace(/ /g, '_')}_${selectedProject?.name.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // También guardar la URL para previsualización
      setReportUrl(pdfUrl);
      
      toast({
        title: "Reporte generado",
        description: "El reporte ha sido generado y descargado con éxito"
      });
    } catch (error: any) {
      console.error("Error al generar reporte:", error);
      toast({
        title: "Error",
        description: `No se pudo generar el reporte: ${error.message || "Error desconocido"}`,
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const handlePreviewReport = () => {
    if (!selectedProjectId) {
      toast({
        title: "Seleccione un proyecto",
        description: "Debe seleccionar un proyecto para previsualizar el reporte",
        variant: "destructive"
      });
      return;
    }

    // Si ya tenemos una URL de reporte, la abrimos
    if (reportUrl) {
      window.open(reportUrl, '_blank');
    } else {
      toast({
        title: "Genere primero el reporte",
        description: "Debe generar el reporte antes de previsualizarlo"
      });
    }
  };

  const translateStatus = (status: string): string => {
    switch (status) {
      case 'complete':
        return 'Completado';
      case 'inprogress':
        return 'En Progreso';
      case 'delayed':
        return 'Retrasado';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Genera y visualiza reportes para tus proyectos
          </p>
        </div>
        <ProjectSelector 
          onSelectProject={handleSelectProject}
          selectedProjectId={selectedProjectId}
        />
      </div>

      {!selectedProjectId ? (
        <Card>
          <CardHeader>
            <CardTitle>Seleccione un proyecto</CardTitle>
            <CardDescription>
              Por favor seleccione un proyecto para generar reportes
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Tabs defaultValue="standard">
          <TabsList className="mb-4">
            <TabsTrigger value="standard">Reportes Estándar</TabsTrigger>
            <TabsTrigger value="custom">Reportes Personalizados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-secondary" />
                    Estado del Proyecto
                  </CardTitle>
                  <CardDescription>
                    Visión general del estado de los proyectos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Resumen del estado de todos los proyectos, incluyendo tasas de finalización y adherencia al cronograma.
                  </p>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="mr-2" 
                      onClick={handlePreviewReport}
                      disabled={generatingReport !== null || !reportUrl}
                    >
                      Previsualizar
                    </Button>
                    <Button size="sm" 
                      onClick={() => handleGenerateReport("Estado del Proyecto")}
                      disabled={generatingReport !== null}
                    >
                      {generatingReport === "Estado del Proyecto" ? "Generando..." : "Generar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-secondary" />
                    Cumplimiento de ITR
                  </CardTitle>
                  <CardDescription>
                    Completado y cumplimiento de ITR
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Análisis detallado de las tasas de finalización de ITR y cumplimiento de estándares.
                  </p>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="mr-2" 
                      onClick={handlePreviewReport}
                      disabled={generatingReport !== null || !reportUrl}
                    >
                      Previsualizar
                    </Button>
                    <Button size="sm" 
                      onClick={() => handleGenerateReport("Cumplimiento de ITR")}
                      disabled={generatingReport !== null}
                    >
                      {generatingReport === "Cumplimiento de ITR" ? "Generando..." : "Generar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <LineChart className="h-5 w-5 mr-2 text-secondary" />
                    Utilización de Recursos
                  </CardTitle>
                  <CardDescription>
                    Asignación y uso de recursos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Análisis de la asignación y utilización de recursos en proyectos y sistemas.
                  </p>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="mr-2" 
                      onClick={handlePreviewReport}
                      disabled={generatingReport !== null || !reportUrl}
                    >
                      Previsualizar
                    </Button>
                    <Button size="sm" 
                      onClick={() => handleGenerateReport("Utilización de Recursos")}
                      disabled={generatingReport !== null}
                    >
                      {generatingReport === "Utilización de Recursos" ? "Generando..." : "Generar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-secondary" />
                    Salud del Sistema
                  </CardTitle>
                  <CardDescription>
                    Salud de sistemas y subsistemas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Informe completo sobre la salud y el rendimiento de todos los sistemas y subsistemas.
                  </p>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="mr-2" 
                      onClick={handlePreviewReport}
                      disabled={generatingReport !== null || !reportUrl}
                    >
                      Previsualizar
                    </Button>
                    <Button size="sm" 
                      onClick={() => handleGenerateReport("Salud del Sistema")}
                      disabled={generatingReport !== null}
                    >
                      {generatingReport === "Salud del Sistema" ? "Generando..." : "Generar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <FilePieChart className="h-5 w-5 mr-2 text-secondary" />
                    Progreso Mensual
                  </CardTitle>
                  <CardDescription>
                    Análisis mensual del progreso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Informe mensual que muestra el progreso, desviaciones y pronósticos para todos los proyectos activos.
                  </p>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="mr-2" 
                      onClick={handlePreviewReport}
                      disabled={generatingReport !== null || !reportUrl}
                    >
                      Previsualizar
                    </Button>
                    <Button size="sm" 
                      onClick={() => handleGenerateReport("Progreso Mensual")}
                      disabled={generatingReport !== null}
                    >
                      {generatingReport === "Progreso Mensual" ? "Generando..." : "Generar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart className="h-5 w-5 mr-2 text-secondary" />
                    Métricas de Rendimiento
                  </CardTitle>
                  <CardDescription>
                    Indicadores clave de rendimiento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Análisis de indicadores clave de rendimiento en todos los proyectos, sistemas y personal.
                  </p>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="mr-2" 
                      onClick={handlePreviewReport}
                      disabled={generatingReport !== null || !reportUrl}
                    >
                      Previsualizar
                    </Button>
                    <Button size="sm" 
                      onClick={() => handleGenerateReport("Métricas de Rendimiento")}
                      disabled={generatingReport !== null}
                    >
                      {generatingReport === "Métricas de Rendimiento" ? "Generando..." : "Generar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="custom">
            <Card>
              <CardHeader>
                <CardTitle>Creador de Reportes Personalizados</CardTitle>
                <CardDescription>
                  Crea reportes personalizados basados en tus necesidades específicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Reporte</label>
                    <Select defaultValue="performance">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione tipo de reporte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Rendimiento</SelectItem>
                        <SelectItem value="status">Estado</SelectItem>
                        <SelectItem value="compliance">Cumplimiento</SelectItem>
                        <SelectItem value="timeline">Cronograma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Formato de Salida</label>
                    <Select defaultValue="pdf">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Incluir Secciones</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="section-summary" className="rounded border-gray-300" defaultChecked />
                      <label htmlFor="section-summary">Resumen ejecutivo</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="section-charts" className="rounded border-gray-300" defaultChecked />
                      <label htmlFor="section-charts">Gráficos y estadísticas</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="section-details" className="rounded border-gray-300" defaultChecked />
                      <label htmlFor="section-details">Detalles del proyecto</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="section-recommendations" className="rounded border-gray-300" />
                      <label htmlFor="section-recommendations">Recomendaciones</label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleGenerateReport("Reporte Personalizado")}
                    disabled={generatingReport !== null}
                  >
                    {generatingReport === "Reporte Personalizado" ? "Generando..." : "Crear Reporte Personalizado"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Reports;
