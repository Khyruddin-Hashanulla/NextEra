import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITicketMessage {
  sender: Types.ObjectId;
  message: string;
  attachments?: { url: string; publicId: string; name: string }[];
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  user: Types.ObjectId;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'course' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: Types.ObjectId;
  messages: ITicketMessage[];
  order?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ticketMessageSchema = new Schema<ITicketMessage>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, maxlength: 5000 },
  attachments: [
    {
      url: { type: String, maxlength: 500 },
      publicId: { type: String, maxlength: 200 },
      name: { type: String, maxlength: 200 },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    category: {
      type: String,
      enum: ['technical', 'billing', 'course', 'account', 'other'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    messages: [ticketMessageSchema],
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
