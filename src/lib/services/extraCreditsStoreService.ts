// ===================================================================
// GUARDIAN AI CRM - EXTRA CREDITS STORE SERVICE
// File: src/lib/services/extraCreditsStoreService.ts
// Backend service per gestione acquisti crediti extra con Stripe
// ===================================================================

import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

// Types
export interface ExtraCreditsPackage {
  id: string;
  name: string;
  display_name: string;
  credit_type: 'ai' | 'whatsapp' | 'email';
  credits_amount: number;
  price_cents: number;
  currency: string;
  cost_cents: number;
  margin_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseHistory {
  id: string;
  organization_id: string;
  extra_credits_package_id: string;
  credits_amount: number;
  credit_type: 'ai' | 'whatsapp' | 'email';
  price_paid_cents: number;
  currency: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripe_payment_intent_id?: string;
  credits_consumed: number;
  expiry_date: string;
  purchase_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MarginAnalytics {
  total_revenue_cents: number;
  total_cost_cents: number;
  total_margin_cents: number;
  average_margin_percentage: number;
  packages_sold: number;
  credits_sold: number;
  by_credit_type: {
    ai: { revenue: number; margin: number; count: number };
    whatsapp: { revenue: number; margin: number; count: number };
    email: { revenue: number; margin: number; count: number };
  };
}

class ExtraCreditsStoreService {
  /**
   * Dati di esempio per i pacchetti crediti quando il database non è disponibile
   */
  private getFallbackPackages(): ExtraCreditsPackage[] {
    return [
      {
        id: 'fallback-ai-100',
        name: 'ai_100',
        display_name: '100 AI Credits',
        credit_type: 'ai',
        credits_amount: 100,
        price_cents: 800,
        currency: 'EUR',
        cost_cents: 120,
        margin_percentage: 85,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'fallback-ai-500',
        name: 'ai_500',
        display_name: '500 AI Credits',
        credit_type: 'ai',
        credits_amount: 500,
        price_cents: 3500,
        currency: 'EUR',
        cost_cents: 600,
        margin_percentage: 83,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'fallback-whatsapp-100',
        name: 'whatsapp_100',
        display_name: '100 WhatsApp Credits',
        credit_type: 'whatsapp',
        credits_amount: 100,
        price_cents: 500,
        currency: 'EUR',
        cost_cents: 70,
        margin_percentage: 86,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'fallback-email-5000',
        name: 'email_5000',
        display_name: '5,000 Email Credits',
        credit_type: 'email',
        credits_amount: 5000,
        price_cents: 1000,
        currency: 'EUR',
        cost_cents: 200,
        margin_percentage: 80,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  /**
   * Carica tutti i pacchetti crediti attivi
   */
  async getActivePackages(): Promise<ExtraCreditsPackage[]> {
    try {
      const { data, error } = await supabase
        .from('extra_credits_packages')
        .select('*')
        .eq('is_active', true)
        .order('credit_type', { ascending: true })
        .order('price_cents', { ascending: true });

      if (error) {
        console.warn('Tabella extra_credits_packages non disponibile, uso dati di fallback:', error);
        return this.getFallbackPackages();
      }

      return data && data.length > 0 ? data : this.getFallbackPackages();
    } catch (error) {
      console.warn('Errore caricamento pacchetti dal database, uso dati di fallback:', error);
      return this.getFallbackPackages();
    }
  }

  /**
   * Ottiene storico acquisti per organizzazione
   */
  async getPurchaseHistory(organizationId: string): Promise<PurchaseHistory[]> {
    try {
      const { data, error } = await supabase
        .from('organization_extra_credits_purchases')
        .select(`
          *,
          extra_credits_packages (
            name,
            display_name,
            credit_type
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading purchase history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPurchaseHistory:', error);
      throw error;
    }
  }

  /**
   * Simula creazione PaymentIntent Stripe
   * In produzione questo sarebbe un endpoint server-side
   */
  async createPaymentIntent(
    packageId: string, 
    organizationId: string
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      // 1. Verifica package esistente
      const { data: packageData, error: pkgError } = await supabase
        .from('extra_credits_packages')
        .select('*')
        .eq('id', packageId)
        .eq('is_active', true)
        .single();

      if (pkgError || !packageData) {
        throw new Error('Pacchetto non trovato o non attivo');
      }

      // 2. Simula chiamata Stripe API
      // In produzione: const paymentIntent = await stripe.paymentIntents.create(...)
      const mockPaymentIntent = {
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_${Date.now()}_secret_mock`,
        amount: packageData.price_cents,
        currency: packageData.currency.toLowerCase(),
        status: 'requires_payment_method'
      };

      // 3. Crea record pending nel database
      const { error: purchaseError } = await supabase
        .from('organization_extra_credits_purchases')
        .insert({
          organization_id: organizationId,
          extra_credits_package_id: packageId,
          credits_amount: packageData.credits_amount,
          credit_type: packageData.credit_type,
          price_paid_cents: packageData.price_cents,
          currency: packageData.currency,
          payment_status: 'pending',
          stripe_payment_intent_id: mockPaymentIntent.id,
          credits_consumed: 0,
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // +1 anno
          purchase_metadata: {
            package_name: packageData.name,
            purchase_timestamp: new Date().toISOString(),
            payment_method: 'stripe',
            margin_percentage: packageData.margin_percentage
          }
        });

      if (purchaseError) {
        console.error('Error creating purchase record:', purchaseError);
        throw purchaseError;
      }

      return {
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id
      };
    } catch (error) {
      console.error('Error in createPaymentIntent:', error);
      throw error;
    }
  }

  /**
   * Conferma acquisto dopo successo Stripe
   * In produzione gestito da Stripe webhook
   */
  async confirmPurchase(paymentIntentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('organization_extra_credits_purchases')
        .update({
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (error) {
        console.error('Error confirming purchase:', error);
        throw error;
      }

      toast.success('Acquisto completato con successo!');
    } catch (error) {
      console.error('Error in confirmPurchase:', error);
      throw error;
    }
  }

  /**
   * Calcola analytics margini per admin
   */
  async getMarginAnalytics(
    startDate?: string, 
    endDate?: string
  ): Promise<MarginAnalytics> {
    try {
      let query = supabase
        .from('organization_extra_credits_purchases')
        .select(`
          price_paid_cents,
          credits_amount,
          credit_type,
          purchase_metadata,
          extra_credits_packages (
            cost_cents,
            margin_percentage
          )
        `)
        .eq('payment_status', 'completed');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading analytics:', error);
        throw error;
      }

      // Calcola metriche aggregate
      const analytics: MarginAnalytics = {
        total_revenue_cents: 0,
        total_cost_cents: 0,
        total_margin_cents: 0,
        average_margin_percentage: 0,
        packages_sold: data?.length || 0,
        credits_sold: 0,
        by_credit_type: {
          ai: { revenue: 0, margin: 0, count: 0 },
          whatsapp: { revenue: 0, margin: 0, count: 0 },
          email: { revenue: 0, margin: 0, count: 0 }
        }
      };

      if (data && data.length > 0) {
        let totalMarginPercent = 0;

        data.forEach((purchase) => {
          const revenue = purchase.price_paid_cents;
          const cost = purchase.extra_credits_packages?.[0]?.cost_cents || 0;
          const margin = revenue - cost;
          const marginPercent = purchase.extra_credits_packages?.[0]?.margin_percentage || 0;

          analytics.total_revenue_cents += revenue;
          analytics.total_cost_cents += cost;
          analytics.total_margin_cents += margin;
          analytics.credits_sold += purchase.credits_amount;
          totalMarginPercent += marginPercent;

          // Per tipo credito
          const type = purchase.credit_type as keyof typeof analytics.by_credit_type;
          if (analytics.by_credit_type[type]) {
            analytics.by_credit_type[type].revenue += revenue;
            analytics.by_credit_type[type].margin += margin;
            analytics.by_credit_type[type].count += 1;
          }
        });

        analytics.average_margin_percentage = totalMarginPercent / data.length;
      }

      return analytics;
    } catch (error) {
      console.error('Error in getMarginAnalytics:', error);
      throw error;
    }
  }

  /**
   * Ottiene crediti extra disponibili per organizzazione
   */
  async getAvailableExtraCredits(organizationId: string): Promise<{
    ai: number;
    whatsapp: number;
    email: number;
  }> {
    try {
      // Usa la funzione SQL per calcolare crediti disponibili
      const { data, error } = await supabase
        .rpc('get_available_extra_credits', {
          org_id: organizationId
        });

      if (error) {
        console.error('Error getting available credits:', error);
        throw error;
      }

      return data || { ai: 0, whatsapp: 0, email: 0 };
    } catch (error) {
      console.error('Error in getAvailableExtraCredits:', error);
      return { ai: 0, whatsapp: 0, email: 0 };
    }
  }
}

// Singleton instance
export const extraCreditsStoreService = new ExtraCreditsStoreService();
export default extraCreditsStoreService;