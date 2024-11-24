import mongoose, { Schema, Document } from 'mongoose';

export interface IView extends Document {
    viewable_id: mongoose.Types.ObjectId;
    viewable_type: string;
    visitor_id: string;
    viewed_at: Date;
    ip_address?: string;
    user_agent?: string;
}

const ViewSchema: Schema = new Schema({
    viewable_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'viewable_type'
    },
    viewable_type: {
        type: String,
        required: true
    },
    visitor_id: {
        type: String,
        required: true
    },
    viewed_at: {
        type: Date,
        default: Date.now
    },
    ip_address: String,
    user_agent: String
}, {
    timestamps: true
});

// Index for efficient querying
ViewSchema.index({ viewable_id: 1, viewable_type: 1, visitor_id: 1 });

export const View = mongoose.model<IView>('View', ViewSchema);
