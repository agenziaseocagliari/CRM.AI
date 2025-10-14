'use client'

import { useNavigate } from 'react-router-dom'
import { UserPlus, TrendingUp, Calendar, FileText, Mail, Kanban } from 'lucide-react'

export default function QuickActions() {
  const navigate = useNavigate()

  const actions = [
    {
      title: 'Nuovo Contatto',
      description: 'Aggiungi un nuovo contatto al CRM',
      icon: UserPlus,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      action: () => {
        console.log('Navigating to contacts...') // Debug log
        navigate('/dashboard/contacts?action=new')
      }
    },
    {
      title: 'Nuova Opportunità',
      description: 'Crea una nuova opportunità di vendita',
      icon: TrendingUp,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      action: () => {
        console.log('Navigating to opportunities...') // Debug log
        navigate('/dashboard/opportunities?action=new')
      }
    },
    {
      title: 'Programma Evento',
      description: 'Aggiungi un nuovo evento al calendario',
      icon: Calendar,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      action: () => {
        console.log('Navigating to calendar...') // Debug log
        navigate('/dashboard/calendar?action=new')
      }
    },
    {
      title: 'Nuovo Form',
      description: 'Crea un form per raccogliere lead',
      icon: FileText,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      action: () => {
        console.log('Navigating to forms...') // Debug log
        navigate('/dashboard/forms?action=new')
      }
    },
    {
      title: 'Campagna Email',
      description: 'Invia una campagna email marketing',
      icon: Mail,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      action: () => {
        console.log('Navigating to email marketing...') // Debug log
        navigate('/dashboard/email-marketing?action=new')
      }
    },
    {
      title: 'Vedi Pipeline',
      description: 'Gestisci le tue opportunità',
      icon: Kanban,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      action: () => {
        console.log('Navigating to opportunities pipeline...') // Debug log
        navigate('/dashboard/opportunities')
      }
    }
  ]

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Azioni Rapide</h2>
      <p className="text-sm text-gray-600 mb-4">
        Accedi rapidamente alle funzioni principali del CRM
      </p>

      <div className="space-y-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault()
              console.log(`Quick action clicked: ${action.title}`) // Debug
              action.action()
            }}
            type="button"
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all text-left group border border-transparent hover:border-gray-200"
          >
            <div className={`p-2.5 rounded-lg ${action.color} ${action.hoverColor} group-hover:scale-110 transition-transform`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {action.title}
              </p>
              <p className="text-xs text-gray-500 truncate">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}