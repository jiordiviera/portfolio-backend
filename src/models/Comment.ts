import mongoose, { Document, ObjectId, Schema } from 'mongoose';

export interface CommentInterface extends Document {
    _id: ObjectId;
    message: string;
    pseudo: string;
}

const CommentSchema: Schema = new Schema({
    message: { type: String, required: true },
    pseudo: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<CommentInterface>('Comment', CommentSchema);
