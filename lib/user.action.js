"use server";

import { connectDB } from "./dbConfig";
import User from "@/models/userModels"

export async function createUser(user) {
    try {
        await connectDB();
        const newUser = await User.create(user);
        return JSON.parse(JSON.stringify(newUser));
    } catch (error) {
        console.log(error);
    }
}