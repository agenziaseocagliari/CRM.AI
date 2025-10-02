// File: supabase/functions/execute-automation-agent/index.ts
// Edge function to execute automation agents

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

interface AgentExecutionRequest {
  agent_id: string;
  force?: boolean; // Force execution even if not scheduled
}

interface AgentConfig {
  alert_channels?: string[];
  check_interval_minutes?: number;
  thresholds?: Record<string, any>;
  [key: string]: any;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { agent_id, force = false }: AgentExecutionRequest = await req.json();

    if (!agent_id) {
      return new Response(
        JSON.stringify({ error: "agent_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get agent configuration
    const { data: agent, error: agentError } = await supabase
      .from("automation_agents")
      .select("*")
      .eq("id", agent_id)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agent_id}`);
    }

    if (!agent.is_active && !force) {
      return new Response(
        JSON.stringify({ 
          error: "Agent is not active",
          agent_id,
          is_active: false 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const executionStartTime = new Date().toISOString();

    // Create execution log entry
    const { data: logEntry, error: logError } = await supabase
      .from("agent_execution_logs")
      .insert({
        agent_id: agent.id,
        execution_start: executionStartTime,
        status: "running",
      })
      .select()
      .single();

    if (logError || !logEntry) {
      throw new Error("Failed to create execution log");
    }

    // Execute agent based on type
    let result;
    let actions: any[] = [];

    try {
      switch (agent.type) {
        case "health_monitor":
          result = await executeHealthMonitor(agent, supabase);
          actions = result.actions;
          break;

        case "payment_revenue":
          result = await executePaymentRevenueAgent(agent, supabase);
          actions = result.actions;
          break;

        case "support_ticket":
          result = await executeSupportTicketAgent(agent, supabase);
          actions = result.actions;
          break;

        case "user_engagement":
          result = await executeUserEngagementAgent(agent, supabase);
          actions = result.actions;
          break;

        case "security_watcher":
          result = await executeSecurityWatcherAgent(agent, supabase);
          actions = result.actions;
          break;

        default:
          throw new Error(`Unknown agent type: ${agent.type}`);
      }

      // Update agent with last run time
      await supabase
        .from("automation_agents")
        .update({
          last_run_at: new Date().toISOString(),
          status: "idle",
          last_error: null,
        })
        .eq("id", agent.id);

      // Update execution log with success
      await supabase
        .from("agent_execution_logs")
        .update({
          execution_end: new Date().toISOString(),
          status: "success",
          result_summary: result,
          actions_taken: actions,
        })
        .eq("id", logEntry.id);

      return new Response(
        JSON.stringify({
          success: true,
          agent_id: agent.id,
          agent_name: agent.name,
          execution_id: logEntry.id,
          result,
          actions_taken: actions.length,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (executionError: any) {
      // Update agent with error
      await supabase
        .from("automation_agents")
        .update({
          status: "error",
          last_error: executionError.message,
        })
        .eq("id", agent.id);

      // Update execution log with error
      await supabase
        .from("agent_execution_logs")
        .update({
          execution_end: new Date().toISOString(),
          status: "error",
          error_details: executionError.message,
        })
        .eq("id", logEntry.id);

      throw executionError;
    }

  } catch (error: any) {
    console.error("Error executing agent:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Agent execution functions

async function executeHealthMonitor(agent: any, supabase: any) {
  const config: AgentConfig = agent.configuration || {};
  const actions: any[] = [];
  const issues: any[] = [];

  // Check uptime (mock - would query actual monitoring service)
  const uptimePercentage = 99.8; // Mock data
  if (uptimePercentage < (config.thresholds?.uptime_percentage || 99)) {
    issues.push({
      type: "uptime",
      severity: "warning",
      message: `Uptime below threshold: ${uptimePercentage}%`,
    });
    
    actions.push({
      type: "alert",
      channels: config.alert_channels || ["in_app"],
      message: `⚠️ Uptime Alert: ${uptimePercentage}%`,
    });
  }

  // Check API error rate
  const errorRate = 3; // Errors per minute (mock)
  if (errorRate > (config.thresholds?.error_rate || 5)) {
    issues.push({
      type: "error_rate",
      severity: "critical",
      message: `Error rate above threshold: ${errorRate}/min`,
    });

    actions.push({
      type: "alert",
      channels: config.alert_channels || ["in_app", "email"],
      message: `🚨 High Error Rate: ${errorRate} errors/min`,
    });
  }

  return {
    status: issues.length > 0 ? "issues_detected" : "healthy",
    uptime: uptimePercentage,
    error_rate: errorRate,
    issues_found: issues.length,
    issues,
    actions,
  };
}

async function executePaymentRevenueAgent(agent: any, supabase: any) {
  const config: AgentConfig = agent.configuration || {};
  const actions: any[] = [];

  // Query for failed payments
  const { data: failedPayments, error } = await supabase
    .from("organization_credits")
    .select("organization_id, current_credits")
    .lt("current_credits", 10);

  if (error) {
    throw new Error(`Failed to query credits: ${error.message}`);
  }

  // Send low credit alerts
  for (const org of failedPayments || []) {
    actions.push({
      type: "notification",
      target: org.organization_id,
      channels: config.alert_channels || ["email"],
      message: `⚠️ Low Credits: Only ${org.current_credits} credits remaining`,
    });
  }

  return {
    status: "completed",
    low_credit_orgs: (failedPayments || []).length,
    notifications_sent: actions.length,
    actions,
  };
}

async function executeSupportTicketAgent(_agent: any, _supabase: any) {
  // TODO: Implement support ticket logic
  return {
    status: "not_implemented",
    message: "Support ticket agent logic to be implemented",
    actions: [],
  };
}

async function executeUserEngagementAgent(_agent: any, _supabase: any) {
  // TODO: Implement user engagement logic
  return {
    status: "not_implemented",
    message: "User engagement agent logic to be implemented",
    actions: [],
  };
}

async function executeSecurityWatcherAgent(_agent: any, supabase: any) {
  const actions: any[] = [];
  const threats: any[] = [];

  // Check for suspicious login attempts (mock - would query actual auth logs)
  const suspiciousLogins = 0;

  if (suspiciousLogins > 0) {
    threats.push({
      type: "suspicious_login",
      count: suspiciousLogins,
      severity: "high",
    });

    actions.push({
      type: "security_alert",
      channels: ["email", "telegram"],
      message: `🔒 Security Alert: ${suspiciousLogins} suspicious login attempts`,
    });
  }

  return {
    status: threats.length > 0 ? "threats_detected" : "secure",
    threats_found: threats.length,
    threats,
    actions,
  };
}
