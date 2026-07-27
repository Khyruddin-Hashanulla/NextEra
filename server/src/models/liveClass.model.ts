import mongoose, { Schema, Document } from 'mongoose';

export interface ILiveClassParticipant {
  user: mongoose.Types.ObjectId;
  joinedAt?: Date;
  leftAt?: Date;
  duration?: number;
}

export interface ILiveClass extends Document {
  course: mongoose.Types.ObjectId;
  instructor: mongoose.Types.ObjectId;
  title: string;
  description: string;
  topic: string;
  agenda: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  timezone: string;
  meetingProvider: 'zoom' | 'google_meet' | 'other';
  zoomMeetingId: string;
  zoomPassword: string;
  joinLink: string;
  startLink: string;
  recording: {
    url: string;
    password: string;
    autoRecord: boolean;
  };
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  recurringMeetingId: string;
  participants: ILiveClassParticipant[];
  attendeeCount: number;
  settings: {
    muteOnEntry: boolean;
    approvalType: 'automatic' | 'manual';
    waitingRoom: boolean;
    qa: boolean;
    chat: boolean;
    allowRecording: boolean;
  };
  notifyStudents: boolean;
  calendarEvent: {
    provider: string;
    eventId: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const liveClassSchema = new Schema<ILiveClass>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    topic: { type: String, default: '' },
    agenda: { type: String, default: '' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    timezone: { type: String, default: 'UTC' },
    meetingProvider: { type: String, enum: ['zoom', 'google_meet', 'other'], default: 'zoom' },
    zoomMeetingId: { type: String, default: '' },
    zoomPassword: { type: String, default: '' },
    joinLink: { type: String, default: '' },
    startLink: { type: String, default: '' },
    recording: {
      url: { type: String, default: '' },
      password: { type: String, default: '' },
      autoRecord: { type: Boolean, default: false },
    },
    status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled' },
    recurrence: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
    recurringMeetingId: { type: String, default: '' },
    participants: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        joinedAt: Date,
        leftAt: Date,
        duration: Number,
      },
    ],
    attendeeCount: { type: Number, default: 0 },
    settings: {
      muteOnEntry: { type: Boolean, default: true },
      approvalType: { type: String, enum: ['automatic', 'manual'], default: 'automatic' },
      waitingRoom: { type: Boolean, default: true },
      qa: { type: Boolean, default: true },
      chat: { type: Boolean, default: true },
      allowRecording: { type: Boolean, default: true },
    },
    notifyStudents: { type: Boolean, default: true },
    calendarEvent: {
      provider: { type: String, default: '' },
      eventId: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

liveClassSchema.index({ course: 1, status: 1 });
liveClassSchema.index({ instructor: 1, startTime: -1 });

export const LiveClass = mongoose.model<ILiveClass>('LiveClass', liveClassSchema);
