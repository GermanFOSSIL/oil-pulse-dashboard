
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import App from './App.tsx'
import './index.css'

// Establecer un manejador global de errores no capturados
window.addEventListener('unhandledrejection', (event) => {
  console.error('Error no capturado en promesa:', event.reason);
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
