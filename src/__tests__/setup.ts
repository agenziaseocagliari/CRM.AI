import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test case
afterEach(() => {
    cleanup();
});

// Mock Supabase client - Enhanced for AI testing
vi.mock('../lib/supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: null },
                error: null,
            }),
            getUser: vi.fn().mockResolvedValue({
                data: { user: null },
                error: null,
            }),
            signIn: vi.fn(),
            signOut: vi.fn(),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } },
            })),
        },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn(),
                download: vi.fn(),
                remove: vi.fn(),
            })),
        },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

// Mock Google GenAI for AI testing
vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn(() => ({
        models: {
            generateContent: vi.fn(() => Promise.resolve({
                text: () => JSON.stringify({
                    score: 75,
                    category: 'Warm',
                    reasoning: 'Test reasoning for mock lead',
                    breakdown: {
                        contact_quality: 20,
                        company_profile: 25,
                        engagement: 15,
                        crm_fit: 15
                    },
                    next_actions: ['Follow up', 'Send demo'],
                    priority: 'medium'
                }),
            })),
        },
    })),
}));

// Mock rate limiter
vi.mock('../lib/rateLimiter', () => ({
    withRateLimit: vi.fn((_organizationId, _actionType, _key, fn) => fn()),
    checkRateLimit: vi.fn(() => Promise.resolve({ 
        allowed: true, 
        remainingRequests: 100,
        resetTime: Date.now() + 60000
    })),
}));

// Mock toast notifications
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        custom: vi.fn(),
    },
    Toaster: () => null,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class MockIntersectionObserver implements IntersectionObserver {
    root = null;
    rootMargin = '';
    thresholds = [];
    
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
    unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver implements ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
};
