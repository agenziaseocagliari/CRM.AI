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
    contact_id?: string; // Needed for DayEventsModal form
}

/**
 * Validates the payload for creating or updating an event.
 * Shows a toast with a specific error message on failure.
 * @param payload The object to validate.
 * @param isUpdate A flag to indicate if this is for an update operation.
 * @returns boolean True if the payload is valid, false otherwise.
 */
export function validateAndToast(payload: any, isUpdate: boolean = false): boolean {
    if (!payload) {
        toast.error("Errore interno: il payload dell'evento è nullo.");
        console.error("Validation failed: Payload is null or undefined", payload);
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
        if (!payload.contact_id) {
            toast.error("ID Contatto mancante. Impossibile salvare l'evento.");
            console.error("Validation failed: Missing contact_id", payload);
            return false;
        }
         if (!payload.contact || typeof payload.contact !== 'object') {
            toast.error("Dati del contatto mancanti o non validi.");
            console.error("Validation failed: Missing or invalid 'contact' object", payload);
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
        console.error("Validation failed: Invalid date format", payload);
        return false;
    }

    return true; // All checks passed
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
    
    // Assicura che la data sia interpretata nel fuso orario locale
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    const startTime = new Date(`${localDateString}T${time}:00`);
    const endTime = new Date(startTime.getTime() + Number(duration) * 60000);

    const eventDetails = {
        summary: title,
        description: description || '',
        location: location || '',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        addMeet: addMeet || false,
    };
    
    // --- REQUISITO SODDISFATTO: organization_id ---
    // L'organization_id è sempre incluso per permettere al backend di recuperare
    // il token Google corretto in un ambiente multi-tenant.
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
        description: description || '',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
    };
    
    // --- REQUISITO SODDISFATTO: organization_id ---
    // L'organization_id è sempre incluso per permettere al backend di recuperare
    // il token Google corretto in un ambiente multi-tenant.
    return {
        organization_id: organization.id,
        crm_event_id: crmEvent.id,
        eventDetails
    };
}