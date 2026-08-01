export interface LiveClass {
  _id: string;
  course: { _id: string; title: string; thumbnail?: { url: string } };
  instructor: { _id: string; name: string; email: string; avatar?: { url: string } };
  title: string;
  description: string;
  topic: string;
  agenda: string;
  startTime: string;
  endTime: string;
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
  participants: { user: string; joinedAt?: string; leftAt?: string; duration?: number }[];
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
  createdAt: string;
  updatedAt: string;
}

export interface LiveClassRecording {
  _id: string;
  liveClass: string;
  course: { _id: string; title: string; thumbnail?: { url: string } };
  instructor: { _id: string; name: string; avatar?: { url: string } };
  title: string;
  description: string;
  url: string;
  password: string;
  duration: number;
  fileSize: number;
  format: string;
  zoomRecordingId: string;
  meetingId: string;
  hostId: string;
  topic: string;
  playUrl: string;
  downloadUrl: string;
  recordingStart?: string;
  recordingEnd?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'deleted' | 'available';
  thumbnailUrl: string;
  views: number;
  downloadable: boolean;
  createdAt: string;
}

export interface LiveClassJoinData {
  joinLink: string;
  meetingId: string;
  password: string;
  title: string;
  startTime: string;
}
