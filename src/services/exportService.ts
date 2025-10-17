import { FilterState } from '../components/contacts/ContactSearch';
import { supabase } from '../lib/supabaseClient';
import { Contact } from '../types';

export interface ExportOptions {
    contactIds?: string[];
    filters?: {
        searchQuery?: string;
        hasEmail?: boolean;
        hasPhone?: boolean;
        hasCompany?: boolean;
        recent?: boolean;
    };
    format?: 'csv' | 'excel';
}

export class ExportService {
    /**
     * Helper function to escape CSV fields properly
     */
    private static escapeCsvField(field: string | number | null | undefined): string {
        if (field === null || field === undefined) return '';

        const stringField = String(field);

        // If field contains comma, quote, newline, or double quote, wrap in quotes
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
            // Escape quotes by doubling them
            return `"${stringField.replace(/"/g, '""')}"`;
        }

        return stringField;
    }

    /**
     * Fetch contacts based on export options
     */
    private static async fetchContacts(options: ExportOptions): Promise<Contact[]> {
        let query = supabase
            .from('contacts')
            .select('*')
            .is('deleted_at', null);

        // Export specific contacts
        if (options.contactIds && options.contactIds.length > 0) {
            query = query.in('id', options.contactIds);
        }

        // Apply filters if provided
        if (options.filters) {
            const { searchQuery, hasEmail, hasPhone, hasCompany, recent } = options.filters;
            
            if (searchQuery) {
                query = query.or(
                    `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`
                );
            }
            
            if (hasEmail) {
                query = query.not('email', 'is', null).neq('email', '');
            }
            
            if (hasPhone) {
                query = query.not('phone', 'is', null).neq('phone', '');
            }
            
            if (hasCompany) {
                query = query.not('company', 'is', null).neq('company', '');
            }
            
            if (recent) {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                query = query.gte('created_at', sevenDaysAgo.toISOString());
            }
        }

        // Order by creation date for consistent exports
        query = query.order('created_at', { ascending: false });

        const { data: contacts, error } = await query;

        if (error) {
            throw new Error(`Errore nel recuperare i contatti: ${error.message}`);
        }

        return contacts || [];
    }

    /**
     * Export contacts to CSV format with UTF-8 BOM for Excel compatibility
     */
    static async exportToCSV(options: ExportOptions = {}): Promise<void> {
        try {
            const contacts = await this.fetchContacts(options);

            if (contacts.length === 0) {
                throw new Error('Nessun contatto da esportare');
            }

            // UTF-8 BOM for Excel compatibility
            const BOM = '\uFEFF';
            
            // Italian headers for available fields
            const headers = [
                'Nome',
                'Email',
                'Telefono', 
                'Azienda',
                'Lead Score',
                'Categoria Lead',
                'Ragione Score',
                'Data Creazione'
            ];

            const csvRows = [headers.join(',')];

            contacts.forEach(contact => {
                const row = [
                    this.escapeCsvField(contact.name),
                    this.escapeCsvField(contact.email),
                    this.escapeCsvField(contact.phone),
                    this.escapeCsvField(contact.company),
                    this.escapeCsvField(contact.lead_score || 0),
                    this.escapeCsvField(contact.lead_category),
                    this.escapeCsvField(contact.lead_score_reasoning),
                    contact.created_at ? new Date(contact.created_at).toLocaleDateString('it-IT') : ''
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = BOM + csvRows.join('\n');

            // Generate filename with timestamp and contact count
            const timestamp = new Date().toISOString().split('T')[0];
            const timeString = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
            const filename = `contatti_export_${timestamp}_${timeString}_${contacts.length}_contatti.csv`;

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);

            return;
        } catch (error) {
            throw new Error('Errore durante l\'esportazione: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
        }
    }

    /**
     * Export all contacts with optional filters
     */
    static async exportAllContacts(filters?: FilterState & { searchQuery?: string }): Promise<void> {
        return this.exportToCSV({ filters });
    }

    /**
     * Export selected contacts by IDs
     */
    static async exportSelectedContacts(contactIds: string[]): Promise<void> {
        return this.exportToCSV({ contactIds });
    }

    /**
     * Export filtered contacts
     */
    static async exportFilteredContacts(filters: FilterState & { searchQuery?: string }): Promise<void> {
        return this.exportToCSV({ filters });
    }

    /**
     * Get export summary without actually exporting
     */
    static async getExportSummary(options: ExportOptions = {}): Promise<{
        totalContacts: number;
        hasEmail: number;
        hasPhone: number;
        hasCompany: number;
        recentContacts: number;
    }> {
        try {
            const contacts = await this.fetchContacts(options);
            
            return {
                totalContacts: contacts.length,
                hasEmail: contacts.filter(c => c.email && c.email.trim() !== '').length,
                hasPhone: contacts.filter(c => c.phone && c.phone.trim() !== '').length,
                hasCompany: contacts.filter(c => c.company && c.company.trim() !== '').length,
                recentContacts: contacts.filter(c => {
                    if (!c.created_at) return false;
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return new Date(c.created_at) >= sevenDaysAgo;
                }).length
            };
        } catch (error) {
            throw new Error('Errore nel calcolare il riassunto esportazione: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
        }
    }
}