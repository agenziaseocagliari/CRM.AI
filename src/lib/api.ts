import React from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from './supabaseClient'

const handleAuthErrorToast = (toastId?: string) => {
  const options = { id: toastId, duration: 8000 }
  toast.error(
    t =>
      React.createElement(
        'span',
        { className: 'text-center' },
        "La tua sessione o la connessione a Google sono scadute.",
        React.createElement(
          'a',
          {
            href: '/settings',
            onClick: () => toast.dismiss(t.id),
            className: 'block mt-2 font-bold underline text-indigo-600 hover:text-indigo-500'
          },
          "Verifica nelle Impostazioni"
        )
      ),
    options
  )
}

/**
 * Helper centralizzato per chiamare le Supabase Edge Function con autenticazione solida.
 * Invocare sempre questa funzione e MAI fetch nativo o wrapper non documentati.
 */
export async function invokeSupabaseFunction(functionName: string, payload: object = {}) {
  console.log(`[API Helper] Invocazione di '${functionName}' con fetch esplicito...`)
  console.log(`[API Helper] Payload inviato a '${functionName}':`, payload)

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Le variabili d'ambiente VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY non sono configurate.")
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw new Error(`Errore nel recupero della sessione: ${sessionError.message}`)

  if (!session) {
    handleAuthErrorToast()
    throw new Error("Sessione utente non trovata. Effettua nuovamente il login.")
  }

  const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': supabaseAnonKey
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[API Helper] Errore HTTP da '${functionName}' (${response.status}):`, errorText)
    if (response.status === 401 || response.status === 403) handleAuthErrorToast()
    try {
      const errorJson = JSON.parse(errorText)
      throw new Error(errorJson.error || errorJson.message || `Errore del server (${response.status})`)
    } catch (e) {
      throw new Error(`Errore del server (${response.status}): ${errorText}`)
    }
  }

  const responseData = await response.json()
  console.log(`[API Helper] Risposta da '${functionName}':`, { data: responseData })

  if (responseData && responseData.error) {
    const errorMessage = responseData.error.toString().toLowerCase()
    if (
      errorMessage.includes("authenticate") ||
      errorMessage.includes("token") ||
      errorMessage.includes("non autenticato") ||
      errorMessage.includes("accesso negato")
    ) {
      handleAuthErrorToast()
    }
    throw new Error(responseData.error)
  }
  return responseData
}
