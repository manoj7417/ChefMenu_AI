// app/api/clerk-webhook/route.js

import { verifyWebhook } from '@clerk/nextjs/webhooks';
import User from "@/models/userModels"
import { connectDB } from '@/lib/dbConfig';

export async function POST(req) {
    try {
        const evt = await verifyWebhook(req);

        const { id } = evt.data;
        const eventType = evt.type;

        console.log(`Received webhook with ID ${id} and event type of ${eventType}`);
        console.log('Webhook payload:', evt.data);

        await connectDB();

        if (eventType === 'user.created') {
            const { email_addresses, first_name, last_name, id: clerkId } = evt.data;

            await User.create({
                clerkId,
                name: `${first_name} ${last_name}`,
                email: email_addresses[0].email_address,
            });
        }

        if (eventType === 'user.updated') {
            const { email_addresses, first_name, last_name, id: clerkId } = evt.data;

            await User.findOneAndUpdate(
                { clerkId },
                {
                    name: `${first_name} ${last_name}`,
                    email: email_addresses[0].email_address,
                },
                { new: true, upsert: true }
            );
        }

        if (eventType === 'user.deleted') {
            const { id: clerkId } = evt.data;
            await User.findOneAndDelete({ clerkId });
        }

        return new Response('Webhook received and processed', { status: 200 });
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error verifying webhook', { status: 400 });
    }
}
