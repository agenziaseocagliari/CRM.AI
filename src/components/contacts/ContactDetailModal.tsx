'use client'

import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import {
    Activity, Award,
    Building,
    Calendar,
    Clock,
    FileText,
    Mail,
    MapPin,
    Phone,
    TrendingUp,
    X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface ContactDetailModalProps {
  isOpen: boolean
  onClose: () => void
  contact: any
  onUpdate: (contact: any) => void
}

export default function ContactDetailModal({
  isOpen,
  onClose,
  contact,
  onUpdate
}: ContactDetailModalProps) {
  // supabase is imported from lib/supabaseClient
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'deals' | 'events'>('overview')
  const [notes, setNotes] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [isCreatingDeal, setIsCreatingDeal] = useState(false)

  useEffect(() => {
    if (contact && isOpen) {
      loadContactData()
    }
  }, [contact, isOpen])

  async function loadContactData() {
    setLoading(true)
    try {
      // Load notes from contact_notes table
      const { data: notesData, error: notesError } = await supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })

      if (notesError) {
        console.error('Error loading contact notes:', notesError)
      }

      // Load related opportunities (deals)
      const { data: dealsData, error: dealsError } = await supabase
        .from('opportunities')
        .select('*, pipeline_stages(name, color)')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })

      if (dealsError) {
        console.error('Error loading opportunities:', dealsError)
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
        ...(notesData?.map((n: any) => ({ type: 'note', ...n })) || []),
        ...(dealsData?.map(d => ({ type: 'deal', ...d })) || []),
        ...(eventsData?.map(e => ({ type: 'event', ...e })) || [])
      ].sort((a, b) => new Date(b.created_at || b.start_time).getTime() - new Date(a.created_at || a.start_time).getTime())

      setNotes(notesData || [])
      setDeals(dealsData || [])
      setEvents(eventsData || [])
      setActivities(allActivities)
    } catch (error) {
      console.error('Error loading contact data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) {
      toast.error('La nota non può essere vuota')
      return
    }

    setIsAddingNote(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Devi essere autenticato per aggiungere note')
        return
      }

      // Insert into contact_notes table
      const { data, error } = await supabase
        .from('contact_notes')
        .insert({
          contact_id: contact.id,
          note: newNote.trim(),
          created_by: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving note:', error)
        if (error.code === '42P01') {
          toast.error('Tabella contact_notes non trovata. Contatta l\'amministratore.')
        } else {
          toast.error('Errore nel salvataggio della nota')
        }
        return
      }

      // Success - update UI
      setNotes([data, ...notes])
      setNewNote('')
      toast.success('Nota salvata con successo!')
      
    } catch (error: any) {
      console.error('Failed to add note:', error)
      toast.error('Errore nel salvataggio della nota')
    } finally {
      setIsAddingNote(false)
    }
  }

  async function handleCreateDeal() {
    setIsCreatingDeal(true)
    try {
      // Get current user and organization
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Devi essere autenticato')
        return
      }

      // Get user's organization from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      const organizationId = profile?.organization_id || user.user_metadata?.organization_id

      if (!organizationId) {
        toast.error('Organizzazione non trovata')
        return
      }

      // Create opportunity with correct field names
      const { data: newDeal, error } = await supabase
        .from('opportunities')
        .insert({
          contact_name: contact.name,
          contact_id: contact.id,
          value: 0,
          stage: 'New Lead', // Use enum value directly
          assigned_to: user.email || 'System',
          close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          organization_id: organizationId
        })
        .select()
        .single()

      if (error) {
        console.error('Deal creation error:', error)
        throw error
      }

      toast.success('Opportunità creata con successo!')
      loadContactData() // Reload to show new deal

      // Navigate to opportunities page
      setTimeout(() => {
        navigate('/dashboard/opportunities')
      }, 1000)
      
    } catch (error: any) {
      console.error('Failed to create deal:', error)
      toast.error('Errore nella creazione dell\'opportunità')
    } finally {
      setIsCreatingDeal(false)
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
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'Panoramica', icon: Activity },
              { id: 'activity', label: 'Timeline', icon: Clock },
              { id: 'deals', label: `Opportunità (${deals.length})`, icon: TrendingUp },
              { id: 'events', label: `Eventi (${events.length})`, icon: Calendar }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
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
                        <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-900 mb-2">{note.note}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(note.created_at), 'dd MMM yyyy HH:mm', { locale: it })}
                          </p>
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
                                  new Date(activity.created_at || activity.start_time), 
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
                        <h4 className="font-medium text-gray-900">{deal.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          deal.status === 'won' ? 'bg-green-100 text-green-700' :
                          deal.status === 'lost' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {deal.pipeline_stages?.name}
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
                          <span className="text-gray-600">Probabilità</span>
                          <span className="font-medium">{deal.probability}%</span>
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
                              {format(new Date(event.start_time), 'MMM', { locale: it })}
                            </span>
                            <span className="text-lg font-bold text-green-700">
                              {format(new Date(event.start_time), 'dd')}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1">{event.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(event.start_time), 'HH:mm')}
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
        </div>
      </div>
    </div>
  )
}