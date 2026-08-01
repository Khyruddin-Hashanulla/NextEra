import mongoose from 'mongoose';
import crypto from 'crypto';
import { LiveClass } from '../models/liveClass.model';
import { LiveClassRecording, COMPLETED_RECORDING_STATUSES, RECORDING_STATUS } from '../models/liveClassRecording.model';
import { WebhookEvent } from '../models/webhookEvent.model';
import { Enrollment } from '../models/enrollment.model';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { withTransaction } from '../utils/transaction';
import { escapeRegex } from '../utils/escapeRegex';
import { subscriptionPermissionService } from './subscriptionPermission.service';

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

    await subscriptionPermissionService.requireLiveClassPermission(instructorId);

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

    let recordings: any[] = [];
    if (liveClass.recording.autoRecord) {
      recordings = await this.getZoomRecordings(liveClass.zoomMeetingId);
    }

    return withTransaction(async (session) => {
      liveClass.status = 'ended';
      await liveClass.save({ session });

      const completedRecordings = recordings
        .filter((rec: any) => rec.status === 'completed')
        .map((rec: any) => ({
          liveClass: liveClass._id,
          course: liveClass.course,
          instructor: instructorId,
          title: `${liveClass.title} - Recording`,
          description: `Recording of ${liveClass.title}`,
          topic: liveClass.topic || liveClass.title,
          url: rec.play_url || rec.download_url || '',
          playUrl: rec.play_url || '',
          downloadUrl: rec.download_url || '',
          password: liveClass.zoomPassword,
          duration: rec.duration || 0,
          fileSize: rec.file_size || 0,
          format: rec.file_type || 'mp4',
          zoomRecordingId: rec.id || '',
          meetingId: liveClass.zoomMeetingId,
          hostId: rec.host_id || '',
          recordingStart: rec.recording_start ? new Date(rec.recording_start) : undefined,
          recordingEnd: rec.recording_end ? new Date(rec.recording_end) : undefined,
          status: 'completed' as const,
          thumbnailUrl: '',
        }));

      if (completedRecordings.length > 0) {
        await LiveClassRecording.insertMany(completedRecordings, { session });
      }

      return liveClass;
    });
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
      status: 'completed',
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
  async listStudentRecordings(studentId: string, page = 1, limit = 20, courseId?: string) {
    const enrollments = await Enrollment.find({ user: studentId }).select('course').lean();
    const courseIds = enrollments.map((e) => e.course);

    if (courseIds.length === 0) {
      return { recordings: [], pagination: { page, limit, total: 0, pages: 0 } };
    }

    const filter: any = { status: { $in: COMPLETED_RECORDING_STATUSES } };
    if (courseId) {
      if (!courseIds.some((c) => c.toString() === courseId)) {
        return { recordings: [], pagination: { page, limit, total: 0, pages: 0 } };
      }
      filter.course = courseId;
    } else {
      filter.course = { $in: courseIds };
    }

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

  // ─── Zoom Recording Webhook (Idempotent) ───────────────────
  async handleZoomRecordingWebhook(payload: any) {
    const eventType = payload?.event || '';
    const object = payload?.payload?.object || {};

    if (eventType === 'endpoint.url_validation') {
      const plainToken = object?.plainToken || '';
      const encryptedToken = crypto
        .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET || '')
        .update(plainToken)
        .digest('base64');
      return { encryptedToken };
    }

    const eventId = payload?.event_id || payload?.eventId;
    if (!eventId) {
      logger.warn('Zoom webhook received without event_id', { event: eventType });
      return { received: true };
    }

    const isRecordingReady =
      eventType === 'recording.ready' ||
      eventType === 'recording.completed' ||
      eventType === 'recording.file.completed';
    const isRecordingDeleted =
      eventType === 'recording.deleted' || eventType === 'recording.trashed';
    const isRecordingTransition =
      eventType === 'recording.paused' ||
      eventType === 'recording.resumed' ||
      eventType === 'recording.started';

    if (!isRecordingReady && !isRecordingDeleted && !isRecordingTransition) {
      logger.info('Zoom webhook ignored', { event: eventType, eventId });
      return { received: true };
    }

    return withTransaction(async (session) => {
      const existingEvent = await WebhookEvent.findOne({ eventId }).session(session);
      if (existingEvent) {
        logger.info('Duplicate Zoom webhook', { eventId, event: eventType });
        return { received: true, duplicate: true };
      }

      await WebhookEvent.create(
        [
          {
            eventId,
            eventType,
            paymentId: '',
            orderId: '',
            payloadHash: crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
            status: 'processed',
          },
        ],
        { session }
      );

      const candidateMeetingIds = new Set<string>();
      if (object.id) candidateMeetingIds.add(String(object.id));
      if (object.uuid) candidateMeetingIds.add(String(object.uuid));
      for (const file of object?.recording_files || []) {
        if (file.meeting_id) candidateMeetingIds.add(String(file.meeting_id));
      }

      if (candidateMeetingIds.size === 0) {
        logger.warn('Zoom webhook: no meeting identifiers in payload', { eventId, event: eventType });
        return { received: true };
      }

      const liveClass = await LiveClass.findOne({ zoomMeetingId: { $in: [...candidateMeetingIds] } }).session(session);
      if (!liveClass) {
        logger.warn('Zoom webhook: no matching live class', { meetingIds: [...candidateMeetingIds], eventId });
        return { received: true, noClass: true };
      }

      if (isRecordingDeleted) {
        const fileIds = (object?.recording_files || [])
          .map((file: any) => file.id)
          .filter(Boolean);
        const result = await LiveClassRecording.updateMany(
          { $or: [{ zoomRecordingId: { $in: fileIds } }, { meetingId: { $in: [...candidateMeetingIds] } }] },
          { status: RECORDING_STATUS.DELETED },
          { session }
        );
        return { received: true, deleted: result.modifiedCount };
      }

      const files = object?.recording_files || [];
      if (isRecordingTransition || files.length === 0) {
        return { received: true };
      }

      const upserted = await this.upsertZoomRecordingFiles(liveClass, object, files, session);
      return { received: true, processed: true, recordings: upserted.length };
    });
  }

  // ─── Sync Recordings for a Live Class (Instructor/Admin) ───
  async syncRecordingsForClass(liveClassId: string, instructorId?: string) {
    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) throw ApiError.notFound('Live class not found');
    if (instructorId && liveClass.instructor.toString() !== instructorId) {
      throw ApiError.forbidden('You do not own this live class');
    }
    if (!liveClass.zoomMeetingId) {
      throw ApiError.badRequest('This live class has no Zoom meeting to sync');
    }

    const token = await this.getZoomAccessToken();
    if (!token) throw ApiError.badRequest('Zoom integration is not configured');

    const response = await fetch(
      `https://api.zoom.us/v2/meetings/${liveClass.zoomMeetingId}/recordings`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      logger.error('Zoom recordings sync failed', {
        status: response.status,
        meetingId: liveClass.zoomMeetingId,
      });
      throw ApiError.badRequest('Failed to fetch recordings from Zoom');
    }

    const data: any = await response.json();
    const files = data?.recording_files || [];

    return withTransaction(async (session) => {
      const upserted = await this.upsertZoomRecordingFiles(liveClass, data, files, session);
      return { liveClassId, recordings: upserted };
    });
  }

  private async upsertZoomRecordingFiles(
    liveClass: any,
    object: any,
    files: any[],
    session: mongoose.ClientSession
  ): Promise<any[]> {
    const results: any[] = [];

    for (const file of files) {
      if (!file.id) continue;
      if (file.status && file.status !== 'completed' && file.status !== 'available') {
        continue;
      }

      const recordingStart = file.recording_start ? new Date(file.recording_start) : undefined;
      const recordingEnd = file.recording_end ? new Date(file.recording_end) : undefined;
      const duration =
        file.duration ??
        (recordingStart && recordingEnd
          ? Math.round((recordingEnd.getTime() - recordingStart.getTime()) / 60000)
          : undefined) ??
        object.duration ??
        0;

      const data: any = {
        liveClass: liveClass._id,
        course: liveClass.course,
        instructor: liveClass.instructor,
        title: `${liveClass.title} - Recording`,
        description: `Recording of ${liveClass.title}`,
        topic: object.topic || liveClass.topic || liveClass.title,
        url: file.play_url || file.download_url || '',
        playUrl: file.play_url || '',
        downloadUrl: file.download_url || '',
        password: object.password || liveClass.zoomPassword || '',
        duration,
        fileSize: file.file_size || 0,
        format: file.file_type || 'mp4',
        zoomRecordingId: file.id,
        meetingId: object.id || file.meeting_id || liveClass.zoomMeetingId,
        hostId: object.host_id || '',
        recordingStart,
        recordingEnd,
        status:
          file.status === 'completed' || file.status === 'available'
            ? RECORDING_STATUS.COMPLETED
            : RECORDING_STATUS.PROCESSING,
        thumbnailUrl: '',
      };

      const existing = await LiveClassRecording.findOne({ zoomRecordingId: file.id }).session(session);
      if (existing) {
        if (existing.status === RECORDING_STATUS.DELETED) continue;
        Object.assign(existing, data);
        await existing.save({ session });
        results.push(existing);
        continue;
      }

      const created = await LiveClassRecording.create([data], { session });
      results.push(created[0]);
    }

    return results;
  }

  // ─── Recording Detail (Instructor/Admin) ───────────────────
  async getRecordingById(id: string, ownerId?: string) {
    const recording = await LiveClassRecording.findById(id)
      .populate('course', 'title thumbnail')
      .populate('instructor', 'name avatar email')
      .populate('liveClass', 'title topic startTime status')
      .lean();
    if (!recording) throw ApiError.notFound('Recording not found');
    if (ownerId) {
      const instructorId =
        (recording.instructor as any)?._id?.toString?.() ??
        (recording.instructor as any)?.toString?.() ??
        '';
      if (instructorId !== ownerId) {
        throw ApiError.forbidden('You do not own this recording');
      }
    }
    return recording;
  }

  // ─── Admin: List All Recordings ────────────────────────────
  async listAllRecordings(
    filters: { courseId?: string; instructorId?: string; status?: string; search?: string },
    page = 1,
    limit = 20
  ) {
    const filter: any = {};
    if (filters.courseId) filter.course = filters.courseId;
    if (filters.instructorId) filter.instructor = filters.instructorId;
    if (filters.status) filter.status = filters.status;
    if (filters.search) {
      const escaped = escapeRegex(filters.search);
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { topic: { $regex: escaped, $options: 'i' } },
        { meetingId: { $regex: escaped, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [recordings, total] = await Promise.all([
      LiveClassRecording.find(filter)
        .populate('course', 'title thumbnail')
        .populate('instructor', 'name avatar email')
        .populate('liveClass', 'title startTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LiveClassRecording.countDocuments(filter),
    ]);

    return { recordings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // ─── Admin: Delete Recording ───────────────────────────────
  async deleteRecordingAsAdmin(id: string) {
    const recording = await LiveClassRecording.findById(id);
    if (!recording) throw ApiError.notFound('Recording not found');
    await LiveClassRecording.findByIdAndDelete(id);
    return recording;
  }
}

function meetingDataAvailable(): boolean {
  return !!(process.env.ZOOM_ACCOUNT_ID || process.env.ZOOM_CLIENT_ID);
}

export const liveClassService = new LiveClassService();
