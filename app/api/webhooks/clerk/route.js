import { createUser } from '@/lib/user.action'
import { clerkClient } from "@clerk/nextjs";
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const evt = await verifyWebhook(req)

        // Do something with payload
        // For this guide, log payload to console
        const { id } = evt.data
        const eventType = evt.type
        console.log(`Received webhook with ID ${id} and event type of ${eventType}`)

        if (eventType === "user.created") {
            const { id, email_addresses, image_url, first_name, last_name } =
                evt.data;

            const user = {
                clerkId: id,
                email: email_addresses[0].email_address,
                firstName: first_name,
                lastName: last_name,
                photo: image_url,
            };


            console.log(user);

            const newUser = await createUser(user);

            if (newUser) {
                await clerkClient.users.updateUserMetadata(id, {
                    publicMetadata: {
                        userId: newUser._id,
                    },
                });
            }

            return NextResponse.json({ message: "New user created", user: newUser });
        }
        console.log('Webhook payload:', evt.data)

        return new Response('Webhook received', { status: 200 })
    } catch (err) {
        console.error('Error verifying webhook:', err)
        return new Response('Error verifying webhook', { status: 400 })
    }
}