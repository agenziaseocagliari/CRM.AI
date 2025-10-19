import { createContext } from 'react';

// Types
export interface VerticalConfig {
  vertical: string;
  displayName: string;
  description: string;
  icon: string;
  sidebarConfig: {
    sections: Array<{
      id: string;
      label: string;
      icon: string;
      path: string;
    }>;
  };
  dashboardConfig: Record<string, unknown>;
  enabledModules: string[];
}

export interface VerticalContextType {
  vertical: string;
  config: VerticalConfig | null;
  loading: boolean;
  error: Error | null;
  hasModule: (module: string) => boolean;
  switchVertical: (newVertical: string) => Promise<void>;
}

// Context
export const VerticalContext = createContext<VerticalContextType | null>(null);