// =============================================
// Edge Function: send-renewal-notifications
// Trigger: Cron (daily at 09:00 CEST)
// Purpose: Send email notifications for upcoming policy renewals
// =============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface PolicyRenewalData {
  policy_id: string;
  policy_number: string;
  contact_name: string;
  contact_email: string;
  expiration_date: string;
  days_until_expiry: number;
  organization_id: string;
  notification_email: string;
}

// Italian email template
function generateEmailHTML(policy: PolicyRenewalData): string {
  const urgencyColor = policy.days_until_expiry <= 7 ? '#EF4444' : 
                       policy.days_until_expiry <= 30 ? '#F59E0B' : '#3B82F6';
  
  return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Promemoria Rinnovo Polizza</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #F3F4F6; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🔔 Promemoria Rinnovo Polizza</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Gentile <strong>${policy.contact_name}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Ti informiamo che la tua polizza assicurativa <strong>${policy.policy_number}</strong> 
            è in scadenza tra <strong style="color: ${urgencyColor};">${policy.days_until_expiry} giorni</strong>.
          </p>
          
          <!-- Policy Details Card -->
          <div style="background-color: #F9FAFB; border-left: 4px solid ${urgencyColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 5px 0; color: #6B7280;">
              <strong>Numero Polizza:</strong> ${policy.policy_number}
            </p>
            <p style="margin: 5px 0; color: #6B7280;">
              <strong>Data Scadenza:</strong> ${new Date(policy.expiration_date).toLocaleDateString('it-IT', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
            <p style="margin: 5px 0; color: #6B7280;">
              <strong>Giorni Rimanenti:</strong> ${policy.days_until_expiry}
            </p>
          </div>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Per evitare interruzioni nella copertura assicurativa, ti consigliamo di 
            contattarci quanto prima per procedere con il rinnovo.
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${SUPABASE_URL?.replace('.supabase.co', '.vercel.app')}/dashboard/assicurazioni/polizze/${policy.policy_id}" 
               style="display: inline-block; background-color: ${urgencyColor}; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Visualizza Polizza
            </a>
          </div>
          
          <p style="font-size: 14px; color: #9CA3AF; line-height: 1.6; margin-top: 20px;">
            Se hai già provveduto al rinnovo, puoi ignorare questa email.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="font-size: 12px; color: #6B7280; margin: 5px 0;">
            Guardian AI CRM - Sistema di Gestione Assicurazioni
          </p>
          <p style="font-size: 12px; color: #9CA3AF; margin: 5px 0;">
            Questa è una email automatica. Non rispondere a questo messaggio.
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Fetch policies needing notifications
    const { data: policies, error: queryError } = await supabase
      .rpc('get_policies_needing_notification') as { data: PolicyRenewalData[] | null, error: any };

    if (queryError) {
      console.error('❌ Error fetching policies:', queryError);
      throw queryError;
    }

    if (!policies || policies.length === 0) {
      console.log('✅ No policies need notifications today');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No policies need notifications', 
          count: 0 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📧 Sending notifications for ${policies.length} policies...`);

    // Send emails via Resend API
    const emailPromises = policies.map(async (policy) => {
      try {
        const emailPayload = {
          from: 'Guardian AI CRM <noreply@guardianai.it>',
          to: [policy.notification_email],
          subject: `🔔 Promemoria: Polizza ${policy.policy_number} in scadenza tra ${policy.days_until_expiry} giorni`,
          html: generateEmailHTML(policy),
        };

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`❌ Failed to send email for policy ${policy.policy_number}:`, errorText);
          return { success: false, policy_id: policy.policy_id, error: errorText };
        }

        // Update last_renewal_email_sent timestamp
        const { error: updateError } = await supabase
          .from('insurance_policies')
          .update({ 
            last_renewal_email_sent: new Date().toISOString(),
            renewal_email_count: supabase.sql`renewal_email_count + 1`
          })
          .eq('id', policy.policy_id);

        if (updateError) {
          console.error(`⚠️ Failed to update email timestamp for ${policy.policy_number}:`, updateError);
        }

        console.log(`✅ Email sent successfully to ${policy.contact_email} for policy ${policy.policy_number}`);
        return { success: true, policy_id: policy.policy_id };

      } catch (emailError) {
        console.error(`❌ Error sending email for policy ${policy.policy_number}:`, emailError);
        return { success: false, policy_id: policy.policy_id, error: String(emailError) };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`✅ Email notifications complete: ${successCount} sent, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total_policies: policies.length,
        emails_sent: successCount,
        emails_failed: failureCount,
        results,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Edge Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: String(error) 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
