// File: supabase/functions/execute-workflow/index.ts
// Edge function to execute workflow definitions

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

interface ExecuteWorkflowRequest {
  workflow_id: string;
  trigger_data?: Record<string, any>;
  force?: boolean;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { workflow_id, trigger_data = {}, force = false }: ExecuteWorkflowRequest = await req.json();

    if (!workflow_id) {
      return new Response(
        JSON.stringify({ error: "workflow_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get workflow definition
    const { data: workflow, error: workflowError } = await supabase
      .from("workflow_definitions")
      .select("*")
      .eq("id", workflow_id)
      .single();

    if (workflowError || !workflow) {
      throw new Error(`Workflow not found: ${workflow_id}`);
    }

    if (!workflow.is_active && !force) {
      return new Response(
        JSON.stringify({ 
          error: "Workflow is not active",
          workflow_id,
          name: workflow.name 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const executionStartTime = new Date().toISOString();

    // Create execution log entry
    const { data: logEntry, error: logError } = await supabase
      .from("workflow_execution_logs")
      .insert({
        workflow_id: workflow.id,
        execution_start: executionStartTime,
        status: "running",
        trigger_data,
      })
      .select()
      .single();

    if (logError || !logEntry) {
      throw new Error("Failed to create execution log");
    }

    // Execute workflow steps
    let executionResult;

    try {
      executionResult = await executeWorkflowSteps(workflow, trigger_data, supabase);

      // Update workflow last executed timestamp
      await supabase
        .from("workflow_definitions")
        .update({
          last_executed_at: new Date().toISOString(),
        })
        .eq("id", workflow.id);

      // Update execution log with success
      await supabase
        .from("workflow_execution_logs")
        .update({
          execution_end: new Date().toISOString(),
          status: "success",
          execution_result: executionResult,
        })
        .eq("id", logEntry.id);

      return new Response(
        JSON.stringify({
          success: true,
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          execution_id: logEntry.id,
          result: executionResult,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (executionError: any) {
      // Update execution log with error
      await supabase
        .from("workflow_execution_logs")
        .update({
          execution_end: new Date().toISOString(),
          status: "error",
          error_details: executionError.message,
        })
        .eq("id", logEntry.id);

      throw executionError;
    }

  } catch (error: any) {
    console.error("Error executing workflow:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function executeWorkflowSteps(workflow: any, triggerData: any, supabase: any) {
  const workflowJson = workflow.workflow_json || {};
  const steps = workflowJson.steps || [];

  if (steps.length === 0) {
    return {
      status: "no_steps",
      message: "Workflow has no steps defined",
      steps_executed: 0,
    };
  }

  const results: any[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    try {
      const stepResult = await executeStep(step, triggerData, workflow, supabase);
      results.push({
        step_index: i,
        step_type: step.type || "unknown",
        status: "success",
        result: stepResult,
      });
      successCount++;
    } catch (stepError: any) {
      results.push({
        step_index: i,
        step_type: step.type || "unknown",
        status: "error",
        error: stepError.message,
      });
      errorCount++;

      // Decide whether to continue or stop on error
      if (step.stop_on_error !== false) {
        break;
      }
    }
  }

  return {
    status: errorCount > 0 ? "partial" : "completed",
    steps_total: steps.length,
    steps_executed: successCount + errorCount,
    steps_success: successCount,
    steps_failed: errorCount,
    results,
  };
}

async function executeStep(step: any, triggerData: any, workflow: any, supabase: any) {
  const stepType = step.type || "action";

  switch (stepType) {
    case "send_email":
      return await executeSendEmail(step, triggerData, workflow, supabase);

    case "send_notification":
      return await executeSendNotification(step, triggerData, workflow, supabase);

    case "delay":
      return await executeDelay(step);

    case "condition":
      return await executeCondition(step, triggerData);

    case "api_call":
      return await executeApiCall(step, triggerData);

    case "database_query":
      return await executeDatabaseQuery(step, triggerData, supabase);

    default:
      // For generic actions, just log the description
      return {
        step_type: stepType,
        description: step.description || "No description",
        status: "executed",
      };
  }
}

async function executeSendEmail(step: any, _triggerData: any, workflow: any, supabase: any) {
  // Get email integration
  const { data: emailIntegration } = await supabase
    .from("api_integrations")
    .select("*")
    .eq("provider_type", "email")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!emailIntegration) {
    throw new Error("No active email integration found");
  }

  const recipient = step.recipient || workflow.created_by;
  const subject = step.subject || "Workflow Notification";
  const body = step.body || step.description;

  // Mock sending email - in production would call actual email API
  return {
    action: "send_email",
    provider: emailIntegration.provider_name,
    recipient,
    subject,
    status: "sent",
  };
}

async function executeSendNotification(step: any, _triggerData: any, _workflow: any, _supabase: any) {
  const channel = step.channel || "in_app";
  const message = step.message || step.description;

  return {
    action: "send_notification",
    channel,
    message,
    status: "sent",
  };
}

async function executeDelay(step: any) {
  const delayMs = step.delay_ms || step.delay_seconds * 1000 || 1000;
  
  // For async workflows, we would queue this for later
  // For now, just record the delay
  return {
    action: "delay",
    delay_ms: delayMs,
    status: "scheduled",
  };
}

async function executeCondition(step: any, triggerData: any) {
  const condition = step.condition || "true";
  const conditionResult = evaluateCondition(condition, triggerData);

  return {
    action: "condition",
    condition,
    result: conditionResult,
    next_step: conditionResult ? step.then_step : step.else_step,
  };
}

async function executeApiCall(step: any, triggerData: any) {
  const url = step.url;
  const method = step.method || "GET";
  const headers = step.headers || {};
  const body = step.body || triggerData;

  // Mock API call - in production would make actual HTTP request
  return {
    action: "api_call",
    url,
    method,
    status: "success",
    mock: true,
  };
}

async function executeDatabaseQuery(step: any, _triggerData: any, supabase: any) {
  const table = step.table;
  const operation = step.operation || "select";
  const filters = step.filters || {};

  if (!table) {
    throw new Error("Database query step requires 'table' parameter");
  }

  // Execute query based on operation
  let result;

  switch (operation) {
    case "select":
      result = await supabase.from(table).select("*").limit(10);
      break;

    case "insert":
      result = await supabase.from(table).insert(step.data);
      break;

    case "update":
      result = await supabase.from(table).update(step.data).match(filters);
      break;

    case "delete":
      result = await supabase.from(table).delete().match(filters);
      break;

    default:
      throw new Error(`Unknown database operation: ${operation}`);
  }

  if (result.error) {
    throw new Error(`Database query failed: ${result.error.message}`);
  }

  return {
    action: "database_query",
    table,
    operation,
    rows_affected: result.data?.length || 0,
    status: "success",
  };
}

function evaluateCondition(condition: string, data: any): boolean {
  // Simple condition evaluation
  // In production, would use a safe expression evaluator
  try {
    // Replace variable references with data values
    const evaluated = condition.replace(/\$\{(\w+)\}/g, (_, key) => {
      return JSON.stringify(data[key] || null);
    });

    // For now, just check if it's "true"
    return evaluated === "true" || evaluated.includes("true");
  } catch {
    return false;
  }
}
