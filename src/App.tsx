import React, { ReactNode, Component, ErrorInfo } from 'react';
import SortingVisualizer from './components/SortingVisualizer';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-100 text-red-800 border-2 border-red-800 m-4 rounded-2xl shadow-2xl">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="bg-red-200 p-4 rounded-xl overflow-auto max-h-96 text-xs">
            {this.state.error?.toString()}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-800 text-white rounded-full hover:bg-red-900 transition-colors shadow-lg"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <div className="min-h-screen bg-bg selection:bg-primary/20">
      <header className="py-12 px-4 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black tracking-tighter text-primary uppercase"
        >
          Sort<span className="text-secondary">Lab</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-primary/60 font-medium tracking-widest uppercase text-xs"
        >
          Interactive Algorithm Visualizer
        </motion.p>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 pb-24">
        <ErrorBoundary>
          <SortingVisualizer />
        </ErrorBoundary>
      </main>

      <footer className="py-8 text-center border-t border-primary/10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary/40 font-bold">
          Built with precision & curiosity
        </p>
      </footer>
    </div>
  );
}
