import { useEffect, useRef } from 'react';
import { createApp } from 'vue';
import { createPinia } from 'pinia';

interface VueWrapperProps {
  vueComponent: any;
}

export default function VueWrapper({ vueComponent }: VueWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && vueComponent) {
      const app = createApp(vueComponent);
      const pinia = createPinia();
      app.use(pinia);
      app.mount(containerRef.current);

      return () => {
        app.unmount();
      };
    }
  }, [vueComponent]);

  return <div ref={containerRef} />;
}
