// Email Reminder Service for Calendar Events
// This would typically run as a cron job or serverless function

import { supabase } from '../lib/supabaseClient';
import { sendEmail } from '../lib/email/resend';
import { eventReminderEmail } from '../lib/email/templates';

export interface ReminderServiceOptions {
  reminderWindow?: number; // Minutes to look ahead for upcoming events
}

export class EmailReminderService {
  /**
   * Check for upcoming events and send reminders
   * This should be called periodically (every 5-15 minutes)
   */
  static async processReminders(options: ReminderServiceOptions = {}) {
    const { reminderWindow = 60 } = options; // Default 1 hour window
    
    try {
      const now = new Date();
      const windowEnd = new Date(now.getTime() + reminderWindow * 60 * 1000);

      // Get events starting in the next window that have reminders
      const { data: upcomingEvents, error } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', now.toISOString())
        .lte('start_time', windowEnd.toISOString())
        .not('reminder_minutes', 'is', null)
        .is('deleted_at', null);

      if (error) {
        console.error('Failed to fetch upcoming events:', error);
        return;
      }

      if (!upcomingEvents?.length) {
        console.log('No upcoming events with reminders found');
        return;
      }

      const reminderPromises = upcomingEvents.map(async (event) => {
        // Check if event has attendee email
        if (!event.attendee_email || !event.reminder_minutes?.length) {
          return null;
        }

        const eventStart = new Date(event.start_time);
        const minutesUntilEvent = Math.floor(
          (eventStart.getTime() - now.getTime()) / (1000 * 60)
        );

        // Find matching reminder times (within 5 minutes tolerance)
        const matchingReminders = event.reminder_minutes.filter(
          (reminderMinutes: number) => 
            Math.abs(reminderMinutes - minutesUntilEvent) <= 5
        );

        if (matchingReminders.length === 0) {
          return null;
        }

        // Send reminder for each matching reminder time
        const emailPromises = matchingReminders.map((reminderMinutes: number) =>
          sendEmail({
            to: event.attendee_email,
            subject: `⏰ Promemoria: ${event.title} ${
              reminderMinutes < 60 
                ? `tra ${reminderMinutes} minuti`
                : reminderMinutes < 1440
                  ? `tra ${Math.floor(reminderMinutes / 60)} ${reminderMinutes >= 120 ? 'ore' : 'ora'}`
                  : `tra ${Math.floor(reminderMinutes / 1440)} ${reminderMinutes >= 2880 ? 'giorni' : 'giorno'}`
            }`,
            html: eventReminderEmail({
              eventTitle: event.title,
              startTime: event.start_time,
              endTime: event.end_time,
              location: event.location,
              meetingUrl: event.meeting_url,
              description: event.description,
              organizerName: event.organizer_name || 'CRM.AI Team',
              attendeeName: event.attendee_name,
            }, reminderMinutes),
          })
        );

        return Promise.allSettled(emailPromises);
      });

      const results = await Promise.allSettled(reminderPromises);
      
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value !== null
      ).length;

      console.log(`✅ Processed ${successCount} reminder emails successfully`);
      
      return {
        success: true,
        processed: successCount,
        total: upcomingEvents.length
      };

    } catch (error) {
      console.error('Reminder service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Manual trigger for testing reminders
   */
  static async testReminders(eventId: string) {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !event) {
        throw new Error('Event not found');
      }

      if (!event.attendee_email) {
        throw new Error('No attendee email for this event');
      }

      await sendEmail({
        to: event.attendee_email,
        subject: `🧪 Test Reminder: ${event.title}`,
        html: eventReminderEmail({
          eventTitle: event.title,
          startTime: event.start_time,
          endTime: event.end_time,
          location: event.location,
          meetingUrl: event.meeting_url,
          description: event.description,
          organizerName: event.organizer_name || 'CRM.AI Team',
          attendeeName: event.attendee_name,
        }, 15), // 15 minutes test reminder
      });

      console.log('✅ Test reminder sent successfully');
      return { success: true };

    } catch (error) {
      console.error('Test reminder failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export for use in cron jobs or manual triggers
export default EmailReminderService;