// pages/api/syncUser.js
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/dbConfig";
import User from "@/models/userModels"

export default async function handler(req, res) {
    try {
        await connectDB();

        const user = await currentUser();

        if (!user) return res.status(401).json({ message: "Unauthorized" });

        const existingUser = await User.findOne({ clerkId: user.id });

        if (!existingUser) {
            const newUser = new User({
                clerkId: user.id,
                email: user.emailAddresses[0].emailAddress,
                fullName: user.firstName + " " + user.lastName,
            });

            await newUser.save();
        }

        res.status(200).json({ message: "User synced" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}
