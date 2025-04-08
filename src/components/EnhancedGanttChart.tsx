import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface EnhancedGanttProps {
  data: any[];
  startDate: string;
  endDate: string;
  viewMode: string;
}

export const EnhancedGanttChart: React.FC<EnhancedGanttProps> = ({
  data,
  startDate,
  endDate,
  viewMode
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [visibleItems, setVisibleItems] = useState<any[]>([]);

  useEffect(() => {
    // Process data to determine parent-child relationships and visibility
    const processedData = processGanttData(data);
    setVisibleItems(processedData);
  }, [data]);

  const processGanttData = (items: any[]) => {
    // Create a map of parent-child relationships
    const itemMap: Record<string, any> = {};
    const rootItems: any[] = [];
    
    // First pass: create map of all items
    items.forEach(item => {
      itemMap[item.id] = {
        ...item,
        children: []
      };
    });
    
    // Second pass: establish parent-child relationships
    items.forEach(item => {
      if (item.parent && itemMap[item.parent]) {
        itemMap[item.parent].children.push(itemMap[item.id]);
      } else {
        rootItems.push(itemMap[item.id]);
      }
    });
    
    // Flatten the hierarchy for display, respecting expanded state
    const flattenedItems: any[] = [];
    
    const flattenHierarchy = (items: any[], level = 0) => {
      items.forEach(item => {
        const isExpanded = expandedItems[item.id] !== false; // Default to expanded
        
        flattenedItems.push({
          ...item,
          level,
          isExpanded
        });
        
        if (isExpanded && item.children && item.children.length > 0) {
          flattenHierarchy(item.children, level + 1);
        }
      });
    };
    
    flattenHierarchy(rootItems);
    return flattenedItems;
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-status-complete';
      case 'inprogress':
        return 'bg-status-inprogress';
      case 'delayed':
        return 'bg-status-delayed';
      default:
        return 'bg-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project':
        return '📁';
      case 'system':
        return '⚙️';
      case 'subsystem':
        return '🔧';
      case 'task':
        return '📝';
      default:
        return '•';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: es }) : 'Fecha inválida';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  };

  // Calculate date range for the timeline
  const startDateObj = parseISO(startDate);
  const endDateObj = parseISO(endDate);
  
  // Generate timeline headers based on view mode
  const generateTimelineHeaders = () => {
    const headers = [];
    let current = new Date(startDateObj);
    
    while (current <= endDateObj) {
      let label = '';
      
      if (viewMode === 'year') {
        label = format(current, 'MMM', { locale: es });
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      } else if (viewMode === 'month') {
        label = format(current, 'd', { locale: es });
        current.setDate(current.getDate() + 1);
      } else {
        // Week view
        label = format(current, 'EEE d', { locale: es });
        current.setDate(current.getDate() + 1);
      }
      
      headers.push(label);
    }
    
    return headers;
  };
  
  const timelineHeaders = generateTimelineHeaders();

  // Calculate position and width for gantt bars
  const calculateBarPosition = (item: any) => {
    try {
      const itemStart = parseISO(item.start);
      const itemEnd = parseISO(item.end);
      
      // Calculate total timeline duration in milliseconds
      const timelineDuration = endDateObj.getTime() - startDateObj.getTime();
      
      // Calculate item position relative to timeline start
      const itemStartPosition = Math.max(0, itemStart.getTime() - startDateObj.getTime());
      const itemDuration = Math.min(
        itemEnd.getTime() - itemStart.getTime(),
        itemEnd.getTime() - startDateObj.getTime()
      );
      
      // Convert to percentage
      const startPercentage = (itemStartPosition / timelineDuration) * 100;
      const widthPercentage = (itemDuration / timelineDuration) * 100;
      
      return {
        left: `${startPercentage}%`,
        width: `${widthPercentage}%`
      };
    } catch (error) {
      console.error('Error calculating bar position:', error, item);
      return { left: '0%', width: '10%' };
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Timeline header */}
        <div className="flex">
          <div className="w-1/3 min-w-[300px] p-2 font-medium">Tarea</div>
          <div className="w-2/3 flex">
            {timelineHeaders.map((header, index) => (
              <div 
                key={index} 
                className="flex-1 text-center text-xs p-1 border-l border-gray-200"
              >
                {header}
              </div>
            ))}
          </div>
        </div>
        
        {/* Gantt rows */}
        <div className="divide-y">
          {visibleItems.map((item) => (
            <div key={item.id} className="flex hover:bg-gray-50">
              {/* Task info */}
              <div 
                className="w-1/3 min-w-[300px] p-2 flex items-center"
                style={{ paddingLeft: `${(item.level * 20) + 8}px` }}
              >
                {item.children && item.children.length > 0 && (
                  <button 
                    onClick={() => toggleExpand(item.id)}
                    className="mr-1 w-4 h-4 flex items-center justify-center text-xs"
                  >
                    {item.isExpanded ? '▼' : '►'}
                  </button>
                )}
                <span className="mr-2">{getTypeIcon(item.type)}</span>
                <div className="flex-1 truncate">
                  <div className="font-medium truncate">{item.task}</div>
                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <span>{formatDate(item.start)} - {formatDate(item.end)}</span>
                    {item.quantity > 1 && (
                      <span className="bg-gray-100 px-1 rounded">
                        x{item.quantity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Timeline */}
              <div className="w-2/3 relative p-2">
                <div className="absolute inset-0 flex">
                  {timelineHeaders.map((_, index) => (
                    <div 
                      key={index} 
                      className="flex-1 border-l border-gray-200"
                    />
                  ))}
                </div>
                
                <div 
                  className={cn(
                    "absolute h-6 rounded-sm flex items-center justify-center text-xs text-white",
                    getStatusColor(item.status)
                  )}
                  style={calculateBarPosition(item)}
                >
                  <div className="truncate px-1">
                    {item.progress}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
