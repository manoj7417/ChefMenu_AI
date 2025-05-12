"use server";

import User from "@/lib/modals/user.modal";
import { connectDB } from "./dbConfig";

export async function createUser(user) {
    try {
        await connectDB();
        const newUser = await User.create(user);
        return JSON.parse(JSON.stringify(newUser));
    } catch (error) {
        console.log(error);
    }
}