import mongoose, { Document, ObjectId, Schema } from 'mongoose';
import { CommentInterface } from './Comment';

export interface PostInterface extends Document {
    _id: ObjectId;
    title: string;
    slug: string;
    description: string;
    excerpt: string;
    published_at: Date;
    views_count: number;
    read_time: number;
    media_url: string;
    is_active: boolean;
    comments: CommentInterface[];
}

const PostSchema: Schema = new Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    published_at: { type: Date },
    views_count: { type: Number, default: 0 },
    read_time: { type: Number, required: true },
    media_url: { type: String, required: true },
    is_active: { type: Boolean, default: false },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
},{timestamps: true});

export default mongoose.model<PostInterface>('Post', PostSchema);
