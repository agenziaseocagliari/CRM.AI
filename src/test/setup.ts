// File: src/test/setup.ts
// Global test setup for Vitest

// @ts-ignore - Vitest types not available in build
import { beforeEach, vi } from 'vitest';

// Mock console methods to reduce noise in tests
vi.spyOn(console, 'error').mockImplementation(() => { });
vi.spyOn(console, 'warn').mockImplementation(() => { });

// Global test environment setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});