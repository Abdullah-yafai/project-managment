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

const CommentSchema = new Schema({
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    attachments: { type: [AttachmentSchema], default: [] },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    edited: { type: Boolean, default: false },
    editeddAt: { type: Date, default: null },

    timeEstimatedMinutes: { type: Number, default: 0 }, // minutes
    timeSpentMinutes: { type: Number, default: 0 },
}, { timestamps: true });


CommentSchema.index({ task: 1, createdAt: -1 });
CommentSchema.index({ author: 1, createdAt: -1 });


// helper funcion for create with count increment automatically using transaction

CommentSchema.statics.createWithIncrement = async function (Data) {
    const session = await this.db.startSession();
    session.startTransaction();
    try {
        const Comments = this;
        const created = await Comments.create([Data], { session });

        const Task = this.db.model("Task");
        await Task.findByIdAndUpdate(Data.task, { $inc: { commentsCount: 1 } }, { session });

        await session.commitTransaction();
        session.endSession();

        return created[0];
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        throw error;
    }
}

CommentSchema.statics.softDelete = async function (commentId, opts = {}) {
    const session = await this.db.startSession();
    session.startTransaction();
    try {
        const Comments = this;
        const comment = await Comments.findById(commentId).session(session);

        if (!comment) throw new Error("Comment not found");

        if (comment.isDeleted) {
            await session.abortTransaction();
            session.endSession();
            return comment;
        }

        comment.isDeleted = true;
        comment.deletedAt = new Date();
        await comment.save({session})

        const Task = this.db.model("Task");
        await Task.findByIdAndUpdate(Data.task, { $inc: { commentsCount: -1 } }, { session });

        await session.commitTransaction();
        session.endSession();

        return comment;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        throw error;
    }
}
export const Comment = model("Comment", CommentSchema)