
import { useState, useEffect } from 'react';

interface UseLoadingTimeoutProps {
  loading: boolean;
  timeoutMs?: number;
}

export function useLoadingTimeout({ loading, timeoutMs = 15000 }: UseLoadingTimeoutProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (loading) {
      // Si está cargando, configuramos un timeout
      setHasTimedOut(false);
      timeoutId = setTimeout(() => {
        setHasTimedOut(true);
        console.error("La operación de carga ha excedido el tiempo límite");
      }, timeoutMs);
    }
    
    return () => {
      // Limpiamos el timeout si el componente se desmonta o loading cambia
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loading, timeoutMs]);
  
  return { hasTimedOut };
}
