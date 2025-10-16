import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, subject, body, variables } = req.body;

    console.log('📧 Email send request:', { to, subject });

    // Check if Brevo API key is configured
    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    if (!BREVO_API_KEY) {
        console.warn('⚠️ BREVO_API_KEY not configured, using mock mode');
        return res.status(200).json({
            success: true,
            messageId: 'mock-' + Date.now(),
            to,
            subject,
            method: 'mock',
            note: 'Email not actually sent (Brevo API key not configured)',
        });
    }

    try {
        // Real Brevo API call
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                sender: {
                    name: 'CRM.AI',
                    email: process.env.BREVO_SENDER_EMAIL || 'noreply@crm-ai.app',
                },
                to: [{ email: to }],
                subject,
                htmlContent: body.replace(/{{(\w+)}}/g, (match: string, key: string) => {
                    return variables?.[key] || match;
                }),
            }),
        });

        if (!response.ok) {
            throw new Error(`Brevo API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Email sent via Brevo:', data.messageId);

        return res.status(200).json({
            success: true,
            messageId: data.messageId,
            to,
            subject,
            method: 'brevo',
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Email send failed:', errorMessage);
        return res.status(500).json({
            success: false,
            error: errorMessage,
        });
    }
}