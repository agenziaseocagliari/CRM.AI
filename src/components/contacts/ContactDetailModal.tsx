'use client'

import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import {
    Activity, Award,
    Building,
    Calendar,
    Clock,
    Edit2,
    FileText,
    Mail,
    MapPin,
    Phone,
    Trash2,
    TrendingUp,
    X
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { getUserOrganization } from '../../lib/organizationContext'
import { supabase } from '../../lib/supabaseClient'
import { Contact, Opportunity } from '../../types'
import DocumentUploader from '../insurance/DocumentUploader'
import DocumentGallery from '../insurance/DocumentGallery'

interface ContactNote {
  id: string
  contact_id: string
  note: string
  created_at: string
  created_by: string
  updated_at?: string
}

interface CalendarEvent {
  id: string
  title: string
  start: string
  start_time?: string
  contact_id: string
  location?: string
}

interface ContactActivity {
  id: string
  type: string
  description?: string
  created_at: string
  start_time?: string
  title?: string
  note?: string
  value?: number
  pipeline_stages?: { name: string }
  [key: string]: unknown
}

interface ContactDetailModalProps {
  isOpen: boolean
  onClose: () => void
  contact: Contact
  onUpdate: (contact: Contact) => void
}

export default function ContactDetailModal({
  isOpen,
  onClose,
  contact,
  onUpdate: _onUpdate
}: ContactDetailModalProps) {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'deals' | 'events' | 'documents'>('overview')
  const [notes, setNotes] = useState<ContactNote[]>([])
  const [deals, setDeals] = useState<Opportunity[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [activities, setActivities] = useState<ContactActivity[]>([])
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [isCreatingDeal, setIsCreatingDeal] = useState(false)
  const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0)
  
  // Enhanced notes functionality
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editNoteText, setEditNoteText] = useState('')

  const loadContactData = useCallback(async () => {
    try {
      // Load notes from contact_notes table
      console.log('📚 Loading notes for contact:', contact.id)
      const { data: notesData, error: notesError } = await supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })

      if (notesError) {
        console.error('❌ Error loading contact notes:', notesError)
        console.error('❌ Notes error code:', notesError.code)
        if (notesError.code === '42P01') {
          console.error('⚠️ contact_notes table does not exist! Run PHASE1_DATABASE_SCRIPTS.sql')
        }
      } else {
        console.log('✅ Notes loaded successfully:', { count: notesData?.length || 0, data: notesData })
      }

      // Load related opportunities (deals)
      console.log('💼 Loading opportunities for contact:', contact.id)
      const { data: dealsData, error: dealsError } = await supabase
        .from('opportunities')
        .select(`
          *
        `)
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })

      if (dealsError) {
        console.error('❌ Error loading opportunities:', dealsError)
        console.error('❌ Deals error code:', dealsError.code)
        if (dealsError.code === '42P01') {
          console.error('⚠️ opportunities table does not exist! Run PHASE1_DATABASE_SCRIPTS.sql')
        }
      } else {
        console.log('✅ Opportunities loaded successfully:', { count: dealsData?.length || 0, data: dealsData })
      }

      // Load related events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .contains('attendees', [contact.email])
        .order('start_time', { ascending: false })
        .limit(10)

      // Combine all activities for timeline
      const allActivities = [
        ...(notesData?.map((n: ContactNote) => ({ type: 'note', ...n })) || []),
        ...(dealsData?.map(d => ({ type: 'deal', ...d })) || []),
        ...(eventsData?.map(e => ({ type: 'event', ...e })) || [])
      ].sort((a, b) => new Date(b.created_at || b.start_time).getTime() - new Date(a.created_at || a.start_time).getTime())

      setNotes(notesData || [])
      setDeals(dealsData || [])
      setEvents(eventsData || [])
      setActivities(allActivities)
    } catch (error) {
      console.error('Error loading contact data:', error)
    }
  }, [contact])

  useEffect(() => {
    if (contact && isOpen) {
      loadContactData()
    }
  }, [contact, isOpen, loadContactData])

  async function handleAddNote() {
    console.log('🔵 PHASE3: handleAddNote started (multi-tenant)', { newNote: newNote.trim(), contactId: contact.id })
    
    if (!newNote.trim()) {
      console.log('❌ Empty note detected')
      toast.error('Nota vuota')
      return
    }

    setIsAddingNote(true)
    try {
      // Step 1: Get user (simple check)
      console.log('🔍 Step 1: Getting authenticated user...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ Auth error:', authError)
        toast.error('Devi essere autenticato')
        return
      }
      console.log('✅ User authenticated:', { userId: user.id, email: user.email })

      // Step 2: Get organization context (CRITICAL for multi-tenant!)
      console.log('🏢 Step 2: Getting organization context...')
      const { organization_id, error: orgError } = await getUserOrganization()
      
      if (orgError || !organization_id) {
        console.error('❌ Organization error:', orgError)
        toast.error('Organizzazione non trovata. Contatta amministratore.')
        return
      }
      console.log('✅ Organization found:', organization_id)

      // Step 3: Multi-tenant insert with organization_id
      const noteData = {
        contact_id: contact.id,
        note: newNote.trim(),
        created_by: user.id,
        organization_id: organization_id  // MULTI-TENANT KEY!
      }
      console.log('📝 Step 3: Inserting note with organization:', noteData)

      const { data, error } = await supabase
        .from('contact_notes')
        .insert(noteData)
        .select()
        .single()

      if (error) {
        console.error('❌ Insert error details:', error)
        console.error('❌ Error code:', error.code)
        console.error('❌ Error message:', error.message)
        
        if (error.code === '42P01') {
          toast.error('⚠️ Tabella contact_notes non trovata! Esegui PHASE1_DATABASE_SCRIPTS.sql')
        } else if (error.code === '23503') {
          toast.error('⚠️ Riferimento contatto non valido')
        } else {
          toast.error(`❌ Errore DB: ${error.message}`)
        }
        return
      }

      console.log('✅ Note saved successfully:', data)

      // Step 3: Update UI
      setNotes([data, ...notes])
      setNewNote('')
      toast.success('✅ Nota salvata con successo!')
      
    } catch (error: unknown) {
      const err = error as Error
      console.error('💥 Complete error:', err)
      const errorMsg = err.message || err.toString()
      toast.error(`💥 Errore: ${errorMsg}`)
    } finally {
      setIsAddingNote(false)
      console.log('🔵 handleAddNote completed')
    }
  }

  // Enhanced Notes Functions: Update and Delete
  async function handleUpdateNote(noteId: string, newText: string) {
    if (!newText.trim()) {
      toast.error('Nota vuota')
      return
    }

    try {
      const { error } = await supabase
        .from('contact_notes')
        .update({ 
          note: newText.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)

      if (error) {
        console.error('❌ Error updating note:', error)
        toast.error('Errore aggiornamento nota')
        return
      }

      // Update local state
      setNotes(notes.map(n => 
        n.id === noteId 
          ? { ...n, note: newText.trim(), updated_at: new Date().toISOString() }
          : n
      ))

      setEditingNoteId(null)
      setEditNoteText('')
      toast.success('Nota aggiornata!')

    } catch (error: unknown) {
      const err = error as Error
      console.error('Error updating note:', err)
      toast.error('Errore aggiornamento nota')
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Eliminare questa nota?')) return

    try {
      const { error } = await supabase
        .from('contact_notes')
        .delete()
        .eq('id', noteId)

      if (error) {
        console.error('❌ Error deleting note:', error)
        toast.error('Errore eliminazione nota')
        return
      }

      // Update local state
      setNotes(notes.filter(n => n.id !== noteId))
      toast.success('Nota eliminata!')

    } catch (error: unknown) {
      const err = error as Error
      console.error('Error deleting note:', err)
      toast.error('Errore eliminazione nota')
    }
  }

  async function handleCreateDeal() {
    console.log('🟢 PHASE3: handleCreateDeal started (multi-tenant)', { contactId: contact.id, contactName: contact.name })
    
    setIsCreatingDeal(true)
    try {
      // Step 1: Auth check
      console.log('🔍 Step 1: Getting authenticated user...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ Auth error:', authError)
        toast.error('Non autenticato')
        return
      }
      console.log('✅ User authenticated:', { userId: user.id, email: user.email })

      // Step 2: Get organization context (CRITICAL for multi-tenant!)
      console.log('🏢 Step 2: Getting organization context...')
      const { organization_id, error: orgError } = await getUserOrganization()
      
      if (orgError || !organization_id) {
        console.error('❌ Organization error:', orgError)
        toast.error('Organizzazione non trovata. Contatta amministratore.')
        return
      }
      console.log('✅ Organization found:', organization_id)

      // Step 3: Get New Lead stage for THIS organization
      console.log('📊 Step 3: Finding pipeline stage for organization...')
      const { data: stages, error: stageError } = await supabase
        .from('pipeline_stages')
        .select('id, name')
        .eq('organization_id', organization_id)  // Filter by org!
        .ilike('name', '%new%lead%')
        .limit(1)

      if (stageError || !stages || stages.length === 0) {
        console.error('❌ Stage lookup error:', stageError)
        // Try without organization filter as fallback
        const { data: fallbackStages } = await supabase
          .from('pipeline_stages')
          .select('id, name')
          .ilike('name', '%lead%')
          .limit(1)
        
        if (!fallbackStages || fallbackStages.length === 0) {
          toast.error('Stage "New Lead" non trovato')
          return
        }
        console.log('⚠️ Using fallback stage:', fallbackStages[0])
      }

      // Step 4: Create opportunity with organization context
      const opportunityData = {
        contact_name: contact.name,
        contact_id: contact.id,
        value: 0,
        stage: 'New Lead', // Direct string - matches enum
        assigned_to: user.email || user.id,
        close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        organization_id: organization_id,  // MULTI-TENANT KEY!
        status: 'open',
        source: 'manual',
        created_by: user.id
      }
      console.log('💼 Step 4: Creating opportunity with organization:', opportunityData)

      const { data: newOpp, error: createError } = await supabase
        .from('opportunities')
        .insert(opportunityData)
        .select(`
          *
        `)
        .single()

      if (createError) {
        console.error('❌ Create error details:', createError)
        console.error('❌ Error code:', createError.code)
        console.error('❌ Error message:', createError.message)
        
        if (createError.code === '42P01') {
          toast.error('⚠️ Tabella opportunities non trovata! Esegui PHASE1_DATABASE_SCRIPTS.sql')
        } else if (createError.code === '23503') {
          toast.error('⚠️ Riferimenti tabella non validi (contatto/organizzazione)')
        } else {
          toast.error(`❌ Errore DB: ${createError.message}`)
        }
        return
      }

      console.log('✅ Opportunity created successfully:', newOpp)

      // Step 4: Success
      toast.success('✅ Opportunità creata con successo!')
      
      // Reload to show new deal
      console.log('🔄 Reloading contact data...')
      await loadContactData()

      // Navigate after brief delay
      setTimeout(() => {
        console.log('🧭 Navigating to opportunities page...')
        navigate('/dashboard/opportunities')
      }, 1500)

    } catch (error: unknown) {
      const err = error as Error
      console.error('💥 Complete error:', err)
      const errorMsg = err.message || err.toString()
      toast.error(`💥 Errore: ${errorMsg}`)
    } finally {
      setIsCreatingDeal(false)
      console.log('🟢 handleCreateDeal completed')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {contact.name?.charAt(0)?.toUpperCase()}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">{contact.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                {contact.company && (
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {contact.company}
                  </span>
                )}
                {contact.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {contact.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-gray-50 border-b px-6 py-3 flex gap-2">
          <button
            onClick={() => window.location.href = `mailto:${contact.email}`}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          
          <button
            onClick={() => window.location.href = `tel:${contact.phone}`}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            <Phone className="w-4 h-4" />
            Chiama
          </button>
          
          <button
            onClick={() => navigate(`/dashboard/calendar?contact=${contact.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            <Calendar className="w-4 h-4" />
            Programma
          </button>
          
          <button
            onClick={handleCreateDeal}
            disabled={isCreatingDeal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
          >
            {isCreatingDeal ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Crea Opportunità
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <div className="flex gap-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Panoramica', icon: Activity },
              { id: 'activity', label: 'Timeline', icon: Clock },
              { id: 'deals', label: `Opportunità (${deals.length})`, icon: TrendingUp },
              { id: 'events', label: `Eventi (${events.length})`, icon: Calendar },
              { id: 'documents', label: 'Documenti', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'activity' | 'deals' | 'events' | 'documents')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Contact Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Details Card */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Informazioni Contatto</h3>
                  
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Email</dt>
                      <dd className="text-sm text-gray-900">{contact.email || 'N/A'}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Telefono</dt>
                      <dd className="text-sm text-gray-900">{contact.phone || 'N/A'}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Azienda</dt>
                      <dd className="text-sm text-gray-900">{contact.company || 'N/A'}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Creato</dt>
                      <dd className="text-sm text-gray-900">
                        {format(new Date(contact.created_at), 'dd MMM yyyy', { locale: it })}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Notes Section */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Note</h3>
                  
                  {/* Add Note */}
                  <div className="mb-4">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Aggiungi una nota su questo contatto..."
                      rows={3}
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || isAddingNote}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                    >
                      {isAddingNote ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Aggiungi Nota'
                      )}
                    </button>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {notes.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nessuna nota ancora. Aggiungi la prima!
                      </p>
                    ) : (
                      notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 rounded-lg p-4 group relative">
                          {editingNoteId === note.id ? (
                            // Edit mode
                            <div>
                              <textarea
                                value={editNoteText}
                                onChange={(e) => setEditNoteText(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleUpdateNote(note.id, editNoteText)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                                >
                                  Salva
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNoteId(null)
                                    setEditNoteText('')
                                  }}
                                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
                                >
                                  Annulla
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <>
                              <p className="text-sm text-gray-900 mb-2">{note.note}</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(note.created_at), 'dd MMM yyyy HH:mm', { locale: it })}
                                {note.updated_at && note.updated_at !== note.created_at && (
                                  <span className="ml-2 text-gray-400">(modificata)</span>
                                )}
                              </p>

                              {/* Actions - show on hover */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingNoteId(note.id)
                                    setEditNoteText(note.note)
                                  }}
                                  className="p-1.5 bg-white border rounded hover:bg-gray-50 shadow-sm transition-colors"
                                  title="Modifica"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-1.5 bg-white border rounded hover:bg-red-50 shadow-sm transition-colors"
                                  title="Elimina"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Stats & Quick Info */}
              <div className="space-y-6">
                {/* Lead Score */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium opacity-90">Lead Score</span>
                    <Award className="w-5 h-5 opacity-75" />
                  </div>
                  <div className="text-4xl font-bold mb-1">
                    {contact.lead_score || 0}/100
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all"
                      style={{ width: `${contact.lead_score || 0}%` }}
                    />
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Statistiche</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Opportunità</span>
                      <span className="text-sm font-bold text-gray-900">{deals.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Eventi</span>
                      <span className="text-sm font-bold text-gray-900">{events.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Note</span>
                      <span className="text-sm font-bold text-gray-900">{notes.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-sm text-gray-600">Valore Totale</span>
                      <span className="text-sm font-bold text-green-600">
                        €{deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0).toLocaleString('it-IT')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="max-w-3xl">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Timeline Attività</h3>
              
              {/* Activity Timeline */}
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Nessuna attività registrata ancora
                  </p>
                ) : (
                  activities.map((activity, index) => (
                    <div key={index} className="flex gap-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'note' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'deal' ? 'bg-purple-100 text-purple-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {activity.type === 'note' && <FileText className="w-5 h-5" />}
                          {activity.type === 'deal' && <TrendingUp className="w-5 h-5" />}
                          {activity.type === 'event' && <Calendar className="w-5 h-5" />}
                        </div>
                        {index < activities.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-2" />
                        )}
                      </div>

                      {/* Activity Content */}
                      <div className="flex-1 pb-8">
                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {activity.type === 'note' && 'Nota aggiunta'}
                                {activity.type === 'deal' && activity.title}
                                {activity.type === 'event' && activity.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(
                                  new Date(activity.created_at || activity.start_time || new Date()), 
                                  'dd MMM yyyy HH:mm', 
                                  { locale: it }
                                )}
                              </p>
                            </div>
                            
                            {activity.type === 'deal' && (
                              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                {activity.pipeline_stages?.name}
                              </span>
                            )}
                          </div>
                          
                          {activity.type === 'note' && (
                            <p className="text-sm text-gray-700">{activity.note}</p>
                          )}
                          
                          {activity.type === 'deal' && (
                            <p className="text-sm text-gray-700">
                              Valore: €{Number(activity.value).toLocaleString('it-IT')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'deals' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Opportunità Collegate</h3>
              
              {deals.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nessuna opportunità collegata</p>
                  <button
                    onClick={handleCreateDeal}
                    disabled={isCreatingDeal}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2 mx-auto"
                  >
                    {isCreatingDeal ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creando...
                      </>
                    ) : (
                      'Crea Prima Opportunità'
                    )}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deals.map((deal) => (
                    <div key={deal.id} className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{deal.contact_name}</h4>
                        <span className={`text-xs px-2 py-1 rounded bg-blue-100 text-blue-700`}>
                          {deal.stage}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Valore</span>
                          <span className="font-bold text-gray-900">
                            €{Number(deal.value).toLocaleString('it-IT')}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Creato</span>
                          <span className="text-gray-600">
                            {format(new Date(deal.created_at), 'dd MMM yyyy', { locale: it })}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/dashboard/opportunities?highlight=${deal.id}`)}
                        className="w-full mt-4 px-4 py-2 border rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                      >
                        Vedi Dettagli
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Eventi Collegati</h3>
              
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nessun evento programmato</p>
                  <button
                    onClick={() => navigate(`/dashboard/calendar?contact=${contact.id}`)}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Programma Evento
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg bg-green-100 flex flex-col items-center justify-center">
                            <span className="text-xs font-medium text-green-700">
                              {format(new Date(event.start_time || event.start), 'MMM', { locale: it })}
                            </span>
                            <span className="text-lg font-bold text-green-700">
                              {format(new Date(event.start_time || event.start), 'dd')}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1">{event.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(event.start_time || event.start), 'HH:mm')}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/dashboard/calendar?event=${event.id}`)}
                          className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition"
                        >
                          Dettagli
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6">📋 Documenti Contatto</h3>
              
              {/* DEBUG MARKER - Highly visible */}
              <div style={{
                background: 'linear-gradient(90deg, red, yellow, lime)',
                padding: '20px',
                marginBottom: '30px',
                borderRadius: '8px',
                border: '4px solid #000',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', textShadow: '2px 2px 4px black' }}>
                  🔴 DEBUG: DOCUMENTS TAB ACTIVE 🔴
                </p>
                <p style={{ fontSize: '18px', color: 'white', marginTop: '10px' }}>
                  Contact ID: {contact.id}
                </p>
                <p style={{ fontSize: '18px', color: 'white' }}>
                  Organization ID: {contact.organization_id || '❌ MISSING'}
                </p>
              </div>
              
              {contact.organization_id ? (
                <div className="space-y-6">
                  {/* Upload Section */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Carica Nuovi Documenti
                    </h4>
                    <DocumentUploader
                      organizationId={contact.organization_id}
                      category="contact"
                      entityType="contact"
                      entityId={contact.id}
                      onUploadComplete={() => {
                        console.log('[MODAL] Document uploaded to contact:', contact.id);
                        setDocumentsRefreshKey(prev => prev + 1);
                        toast.success('Documento caricato con successo!');
                      }}
                    />
                  </div>

                  {/* Gallery Section */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Documenti Esistenti</h4>
                    <DocumentGallery
                      key={documentsRefreshKey}
                      organizationId={contact.organization_id}
                      category="contact"
                      entityType="contact"
                      entityId={contact.id}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-red-50 border-2 border-red-500 rounded-lg">
                  <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <p className="text-red-700 font-bold text-xl mb-2">
                    ❌ Organization ID Mancante
                  </p>
                  <p className="text-red-600">
                    Impossibile caricare documenti senza Organization ID.
                  </p>
                  <p className="text-red-600 mt-2">
                    Effettua nuovamente il login.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}