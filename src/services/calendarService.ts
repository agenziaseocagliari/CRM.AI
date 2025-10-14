// Calendar Events Service
// Service layer for calendar operations in Vite/React architecture

import { sendEmail } from '../lib/email/resend';
import { eventCancellationEmail, eventConfirmationEmail, eventUpdateEmail } from '../lib/email/templates';
import { VideoMeetingService } from '../lib/integrations/video-links';
import { supabase } from '../lib/supabaseClient';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  status: string;
  priority: string;
  location?: string;
  color?: string;
  notes?: string;
  reminder_minutes: number[];
  created_by: string;
  created_at: string;
  updated_at: string;
  // Recurring fields
  is_recurring?: boolean;
  rrule?: string;
  recurrence_id?: string;
  original_start_time?: string;
  is_exception?: boolean;
}

export interface CalendarEventCreate {
  title: string;
  description?: string;
  event_type?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  status?: string;
  priority?: string;
  location?: string;
  color?: string;
  notes?: string;
  reminder_minutes?: number[];
  contact_id?: string;
  // Email fields
  attendee_name?: string;
  attendee_email?: string;
  organizer_name?: string;
  meeting_url?: string;
}

interface CalendarEventExtendedProps {
  description?: string;
  event_type?: string;
  status?: string;
  priority?: string;
  location?: string;
  notes?: string;
  reminder_minutes?: number[];
  is_recurring?: boolean;
  [key: string]: unknown;
}

export interface FullCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: CalendarEventExtendedProps;
}

export class CalendarService {
  // Fetch calendar events for a date range
  static async fetchEvents(start?: string, end?: string): Promise<FullCalendarEvent[]> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          event_type,
          start_time,
          end_time,
          all_day,
          status,
          priority,
          location,
          color,
          notes,
          reminder_minutes,
          created_by,
          created_at,
          updated_at,
          is_recurring,
          rrule,
          recurrence_id,
          original_start_time,
          is_exception
        `)
        .eq('created_by', user.id)
        .is('deleted_at', null)
        .or('is_recurring.eq.false,is_recurring.is.null')
        .order('start_time', { ascending: true });

      if (start) {
        query = query.gte('start_time', start);
      }
      if (end) {
        query = query.lte('end_time', end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch events: ${error.message}`);
      }

      // Transform for FullCalendar format
      return data?.map((event: CalendarEvent) => ({
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        backgroundColor: event.color || '#3b82f6',
        borderColor: event.color || '#2563eb',
        extendedProps: {
          description: event.description,
          event_type: event.event_type,
          status: event.status,
          priority: event.priority,
          location: event.location,
          notes: event.notes,
          reminder_minutes: event.reminder_minutes,
          is_recurring: event.is_recurring
        }
      })) || [];
    } catch (error) {
      console.error('Calendar service error:', error);
      throw error;
    }
  }

  // Create a new calendar event
  static async createEvent(eventData: CalendarEventCreate): Promise<FullCalendarEvent> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!eventData.title || !eventData.start_time || !eventData.end_time) {
        throw new Error('Missing required fields: title, start_time, end_time');
      }

      // Prepare event data
      const newEventData = {
        title: eventData.title,
        description: eventData.description,
        event_type: eventData.event_type || 'meeting',
        start_time: eventData.start_time,
        end_time: eventData.end_time,
        all_day: eventData.all_day || false,
        status: eventData.status || 'confirmed',
        priority: eventData.priority || 'medium',
        location: eventData.location,
        color: eventData.color || '#3b82f6',
        notes: eventData.notes,
        reminder_minutes: eventData.reminder_minutes || [],
        created_by: user.id,
        organization_id: null, // Will be set based on user's organization if needed
        contact_id: eventData.contact_id || null
      };

      // Auto-generate video meeting link for virtual events
      if (eventData.location === 'virtual' || eventData.event_type === 'meeting') {
        try {
          const videoMeeting = await VideoMeetingService.generateMeetingLink({
            title: eventData.title,
            start_time: eventData.start_time,
            end_time: eventData.end_time,
            organizer_email: user.email || '',
            attendee_emails: [] // TODO: Extract from participants when implemented
          });
          
          // Add meeting URL to event data
          newEventData.location = `${newEventData.location || 'Video Call'} - ${videoMeeting.url}`;
          console.log('✅ Auto-generated video link:', videoMeeting.url);
        } catch (videoError) {
          console.warn('Video link generation failed, continuing without:', videoError);
        }
      }

      const { data, error } = await supabase
        .from('events')
        .insert(newEventData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create event: ${error.message}`);
      }

      // Send confirmation email (non-blocking)
      if (eventData.attendee_email) {
        sendEmail({
          to: eventData.attendee_email,
          subject: `✅ Evento confermato: ${data.title}`,
          html: eventConfirmationEmail({
            eventTitle: data.title,
            startTime: data.start_time,
            endTime: data.end_time,
            location: data.location,
            meetingUrl: eventData.meeting_url,
            description: data.description,
            organizerName: eventData.organizer_name || user.email || 'CRM.AI Team',
            attendeeName: eventData.attendee_name,
          }),
        }).catch(emailError => {
          console.error('Confirmation email failed (non-blocking):', emailError);
        });
      }

      // Return in FullCalendar format
      return {
        id: data.id,
        title: data.title,
        start: data.start_time,
        end: data.end_time,
        backgroundColor: data.color || '#3b82f6',
        borderColor: data.color || '#2563eb',
        extendedProps: {
          description: data.description,
          event_type: data.event_type,
          status: data.status,
          priority: data.priority,
          location: data.location,
          notes: data.notes,
          reminder_minutes: data.reminder_minutes,
          is_recurring: data.is_recurring
        }
      };
    } catch (error) {
      console.error('Calendar service error:', error);
      throw error;
    }
  }

  // Update an existing event
  static async updateEvent(eventId: string, updateData: Partial<CalendarEventCreate>): Promise<CalendarEvent> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('events')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .eq('created_by', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to update event: ${error.message}`);
      }

      // Send update email (non-blocking)
      if (updateData.attendee_email) {
        sendEmail({
          to: updateData.attendee_email,
          subject: `🔄 Evento aggiornato: ${data.title}`,
          html: eventUpdateEmail({
            eventTitle: data.title,
            startTime: data.start_time,
            endTime: data.end_time,
            location: data.location,
            meetingUrl: updateData.meeting_url,
            description: data.description,
            organizerName: updateData.organizer_name || user.email || 'CRM.AI Team',
            attendeeName: updateData.attendee_name,
          }),
        }).catch(emailError => {
          console.error('Update email failed (non-blocking):', emailError);
        });
      }

      return data;
    } catch (error) {
      console.error('Calendar service error:', error);
      throw error;
    }
  }

  // Soft delete an event
  static async deleteEvent(eventId: string, attendeeEmail?: string, attendeeName?: string): Promise<void> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get event details before deletion for email
      let eventData = null;
      if (attendeeEmail) {
        const { data: event } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .eq('created_by', user.id)
          .single();
        eventData = event;
      }

      const { error } = await supabase
        .from('events')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .eq('created_by', user.id);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to delete event: ${error.message}`);
      }

      // Send cancellation email (non-blocking)
      if (attendeeEmail && eventData) {
        sendEmail({
          to: attendeeEmail,
          subject: `❌ Evento cancellato: ${eventData.title}`,
          html: eventCancellationEmail({
            eventTitle: eventData.title,
            startTime: eventData.start_time,
            endTime: eventData.end_time,
            location: eventData.location,
            organizerName: user.email || 'CRM.AI Team',
            attendeeName: attendeeName,
          }),
        }).catch(emailError => {
          console.error('Cancellation email failed (non-blocking):', emailError);
        });
      }
    } catch (error) {
      console.error('Calendar service error:', error);
      throw error;
    }
  }

  // Update event timing (for drag & drop)
  static async updateEventTiming(eventId: string, start: Date, end: Date): Promise<void> {
    try {
      await this.updateEvent(eventId, {
        start_time: start.toISOString(),
        end_time: end.toISOString()
      });
    } catch (error) {
      console.error('Calendar service error:', error);
      throw error;
    }
  }

  // ===========================================
  // RECURRING EVENTS FUNCTIONALITY
  // ===========================================

  // Fetch recurring events and generate instances for date range
  static async fetchRecurringInstances(start: string, end: string): Promise<FullCalendarEvent[]> {
    try {
      // Dynamic import to avoid circular dependency
      const { parseRRule, generateRecurringInstances } = await import('../lib/calendar/recurring');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get all recurring events
      const { data: recurringEvents, error } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', user.id)
        .eq('is_recurring', true)
        .is('deleted_at', null);

      if (error) {
        console.error('Error fetching recurring events:', error);
        throw error;
      }

      if (!recurringEvents || recurringEvents.length === 0) {
        return [];
      }

      const rangeStart = new Date(start);
      const rangeEnd = new Date(end);

      // Generate instances for each recurring event
      const allInstances = recurringEvents.flatMap(event => {
        if (!event.rrule) return [];

        try {
          const rrule = parseRRule(event.rrule);
          return generateRecurringInstances(event, rrule, rangeStart, rangeEnd);
        } catch (error) {
          console.error('Error parsing rrule for event', event.id, ':', error);
          return [];
        }
      });

      // Convert to FullCalendar format
      return allInstances.map(instance => this.convertToFullCalendarEvent(instance));
    } catch (error) {
      console.error('Error fetching recurring instances:', error);
      throw error;
    }
  }

  // Convert database event to FullCalendar format
  static convertToFullCalendarEvent(event: CalendarEvent): FullCalendarEvent {
    return {
      id: event.id,
      title: event.title,
      start: event.start_time,
      end: event.end_time,
      backgroundColor: event.color || '#3b82f6',
      borderColor: event.color || '#2563eb',
      extendedProps: {
        description: event.description,
        event_type: event.event_type,
        status: event.status,
        priority: event.priority,
        location: event.location,
        notes: event.notes,
        reminder_minutes: event.reminder_minutes,
        is_recurring: event.is_recurring
      }
    };
  }

  // Enhanced fetchEvents that includes recurring instances
  static async fetchAllEvents(start?: string, end?: string): Promise<FullCalendarEvent[]> {
    try {
      // Fetch regular events
      const regularEvents = await this.fetchEvents(start, end);
      
      // Fetch recurring instances if date range is provided
      const recurringInstances = (start && end) ? 
        await this.fetchRecurringInstances(start, end) : [];

      // Combine and return
      return [...regularEvents, ...recurringInstances];
    } catch (error) {
      console.error('Error fetching all events:', error);
      throw error;
    }
  }

  // Create recurring event with RRULE
  static async createRecurringEvent(eventData: CalendarEventCreate & { 
    is_recurring?: boolean;
    recurrence_frequency?: string;
    recurrence_interval?: number;
    recurrence_days?: number[];
    recurrence_end_date?: string;
  }): Promise<CalendarEvent> {
    try {
      // Dynamic import to avoid circular dependency
      const { generateRRuleFromEventData } = await import('../lib/calendar/recurring');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate RRULE if recurring
      let rrule = null;
      if (eventData.is_recurring) {
        const formData = {
          is_recurring: eventData.is_recurring,
          recurrence_frequency: (eventData.recurrence_frequency as 'daily' | 'weekly' | 'monthly') || 'weekly',
          recurrence_interval: eventData.recurrence_interval || 1,
          recurrence_days: eventData.recurrence_days || [],
          recurrence_end_date: eventData.recurrence_end_date || null,
          start_time: eventData.start_time
        };
        rrule = generateRRuleFromEventData(formData);
      }

      const newEvent = {
        ...eventData,
        created_by: user.id,
        is_recurring: eventData.is_recurring || false,
        rrule: rrule,
      };

      const { data, error } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();

      if (error) {
        console.error('Calendar service error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Calendar service error:', error);
      throw error;
    }
  }

  // Edit recurring event choice: single occurrence vs entire series
  static async updateRecurringEvent(
    eventId: string, 
    updates: Partial<CalendarEventCreate>, 
    editChoice: 'this' | 'series' = 'this'
  ): Promise<CalendarEvent> {
    try {
      if (editChoice === 'series') {
        // Update the main recurring event
        return await this.updateEvent(eventId, updates);
      } else {
        // Create exception for this occurrence
        // This is a simplified approach - in production you'd want more sophisticated exception handling
        const { data: originalEvent } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (!originalEvent) {
          throw new Error('Event not found');
        }

        // Create a new non-recurring event for this specific occurrence
        const exceptionEvent = {
          ...originalEvent,
          ...updates,
          is_recurring: false,
          rrule: null,
          recurrence_id: originalEvent.id,
          is_exception: true,
          original_start_time: originalEvent.start_time,
        };

        const { data, error } = await supabase
          .from('events')
          .insert(exceptionEvent)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Calendar service error:', error);
      throw error;
    }
  }

  // Delete recurring event choice: single occurrence vs entire series  
  static async deleteRecurringEvent(
    eventId: string, 
    deleteChoice: 'this' | 'series' = 'this'
  ): Promise<void> {
    try {
      if (deleteChoice === 'series') {
        // Delete the main recurring event (soft delete)
        await this.deleteEvent(eventId);
      } else {
        // Create exception to hide this occurrence
        const { data: originalEvent } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (!originalEvent) {
          throw new Error('Event not found');
        }

        // Create a deletion exception
        const exceptionEvent = {
          ...originalEvent,
          is_recurring: false,
          rrule: null,
          recurrence_id: originalEvent.id,
          is_exception: true,
          deleted_at: new Date().toISOString(),
          original_start_time: originalEvent.start_time,
        };

        const { error } = await supabase
          .from('events')
          .insert(exceptionEvent);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Calendar service error:', error);
      throw error;
    }
  }
}