import mongoose from 'mongoose';
import { liveClassService } from '../services/liveClass.service';
import { LiveClass } from '../models/liveClass.model';
import { LiveClassRecording, RECORDING_STATUS } from '../models/liveClassRecording.model';
import { WebhookEvent } from '../models/webhookEvent.model';

jest.mock('../utils/transaction', () => ({
  withTransaction: (fn: any) => fn({ __fakeSession: true }),
}));

jest.mock('../models/webhookEvent.model', () => ({
  WebhookEvent: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../models/liveClass.model', () => ({
  LiveClass: { findOne: jest.fn() },
}));

jest.mock('../models/liveClassRecording.model', () => {
  const actual = jest.requireActual('../models/liveClassRecording.model');
  return {
    ...actual,
    LiveClassRecording: {
      findOne: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };
});

const liveClassId = new mongoose.Types.ObjectId();
const courseId = new mongoose.Types.ObjectId();
const instructorId = new mongoose.Types.ObjectId();

const liveClassDoc = {
  _id: liveClassId,
  course: courseId,
  instructor: instructorId,
  title: 'Physics Class',
  topic: 'Mechanics',
  zoomPassword: 'pwd123',
  zoomMeetingId: '99123',
};

function recordingReadyPayload() {
  return {
    event: 'recording.ready',
    event_id: 'evt_ready_1',
    payload: {
      object: {
        id: 'uuid-abc',
        uuid: 'uuid-abc',
        host_id: 'host-1',
        topic: 'Physics Class',
        start_time: '2026-08-01T10:00:00Z',
        duration: 60,
        password: 'pwd123',
        recording_files: [
          {
            id: 'rec-1',
            meeting_id: '99123',
            recording_start: '2026-08-01T10:00:00Z',
            recording_end: '2026-08-01T10:45:00Z',
            file_type: 'MP4',
            file_size: 123456,
            play_url: 'https://zoom.us/rec/play/1',
            download_url: 'https://zoom.us/rec/download/1',
            status: 'completed',
          },
        ],
      },
    },
  };
}

function recordingDeletedPayload() {
  return {
    event: 'recording.deleted',
    event_id: 'evt_delete_1',
    payload: {
      object: {
        id: 'uuid-abc',
        recording_files: [{ id: 'rec-1', meeting_id: '99123' }],
      },
    },
  };
}

const liveClassFindOne = LiveClass.findOne as jest.Mock;
const webhookFindOne = WebhookEvent.findOne as jest.Mock;
const webhookCreate = WebhookEvent.create as jest.Mock;
const recordingFindOne = LiveClassRecording.findOne as jest.Mock;
const recordingCreate = LiveClassRecording.create as jest.Mock;
const recordingUpdateMany = LiveClassRecording.updateMany as jest.Mock;

function queryMock(value: any) {
  return { session: jest.fn().mockResolvedValue(value) };
}

beforeEach(() => {
  jest.clearAllMocks();
  liveClassFindOne.mockReturnValue(queryMock(liveClassDoc));
  webhookFindOne.mockReturnValue(queryMock(null));
  webhookCreate.mockResolvedValue([{}]);
  recordingFindOne.mockReturnValue(queryMock(null));
  recordingCreate.mockResolvedValue([{ _id: new mongoose.Types.ObjectId(), zoomRecordingId: 'rec-1' }]);
  recordingUpdateMany.mockResolvedValue({ modifiedCount: 1 });
});

describe('liveClassService.handleZoomRecordingWebhook', () => {
  it('returns an encrypted token for endpoint.url_validation', async () => {
    process.env.ZOOM_WEBHOOK_SECRET = 'test-secret';
    const payload = { event: 'endpoint.url_validation', payload: { plainToken: 'plain-token' } };
    const result: any = await liveClassService.handleZoomRecordingWebhook(payload);
    expect(result.encryptedToken).toBeTruthy();
    expect(webhookFindOne).not.toHaveBeenCalled();
  });

  it('returns received for an ignored event without touching the database', async () => {
    const payload = { event: 'meeting.started', event_id: 'evt_x', payload: { object: { id: '1' } } };
    const result: any = await liveClassService.handleZoomRecordingWebhook(payload);
    expect(result.received).toBe(true);
    expect(webhookFindOne).not.toHaveBeenCalled();
  });

  it('returns received without event_id', async () => {
    const payload: any = recordingReadyPayload();
    delete payload.event_id;
    const result: any = await liveClassService.handleZoomRecordingWebhook(payload);
    expect(result.received).toBe(true);
    expect(webhookFindOne).not.toHaveBeenCalled();
  });

  it('returns duplicate for a replayed event', async () => {
    webhookFindOne.mockReturnValue(queryMock({ eventId: 'evt_ready_1' }));
    const result: any = await liveClassService.handleZoomRecordingWebhook(recordingReadyPayload());
    expect(result.duplicate).toBe(true);
    expect(webhookCreate).not.toHaveBeenCalled();
  });

  it('returns noClass when no live class matches the meeting id', async () => {
    liveClassFindOne.mockReturnValue(queryMock(null));
    const result: any = await liveClassService.handleZoomRecordingWebhook(recordingReadyPayload());
    expect(result.noClass).toBe(true);
    expect(recordingCreate).not.toHaveBeenCalled();
  });

  it('creates a recording for recording.ready', async () => {
    const result: any = await liveClassService.handleZoomRecordingWebhook(recordingReadyPayload());
    expect(result.processed).toBe(true);
    expect(result.recordings).toBe(1);
    expect(webhookCreate).toHaveBeenCalled();
    expect(recordingCreate).toHaveBeenCalled();
    const created = recordingCreate.mock.calls[0][0][0];
    expect(created.zoomRecordingId).toBe('rec-1');
    expect(created.meetingId).toBe('uuid-abc');
    expect(created.hostId).toBe('host-1');
    expect(created.status).toBe(RECORDING_STATUS.COMPLETED);
    expect(created.playUrl).toBe('https://zoom.us/rec/play/1');
    expect(created.downloadUrl).toBe('https://zoom.us/rec/download/1');
    expect(created.duration).toBe(45);
  });

  it('updates an existing recording instead of duplicating', async () => {
    const existing = {
      status: RECORDING_STATUS.COMPLETED,
      save: jest.fn().mockResolvedValue({}),
    };
    recordingFindOne.mockReturnValue(queryMock(existing));
    const result: any = await liveClassService.handleZoomRecordingWebhook(recordingReadyPayload());
    expect(result.processed).toBe(true);
    expect(recordingCreate).not.toHaveBeenCalled();
    expect(existing.save).toHaveBeenCalled();
  });

  it('marks recordings as deleted for recording.deleted', async () => {
    const result: any = await liveClassService.handleZoomRecordingWebhook(recordingDeletedPayload());
    expect(result.deleted).toBe(1);
    expect(recordingUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: expect.arrayContaining([
          { zoomRecordingId: { $in: ['rec-1'] } },
          { meetingId: { $in: ['uuid-abc', '99123'] } },
        ]),
      }),
      { status: RECORDING_STATUS.DELETED },
      { session: expect.anything() }
    );
  });

  it('skips recording files that are not completed', async () => {
    const payload: any = recordingReadyPayload();
    payload.payload.object.recording_files[0].status = 'processing';
    recordingFindOne.mockReturnValue(queryMock(null));
    const result: any = await liveClassService.handleZoomRecordingWebhook(payload);
    expect(recordingCreate).not.toHaveBeenCalled();
    expect(result.processed).toBe(true);
    expect(result.recordings).toBe(0);
  });
});
