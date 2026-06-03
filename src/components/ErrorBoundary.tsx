import { Component, type ReactNode } from 'react';
import { Button } from './ui';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

/**
 * Si algo en el editor lanza un error de render, mostramos un mensaje claro
 * (en vez de pantalla en blanco) y un botón para recargar. Los datos guardados
 * en el navegador no se pierden: están en IndexedDB, no en memoria.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('NexoCotiza — error de render:', error);
    // Por si el error ocurre antes de que el editor quite el skeleton inicial.
    document.getElementById('boot-skeleton')?.remove();
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="mx-auto max-w-[640px] px-4 py-20 text-center">
        <h2 className="font-sora text-2xl font-bold text-ink">Algo salió mal</h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] text-gray">
          Ocurrió un error inesperado en la aplicación. Tus datos guardados en este navegador
          (empresa, historial y borrador) <b className="text-ink">no se han perdido</b>.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="primary" onClick={() => location.reload()}>Recargar</Button>
        </div>
      </div>
    );
  }
}
