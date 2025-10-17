// Temporary type declarations for missing packages
declare module 'react-dom' {
  export * from 'react-dom/index';
  export { createPortal } from 'react-dom/index';
}

declare module 'react-dom/client' {
  export * from 'react-dom/client/index';
  export { createRoot } from 'react-dom/client/index';
}

declare module 'uuid' {
  export function v4(): string;
  export function v1(): string;
  export function v3(name: string, namespace: string): string;
  export function v5(name: string, namespace: string): string;
}

declare module 'vitest' {
  export * from 'vitest/dist/index';
}