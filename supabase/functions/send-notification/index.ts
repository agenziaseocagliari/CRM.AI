// File: supabase/functions/send-notification/index.ts
// Edge function to send notifications via various channels

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

interface SendNotificationRequest {
  incident_id: string;
  channel: 'email' | 'slack' | 'telegram' | 'webhook' | 'in_app';
  recipient: string;
  message: string;
  subject?: string;
  metadata?: any;
}

async function sendEmail(recipient: string, subject: string, message: string): Promise<boolean> {
  // In production, integrate with email service (Brevo, SendGrid, etc.)
  console.log(`[EMAIL] To: ${recipient}, Subject: ${subject}`);
  console.log(`[EMAIL] Message: ${message}`);
  
  // For now, just log it
  return true;
}

async function sendSlackNotification(channel: string, message: string, webhookUrl?: string): Promise<boolean> {
  if (!webhookUrl) {
    console.error("Slack webhook URL not configured");
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
        channel: channel,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    return false;
  }
}

async function sendTelegramNotification(chatId: string, message: string, botToken?: string): Promise<boolean> {
  if (!botToken) {
    console.error("Telegram bot token not configured");
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return false;
  }
}

async function sendWebhook(url: string, payload: any): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending webhook:", error);
    return false;
  }
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SendNotificationRequest = await req.json();
    const { incident_id, channel, recipient, message, subject, metadata } = body;

    if (!incident_id || !channel || !recipient || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification log entry
    const { data: logEntry, error: logError } = await supabase
      .from('notification_logs')
      .insert({
        incident_id,
        channel,
        recipient,
        status: 'pending',
        message_content: message,
      })
      .select()
      .single();

    if (logError) throw logError;

    let success = false;
    let errorMessage = null;

    try {
      switch (channel) {
        case 'email':
          success = await sendEmail(recipient, subject || 'Incident Notification', message);
          break;

        case 'slack': {
          const slackWebhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
          success = await sendSlackNotification(recipient, message, slackWebhookUrl);
          break;
        }

        case 'telegram': {
          const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
          success = await sendTelegramNotification(recipient, message, telegramBotToken);
          break;
        }

        case 'webhook':
          success = await sendWebhook(recipient, {
            incident_id,
            message,
            metadata,
            timestamp: new Date().toISOString(),
          });
          break;

        case 'in_app':
          // For in-app notifications, just mark as sent
          success = true;
          break;

        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }
    } catch (error: any) {
      errorMessage = error.message;
      success = false;
    }

    // Update notification log
    await supabase
      .from('notification_logs')
      .update({
        status: success ? 'sent' : 'failed',
        sent_at: success ? new Date().toISOString() : null,
        delivered_at: success ? new Date().toISOString() : null,
        error_message: errorMessage,
      })
      .eq('id', logEntry.id);

    return new Response(
      JSON.stringify({
        success,
        log_id: logEntry.id,
        message: success ? 'Notification sent successfully' : 'Failed to send notification',
        error: errorMessage,
      }),
      { status: success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.toString(),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
