/**
 * Diag  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data);
  }gger
 * Mock implementation for development
 */

interface Logger {
  info: (message: string, data?: unknown) => void;
  error: (message: string, error?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
}

export const diagnosticLogger: Logger = {
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data || '');
  },
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data || '');
  }
};