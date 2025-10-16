import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, body } = req.body;

    console.log('💬 WhatsApp send request:', { to, body: body.substring(0, 50) });

    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER; // Format: whatsapp:+14155238886

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        console.warn('⚠️ Twilio WhatsApp not configured, using mock mode');
        return res.status(200).json({
            success: true,
            sid: 'mock-whatsapp-' + Date.now(),
            to,
            method: 'mock',
            note: 'WhatsApp not actually sent (Twilio not configured)',
        });
    }

    try {
        const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    From: TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
                    To: `whatsapp:${to}`,
                    Body: body,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Twilio WhatsApp API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ WhatsApp sent via Twilio:', data.sid);

        return res.status(200).json({
            success: true,
            sid: data.sid,
            to,
            method: 'twilio-whatsapp',
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ WhatsApp send failed:', errorMessage);
        return res.status(500).json({
            success: false,
            error: errorMessage,
        });
    }
}