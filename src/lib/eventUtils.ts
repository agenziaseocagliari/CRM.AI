// This import section is managed in batch via AIStudio—do not add unused imports.
import { toast } from 'react-hot-toast';
import { Contact, CreateGoogleEventPayload, CrmEvent, Organization, UpdateGoogleEventPayload } from '../types';

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

    if (!payload.event) {
        toast.error("Dettagli dell'evento ('event') mancanti.");
        console.error("Validation failed: Missing event object", payload);
        return false;
    }
    
    const { summary, start, end } = payload.event;

    if (!summary || typeof summary !== 'string' || summary.trim() === '') {
        toast.error("Il titolo dell'evento è obbligatorio.");
        console.error("Validation failed: Missing or empty summary", payload);
        return false;
    }
    if (!start || !end) {
        toast.error("Le date di inizio e fine sono obbligatorie.");
        console.error("Validation failed: Missing start or end", payload);
        return false;
    }
    try {
        if (new Date(start) >= new Date(end)) {
            toast.error("L'orario di fine deve essere successivo a quello di inizio.");
            console.error("Validation failed: end is not after start", payload);
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
 * @param organization L'organizzazione corrente.
 * @param contact Il contatto per l'evento.
 * @param formData I dati dal form dell'evento.
 * @param date La data specifica dell'evento (opzionale, default a oggi).
 * @returns Il payload strutturato per la funzione 'create-google-event'.
 */
export function buildCreateEventPayload(
    organization: Organization,
    contact: Contact,
    formData: EventFormData,
    date?: Date
): Omit<CreateGoogleEventPayload, 'userId'> {
    const { title, time, duration, description, location, addMeet } = formData;
    
    const eventDate = date || new Date();
    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, '0');
    const day = String(eventDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    const startTime = new Date(`${localDateString}T${time}:00`);
    const endTime = new Date(startTime.getTime() + Number(duration) * 60000);

    return {
        organization_id: organization.id,
        contact_id: contact.id,
        event: {
            summary: title,
            description: description || '',
            location: location || '',
            start: startTime.toISOString(),
            end: endTime.toISOString(),
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
 * @param organization L'organizzazione corrente.
 * @param crmEvent L'evento CRM da aggiornare.
 * @param formData I nuovi dati dal form dell'evento.
 * @param date La data specifica dell'evento.
 * @returns Il payload strutturato per la funzione 'update-google-event'.
 */
export function buildUpdateEventPayload(
    organization: Organization,
    crmEvent: CrmEvent,
    formData: EventFormData,
    date: Date
): Omit<UpdateGoogleEventPayload, 'userId'> {
    const { title, time, duration, description } = formData;
    
    const eventDate = date || new Date(crmEvent.event_start_time);
    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, '0');
    const day = String(eventDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    const startTime = new Date(`${localDateString}T${time}:00`);
    const endTime = new Date(startTime.getTime() + Number(duration) * 60000);

    return {
        organization_id: organization.id,
        crm_event_id: crmEvent.id,
        event: {
            summary: title,
            description: description || '',
            start: startTime.toISOString(),
            end: endTime.toISOString(),
        }
    };
}
