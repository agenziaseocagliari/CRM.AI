import { supabase } from '../lib/supabaseClient';
import { diagnosticLogger } from '../lib/mockDiagnosticLogger';

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
      
      // Get all data in parallel for better performance
      const [
        contactsData,
        dealsData,
        eventsData,
        formsData
      ] = await Promise.all([
        // Total contacts and new contacts this month
        supabase
          .from('contacts')
          .select('id, created_at')
          .eq('organization_id', organizationId),
        
        // All deals for revenue and conversion calculations
        supabase
          .from('opportunities')
          .select('id, value, stage, created_at, updated_at')
          .eq('organization_id', organizationId),
        
        // Events for activity metrics
        supabase
          .from('events')
          .select('id, created_at')
          .eq('organization_id', organizationId),
        
        // Form submissions
        supabase
          .from('form_submissions')
          .select('id, created_at')
          .eq('organization_id', organizationId)
      ]);

      // Process contacts data
      const totalContacts = contactsData.data?.length || 0;
      const newContactsThisMonth = contactsData.data?.filter(contact => 
        new Date(contact.created_at) >= startOfMonth
      ).length || 0;

      // Process deals data
      const deals = dealsData.data || [];
      const totalDeals = deals.length;
      const wonDeals = deals.filter(deal => deal.stage === 'Won');
      const lostDeals = deals.filter(deal => deal.stage === 'Lost');
      
      const totalRevenue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const monthlyRevenue = wonDeals
        .filter(deal => new Date(deal.updated_at) >= startOfMonth)
        .reduce((sum, deal) => sum + (deal.value || 0), 0);
      
      const dealsWon = wonDeals.length;
      const dealsLost = lostDeals.length;
      const conversionRate = totalDeals > 0 ? (dealsWon / totalDeals) * 100 : 0;

      // Process events data
      const totalEvents = eventsData.data?.length || 0;
      const eventsThisMonth = eventsData.data?.filter(event => 
        new Date(event.created_at) >= startOfMonth
      ).length || 0;

      // Process forms data
      const formSubmissions = formsData.data?.length || 0;
      const formSubmissionsThisMonth = formsData.data?.filter(submission => 
        new Date(submission.created_at) >= startOfMonth
      ).length || 0;

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
      throw error;
    }
  }

  static async getRecentActivity(organizationId: string, limit: number = 10): Promise<RecentActivity[]> {
    try {
      // Get recent activities from different sources
      const [
        recentContacts,
        recentDeals,
        recentEvents,
        recentForms
      ] = await Promise.all([
        // Recent contacts
        supabase
          .from('contacts')
          .select('id, name, email, created_at')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Recent deals
        supabase
          .from('opportunities')
          .select('id, name, stage, value, updated_at')
          .eq('organization_id', organizationId)
          .order('updated_at', { ascending: false })
          .limit(5),
        
        // Recent events
        supabase
          .from('events')
          .select('id, title, start_date, created_at')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Recent form submissions
        supabase
          .from('form_submissions')
          .select('id, form_name, data, created_at')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const activities: RecentActivity[] = [];

      // Process contacts
      recentContacts.data?.forEach(contact => {
        activities.push({
          id: `contact-${contact.id}`,
          type: 'contact',
          title: 'Nuovo contatto',
          description: `${contact.name} (${contact.email})`,
          timestamp: contact.created_at
        });
      });

      // Process deals
      recentDeals.data?.forEach(deal => {
        activities.push({
          id: `deal-${deal.id}`,
          type: 'deal',
          title: `Deal ${deal.stage === 'Won' ? 'vinto' : 'aggiornato'}`,
          description: `${deal.name} - €${deal.value?.toLocaleString('it-IT')}`,
          timestamp: deal.updated_at
        });
      });

      // Process events
      recentEvents.data?.forEach(event => {
        activities.push({
          id: `event-${event.id}`,
          type: 'event',
          title: 'Evento creato',
          description: event.title,
          timestamp: event.created_at
        });
      });

      // Process form submissions
      recentForms.data?.forEach(form => {
        const formData = form.data as { email?: string; name?: string };
        activities.push({
          id: `form-${form.id}`,
          type: 'form',
          title: 'Form completato',
          description: `${form.form_name} - ${formData?.name || formData?.email || 'Anonimo'}`,
          timestamp: form.created_at
        });
      });

      // Sort by timestamp and return limited results
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

    } catch (error) {
      diagnosticLogger.error('[DashboardService] Failed to get recent activity:', error);
      throw error;
    }
  }
}