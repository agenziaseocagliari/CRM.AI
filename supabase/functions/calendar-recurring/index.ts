import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
};

interface RecurringEventRequest {
  organization_id: string;
  created_by: string;
  title: string;
  description?: string;
  event_type?: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  location?: string;
  status?: string;
  priority?: string;
  color?: string;
  contact_id?: string;
  notes?: string;
  // Recurrence specific
  recurrence_rule: string; // RRULE format
  recurrence_end_date?: string;
  generate_until?: string; // Generate instances until this date
}

Deno.serve(async (req) => {
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
    // POST /calendar-recurring - Create recurring event series
    // =============================================
    if (req.method === 'POST' && path.endsWith('/calendar-recurring')) {
      const body: RecurringEventRequest = await req.json();

      // Validate required fields
      if (!body.organization_id || !body.created_by || !body.title || 
          !body.start_time || !body.end_time || !body.recurrence_rule) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required fields for recurring event' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create parent event (template)
      const { data: parentEvent, error: parentError } = await supabaseClient
        .from('events')
        .insert({
          organization_id: body.organization_id,
          created_by: body.created_by,
          title: body.title,
          description: body.description,
          event_type: body.event_type || 'meeting',
          start_time: body.start_time,
          end_time: body.end_time,
          timezone: body.timezone || 'Europe/Rome',
          location: body.location,
          status: body.status || 'scheduled',
          priority: body.priority || 'medium',
          color: body.color,
          contact_id: body.contact_id,
          notes: body.notes,
          is_recurring: true,
          recurrence_rule: body.recurrence_rule,
          recurrence_end_date: body.recurrence_end_date
        })
        .select()
        .single();

      if (parentError) {
        console.error('Create parent event error:', parentError);
        throw parentError;
      }

      // Generate instances using the database function
      const generateUntil = body.generate_until || body.recurrence_end_date;
      if (generateUntil) {
        const { data: instances, error: instancesError } = await supabaseClient
          .rpc('generate_recurring_instances', {
            p_event_id: parentEvent.id,
            p_start_date: body.start_time,
            p_end_date: generateUntil,
            p_max_instances: 100
          });

        if (instancesError) {
          console.error('Generate instances error:', instancesError);
        } else if (instances && instances.length > 0) {
          // Create individual event instances
          const instanceEvents = instances.map((instance: any) => ({
            organization_id: body.organization_id,
            created_by: body.created_by,
            title: body.title,
            description: body.description,
            event_type: body.event_type || 'meeting',
            start_time: instance.instance_date,
            end_time: instance.instance_end_time,
            timezone: body.timezone || 'Europe/Rome',
            location: body.location,
            status: body.status || 'scheduled',
            priority: body.priority || 'medium',
            color: body.color,
            contact_id: body.contact_id,
            notes: body.notes,
            is_recurring: false,
            parent_event_id: parentEvent.id,
            occurrence_date: instance.instance_date
          }));

          const { error: batchError } = await supabaseClient
            .from('events')
            .insert(instanceEvents);

          if (batchError) {
            console.error('Batch create instances error:', batchError);
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          parent_event: parentEvent,
          instances_generated: generateUntil ? true : false,
          message: 'Recurring event series created successfully'
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =============================================
    // GET /calendar-recurring/:id/instances - Get instances of recurring event
    // =============================================
    if (req.method === 'GET' && path.includes('/instances')) {
      const parentEventId = path.split('/')[2]; // Extract ID from path
      const startDate = url.searchParams.get('start');
      const endDate = url.searchParams.get('end');

      if (!parentEventId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Parent event ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabaseClient
        .from('events')
        .select('*')
        .eq('parent_event_id', parentEventId)
        .order('occurrence_date');

      if (startDate && endDate) {
        query = query
          .gte('occurrence_date', startDate)
          .lte('occurrence_date', endDate);
      }

      const { data: instances, error } = await query;

      if (error) {
        console.error('Get instances error:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          instances: instances || [],
          count: instances?.length || 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =============================================
    // PATCH /calendar-recurring/:id/instance/:instanceId - Update single instance
    // =============================================
    if (req.method === 'PATCH' && path.includes('/instance/')) {
      const pathParts = path.split('/');
      const instanceId = pathParts[pathParts.length - 1];
      
      if (!instanceId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Instance ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();

      const { data, error } = await supabaseClient
        .from('events')
        .update(body)
        .eq('id', instanceId)
        .eq('is_recurring', false) // Ensure we're only updating instances
        .select()
        .single();

      if (error) {
        console.error('Update instance error:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          instance: data,
          message: 'Event instance updated successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =============================================
    // DELETE /calendar-recurring/:id - Delete entire series
    // =============================================
    if (req.method === 'DELETE' && path.match(/\/calendar-recurring\/[^\/]+$/)) {
      const parentEventId = path.split('/').pop();
      
      if (!parentEventId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Parent event ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Soft delete parent event and all instances
      const now = new Date().toISOString();

      // Delete parent event
      const { error: parentError } = await supabaseClient
        .from('events')
        .update({ deleted_at: now })
        .eq('id', parentEventId);

      // Delete all instances
      const { error: instancesError } = await supabaseClient
        .from('events')
        .update({ deleted_at: now })
        .eq('parent_event_id', parentEventId);

      if (parentError || instancesError) {
        console.error('Delete series error:', parentError || instancesError);
        throw parentError || instancesError;
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Recurring event series deleted successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Method ${req.method} not allowed for path ${path}` 
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Recurring calendar API error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        details: error.details || null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});