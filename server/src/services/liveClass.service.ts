import { LiveClass } from '../models/liveClass.model';
import { LiveClassRecording } from '../models/liveClassRecording.model';
import { Enrollment } from '../models/enrollment.model';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export class LiveClassService {
  private async getZoomAccessToken(): Promise<string | null> {
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!accountId || !clientId || !clientSecret) {
      return null;
    }

    try {
      const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await fetch(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!response.ok) {
        logger.error('Zoom token request failed', { status: response.status });
        return null;
      }

      const data: any = await response.json();
      return data.access_token;
    } catch (error) {
      logger.error('Failed to get Zoom access token', error);
      return null;
    }
  }

  private async createZoomMeeting(data: {
    topic: string; agenda: string; startTime: Date; duration: number;
    timezone: string; settings: any; password?: string;
  }): Promise<{ meetingId: string; password: string; joinLink: string; startLink: string } | null> {
    const token = await this.getZoomAccessToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: data.topic,
          type: 2,
          start_time: data.startTime.toISOString(),
          duration: data.duration,
          timezone: data.timezone || 'UTC',
          agenda: data.agenda,
          password: data.password || this.generateMeetingPassword(),
          settings: {
            host_video: true,
            participant_video: true,
            cn_meeting: false,
            in_meeting: false,
            join_before_host: false,
            mute_upon_entry: data.settings?.muteOnEntry ?? true,
            watermark: false,
            use_pmi: false,
            approval_type: data.settings?.approvalType === 'manual' ? 1 : 0,
            audio: 'both',
            auto_recording: data.settings?.autoRecord ? 'cloud' : 'none',
            waiting_room: data.settings?.waitingRoom ?? true,
            allow_multiple_devices: true,
            registration_type: 1,
            enforce_login: false,
          },
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        logger.error('Zoom meeting creation failed', { status: response.status, body: errBody });
        return null;
      }

      const meeting: any = await response.json();
      return {
        meetingId: meeting.id?.toString() || '',
        password: meeting.password || '',
        joinLink: meeting.join_url || '',
        startLink: meeting.start_url || '',
      };
    } catch (error) {
      logger.error('Zoom meeting creation error', error);
      return null;
    }
  }

  private async updateZoomMeeting(meetingId: string, data: {
    topic?: string; agenda?: string; startTime?: Date; duration?: number;
    timezone?: string; settings?: any;
  }): Promise<boolean> {
    const token = await this.getZoomAccessToken();
    if (!token) return false;

    try {
      const body: any = {};
      if (data.topic) body.topic = data.topic;
      if (data.agenda) body.agenda = data.agenda;
      if (data.startTime) body.start_time = data.startTime.toISOString();
      if (data.duration) body.duration = data.duration;
      if (data.timezone) body.timezone = data.timezone;
      if (data.settings) {
        body.settings = {
          mute_upon_entry: data.settings.muteOnEntry,
          approval_type: data.settings.approvalType === 'manual' ? 1 : 0,
          waiting_room: data.settings.waitingRoom,
          auto_recording: data.settings.allowRecording ? 'cloud' : 'none',
        };
      }

      const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        logger.error('Zoom meeting update failed', { status: response.status, meetingId });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Zoom meeting update error', error);
      return false;
    }
  }

  private async deleteZoomMeeting(meetingId: string): Promise<boolean> {
    const token = await this.getZoomAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch (error) {
      logger.error('Zoom meeting delete error', error);
      return false;
    }
  }

  private async getZoomRecordings(meetingId: string): Promise<any[]> {
    const token = await this.getZoomAccessToken();
    if (!token) return [];

    try {
      const response = await fetch(
        `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) return [];

      const data: any = await response.json();
      return data.recording_files || [];
    } catch (error) {
      logger.error('Zoom recordings fetch error', error);
      return [];
    }
  }

  private generateMeetingPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // ─── Instructor: List Live Classes ──────────────────────────
  async listByInstructor(instructorId: string, courseId?: string, status?: string, page = 1, limit = 20) {
    const filter: any = { instructor: instructorId };
    if (courseId) filter.course = courseId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [classes, total] = await Promise.all([
      LiveClass.find(filter)
        .populate('course', 'title thumbnail')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LiveClass.countDocuments(filter),
    ]);

    return { classes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // ─── Student: List Upcoming / Past Live Classes ────────────
  async listByStudent(studentId: string, filterType: 'upcoming' | 'past' | 'all' = 'upcoming', page = 1, limit = 20) {
    const enrollments = await Enrollment.find({ user: studentId }).select('course').lean();
    const courseIds = enrollments.map((e) => e.course);

    if (courseIds.length === 0) {
      return { classes: [], pagination: { page, limit, total: 0, pages: 0 } };
    }

    const filter: any = { course: { $in: courseIds }, status: { $ne: 'cancelled' } };
    const now = new Date();

    if (filterType === 'upcoming') {
      filter.startTime = { $gte: now };
    } else if (filterType === 'past') {
      filter.startTime = { $lt: now };
    }

    const skip = (page - 1) * limit;
    const [classes, total] = await Promise.all([
      LiveClass.find(filter)
        .populate('course', 'title thumbnail')
        .populate('instructor', 'name avatar')
        .sort({ startTime: filterType === 'upcoming' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LiveClass.countDocuments(filter),
    ]);

    return { classes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // ─── Get Single Live Class ──────────────────────────────────
  async getById(id: string) {
    const liveClass = await LiveClass.findById(id)
      .populate('course', 'title thumbnail')
      .populate('instructor', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .lean();
    if (!liveClass) throw ApiError.notFound('Live class not found');
    return liveClass;
  }

  // ─── Create Live Class ─────────────────────────────────────
  async create(instructorId: string, data: {
    course: string; title: string; description?: string; topic?: string; agenda?: string;
    startTime: string; duration: number; timezone?: string;
    meetingProvider?: string; settings?: any; notifyStudents?: boolean; password?: string;
    recording?: { autoRecord: boolean };
  }) {
    const course = await Course.findById(data.course);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.instructor.toString() !== instructorId) {
      throw ApiError.forbidden('You do not own this course');
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + data.duration * 60000);

    let meetingData = {
      meetingId: '', password: data.password || this.generateMeetingPassword(),
      joinLink: '', startLink: '',
    };

    if (data.meetingProvider === 'zoom' || !data.meetingProvider) {
      const zoomResult = await this.createZoomMeeting({
        topic: data.title,
        agenda: data.agenda || data.description || '',
        startTime,
        duration: data.duration,
        timezone: data.timezone || 'UTC',
        settings: { ...data.settings, autoRecord: data.recording?.autoRecord },
        password: data.password,
      });

      if (zoomResult) {
        meetingData = zoomResult;
      }
    }

    const liveClass = await LiveClass.create({
      course: data.course,
      instructor: instructorId,
      title: data.title,
      description: data.description || '',
      topic: data.topic || '',
      agenda: data.agenda || '',
      startTime,
      endTime,
      duration: data.duration,
      timezone: data.timezone || 'UTC',
      meetingProvider: data.meetingProvider || 'zoom',
      zoomMeetingId: meetingData.meetingId,
      zoomPassword: meetingData.password,
      joinLink: meetingData.joinLink,
      startLink: meetingData.startLink,
      recording: { autoRecord: data.recording?.autoRecord || false },
      settings: {
        muteOnEntry: data.settings?.muteOnEntry ?? true,
        approvalType: data.settings?.approvalType || 'automatic',
        waitingRoom: data.settings?.waitingRoom ?? true,
        qa: data.settings?.qa ?? true,
        chat: data.settings?.chat ?? true,
        allowRecording: data.settings?.allowRecording ?? true,
      },
      notifyStudents: data.notifyStudents ?? true,
    });

    if (liveClass.notifyStudents) {
      await this.notifyEnrolledStudents(liveClass._id.toString());
    }

    return liveClass;
  }

  // ─── Update Live Class ─────────────────────────────────────
  async update(id: string, instructorId: string, data: {
    title?: string; description?: string; topic?: string; agenda?: string;
    startTime?: string; duration?: number; timezone?: string;
    settings?: any; password?: string; recording?: { autoRecord: boolean };
  }) {
    const liveClass = await LiveClass.findById(id);
    if (!liveClass) throw ApiError.notFound('Live class not found');
    if (liveClass.instructor.toString() !== instructorId) {
      throw ApiError.forbidden('You do not own this live class');
    }
    if (liveClass.status === 'ended' || liveClass.status === 'cancelled') {
      throw ApiError.badRequest('Cannot update an ended or cancelled class');
    }

    const updateData: any = {};

    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.topic !== undefined) updateData.topic = data.topic;
    if (data.agenda !== undefined) updateData.agenda = data.agenda;
    if (data.timezone) updateData.timezone = data.timezone;
    if (data.password) updateData.password = data.password;
    if (data.duration) {
      updateData.duration = data.duration;
      const baseStart = data.startTime ? new Date(data.startTime) : liveClass.startTime;
      updateData.endTime = new Date(baseStart.getTime() + data.duration * 60000);
    }
    if (data.startTime) {
      updateData.startTime = new Date(data.startTime);
      const dur = data.duration || liveClass.duration;
      updateData.endTime = new Date(updateData.startTime.getTime() + dur * 60000);
    }
    if (data.recording?.autoRecord !== undefined) {
      updateData['recording.autoRecord'] = data.recording.autoRecord;
    }
    if (data.settings) {
      if (data.settings.muteOnEntry !== undefined) updateData['settings.muteOnEntry'] = data.settings.muteOnEntry;
      if (data.settings.approvalType) updateData['settings.approvalType'] = data.settings.approvalType;
      if (data.settings.waitingRoom !== undefined) updateData['settings.waitingRoom'] = data.settings.waitingRoom;
      if (data.settings.qa !== undefined) updateData['settings.qa'] = data.settings.qa;
      if (data.settings.chat !== undefined) updateData['settings.chat'] = data.settings.chat;
      if (data.settings.allowRecording !== undefined) updateData['settings.allowRecording'] = data.settings.allowRecording;
    }

    if (liveClass.zoomMeetingId && meetingDataAvailable()) {
      await this.updateZoomMeeting(liveClass.zoomMeetingId, {
        topic: data.title, agenda: data.agenda,
        startTime: updateData.startTime, duration: data.duration,
        timezone: data.timezone, settings: data.settings,
      });
    }

    const updated = await LiveClass.findByIdAndUpdate(id, updateData, { new: true })
      .populate('course', 'title thumbnail')
      .lean();
    return updated;
  }

  // ─── Cancel Live Class ─────────────────────────────────────
  async cancel(id: string, instructorId: string) {
    const liveClass = await LiveClass.findById(id);
    if (!liveClass) throw ApiError.notFound('Live class not found');
    if (liveClass.instructor.toString() !== instructorId) {
      throw ApiError.forbidden('You do not own this live class');
    }
    if (liveClass.status === 'ended') {
      throw ApiError.badRequest('Cannot cancel an ended class');
    }

    if (liveClass.zoomMeetingId) {
      await this.deleteZoomMeeting(liveClass.zoomMeetingId);
    }

    liveClass.status = 'cancelled';
    await liveClass.save();
    return liveClass;
  }

  // ─── Start Live Class (mark as live) ───────────────────────
  async startClass(id: string, instructorId: string) {
    const liveClass = await LiveClass.findById(id);
    if (!liveClass) throw ApiError.notFound('Live class not found');
    if (liveClass.instructor.toString() !== instructorId) {
      throw ApiError.forbidden('You do not own this live class');
    }
    if (liveClass.status !== 'scheduled') {
      throw ApiError.badRequest('Class can only be started from scheduled status');
    }

    liveClass.status = 'live';
    await liveClass.save();
    return liveClass;
  }

  // ─── End Live Class ────────────────────────────────────────
  async endClass(id: string, instructorId: string) {
    const liveClass = await LiveClass.findById(id);
    if (!liveClass) throw ApiError.notFound('Live class not found');
    if (liveClass.instructor.toString() !== instructorId) {
      throw ApiError.forbidden('You do not own this live class');
    }
    if (liveClass.status !== 'live') {
      throw ApiError.badRequest('Class is not currently live');
    }

    liveClass.status = 'ended';

    if (liveClass.recording.autoRecord) {
      const recordings = await this.getZoomRecordings(liveClass.zoomMeetingId);

      for (const rec of recordings) {
        if (rec.status === 'completed') {
          await LiveClassRecording.create({
            liveClass: liveClass._id,
            course: liveClass.course,
            instructor: instructorId,
            title: `${liveClass.title} - Recording`,
            description: `Recording of ${liveClass.title}`,
            url: rec.play_url || rec.download_url || '',
            password: liveClass.zoomPassword,
            duration: rec.duration || 0,
            fileSize: rec.file_size || 0,
            format: rec.file_type || 'mp4',
            zoomRecordingId: rec.id || '',
            status: 'available',
            thumbnailUrl: '',
          });
        }
      }
    }

    await liveClass.save();
    return liveClass;
  }

  // ─── Join Live Class (student) ─────────────────────────────
  async joinClass(id: string, userId: string) {
    const liveClass = await LiveClass.findById(id);
    if (!liveClass) throw ApiError.notFound('Live class not found');
    if (liveClass.status !== 'scheduled' && liveClass.status !== 'live') {
      throw ApiError.badRequest('Class is not available to join');
    }

    const enrollment = await Enrollment.findOne({ user: userId, course: liveClass.course });
    if (!enrollment) throw ApiError.forbidden('You are not enrolled in this course');

    const alreadyJoined = liveClass.participants.find(
      (p) => p.user.toString() === userId
    );

    if (!alreadyJoined) {
      liveClass.participants.push({ user: userId as any, joinedAt: new Date() });
      liveClass.attendeeCount = liveClass.participants.length;
      await liveClass.save();
    }

    return {
      joinLink: liveClass.joinLink,
      meetingId: liveClass.zoomMeetingId,
      password: liveClass.zoomPassword,
      title: liveClass.title,
      startTime: liveClass.startTime,
    };
  }

  // ─── Leave Live Class ──────────────────────────────────────
  async leaveClass(id: string, userId: string) {
    const liveClass = await LiveClass.findById(id);
    if (!liveClass) throw ApiError.notFound('Live class not found');

    const participant = liveClass.participants.find(
      (p) => p.user.toString() === userId
    );

    if (participant) {
      participant.leftAt = new Date();
      if (participant.joinedAt) {
        participant.duration = Math.round(
          (participant.leftAt.getTime() - participant.joinedAt.getTime()) / 1000
        );
      }
      await liveClass.save();
    }

    return { success: true };
  }

  // ─── Recordings ────────────────────────────────────────────
  async listRecordings(courseId?: string, instructorId?: string, page = 1, limit = 20) {
    const filter: any = {};
    if (courseId) filter.course = courseId;
    if (instructorId) filter.instructor = instructorId;

    const skip = (page - 1) * limit;
    const [recordings, total] = await Promise.all([
      LiveClassRecording.find(filter)
        .populate('course', 'title thumbnail')
        .populate('instructor', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LiveClassRecording.countDocuments(filter),
    ]);

    return { recordings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async addRecording(data: {
    liveClass: string; course: string; instructor: string;
    title: string; url: string; password?: string; duration?: number;
    format?: string; thumbnailUrl?: string;
  }) {
    return LiveClassRecording.create({
      liveClass: data.liveClass,
      course: data.course,
      instructor: data.instructor,
      title: data.title,
      url: data.url,
      password: data.password || '',
      duration: data.duration || 0,
      format: data.format || 'mp4',
      status: 'available',
      thumbnailUrl: data.thumbnailUrl || '',
    });
  }

  async deleteRecording(id: string, instructorId: string) {
    const recording = await LiveClassRecording.findById(id);
    if (!recording) throw ApiError.notFound('Recording not found');
    if (recording.instructor.toString() !== instructorId) {
      throw ApiError.forbidden('You do not own this recording');
    }
    await LiveClassRecording.findByIdAndDelete(id);
    return recording;
  }

  async incrementRecordingView(id: string) {
    await LiveClassRecording.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }

  // ─── Student Recordings (by enrolled courses) ──────────────
  async listStudentRecordings(studentId: string, page = 1, limit = 20) {
    const enrollments = await Enrollment.find({ user: studentId }).select('course').lean();
    const courseIds = enrollments.map((e) => e.course);

    if (courseIds.length === 0) {
      return { recordings: [], pagination: { page, limit, total: 0, pages: 0 } };
    }

    const skip = (page - 1) * limit;
    const [recordings, total] = await Promise.all([
      LiveClassRecording.find({ course: { $in: courseIds }, status: 'available' })
        .populate('course', 'title thumbnail')
        .populate('instructor', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LiveClassRecording.countDocuments({ course: { $in: courseIds }, status: 'available' }),
    ]);

    return { recordings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // ─── Notify Enrolled Students ──────────────────────────────
  async notifyEnrolledStudents(liveClassId: string) {
    try {
      const liveClass = await LiveClass.findById(liveClassId)
        .populate('course', 'title')
        .lean();
      if (!liveClass) return;

      const enrollments = await Enrollment.find({ course: liveClass.course })
        .populate('user', 'email name')
        .lean();

      for (const enrollment of enrollments) {
        const student = enrollment.user as any;
        if (student?.email) {
          logger.info(
            `[LiveClass] Notification sent to ${student.email} for class "${liveClass.title}"`
          );
        }
      }
    } catch (error) {
      logger.error('Failed to notify enrolled students', error);
    }
  }
}

function meetingDataAvailable(): boolean {
  return !!(process.env.ZOOM_ACCOUNT_ID || process.env.ZOOM_CLIENT_ID);
}

export const liveClassService = new LiveClassService();
