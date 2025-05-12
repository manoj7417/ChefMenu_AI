// import mongoose from "mongoose";

// const appointmentSchema = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true, 
//     },
//     name: String,
//     preferredDate: String,
//     symptoms: String,
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     },
// });

// const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);

// export default Appointment;




import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    clerkUserId: {
        type: String,
        required: [true, 'Clerk User ID is required'],
    },
    name: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true
    },
    preferredDate: {
        type: String,
        required: [true, 'Preferred date is required']
    },
    symptoms: {
        type: String,
        required: [true, 'Symptoms description is required'],
        minlength: [10, 'Symptoms should be at least 10 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    }
});

// Create index for faster queries by clerkUserId
appointmentSchema.index({ clerkUserId: 1 });

const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);

export default Appointment;