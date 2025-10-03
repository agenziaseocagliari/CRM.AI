// Temporary mock diagnostic logger for performance testing
export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

export interface DiagnosticLogEntry {
  timestamp: string;
  level: LogLevel;
  category: 'jwt' | 'session' | 'auth' | 'api' | 'healthcheck';
  message: string;
  context?: any;
}

export const diagnosticLogger = {
  info: (...args: any[]) => {
    // Handle both patterns: (category, message, context) and (message, context)
    if (args.length >= 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
      console.log(`[INFO][${args[0]}]`, args[1], ...args.slice(2));
    } else {
      console.log('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (args.length >= 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
      console.warn(`[WARN][${args[0]}]`, args[1], ...args.slice(2));
    } else {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (args.length >= 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
      console.error(`[ERROR][${args[0]}]`, args[1], ...args.slice(2));
    } else {
      console.error('[ERROR]', ...args);
    }
  },
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
  critical: (...args: any[]) => {
    if (args.length >= 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
      console.error(`[CRITICAL][${args[0]}]`, args[1], ...args.slice(2));
    } else {
      console.error('[CRITICAL]', ...args);
    }
  },
  // Additional methods that some components expect
  exportLogs: () => 'Mock logs exported',
  clearLogs: () => console.log('[INFO] Mock logs cleared'),
  getLogs: () => [
    { level: 'info' as LogLevel, category: 'api' as const, message: 'Mock log entry', timestamp: new Date().toISOString(), context: {} }
  ] as DiagnosticLogEntry[],
  getErrorStats: () => ({ errorCount: 0, warningCount: 0, total: 0, rate: 0 })
};