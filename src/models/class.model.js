import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
    {
        className: {
            type: String,
            required: true,
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        studentIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

export const Class = mongoose.model("Class", classSchema);
