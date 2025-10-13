import { notFound } from 'next/navigation';

export default async function PublicBookingPage({
  params
}: {
  params: { username: string }
}) {
  // Mock profile data for now - in real implementation would fetch from database
  const profile = {
    id: 'user-123',
    full_name: `User ${params.username}`,
    username: params.username,
    bio: 'Prenota un appuntamento con me'
  };

  if (!params.username) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
              {profile.full_name?.charAt(0) || 'U'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {profile.full_name}
            </h1>
            <p className="text-gray-600">
              {profile.bio || 'Prenota un appuntamento'}
            </p>
          </div>
        </div>
      </div>

      {/* Booking Interface */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Seleziona Data e Orario
            </h2>
            <p className="text-gray-600 mb-8">
              Sistema di prenotazione disponibile a breve
            </p>

            {/* Placeholder for calendar selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="text-4xl mb-3">📆</div>
                <h3 className="font-semibold mb-2">Seleziona Data</h3>
                <p className="text-sm text-gray-500">Calendario disponibile prossimamente</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="text-4xl mb-3">⏰</div>
                <h3 className="font-semibold mb-2">Seleziona Orario</h3>
                <p className="text-sm text-gray-500">Slot orari disponibili prossimamente</p>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 Sistema di prenotazione in fase di completamento. Contatta direttamente {profile.full_name} per fissare un appuntamento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-gray-500">
        Powered by CRM.AI - <a href="/" className="text-blue-600 hover:underline">Crea il tuo calendario gratuito</a>
      </div>
    </div>
  );
}