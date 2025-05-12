// import { connectDB } from "@/lib/dbConfig";
// import Appointment from "@/models/appoinmentModel";
// import { auth } from "@clerk/nextjs/server";
// import { OpenAI } from 'openai';


// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// });


// // Assuming you have a connected MongoDB instance
// export async function POST(req) {
//     try {
//         const { userId } = await auth();
//         if (!userId) {
//             return new Response(JSON.stringify({ error: "Unauthorized" }), {
//                 status: 401,
//                 headers: { "Content-Type": "application/json" },
//             });
//         }

//         const { messages } = await req.json();

//         await connectDB();

//         const response = await openai.chat.completions.create({
//             model: "gpt-3.5-turbo",
//             messages,
//         });

//         const reply = response.choices[0]?.message?.content || "No response";

//         const userInput = messages[messages.length - 1]?.content || "";
//         const appointmentData = extractAppointmentDetails(userInput);

//         if (appointmentData) {
//             // Store the appointment with a reference to the user
//             await Appointment.create({
//                 user: userId,
//                 ...appointmentData,
//             });
//         }

//         return new Response(JSON.stringify({ reply }), {
//             status: 200,
//             headers: { "Content-Type": "application/json" },
//         });
//     } catch (error) {
//         console.error(error);
//         return new Response(JSON.stringify({ error: "Internal server error" }), {
//             status: 500,
//             headers: { "Content-Type": "application/json" },
//         });
//     }
// }



// // Simple regex extractor (can be improved with LLM parsing)
// function extractAppointmentDetails(message) {
//     const nameMatch = message.match(/name\s*is\s*([\w\s]+)/i);
//     const dateMatch = message.match(/(?:on|at)\s*([\w\s,:]+)/i);
//     const symptomMatch = message.match(/(?:suffering from|symptoms are|I have)\s*([\w\s]+)/i);

//     if (nameMatch && dateMatch && symptomMatch) {
//         return {
//             name: nameMatch[1].trim(),
//             preferredDate: dateMatch[1].trim(),
//             symptoms: symptomMatch[1].trim(),
//         };
//     }

//     return null;
// }





import { connectDB } from "@/lib/dbConfig";
import Appointment from "@/models/appoinmentModel";
import { auth } from "@clerk/nextjs/server";
import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
    try {
        // 1. Authenticate user with Clerk
        const { userId } = await auth();
        if (!userId) {
            return new Response(
                JSON.stringify({ error: "Unauthorized - Please log in" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // 2. Parse request data
        const { messages } = await req.json();
        const userInput = messages[messages.length - 1]?.content || "";

        // 3. Connect to MongoDB
        await connectDB();
        console.log("Connected to MongoDB");

        // 4. Get AI response
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages,
            temperature: 0.7,
        });

        const aiReply = response.choices[0]?.message?.content || "I couldn't process that request.";

        // 5. Extract appointment details (improved extraction)
        const appointmentData = extractAppointmentDetails(userInput);

        // 6. Save to database if appointment details found
        if (appointmentData) {
            try {
                const newAppointment = await Appointment.create({
                    clerkUserId: userId,
                    ...appointmentData,
                });

                console.log("Appointment saved:", newAppointment);

                // Enhance the AI reply with confirmation
                const replyWithConfirmation = `${aiReply}\n\nI've scheduled your appointment for ${appointmentData.preferredDate}. ` +
                    `We'll send a confirmation to your email shortly.`;

                return new Response(
                    JSON.stringify({ reply: replyWithConfirmation }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                );
            } catch (dbError) {
                console.error("Database save error:", dbError);
                return new Response(
                    JSON.stringify({
                        reply: `${aiReply}\n\nNote: I couldn't save your appointment details. Please try again.`,
                        error: dbError.message
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                );
            }
        }

        // 7. Return regular AI response if no appointment data
        return new Response(
            JSON.stringify({ reply: aiReply }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Server error:", error);
        return new Response(
            JSON.stringify({
                error: "Internal server error",
                details: error.message
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

// Enhanced appointment details extraction
function extractAppointmentDetails(message) {
    if (!message) return null;

    // Normalize the message
    const normalized = message.toLowerCase().replace(/[^\w\s]/g, '');

    // Check if this is likely an appointment request
    const isAppointmentRequest =
        normalized.includes('appointment') ||
        normalized.includes('schedule') ||
        normalized.includes('book') ||
        (normalized.includes('see') && normalized.includes('doctor'));

    if (!isAppointmentRequest) return null;

    // Extract details with more flexible patterns
    const patterns = [
        // Pattern 1: "I'd like to book an appointment for [date]"
        {
            name: /(?:name is|i'm|called)\s+([a-z][a-z\s]*?)(?:\s+(?:on|for|about)|\.|$)/i,
            date: /(?:on|for|at)\s+([a-z0-9\s,:\/]+)(?:\s+(?:for|because)|\.|$)/i,
            symptoms: /(?:because|suffering from|having|with)\s+([a-z][a-z\s]*?)(?:\.|$)/i
        },
        // Pattern 2: "Can I see the doctor about [symptoms] on [date]?"
        {
            name: /(?:patient|name)[:\s]*([a-z][a-z\s]*)/i,
            date: /(?:appointment|see doctor|available)[:\s]*([a-z0-9\s,:\/]+)/i,
            symptoms: /(?:reason|symptoms|about)[:\s]*([a-z][a-z\s]*)/i
        }
    ];

    let extractedData = {
        name: '',
        preferredDate: '',
        symptoms: ''
    };

    // Try each pattern
    for (const pattern of patterns) {
        const nameMatch = message.match(pattern.name);
        const dateMatch = message.match(pattern.date);
        const symptomMatch = message.match(pattern.symptoms);

        if (nameMatch) extractedData.name = nameMatch[1].trim();
        if (dateMatch) extractedData.preferredDate = dateMatch[1].trim();
        if (symptomMatch) extractedData.symptoms = symptomMatch[1].trim();

        // If we got at least 2 pieces of information, consider it valid
        const validFields = Object.values(extractedData).filter(v => v.trim() !== '').length;
        if (validFields >= 2) {
            // Set defaults for any missing fields
            if (!extractedData.name) extractedData.name = 'Not specified';
            if (!extractedData.preferredDate) extractedData.preferredDate = 'ASAP';
            if (!extractedData.symptoms) extractedData.symptoms = 'General consultation';

            return extractedData;
        }
    }

    return null;
}