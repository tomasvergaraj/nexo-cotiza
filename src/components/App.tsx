import ErrorBoundary from './ErrorBoundary';
import QuoteEditor from './QuoteEditor';

// Punto de montaje del editor, envuelto en el error boundary.
export default function App() {
  return (
    <ErrorBoundary>
      <QuoteEditor />
    </ErrorBoundary>
  );
}
