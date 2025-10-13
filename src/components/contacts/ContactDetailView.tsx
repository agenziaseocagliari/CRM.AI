'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Mail, Phone, MapPin,
  Building, Calendar, User, MoreVertical
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function ContactDetailView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Contact | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchContact(id);
    }
  }, [id]);

  const fetchContact = async (contactId: string) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) throw error;
      
      setContact(data);
      setEditedContact(data);
    } catch (error) {
      console.error('Error fetching contact:', error);
      navigate('/contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedContact || !id) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(editedContact)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setContact(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo contatto?')) return;
    if (!id) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      navigate('/contacts');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Errore durante l\'eliminazione');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento contatto...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Contatto non trovato</h2>
          <p className="mt-2 text-gray-600">Il contatto richiesto non esiste.</p>
          <button
            onClick={() => navigate('/contacts')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Torna ai Contatti
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/contacts')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna ai Contatti
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {contact.name}
              </h1>
              {contact.company && (
                <p className="text-gray-600 mt-1">{contact.company}</p>
              )}
            </div>

            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                    Modifica
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedContact(contact);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isSaving ? 'Salvataggio...' : 'Salva'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Informazioni Contatto</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedContact?.email || ''}
                      onChange={(e) => setEditedContact(prev => prev ? { ...prev, email: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {contact.email || '-'}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefono
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedContact?.phone || ''}
                      onChange={(e) => setEditedContact(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {contact.phone || '-'}
                    </div>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Azienda
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedContact?.company || ''}
                      onChange={(e) => setEditedContact(prev => prev ? { ...prev, company: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Building className="w-4 h-4 text-gray-400" />
                      {contact.company || '-'}
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indirizzo
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedContact?.address || ''}
                      onChange={(e) => setEditedContact(prev => prev ? { ...prev, address: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Via, Numero civico"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {contact.address || '-'}
                    </div>
                  )}
                </div>

                {/* City, State, ZIP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Città
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedContact?.city || ''}
                      onChange={(e) => setEditedContact(prev => prev ? { ...prev, city: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <div className="text-gray-900">{contact.city || '-'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia / CAP
                  </label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editedContact?.state || ''}
                        onChange={(e) => setEditedContact(prev => prev ? { ...prev, state: e.target.value } : null)}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="RM"
                      />
                      <input
                        type="text"
                        value={editedContact?.zip || ''}
                        onChange={(e) => setEditedContact(prev => prev ? { ...prev, zip: e.target.value } : null)}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="00100"
                      />
                    </div>
                  ) : (
                    <div className="text-gray-900">
                      {contact.state || '-'} {contact.zip}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                {isEditing ? (
                  <textarea
                    value={editedContact?.notes || ''}
                    onChange={(e) => setEditedContact(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Aggiungi note..."
                  />
                ) : (
                  <div className="text-gray-900 whitespace-pre-wrap">
                    {contact.notes || 'Nessuna nota'}
                  </div>
                )}
              </div>
            </div>

            {/* Activity Timeline Placeholder */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Attività Recenti</h2>
              <p className="text-gray-500 text-center py-8">
                Nessuna attività registrata
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-3">Azioni Rapide</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => contact.email && window.open(`mailto:${contact.email}`)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Invia Email
                </button>
                <button 
                  onClick={() => contact.phone && window.open(`tel:${contact.phone}`)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Chiama
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Programma Incontro
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-3">Informazioni</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Creato:</span>
                  <div className="text-gray-900">
                    {new Date(contact.created_at).toLocaleDateString('it-IT')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Ultimo aggiornamento:</span>
                  <div className="text-gray-900">
                    {new Date(contact.updated_at).toLocaleDateString('it-IT')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}