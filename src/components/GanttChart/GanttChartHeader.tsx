
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GanttExport } from './GanttExport';

interface GanttChartHeaderProps {
  currentDate: Date;
  viewMode: string;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  setViewMode: (mode: string) => void;
  exporting: boolean;
  data: any[];
  containerRef: React.RefObject<HTMLDivElement>;
}

export const GanttChartHeader = ({
  currentDate,
  viewMode,
  goToPreviousMonth,
  goToNextMonth,
  goToToday,
  setViewMode,
  exporting,
  data,
  containerRef
}: GanttChartHeaderProps) => {
  return (
    <div className="border-b pb-4">
      <h2 className="text-2xl font-bold mb-4">Cronograma de ITRs</h2>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="font-medium h-9 px-3" onClick={goToToday}>
            <Calendar className="h-4 w-4 mr-2" />
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-2 bg-white border rounded-md py-1 px-3 text-lg font-medium">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Vista por Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Vista por Mes</SelectItem>
              <SelectItem value="week">Vista por Semana</SelectItem>
              <SelectItem value="day">Vista por Día</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Search className="h-4 w-4" />
          </Button>
          <GanttExport 
            data={data} 
            containerRef={containerRef} 
          />
        </div>
      </div>
    </div>
  );
};
