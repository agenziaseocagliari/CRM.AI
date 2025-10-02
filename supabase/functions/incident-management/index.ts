// File: supabase/functions/incident-management/index.ts
// Edge function for incident response management

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

interface IncidentManagementRequest {
  action: 
    | 'create_incident'
    | 'list_incidents'
    | 'get_incident'
    | 'update_incident'
    | 'update_status'
    | 'add_comment'
    | 'assign_incident'
    | 'get_incident_history'
    | 'trigger_notification'
    | 'check_escalations';
  incident_id?: string;
  incident_data?: {
    incident_type: string;
    severity: string;
    title: string;
    description?: string;
    affected_service?: string;
    organization_id?: string;
    metadata?: any;
  };
  status?: string;
  comment?: string;
  assignee_id?: string;
  filters?: {
    status?: string[];
    severity?: string[];
    incident_type?: string[];
    organization_id?: string;
    from_date?: string;
    to_date?: string;
  };
  page?: number;
  per_page?: number;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Get JWT from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create client with user JWT for permission checks
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is super admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";

    const body: IncidentManagementRequest = await req.json();
    const { action } = body;

    switch (action) {
      case 'create_incident': {
        if (!body.incident_data) {
          return new Response(
            JSON.stringify({ error: "incident_data is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabaseAdmin.rpc('create_incident', {
          p_incident_type: body.incident_data.incident_type,
          p_severity: body.incident_data.severity,
          p_title: body.incident_data.title,
          p_description: body.incident_data.description,
          p_affected_service: body.incident_data.affected_service,
          p_organization_id: body.incident_data.organization_id,
          p_metadata: body.incident_data.metadata || {}
        });

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            success: true, 
            incident_id: data,
            message: "Incident created successfully"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'list_incidents': {
        let query = supabaseAdmin
          .from('incidents')
          .select('*, incident_actions(count)', { count: 'exact' });

        // Apply filters
        if (body.filters) {
          if (body.filters.status) {
            query = query.in('status', body.filters.status);
          }
          if (body.filters.severity) {
            query = query.in('severity', body.filters.severity);
          }
          if (body.filters.incident_type) {
            query = query.in('incident_type', body.filters.incident_type);
          }
          if (body.filters.organization_id) {
            query = query.eq('organization_id', body.filters.organization_id);
          }
          if (body.filters.from_date) {
            query = query.gte('detected_at', body.filters.from_date);
          }
          if (body.filters.to_date) {
            query = query.lte('detected_at', body.filters.to_date);
          }
        }

        // Pagination
        const page = body.page || 1;
        const perPage = body.per_page || 50;
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        const { data: incidents, error, count } = await query
          .order('detected_at', { ascending: false })
          .range(from, to);

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            incidents,
            pagination: {
              page,
              per_page: perPage,
              total: count,
              total_pages: Math.ceil((count || 0) / perPage)
            }
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'get_incident': {
        if (!body.incident_id) {
          return new Response(
            JSON.stringify({ error: "incident_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get incident details
        const { data: incident, error: incidentError } = await supabaseAdmin
          .from('incidents')
          .select('*')
          .eq('id', body.incident_id)
          .single();

        if (incidentError) throw incidentError;

        // Get incident actions (timeline)
        const { data: actions, error: actionsError } = await supabaseAdmin
          .from('incident_actions')
          .select('*')
          .eq('incident_id', body.incident_id)
          .order('created_at', { ascending: false });

        if (actionsError) throw actionsError;

        // Get notifications sent
        const { data: notifications, error: notifError } = await supabaseAdmin
          .from('notification_logs')
          .select('*')
          .eq('incident_id', body.incident_id)
          .order('created_at', { ascending: false });

        if (notifError) throw notifError;

        return new Response(
          JSON.stringify({ 
            incident,
            actions,
            notifications
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'update_status': {
        if (!body.incident_id || !body.status) {
          return new Response(
            JSON.stringify({ error: "incident_id and status are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabaseAdmin.rpc('update_incident_status', {
          p_incident_id: body.incident_id,
          p_new_status: body.status,
          p_actor_id: user.id,
          p_notes: body.comment
        });

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Incident status updated"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'add_comment': {
        if (!body.incident_id || !body.comment) {
          return new Response(
            JSON.stringify({ error: "incident_id and comment are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabaseAdmin.rpc('log_incident_action', {
          p_incident_id: body.incident_id,
          p_action_type: 'comment_added',
          p_description: body.comment,
          p_actor_id: user.id,
          p_metadata: {}
        });

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Comment added"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'assign_incident': {
        if (!body.incident_id || !body.assignee_id) {
          return new Response(
            JSON.stringify({ error: "incident_id and assignee_id are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update incident
        const { error: updateError } = await supabaseAdmin
          .from('incidents')
          .update({ assigned_to: body.assignee_id, updated_at: new Date().toISOString() })
          .eq('id', body.incident_id);

        if (updateError) throw updateError;

        // Log action
        await supabaseAdmin.rpc('log_incident_action', {
          p_incident_id: body.incident_id,
          p_action_type: 'assigned',
          p_description: 'Incident assigned',
          p_actor_id: user.id,
          p_metadata: { assigned_to: body.assignee_id }
        });

        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Incident assigned"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'check_escalations': {
        // Get all open/investigating incidents
        const { data: openIncidents, error: openError } = await supabaseAdmin
          .from('incidents')
          .select('id')
          .in('status', ['open', 'investigating']);

        if (openError) throw openError;

        const escalations = [];
        for (const incident of openIncidents || []) {
          const { data: shouldEscalate } = await supabaseAdmin.rpc('check_incident_escalation', {
            p_incident_id: incident.id
          });

          if (shouldEscalate) {
            escalations.push(incident.id);
          }
        }

        return new Response(
          JSON.stringify({ 
            checked: openIncidents?.length || 0,
            escalated: escalations.length,
            escalated_incidents: escalations
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("Error in incident-management function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
