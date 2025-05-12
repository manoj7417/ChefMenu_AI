// app/api/clerk-webhook/route.js

import { verifyWebhook } from '@clerk/nextjs/webhooks';
import User from "@/models/userModels"
import { connectDB } from '@/lib/dbConfig';

export async function POST(req) {
    try {
        console.log('Webhook request received');

        const evt = await verifyWebhook(req);

        console.log('Webhook verified:', evt);

        await connectDB();

        const { id: clerkId, email_addresses, first_name, last_name } = evt.data;

        if (evt.type === 'user.created') {
            await User.create({
                clerkId,
                name: `${first_name} ${last_name}`,
                email: email_addresses?.[0]?.email_address || '',
            });
        }

        return new Response('OK', { status: 200 });
    } catch (err) {
        console.error('Webhook error:', err);
        return new Response('Webhook error', { status: 400 });
    }
}
