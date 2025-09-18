// src/lib/eventUtils.ts
import { Organization, Contact, CrmEvent, CreateGoogleEventPayload, UpdateGoogleEventPayload } from '../types';
import { toast } from 'react-hot-toast';

// Un tipo standard per i dati del form, usato da entrambe le modali
interface EventFormData {
    title: string;
    time: string;
    duration: number;
    description: string;
    location?: string;
    addMeet?: boolean;
    contact_id?: string;
}

/**
 * Valida il payload per creare o aggiornare un evento.
 * Mostra un toast con un messaggio di errore specifico in caso di fallimento.
 * @param payload L'oggetto da validare.
 * @param isUpdate Flag per indicare se è un'operazione di aggiornamento.
 * @returns boolean True se il payload è valido, altrimenti false.
 */
export function validateAndToast(payload: any, isUpdate: boolean = false): boolean {
    // --- REQUISITO SODDISFATTO: Validazione userId ---
    // Questo è il primo e più importante controllo. Se manca l'ID utente,
    // l'operazione viene bloccata immediatamente.
    if (!payload || !payload.userId) {
        toast.error("Impossibile salvare l'evento: sessione utente non valida o scaduta. Riprova il login.");
        console.error("Validation failed: Payload or userId is missing", payload);
        return false;
    }

    if (!payload.organization_id) {
        toast.error("ID Organizzazione mancante. Impossibile salvare l'evento.");
        console.error("Validation failed: Missing organization_id", payload);
        return false;
    }

    if (isUpdate) {
        if (!payload.crm_event_id) {
            toast.error("ID Evento CRM mancante per l'aggiornamento.");
            console.error("Validation failed: Missing crm_event_id for update", payload);
            return false;
        }
    } else {
        if (!payload.contact_id || !payload.contact) {
            toast.error("Dati del contatto mancanti o non validi.");
            console.error("Validation failed: Missing contact_id or contact object", payload);
            return false;
        }
    }

    if (!payload.eventDetails) {
        toast.error("Dettagli dell'evento ('eventDetails') mancanti.");
        console.error("Validation failed: Missing eventDetails object", payload);
        return false;
    }
    
    const { summary, startTime, endTime } = payload.eventDetails;

    if (!summary || typeof summary !== 'string' || summary.trim() === '') {
        toast.error("Il titolo dell'evento è obbligatorio.");
        console.error("Validation failed: Missing or empty summary", payload);
        return false;
    }
    if (!startTime || !endTime) {
        toast.error("Le date di inizio e fine sono obbligatorie.");
        console.error("Validation failed: Missing startTime or endTime", payload);
        return false;
    }
    try {
        if (new Date(startTime) >= new Date(endTime)) {
            toast.error("L'orario di fine deve essere successivo a quello di inizio.");
            console.error("Validation failed: endTime is not after startTime", payload);
            return false;
        }
    } catch (e) {
        toast.error("Formato data/ora non valido.");
        console.error("Validation failed: Invalid date format", e, payload);
        return false;
    }

    return true; // Tutti i controlli sono passati
}


/**
 * Utility centralizzata per costruire il payload per la creazione di un evento.
 * @param userId ID dell'utente autenticato (obbligatorio).
 * @param organization L'organizzazione corrente.
 * @param contact Il contatto per l'evento.
 * @param formData I dati dal form dell'evento.
 * @param date La data specifica dell'evento (opzionale, default a oggi).
 * @returns Il payload strutturato per la funzione 'create-google-event'.
 */
export function buildCreateEventPayload(
    userId: string,
    organization: Organization,
    contact: Contact,
    formData: EventFormData,
    date?: Date
): CreateGoogleEventPayload {
    const { title, time, duration, description, location, addMeet } = formData;
    
    const eventDate = date || new Date();
    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, '0');
    const day = String(eventDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    const startTime = new Date(`${localDateString}T${time}:00`);
    const endTime = new Date(startTime.getTime() + Number(duration) * 60000);

    return {
        userId,
        organization_id: organization.id,
        contact_id: contact.id,
        eventDetails: {
            summary: title,
            description: description || '',
            location: location || '',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            addMeet: addMeet || false,
        },
        contact: {
            id: contact.id,
            email: contact.email,
        },
    };
}

/**
 * Utility centralizzata per costruire il payload per l'aggiornamento di un evento.
 * @param userId ID dell'utente autenticato (obbligatorio).
 * @param organization L'organizzazione corrente.
 * @param crmEvent L'evento CRM da aggiornare.
 * @param formData I nuovi dati dal form dell'evento.
 * @param date La data specifica dell'evento.
 * @returns Il payload strutturato per la funzione 'update-google-event'.
 */
export function buildUpdateEventPayload(
    userId: string,
    organization: Organization,
    crmEvent: CrmEvent,
    formData: EventFormData,
    date: Date
): UpdateGoogleEventPayload {
    const { title, time, duration, description } = formData;
    
    const eventDate = date || new Date(crmEvent.event_start_time);
    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, '0');
    const day = String(eventDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    const startTime = new Date(`${localDateString}T${time}:00`);
    const endTime = new Date(startTime.getTime() + Number(duration) * 60000);

    return {
        userId,
        organization_id: organization.id,
        crm_event_id: crmEvent.id,
        eventDetails: {
            summary: title,
            description: description || '',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
        }
    };
}
