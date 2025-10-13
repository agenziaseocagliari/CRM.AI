import React from 'react';
import { useParams } from 'react-router-dom';
import PublicBookingClient from './booking/PublicBookingClient';

const PublicBookingPage = () => {
  const { username } = useParams<{ username: string }>();
  
  if (!username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Username Mancante</h1>
          <p className="text-gray-600">URL non valido per la prenotazione.</p>
        </div>
      </div>
    );
  }

  return <PublicBookingClient username={username} />;
};

export default PublicBookingPage;