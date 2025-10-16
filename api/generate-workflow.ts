import type { VercelRequest, VercelResponse } from '@vercel/node';

interface WorkflowNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
        label: string;
        nodeType: string;
        category?: string;
        icon?: string;
        color?: string;
        config?: Record<string, any>;
    };
    style?: Record<string, any>;
}

interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
}

interface GenerationResponse {
    success: boolean;
    method: 'ai' | 'fallback';
    elements: WorkflowNode[];
    edges: WorkflowEdge[];
    confidence: number;
    agent_used?: string;
    validation?: {
        valid: boolean;
        errors: string[];
    };
    suggestions?: string[];
    processing_time_ms?: number;
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    console.log('🚀 [Vercel API] Generate workflow requested');

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed', success: false });
        return;
    }

    const { description, organization_id } = req.body;

    if (!description || typeof description !== 'string') {
        res.status(400).json({
            error: 'Description is required',
            success: false
        });
        return;
    }

    console.log('📝 [Vercel API] Description:', description);
    console.log('🏢 [Vercel API] Organization ID:', organization_id);

    const startTime = Date.now();

    try {
        // Try Gemini AI generation first
        console.log('🤖 [Vercel API] Attempting Gemini AI generation');
        const geminiResult = await generateWithGemini(description);

        if (geminiResult) {
            const processingTime = Date.now() - startTime;
            console.log('✅ [Vercel API] Gemini generation SUCCESS in', processingTime, 'ms');

            const response: GenerationResponse = {
                success: true,
                method: 'ai',
                elements: geminiResult.nodes,
                edges: geminiResult.edges,
                confidence: 0.9,
                agent_used: 'Google Gemini Pro',
                validation: {
                    valid: true,
                    errors: []
                },
                suggestions: [
                    'Workflow generated using Google Gemini AI',
                    'You can customize node configurations after creation',
                    'Consider adding conditional logic for complex workflows'
                ],
                processing_time_ms: processingTime
            };

            res.status(200).json(response);
            return;
        }
    } catch (error: any) {
        console.warn('⚠️ [Vercel API] Gemini failed:', error.message);
    }

    // Fallback: keyword-based generation
    console.log('🔄 [Vercel API] Using fallback generation');
    const fallbackResult = generateFallbackWorkflow(description);
    const processingTime = Date.now() - startTime;

    console.log('✅ [Vercel API] Fallback generation complete in', processingTime, 'ms');

    const response: GenerationResponse = {
        success: true,
        method: 'fallback',
        elements: fallbackResult.nodes,
        edges: fallbackResult.edges,
        confidence: 0.6,
        agent_used: 'Local Keyword Generator',
        validation: {
            valid: true,
            errors: []
        },
        suggestions: [
            'Workflow generated using keyword-based templates',
            'For better AI results, ensure Gemini API key is configured',
            'Consider simplifying your description for more accurate keyword matching'
        ],
        processing_time_ms: processingTime
    };

    res.status(200).json(response);
}

// Gemini AI generation
async function generateWithGemini(description: string): Promise<{ nodes: WorkflowNode[], edges: WorkflowEdge[] } | null> {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.warn('⚠️ [Gemini] API key not configured');
        return null;
    }

    console.log('🔑 [Gemini] API key found, making request');

    try {
        const prompt = `
Generate a workflow based on this description: "${description}"

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "nodes": [
    {
      "id": "trigger-1",
      "type": "input",
      "position": {"x": 100, "y": 100},
      "data": {"label": "Trigger Name", "nodeType": "trigger-form-submit"}
    },
    {
      "id": "action-1", 
      "type": "default",
      "position": {"x": 400, "y": 100},
      "data": {"label": "Action Name", "nodeType": "action-send-email"}
    }
  ],
  "edges": [
    {"id": "e1", "source": "trigger-1", "target": "action-1"}
  ]
}

Use these node types:
Triggers: trigger-form-submit, trigger-contact-created, trigger-deal-won, trigger-deal-updated
Actions: action-send-email, action-ai-score, action-create-deal, action-add-tag, action-wait, action-webhook

Make the workflow logical and connected. Use Italian labels when possible.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            }
        );

        console.log('📡 [Gemini] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [Gemini] API error:', errorText);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            console.log('📄 [Gemini] Raw response:', text.substring(0, 200) + '...');

            // Clean up the response (remove markdown formatting)
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            try {
                const parsed = JSON.parse(cleaned);
                console.log('✅ [Gemini] Successfully parsed JSON');
                return parsed;
            } catch (parseError: any) {
                console.error('❌ [Gemini] JSON parse error:', parseError.message);
                console.error('❌ [Gemini] Cleaned text:', cleaned);
            }
        } else {
            console.error('❌ [Gemini] No text in response');
        }
    } catch (error: any) {
        console.error('❌ [Gemini] Request error:', error.message);
    }

    return null;
}

// Fallback keyword-based generation
function generateFallbackWorkflow(description: string): { nodes: WorkflowNode[], edges: WorkflowEdge[] } {
    console.log('🔄 [Fallback] Processing description:', description);

    const lower = description.toLowerCase();
    const nodes: WorkflowNode[] = [];
    const edges: WorkflowEdge[] = [];

    // Always start with a trigger
    const triggerId = 'trigger-1';
    let triggerType = 'trigger-form-submit';
    let triggerLabel = 'Invio Modulo';

    if (lower.includes('contatto') || lower.includes('contact')) {
        triggerType = 'trigger-contact-created';
        triggerLabel = 'Contatto Creato';
    } else if (lower.includes('affare') || lower.includes('deal')) {
        triggerType = 'trigger-deal-won';
        triggerLabel = 'Affare Vinto';
    } else if (lower.includes('aggiorn') || lower.includes('update')) {
        triggerType = 'trigger-deal-updated';
        triggerLabel = 'Affare Aggiornato';
    }

    nodes.push({
        id: triggerId,
        type: 'input',
        position: { x: 100, y: 100 },
        data: {
            label: triggerLabel,
            nodeType: triggerType
        }
    });

    let actionY = 100;
    let prevNodeId = triggerId;
    let actionCounter = 1;

    // Detect actions based on keywords
    if (lower.includes('email') || lower.includes('mail')) {
        const actionId = `action-${actionCounter++}`;
        nodes.push({
            id: actionId,
            type: 'default',
            position: { x: 400, y: actionY },
            data: {
                label: 'Invia Email',
                nodeType: 'action-send-email'
            }
        });
        edges.push({
            id: `e${edges.length + 1}`,
            source: prevNodeId,
            target: actionId
        });
        prevNodeId = actionId;
        actionY += 120;
    }

    if (lower.includes('punteggio') || lower.includes('score') || lower.includes('valut')) {
        const actionId = `action-${actionCounter++}`;
        nodes.push({
            id: actionId,
            type: 'default',
            position: { x: 400, y: actionY },
            data: {
                label: 'Punteggio AI',
                nodeType: 'action-ai-score'
            }
        });
        edges.push({
            id: `e${edges.length + 1}`,
            source: prevNodeId,
            target: actionId
        });
        prevNodeId = actionId;
        actionY += 120;
    }

    if (lower.includes('attendi') || lower.includes('wait') || lower.includes('aspett')) {
        const actionId = `action-${actionCounter++}`;
        nodes.push({
            id: actionId,
            type: 'default',
            position: { x: 400, y: actionY },
            data: {
                label: 'Attendi',
                nodeType: 'action-wait'
            }
        });
        edges.push({
            id: `e${edges.length + 1}`,
            source: prevNodeId,
            target: actionId
        });
        prevNodeId = actionId;
        actionY += 120;
    }

    if (lower.includes('tag') || lower.includes('etichett')) {
        const actionId = `action-${actionCounter++}`;
        nodes.push({
            id: actionId,
            type: 'default',
            position: { x: 400, y: actionY },
            data: {
                label: 'Aggiungi Tag',
                nodeType: 'action-add-tag'
            }
        });
        edges.push({
            id: `e${edges.length + 1}`,
            source: prevNodeId,
            target: actionId
        });
        prevNodeId = actionId;
        actionY += 120;
    }

    if (lower.includes('crea') && (lower.includes('affare') || lower.includes('deal'))) {
        const actionId = `action-${actionCounter++}`;
        nodes.push({
            id: actionId,
            type: 'default',
            position: { x: 400, y: actionY },
            data: {
                label: 'Crea Affare',
                nodeType: 'action-create-deal'
            }
        });
        edges.push({
            id: `e${edges.length + 1}`,
            source: prevNodeId,
            target: actionId
        });
        prevNodeId = actionId;
        actionY += 120;
    }

    if (lower.includes('webhook') || lower.includes('api')) {
        const actionId = `action-${actionCounter++}`;
        nodes.push({
            id: actionId,
            type: 'default',
            position: { x: 400, y: actionY },
            data: {
                label: 'Webhook',
                nodeType: 'action-webhook'
            }
        });
        edges.push({
            id: `e${edges.length + 1}`,
            source: prevNodeId,
            target: actionId
        });
    }

    // If no actions were detected, add a default email action
    if (nodes.length === 1) {
        const actionId = `action-${actionCounter}`;
        nodes.push({
            id: actionId,
            type: 'default',
            position: { x: 400, y: 100 },
            data: {
                label: 'Invia Email',
                nodeType: 'action-send-email'
            }
        });
        edges.push({
            id: 'e1',
            source: triggerId,
            target: actionId
        });
    }

    console.log('✅ [Fallback] Generated', nodes.length, 'nodes and', edges.length, 'edges');
    return { nodes, edges };
}