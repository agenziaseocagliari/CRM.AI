import { diagnosticLogger } from '../lib/mockDiagnosticLogger';
import { supabase } from '../lib/supabaseClient';

// Types for database records
interface ContactRecord {
    id: string;
    created_at: string;
}

interface OpportunityRecord {
    id: string;
    value: number;
    stage: string;
    created_at: string;
    updated_at: string;
}

interface EventRecord {
    id: string;
    created_at: string;
}

// Extended types for recent activity
interface ContactActivityRecord {
    id: string;
    name: string;
    email: string;
    created_at: string;
}

interface OpportunityActivityRecord {
    id: string;
    name: string;
    stage: string;
    value: number;
    updated_at: string;
}

interface EventActivityRecord {
    id: string;
    title: string;
    start_date: string;
    created_at: string;
}

interface FormActivityRecord {
    id: string;
    form_name: string;
    submitter_name: string;
    submitter_email: string;
    created_at: string;
}

export interface DashboardStats {
    totalRevenue: number;
    monthlyRevenue: number;
    totalContacts: number;
    newContactsThisMonth: number;
    totalDeals: number;
    dealsWon: number;
    dealsLost: number;
    conversionRate: number;
    totalEvents: number;
    eventsThisMonth: number;
    formSubmissions: number;
    formSubmissionsThisMonth: number;
}

export interface RecentActivity {
    id: string;
    type: 'contact' | 'deal' | 'event' | 'form';
    title: string;
    description: string;
    timestamp: string;
    user?: string;
}

export class DashboardService {
    static async getDashboardStats(organizationId: string): Promise<DashboardStats> {
        try {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            // Get all data in parallel with graceful error handling
            const [
                contactsData,
                dealsData,
                eventsData
            ] = await Promise.allSettled([
                // Total contacts and new contacts this month
                supabase
                    .from('contacts')
                    .select('id, created_at')
                    .eq('organization_id', organizationId),

                // All deals for revenue and conversion calculations
                supabase
                    .from('dashboard_opportunities')  // ✅ Use VIEW with correct column names
                    .select('id, name, stage, value, created_at, updated_at')
                    .eq('organization_id', organizationId),

                // Events for activity metrics
                supabase
                    .from('dashboard_events')  // ✅ Use VIEW with correct column names
                    .select('id, created_at')
                    .eq('organization_id', organizationId),
            ]);

            // Process contacts data with error handling
            let totalContacts = 0;
            let newContactsThisMonth = 0;
            if (contactsData.status === 'fulfilled' && contactsData.value.data) {
                totalContacts = contactsData.value.data.length;
                newContactsThisMonth = contactsData.value.data.filter((contact: ContactRecord) =>
                    new Date(contact.created_at) >= startOfMonth
                ).length;
            } else if (contactsData.status === 'rejected') {
                console.warn('[DashboardService] Contacts query failed:', contactsData.reason);
            }

            // Process deals data with error handling
            let deals: OpportunityRecord[] = [];
            if (dealsData.status === 'fulfilled' && dealsData.value.data) {
                deals = dealsData.value.data;
            } else if (dealsData.status === 'rejected') {
                console.warn('[DashboardService] Opportunities query failed:', dealsData.reason);
            }

            const totalDeals = deals.length;
            const wonDeals = deals.filter((deal: OpportunityRecord) => deal.stage === 'Won');
            const lostDeals = deals.filter((deal: OpportunityRecord) => deal.stage === 'Lost');

            const totalRevenue = wonDeals.reduce((sum: number, deal: OpportunityRecord) => sum + (deal.value || 0), 0);
            const monthlyRevenue = wonDeals
                .filter((deal: OpportunityRecord) => new Date(deal.updated_at) >= startOfMonth)
                .reduce((sum: number, deal: OpportunityRecord) => sum + (deal.value || 0), 0);

            const dealsWon = wonDeals.length;
            const dealsLost = lostDeals.length;
            const conversionRate = totalDeals > 0 ? (dealsWon / totalDeals) * 100 : 0;

            // Process events data with error handling
            let totalEvents = 0;
            let eventsThisMonth = 0;
            if (eventsData.status === 'fulfilled' && eventsData.value.data) {
                totalEvents = eventsData.value.data.length;
                eventsThisMonth = eventsData.value.data.filter((event: EventRecord) =>
                    new Date(event.created_at) >= startOfMonth
                ).length;
            } else if (eventsData.status === 'rejected') {
                console.warn('[DashboardService] Events query failed:', eventsData.reason);
            }

            // Form submissions - table doesn't exist, set to 0
            const formSubmissions = 0;
            const formSubmissionsThisMonth = 0;

            return {
                totalRevenue,
                monthlyRevenue,
                totalContacts,
                newContactsThisMonth,
                totalDeals,
                dealsWon,
                dealsLost,
                conversionRate,
                totalEvents,
                eventsThisMonth,
                formSubmissions,
                formSubmissionsThisMonth,
            };
        } catch (error) {
            diagnosticLogger.error('[DashboardService] Failed to get dashboard stats:', error);
            // Return default values instead of throwing to prevent dashboard crash
            console.warn('[DashboardService] Returning default stats due to error');
            return {
                totalRevenue: 0,
                monthlyRevenue: 0,
                totalContacts: 0,
                newContactsThisMonth: 0,
                totalDeals: 0,
                dealsWon: 0,
                dealsLost: 0,
                conversionRate: 0,
                totalEvents: 0,
                eventsThisMonth: 0,
                formSubmissions: 0,
                formSubmissionsThisMonth: 0,
            };
        }
    }

    static async getRecentActivity(organizationId: string, limit: number = 10): Promise<RecentActivity[]> {
        try {
            // Get recent activities from different sources with graceful error handling
            const [
                recentContacts,
                recentDeals,
                recentEvents,
                recentForms
            ] = await Promise.allSettled([
                // Recent contacts
                supabase
                    .from('contacts')
                    .select('id, name, email, created_at')
                    .eq('organization_id', organizationId)
                    .order('created_at', { ascending: false })
                    .limit(5),

                // Recent deals
                supabase
                    .from('dashboard_opportunities')  // ✅ Use VIEW with correct column names
                    .select('id, name, stage, value, updated_at')
                    .eq('organization_id', organizationId)
                    .order('updated_at', { ascending: false })
                    .limit(5),

                // Recent events
                supabase
                    .from('dashboard_events')  // ✅ Use VIEW with correct column names
                    .select('id, title, start_date, created_at')
                    .eq('organization_id', organizationId)
                    .order('created_at', { ascending: false })
                    .limit(5),

                // Recent form submissions
                supabase
                    .from('form_submissions')  // ✅ Now uses the newly created table
                    .select('id, form_name, submitter_name, submitter_email, created_at')
                    .eq('organization_id', organizationId)
                    .order('created_at', { ascending: false })
                    .limit(5)
            ]);

            const activities: RecentActivity[] = [];

            // Process contacts with error handling
            if (recentContacts.status === 'fulfilled' && recentContacts.value.data) {
                recentContacts.value.data.forEach((contact: ContactActivityRecord) => {
                    activities.push({
                        id: `contact-${contact.id}`,
                        type: 'contact',
                        title: 'Nuovo contatto',
                        description: `${contact.name} (${contact.email})`,
                        timestamp: contact.created_at
                    });
                });
            } else if (recentContacts.status === 'rejected') {
                console.warn('[DashboardService] Recent contacts query failed:', recentContacts.reason);
            }

            // Process deals with error handling
            if (recentDeals.status === 'fulfilled' && recentDeals.value.data) {
                recentDeals.value.data.forEach((deal: OpportunityActivityRecord) => {
                    activities.push({
                        id: `deal-${deal.id}`,
                        type: 'deal',
                        title: `Deal ${deal.stage === 'Won' ? 'vinto' : 'aggiornato'}`,
                        description: `${deal.name} - €${deal.value?.toLocaleString('it-IT')}`,
                        timestamp: deal.updated_at
                    });
                });
            } else if (recentDeals.status === 'rejected') {
                console.warn('[DashboardService] Recent opportunities query failed:', recentDeals.reason);
            }

            // Process events with error handling
            if (recentEvents.status === 'fulfilled' && recentEvents.value.data) {
                recentEvents.value.data.forEach((event: EventActivityRecord) => {
                    activities.push({
                        id: `event-${event.id}`,
                        type: 'event',
                        title: 'Evento creato',
                        description: event.title,
                        timestamp: event.created_at
                    });
                });
            } else if (recentEvents.status === 'rejected') {
                console.warn('[DashboardService] Recent events query failed:', recentEvents.reason);
            }

            // Process form submissions with error handling
            if (recentForms.status === 'fulfilled' && recentForms.value.data) {
                recentForms.value.data.forEach((form: FormActivityRecord) => {
                    activities.push({
                        id: `form-${form.id}`,
                        type: 'form',
                        title: 'Form completato',
                        description: `${form.form_name} - ${form.submitter_name || form.submitter_email || 'Anonimo'}`,
                        timestamp: form.created_at
                    });
                });
            } else if (recentForms.status === 'rejected') {
                console.warn('[DashboardService] Recent form submissions query failed:', recentForms.reason);
            }

            // Sort by timestamp and return limited results
            return activities
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit);

        } catch (error) {
            diagnosticLogger.error('[DashboardService] Failed to get recent activity:', error);
            // Return empty array instead of throwing to prevent dashboard crash
            console.warn('[DashboardService] Returning empty activities due to error');
            return [];
        }
    }
}