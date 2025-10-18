// Comprehensive diagnostic logging system

interface DiagnosticEvent {
    timestamp: string;
    type: 'route' | 'component' | 'data' | 'error' | 'render' | 'auth';
    location: string;
    data: unknown;
}

class DiagnosticLogger {
    private events: DiagnosticEvent[] = [];
    private enabled: boolean = true;

    log(type: DiagnosticEvent['type'], location: string, data?: unknown) {
        if (!this.enabled) return;

        const event: DiagnosticEvent = {
            timestamp: new Date().toISOString(),
            type,
            location,
            data
        };

        this.events.push(event);

        // Console log with color coding
        const colors = {
            route: 'color: blue; font-weight: bold',
            component: 'color: green; font-weight: bold',
            data: 'color: purple',
            error: 'color: red; font-weight: bold',
            render: 'color: orange',
            auth: 'color: cyan; font-weight: bold'
        };

        console.log(
            `%c[DIAGNOSTIC:${type.toUpperCase()}] ${location}`,
            colors[type],
            data || ''
        );
    }

    getEvents() {
        return this.events;
    }

    downloadLog() {
        const logText = JSON.stringify(this.events, null, 2);
        const blob = new Blob([logText], { type: 'text/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagnostic-log-${Date.now()}.json`;
        a.click();
    }

    clear() {
        this.events = [];
    }

    // Get events by type
    getRouteEvents() {
        return this.events.filter(e => e.type === 'route');
    }

    getComponentEvents() {
        return this.events.filter(e => e.type === 'component');
    }

    getErrorEvents() {
        return this.events.filter(e => e.type === 'error');
    }

    // Get latest event of specific location
    getLatestEvent(location: string) {
        return this.events.filter(e => e.location === location).slice(-1)[0];
    }
}

export const diagnostics = new DiagnosticLogger();

// Add to window for easy access in console
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).diagnostics = diagnostics;
    (window as unknown as Record<string, unknown>).diagLog = (type: string, location: string, data?: unknown) => {
        diagnostics.log(type as DiagnosticEvent['type'], location, data);
    };
}