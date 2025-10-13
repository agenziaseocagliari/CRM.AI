import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
};

interface EventRequest {
  organization_id: string;
  created_by: string;
  title: string;
  description?: string;
  event_type?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  timezone?: string;
  location?: string;
  location_type?: string;
  meeting_url?: string;
  status?: string;
  priority?: string;
  color?: string;
  contact_id?: string;
  notes?: string;
  reminder_minutes?: number[];
  participants?: Array<{
    type: 'user' | 'contact' | 'external';
    user_id?: string;
    contact_id?: string;
    external_name?: string;
    external_email?: string;
    role?: string;
  }>;
}

interface ConflictCheckRequest {
  organization_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  exclude_event_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // =============================================
    // GET /calendar-events - Get events for date range
    // =============================================
    if (req.method === 'GET' && path.endsWith('/calendar-events')) {
      const startDate = url.searchParams.get('start');
      const endDate = url.searchParams.get('end');
      const userId = url.searchParams.get('userId');
      const orgId = url.searchParams.get('orgId');
      const includeParticipants = url.searchParams.get('includeParticipants') !== 'false';

      if (!startDate || !endDate || !userId || !orgId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required parameters: start, end, userId, orgId' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const { data, error } = await supabaseClient
        .rpc('get_calendar_events', {
          p_organization_id: orgId,
          p_user_id: userId,
          p_start_date: startDate,
          p_end_date: endDate,
          p_include_participants: includeParticipants
        });

      if (error) {
        console.error('Get calendar events error:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          events: data || [],
          count: data?.length || 0 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // =============================================
    // GET /calendar-events/conflicts - Check for conflicts
    // =============================================
    if (req.method === 'GET' && path.includes('/conflicts')) {
      const orgId = url.searchParams.get('orgId');
      const userId = url.searchParams.get('userId');
      const startTime = url.searchParams.get('startTime');
      const endTime = url.searchParams.get('endTime');
      const excludeEventId = url.searchParams.get('excludeEventId');

      if (!orgId || !userId || !startTime || !endTime) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required parameters for conflict check' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const { data: conflicts, error } = await supabaseClient
        .rpc('check_event_conflicts', {
          p_organization_id: orgId,
          p_user_id: userId,
          p_start_time: startTime,
          p_end_time: endTime,
          p_exclude_event_id: excludeEventId
        });

      if (error) {
        console.error('Check conflicts error:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          has_conflicts: (conflicts?.length || 0) > 0,
          conflicts: conflicts || []
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // =============================================
    // POST /calendar-events - Create new event
    // =============================================
    if (req.method === 'POST' && path.endsWith('/calendar-events')) {
      const body: EventRequest = await req.json();

      // Validate required fields
      if (!body.organization_id || !body.created_by || !body.title || 
          !body.start_time || !body.end_time) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required fields: organization_id, created_by, title, start_time, end_time' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Create event
      const { data: event, error: eventError } = await supabaseClient
        .from('events')
        .insert({
          organization_id: body.organization_id,
          created_by: body.created_by,
          title: body.title,
          description: body.description,
          event_type: body.event_type || 'meeting',
          start_time: body.start_time,
          end_time: body.end_time,
          all_day: body.all_day || false,
          timezone: body.timezone || 'Europe/Rome',
          location: body.location,
          location_type: body.location_type,
          meeting_url: body.meeting_url,
          status: body.status || 'scheduled',
          priority: body.priority || 'medium',
          color: body.color,
          contact_id: body.contact_id,
          notes: body.notes,
          reminder_minutes: body.reminder_minutes
        })
        .select()
        .single();

      if (eventError) {
        console.error('Create event error:', eventError);
        throw eventError;
      }

      // Add participants if provided
      if (body.participants && body.participants.length > 0) {
        const participants = body.participants.map((p) => ({
          event_id: event.id,
          participant_type: p.type,
          user_id: p.user_id,
          contact_id: p.contact_id,
          external_name: p.external_name,
          external_email: p.external_email,
          role: p.role || 'attendee'
        }));

        const { error: participantsError } = await supabaseClient
          .from('event_participants')
          .insert(participants);

        if (participantsError) {
          console.error('Add participants error:', participantsError);
          // Don't fail the entire operation, just log the error
        }
      }

      // Create reminders if specified
      if (body.reminder_minutes && body.reminder_minutes.length > 0) {
        const reminders = body.reminder_minutes.map((minutes) => {
          const remindAt = new Date(new Date(body.start_time).getTime() - (minutes * 60 * 1000));
          return {
            event_id: event.id,
            user_id: body.created_by,
            remind_at: remindAt.toISOString(),
            minutes_before: minutes,
            delivery_method: 'in_app'
          };
        });

        const { error: remindersError } = await supabaseClient
          .from('event_reminders')
          .insert(reminders);

        if (remindersError) {
          console.error('Create reminders error:', remindersError);
          // Don't fail the entire operation
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          event,
          message: 'Event created successfully'
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // =============================================
    // PATCH /calendar-events/:id - Update event
    // =============================================
    if (req.method === 'PATCH' && path.includes('/calendar-events/')) {
      const eventId = path.split('/').pop();
      if (!eventId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Event ID required' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const body = await req.json();

      const { data, error } = await supabaseClient
        .from('events')
        .update(body)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('Update event error:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          event: data,
          message: 'Event updated successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // =============================================
    // DELETE /calendar-events/:id - Delete event (soft delete)
    // =============================================
    if (req.method === 'DELETE' && path.includes('/calendar-events/')) {
      const eventId = path.split('/').pop();
      if (!eventId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Event ID required' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const { error } = await supabaseClient
        .from('events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', eventId);

      if (error) {
        console.error('Delete event error:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Event deleted successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // =============================================
    // POST /calendar-events/participants - Manage participants
    // =============================================
    if (req.method === 'POST' && path.includes('/participants')) {
      const body = await req.json();
      const { event_id, participants, action } = body;

      if (!event_id || !participants) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'event_id and participants are required' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (action === 'add') {
        const { error } = await supabaseClient
          .from('event_participants')
          .insert(participants.map((p: any) => ({
            event_id,
            participant_type: p.type,
            user_id: p.user_id,
            contact_id: p.contact_id,
            external_name: p.external_name,
            external_email: p.external_email,
            role: p.role || 'attendee'
          })));

        if (error) throw error;

      } else if (action === 'remove') {
        for (const participant of participants) {
          await supabaseClient
            .from('event_participants')
            .delete()
            .eq('event_id', event_id)
            .eq(participant.user_id ? 'user_id' : 'contact_id', 
                participant.user_id || participant.contact_id);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Participants ${action}ed successfully`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // =============================================
    // GET /calendar-events/search - Search events
    // =============================================
    if (req.method === 'GET' && path.includes('/search')) {
      const query = url.searchParams.get('q');
      const orgId = url.searchParams.get('orgId');
      const userId = url.searchParams.get('userId');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      if (!query || !orgId || !userId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required parameters: q, orgId, userId' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const { data, error } = await supabaseClient
        .from('events')
        .select(`
          id, title, description, event_type, start_time, end_time,
          status, priority, location, contact_id,
          contacts(name)
        `)
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .or(`created_by.eq.${userId},event_participants.user_id.eq.${userId}`)
        .textSearch('search_vector', query, { type: 'websearch' })
        .order('start_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Search events error:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          events: data || [],
          count: data?.length || 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // =============================================
    // Method not allowed
    // =============================================
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Method ${req.method} not allowed for path ${path}` 
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Calendar API error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        details: error.details || null
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});