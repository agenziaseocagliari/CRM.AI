import { supabase } from '../lib/supabaseClient';
import { Contact } from '../types';

export interface BulkOperationResult {
    success: boolean;
    affected: number;
    error?: string;
}

export class BulkOperationsService {
    /**
     * Soft delete contacts by setting deleted_at timestamp
     */
    static async softDeleteContacts(contactIds: number[]): Promise<BulkOperationResult> {
        try {
            const { error, count } = await supabase
                .from('contacts')
                .update({ deleted_at: new Date().toISOString() })
                .in('id', contactIds);

            if (error) {
                return { success: false, affected: 0, error: error.message };
            }

            return { success: true, affected: count || contactIds.length };
        } catch (error) {
            return { 
                success: false, 
                affected: 0, 
                error: error instanceof Error ? error.message : 'Errore sconosciuto'
            };
        }
    }

    /**
     * Restore soft-deleted contacts by setting deleted_at to null
     */
    static async restoreContacts(contactIds: number[]): Promise<BulkOperationResult> {
        try {
            const { error, count } = await supabase
                .from('contacts')
                .update({ deleted_at: null })
                .in('id', contactIds);

            if (error) {
                return { success: false, affected: 0, error: error.message };
            }

            return { success: true, affected: count || contactIds.length };
        } catch (error) {
            return { 
                success: false, 
                affected: 0, 
                error: error instanceof Error ? error.message : 'Errore sconosciuto'
            };
        }
    }

    /**
     * Hard delete contacts (permanent removal)
     */
    static async hardDeleteContacts(contactIds: number[]): Promise<BulkOperationResult> {
        try {
            const { error, count } = await supabase
                .from('contacts')
                .delete()
                .in('id', contactIds);

            if (error) {
                return { success: false, affected: 0, error: error.message };
            }

            return { success: true, affected: count || contactIds.length };
        } catch (error) {
            return { 
                success: false, 
                affected: 0, 
                error: error instanceof Error ? error.message : 'Errore sconosciuto'
            };
        }
    }

    /**
     * Export selected contacts to CSV format
     */
    static async exportContacts(contacts: Contact[]): Promise<void> {
        try {
            // Prepare CSV data
            const headers = ['Nome', 'Email', 'Telefono', 'Azienda', 'Lead Score', 'Data Creazione'];
            const csvContent = [
                headers.join(','),
                ...contacts.map(contact => [
                    `"${contact.name || ''}"`,
                    `"${contact.email || ''}"`,
                    `"${contact.phone || ''}"`,
                    `"${contact.company || ''}"`,
                    contact.lead_score || 0,
                    contact.created_at ? new Date(contact.created_at).toLocaleDateString('it-IT') : ''
                ].join(','))
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `contatti_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        } catch (error) {
            throw new Error('Errore durante l\'esportazione: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
        }
    }

    /**
     * Assign contacts to a user (placeholder for future implementation)
     */
    static async assignContacts(contactIds: number[], userId: string): Promise<BulkOperationResult> {
        try {
            const { error, count } = await supabase
                .from('contacts')
                .update({ assigned_to: userId })
                .in('id', contactIds);

            if (error) {
                return { success: false, affected: 0, error: error.message };
            }

            return { success: true, affected: count || contactIds.length };
        } catch (error) {
            return { 
                success: false, 
                affected: 0, 
                error: error instanceof Error ? error.message : 'Errore sconosciuto'
            };
        }
    }

    /**
     * Add tags to contacts (placeholder for future implementation)
     */
    static async tagContacts(contactIds: number[], tags: string[]): Promise<BulkOperationResult> {
        // Placeholder - will implement when tags table is created
        console.log('Tagging contacts:', contactIds, 'with tags:', tags);
        
        // Simulate success for now
        return { success: true, affected: contactIds.length };
    }
}