// Calendar Events Service
// Service layer for calendar operations in Vite/React architecture

import { supabase } from '../lib/supabaseClient';
import { VideoMeetingService } from '../lib/integrations/video-links';

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
}

export interface FullCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: any;
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
          updated_at
        `)
        .eq('created_by', user.id)
        .is('deleted_at', null)
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
          reminder_minutes: event.reminder_minutes
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
          reminder_minutes: data.reminder_minutes
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

      return data;
    } catch (error) {
      console.error('Calendar service error:', error);
      throw error;
    }
  }

  // Soft delete an event
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
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
}