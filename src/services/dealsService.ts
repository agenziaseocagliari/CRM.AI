// Deals Service
// Service layer for deals/opportunities management in CRM

import { supabase } from '../lib/supabaseClient';

export interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage_id: string;
  contact_id?: string;
  assigned_to?: string;
  probability: number;
  expected_close_date?: string;
  notes?: string;
  status: 'open' | 'won' | 'lost';
  source?: string;
  company?: string;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
  organization_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  
  // Relations
  contact?: Contact;
  stage?: PipelineStage;
  assigned_user?: Profile;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  order_index: number;
  color: string;
  is_active: boolean;
  organization_id?: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface Profile {
  id: string;
  email?: string;
  role?: string;
}

export interface DealCreate {
  title: string;
  value?: number;
  currency?: string;
  stage_id: string;
  contact_id?: string;
  assigned_to?: string;
  probability?: number;
  expected_close_date?: string;
  notes?: string;
  source?: string;
}

export interface DealUpdate {
  title?: string;
  value?: number;
  currency?: string;
  stage_id?: string;
  contact_id?: string;
  assigned_to?: string;
  probability?: number;
  expected_close_date?: string;
  notes?: string;
  status?: 'open' | 'won' | 'lost';
}

export class DealsService {
  // Fetch all pipeline stages
  static async fetchPipelineStages(): Promise<PipelineStage[]> {
    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        console.error('Error fetching pipeline stages:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('DealsService.fetchPipelineStages error:', error);
      throw error;
    }
  }

  // Fetch deals with related data
  static async fetchDeals(): Promise<Deal[]> {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          contact:contacts(id, name, email, phone),
          stage:pipeline_stages(id, name, color, order_index),
          assigned_user:profiles(id, email, role)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deals:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('DealsService.fetchDeals error:', error);
      throw error;
    }
  }

  // Create a new deal
  static async createDeal(dealData: DealCreate): Promise<Deal> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare deal data
      const newDealData = {
        ...dealData,
        value: dealData.value || 0,
        currency: dealData.currency || 'EUR',
        probability: dealData.probability || 50,
        created_by: user.id,
        status: 'open' as const
      };

      const { data, error } = await supabase
        .from('deals')
        .insert(newDealData)
        .select(`
          *,
          contact:contacts(id, name, email, phone),
          stage:pipeline_stages(id, name, color, order_index),
          assigned_user:profiles(id, email, role)
        `)
        .single();

      if (error) {
        console.error('Error creating deal:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('DealsService.createDeal error:', error);
      throw error;
    }
  }

  // Update a deal
  static async updateDeal(dealId: string, updateData: DealUpdate): Promise<Deal> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('deals')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId)
        .select(`
          *,
          contact:contacts(id, name, email, phone),
          stage:pipeline_stages(id, name, color, order_index),
          assigned_user:profiles(id, email, role)
        `)
        .single();

      if (error) {
        console.error('Error updating deal:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('DealsService.updateDeal error:', error);
      throw error;
    }
  }

  // Delete a deal (soft delete)
  static async deleteDeal(dealId: string): Promise<void> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('deals')
        .update({
          status: 'lost',
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (error) {
        console.error('Error deleting deal:', error);
        throw error;
      }
    } catch (error) {
      console.error('DealsService.deleteDeal error:', error);
      throw error;
    }
  }

  // Move deal to different stage
  static async moveDealToStage(dealId: string, newStageId: string): Promise<Deal> {
    return this.updateDeal(dealId, { stage_id: newStageId });
  }

  // Mark deal as won
  static async markDealAsWon(dealId: string): Promise<Deal> {
    return this.updateDeal(dealId, {
      status: 'won',
      probability: 100
    });
  }

  // Mark deal as lost
  static async markDealAsLost(dealId: string): Promise<Deal> {
    return this.updateDeal(dealId, {
      status: 'lost',
      probability: 0
    });
  }

  // Get deals statistics
  static async getDealsStatistics(): Promise<{
    totalDeals: number;
    totalValue: number;
    averageDealValue: number;
    conversionRate: number;
    dealsWonThisMonth: number;
    valueWonThisMonth: number;
  }> {
    try {
      // Get all deals (including won/lost for statistics)
      const { data: allDeals, error } = await supabase
        .from('deals')
        .select('*');

      if (error) {
        console.error('Error fetching deals statistics:', error);
        throw error;
      }

      if (!allDeals || allDeals.length === 0) {
        return {
          totalDeals: 0,
          totalValue: 0,
          averageDealValue: 0,
          conversionRate: 0,
          dealsWonThisMonth: 0,
          valueWonThisMonth: 0
        };
      }

      // Calculate statistics
      const openDeals = allDeals.filter(d => d.status === 'open');
      const wonDeals = allDeals.filter(d => d.status === 'won');
      const totalValue = openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      
      // Deals won this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const dealsWonThisMonth = wonDeals.filter(deal => 
        new Date(deal.closed_at || deal.updated_at) >= thisMonth
      );

      const valueWonThisMonth = dealsWonThisMonth.reduce((sum, deal) => sum + (deal.value || 0), 0);

      return {
        totalDeals: openDeals.length,
        totalValue,
        averageDealValue: openDeals.length > 0 ? totalValue / openDeals.length : 0,
        conversionRate: allDeals.length > 0 ? (wonDeals.length / allDeals.length) * 100 : 0,
        dealsWonThisMonth: dealsWonThisMonth.length,
        valueWonThisMonth
      };
    } catch (error) {
      console.error('DealsService.getDealsStatistics error:', error);
      throw error;
    }
  }

  // Fetch contacts for deal assignment
  static async fetchContacts(): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, email, phone')
        .order('name');

      if (error) {
        console.error('Error fetching contacts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('DealsService.fetchContacts error:', error);
      throw error;
    }
  }

  // Fetch team members for deal assignment
  static async fetchTeamMembers(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .order('email');

      if (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('DealsService.fetchTeamMembers error:', error);
      throw error;
    }
  }

  // Instance methods that wrap static methods
  async fetchStages(_organizationId?: string): Promise<PipelineStage[]> {
    return DealsService.fetchPipelineStages();
  }

  async fetchDeals(_options?: { organizationId?: string }): Promise<Deal[]> {
    return DealsService.fetchDeals();
  }

  async createDeal(dealData: Deal): Promise<Deal> {
    return DealsService.createDeal(dealData as DealCreate);
  }

  async updateDeal(dealId: string, updateData: Partial<Deal>): Promise<Deal> {
    return DealsService.updateDeal(dealId, updateData as DealUpdate);
  }

  async deleteDeal(dealId: string): Promise<void> {
    return DealsService.deleteDeal(dealId);
  }

  async moveDealToStage(dealId: string, newStageId: string): Promise<Deal> {
    return DealsService.moveDealToStage(dealId, newStageId);
  }

  async createStage(stageData: { name: string; color: string; order: number; organization_id?: string }): Promise<PipelineStage> {
    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .insert([{
          name: stageData.name,
          color: stageData.color,
          order_index: stageData.order,
          is_active: true,
          organization_id: stageData.organization_id
        }])
        .select()
        .single();

      if (error) throw error;
      return { ...data, order: data.order_index };
    } catch (error) {
      console.error('DealsService.createStage error:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const dealsService = new DealsService();
export default DealsService;