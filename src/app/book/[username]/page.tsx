import { Suspense } from 'react';
import PublicBookingClient from './PublicBookingClient';

// CRITICAL: This makes it a dynamic route
export const dynamic = 'force-dynamic';

export default async function PublicBookingPage({
    params,
}: {
    params: { username: string };
}) {
    // Simple pass-through - no auth, no redirects
    return (
        <Suspense fallback={<LoadingBooking />}>
            <PublicBookingClient username={params.username} />
        </Suspense>
    );
}

function LoadingBooking() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Caricamento pagina prenotazione...</p>
            </div>
        </div>
    );
}