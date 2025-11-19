import mongoose from "mongoose";

const { Schema, model } = mongoose;

const AttachmentSchema = new Schema({
    file: String,
    url: String,
    mimeType: String,
    size: Number,
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
},
    { _id: false }
)

const TaskSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: false, index: true },
    commentsCount: { type: Number, default: 0 },
    status: { type: String, enum: ["todo", "in-progress", "blocked", "done"], default: "todo", index: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
        index: true,
    },

    dueDate: { type: Date, default: null },
    attachments: { type: [AttachmentSchema], default: [] },

    tags: { type: [String], default: [] },

    timeEstimatedMinutes: { type: Number, default: 0 }, // minutes
    timeSpentMinutes: { type: Number, default: 0 },
}, { timestamps: true });


TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ assignee: 1, status: 1 });
TaskSchema.index({ project: 1, assignee: 1 });

export const Task = model("Task", TaskSchema)