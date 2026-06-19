import { useEffect, useRef, useState } from 'react';
import { createApp } from 'vue';
import { createPinia } from 'pinia';

interface VueWrapperProps {
  loadComponent: () => Promise<any>;
}

export default function VueWrapper({ loadComponent }: VueWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [component, setComponent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadComponent()
      .then((m) => {
        if (active) {
          setComponent(m.default || m);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Error loading Vue component:', err);
          setError(err.message || String(err));
        }
      });
    return () => {
      active = false;
    };
  }, [loadComponent]);

  useEffect(() => {
    if (containerRef.current && component) {
      const app = createApp(component);
      const pinia = createPinia();
      app.use(pinia);
      app.mount(containerRef.current);

      return () => {
        app.unmount();
      };
    }
  }, [component]);

  if (error) {
    return <div className="text-center py-12 text-red-500">Error loading catalog: {error}</div>;
  }

  if (!component) {
    return <div className="flex justify-center p-8">Loading Catalog...</div>;
  }

  return <div ref={containerRef} />;
}

