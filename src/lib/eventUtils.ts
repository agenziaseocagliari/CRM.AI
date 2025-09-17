// src/lib/eventUtils.ts
import { Organization, Contact, CrmEvent } from '../types';
import { toast } from 'react-hot-toast';

// A standardized form data type for our utility functions
interface EventFormData {
    title: string;
    time: string;
    duration: number;
    description: string;
    location?: string;
    addMeet?: boolean;
}

/**
 * Validates the payload for creating or updating an event.
 * @param payload The object to validate.
 * @param isUpdate A flag to indicate if this is for an update operation.
 * @returns An object with validation status and an error message if invalid.
 */
function validateEventPayload(payload: any, isUpdate: boolean = false): { isValid: boolean, error: string | null } {
    if (!payload) {
        return { isValid: false, error: "Il payload dell'evento è nullo." };
    }

    if (!payload.organization_id) {
        return { isValid: false, error: "ID Organizzazione mancante nel payload." };
    }

    if (isUpdate) {
        if (!payload.crm_event_id) {
            return { isValid: false, error: "ID Evento CRM mancante per l'aggiornamento." };
        }
    } else {
        if (!payload.contact_id) {
            return { isValid: false, error: "ID Contatto mancante nel payload." };
        }
         if (!payload.contact) {
            return { isValid: false, error: "Oggetto 'contact' mancante nel payload." };
        }
    }

    if (!payload.eventDetails) {
        return { isValid: false, error: "Dettagli dell'evento ('eventDetails') mancanti." };
    }
    
    const { summary, startTime, endTime } = payload.eventDetails;
    if (!summary || typeof summary !== 'string' || summary.trim() === '') {
        return { isValid: false, error: "Il titolo (summary) dell'evento è obbligatorio." };
    }
    if (!startTime || !endTime) {
        return { isValid: false, error: "Le date di inizio e fine sono obbligatorie." };
    }
    try {
        if (new Date(startTime) >= new Date(endTime)) {
            return { isValid: false, error: "L'orario di fine deve essere successivo a quello di inizio." };
        }
    } catch (e) {
        return { isValid: false, error: "Formato data/ora non valido." };
    }

    return { isValid: true, error: null };
}

/**
 * A wrapper to handle the frontend validation and toast display logic.
 * @param payload The payload to validate.
 * @param isUpdate Whether the validation is for an update.
 * @returns True if valid, false otherwise.
 */
export function validateAndToast(payload: any, isUpdate: boolean = false): boolean {
    const validation = validateEventPayload(payload, isUpdate);
    if (!validation.isValid) {
        toast.error(validation.error || "Errore di validazione sconosciuto.");
        console.error("Validation failed:", validation.error, "Payload:", payload);
        return false;
    }
    return true;
}

/**
 * Centralized utility to build the payload for creating a new Google event.
 * @param organization The current organization.
 * @param contact The contact for the event.
 * @param formData The data from the event form.
 * @param date The specific date for the event.
 * @returns The structured payload for the 'create-google-event' edge function.
 */
export function buildCreateEventPayload(
    organization: Organization,
    contact: Contact,
    formData: EventFormData,
    date: Date
) {
    const { title, time, duration, description, location, addMeet } = formData;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    const startTime = new Date(`${localDateString}T${time}:00`);
    const endTime = new Date(startTime.getTime() + Number(duration) * 60000);

    const eventDetails = {
        summary: title,
        description,
        location: location || '',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        addMeet: addMeet || false,
    };
    
    // TODO: Allineamento payload per edge function, compatibilità Supabase v2 (settembre 2025)
    // Struttura unica per la creazione di eventi.
    return {
        organization_id: organization.id,
        contact_id: contact.id,
        eventDetails,
        contact,
    };
}

/**
 * Centralized utility to build the payload for updating an existing Google event.
 * @param organization The current organization.
 * @param crmEvent The CRM event to be updated.
 * @param formData The new data from the event form.
 * @returns The structured payload for the 'update-google-event' edge function.
 */
export function buildUpdateEventPayload(
    organization: Organization,
    crmEvent: CrmEvent,
    formData: EventFormData
) {
    const { title, time, duration, description } = formData;
    
    // La data viene presa dall'evento esistente per mantenere il giorno corretto
    const existingDate = new Date(crmEvent.event_start_time);
    const year = existingDate.getFullYear();
    const month = String(existingDate.getMonth() + 1).padStart(2, '0');
    const day = String(existingDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    const startTime = new Date(`${localDateString}T${time}:00`);
    const endTime = new Date(startTime.getTime() + Number(duration) * 60000);

    const eventDetails = {
        summary: title,
        description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
    };
    
    // TODO: Allineamento payload per edge function, compatibilità Supabase v2 (settembre 2025)
    // Struttura unica per l'aggiornamento di eventi.
    return {
        organization_id: organization.id,
        crm_event_id: crmEvent.id,
        eventDetails
    };
}
