import { supabase } from '../lib/supabaseClient';
import { Contact } from '../types';
import { ExportService } from './exportService';

export interface BulkOperationResult {
    success: boolean;
    affected: number;
    error?: string;
}

export class BulkOperationsService {
    /**
     * Soft delete contacts by setting deleted_at timestamp
     */
    static async softDeleteContacts(contactIds: string[]): Promise<BulkOperationResult> {
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
    static async restoreContacts(contactIds: string[]): Promise<BulkOperationResult> {
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
    static async hardDeleteContacts(contactIds: string[]): Promise<BulkOperationResult> {
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
     * Export selected contacts to CSV format using the enhanced ExportService
     */
    static async exportContacts(contacts: Contact[]): Promise<void> {
        try {
            const contactIds = contacts.map(c => c.id);
            await ExportService.exportSelectedContacts(contactIds);
        } catch (error) {
            throw new Error('Errore durante l\'esportazione: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
        }
    }

    /**
     * Assign contacts to a user (placeholder for future implementation)
     */
    static async assignContacts(contactIds: string[], userId: string): Promise<BulkOperationResult> {
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
    static async tagContacts(contactIds: string[], tags: string[]): Promise<BulkOperationResult> {
        // Placeholder - will implement when tags table is created
        console.log('Tagging contacts:', contactIds, 'with tags:', tags);
        
        // Simulate success for now
        return { success: true, affected: contactIds.length };
    }
}