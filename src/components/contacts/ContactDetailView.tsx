'use client';

import {
    ArrowLeft,
    Building, Calendar,
    Edit,
    Mail,
    MapPin,
    Phone,
    Sparkles,
    Trash2
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { useAuth } from '../../contexts/useAuth';
import { supabase } from '../../lib/supabaseClient';
import type { Contact } from '../../types';
import { calculateLeadScore, updateContactScore, type LeadScoringResponse } from '../../utils/leadScoring';
import DocumentGallery from '../insurance/DocumentGallery';
import DocumentUploader from '../insurance/DocumentUploader';

interface ExtendedContact extends Contact {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    notes?: string;
    updated_at?: string;
}

export default function ContactDetailView() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { jwtClaims } = useAuth();
    const organizationId = jwtClaims?.organization_id;
    const [contact, setContact] = useState<ExtendedContact | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContact, setEditedContact] = useState<ExtendedContact | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isScoring, setIsScoring] = useState(false);
    const [aiScore, setAiScore] = useState<LeadScoringResponse | null>(null);
    const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0);

    const fetchContact = useCallback(async (contactId: string) => {
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
            navigate(ROUTES.contacts);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        if (id) {
            fetchContact(id);
        }
    }, [id, fetchContact]);

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

            navigate(ROUTES.contacts);
        } catch (error) {
            console.error('Delete error:', error);
            alert('Errore durante l\'eliminazione');
        }
    };

    const handleAIScore = async () => {
        if (!contact) return;

        try {
            setIsScoring(true);
            
            const result = await calculateLeadScore(contact, {
                useDataPizza: true,
                fallbackToEdgeFunction: true,
                organizationId: contact.organization_id
            });
            
            setAiScore(result);
            
            // Update contact in database
            const success = await updateContactScore(String(contact.id), result, contact.organization_id);
            
            if (success) {
                // Update local contact state
                setContact(prev => prev ? {
                    ...prev,
                    lead_score: result.score,
                    lead_score_reasoning: result.reasoning
                } : null);
                
                toast.success(`🎯 AI Score: ${result.score}/100 (${result.category.toUpperCase()})`);
            } else {
                toast.error('Score calcolato ma errore nel salvataggio');
            }
            
        } catch (error: unknown) {
            console.error('❌ AI scoring failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
            toast.error('Errore durante il scoring AI: ' + errorMessage);
        } finally {
            setIsScoring(false);
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
                        onClick={() => navigate(ROUTES.contacts)}
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
                        onClick={() => navigate(ROUTES.contacts)}
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
                                        onClick={handleAIScore}
                                        disabled={isScoring}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        {isScoring ? 'AI Scoring...' : 'AI Score'}
                                    </button>
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

                        {/* AI Score Display */}
                        {aiScore && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                    AI Lead Score
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Score:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-indigo-600">{aiScore.score}</span>
                                            <span className="text-sm text-gray-500">/100</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Categoria:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            aiScore.category === 'hot' ? 'bg-red-100 text-red-800' :
                                            aiScore.category === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {aiScore.category.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-100">
                                        <p className="text-sm text-gray-700">{aiScore.reasoning}</p>
                                    </div>
                                    {aiScore.breakdown && (
                                        <div className="pt-2 border-t border-gray-100">
                                            <p className="text-xs text-gray-500 mb-2">Breakdown:</p>
                                            <div className="space-y-1 text-xs">
                                                <div className="flex justify-between">
                                                    <span>Email Quality:</span>
                                                    <span>{aiScore.breakdown.email_quality}/20</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Company Fit:</span>
                                                    <span>{aiScore.breakdown.company_fit}/30</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Engagement:</span>
                                                    <span>{aiScore.breakdown.engagement}/30</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Qualification:</span>
                                                    <span>{aiScore.breakdown.qualification}/20</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-gray-100">
                                        <p className="text-xs text-gray-400">
                                            Agent: {aiScore.agent_used} • {aiScore.timestamp}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                        {contact.updated_at ? new Date(contact.updated_at).toLocaleDateString('it-IT') : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 📋 Documenti Contatto Section */}
                        <div className="bg-white rounded-lg shadow p-6 border-4 border-green-500">
                            <h3 className="font-semibold text-xl mb-2 flex items-center gap-2">
                                📋 Documenti Contatto
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Carte d'identità, patenti, certificati e altri documenti del contatto
                            </p>
                            
                            {organizationId ? (
                                <>
                                    <p className="text-green-600 font-bold mb-4">✅ Organization ID trovato: {organizationId.substring(0, 8)}...</p>
                                    <DocumentUploader
                                        organizationId={organizationId}
                                        category="contact"
                                        entityType="contact"
                                        entityId={contact.id}
                                        onUploadComplete={() => {
                                            setDocumentsRefreshKey(prev => prev + 1);
                                        }}
                                    />
                                    
                                    <div className="mt-6">
                                        <DocumentGallery
                                            key={documentsRefreshKey}
                                            organizationId={organizationId}
                                            category="contact"
                                            entityType="contact"
                                            entityId={contact.id}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-gray-500 italic">
                                    ⚠️ Organization ID non disponibile. Effettua nuovamente il login.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 🔴 DEBUG MARKER - ALWAYS VISIBLE */}
                <div style={{
                    marginTop: '40px',
                    padding: '40px',
                    background: 'red',
                    color: 'white',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '32px',
                    border: '10px solid darkred'
                }}>
                    🔴 DEBUG: END OF GRID - DOCUMENTS BELOW (IF YOU SEE THIS, SCROLL DOWN)
                </div>

                {/* 📋 FULL-WIDTH DOCUMENTS SECTION (DEBUG VERSION) */}
                <div style={{
                    marginTop: '40px',
                    border: '16px solid lime',
                    padding: '60px',
                    background: '#90EE90'
                }}>
                    <h2 style={{
                        fontSize: '48px',
                        fontWeight: 'bold',
                        color: 'darkgreen',
                        marginBottom: '30px',
                        textAlign: 'center'
                    }}>
                        📋 DOCUMENTI CONTATTO (DEBUG GIANT BOX - FULL WIDTH)
                    </h2>
                    
                    <div style={{
                        background: 'yellow',
                        padding: '20px',
                        marginBottom: '30px',
                        border: '4px solid orange'
                    }}>
                        <p style={{ fontSize: '24px', marginBottom: '10px' }}>
                            <strong>Contact ID:</strong> {contact.id}
                        </p>
                        <p style={{ fontSize: '24px', marginBottom: '10px' }}>
                            <strong>Organization ID:</strong> {organizationId || '❌ MISSING'}
                        </p>
                        <p style={{ fontSize: '20px', color: organizationId ? 'green' : 'red' }}>
                            {organizationId ? '✅ ID PRESENT - Documents should work' : '❌ ID MISSING - Re-login required'}
                        </p>
                    </div>
                    
                    {organizationId ? (
                        <div>
                            <div style={{ background: 'white', padding: '30px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>📤 Upload Documenti</h3>
                                <DocumentUploader
                                    organizationId={organizationId}
                                    category="contact"
                                    entityType="contact"
                                    entityId={contact.id}
                                    onUploadComplete={() => {
                                        setDocumentsRefreshKey(prev => prev + 1);
                                    }}
                                />
                            </div>
                            
                            <div style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>📁 Galleria Documenti</h3>
                                <DocumentGallery
                                    key={documentsRefreshKey}
                                    organizationId={organizationId}
                                    category="contact"
                                    entityType="contact"
                                    entityId={contact.id}
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: 'red', fontWeight: 'bold', fontSize: '36px', marginBottom: '20px' }}>
                                ❌ Organization ID MISSING
                            </p>
                            <p style={{ color: '#333', fontSize: '20px', background: 'white', padding: '20px', borderRadius: '8px' }}>
                                Contact data: {JSON.stringify(contact, null, 2)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}