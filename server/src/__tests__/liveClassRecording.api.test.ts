import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { ROLES } from '../constants/roles';
import { errorHandler } from '../middlewares/errorHandler.middleware';

let mockCurrentUser: { userId: string; role: string; email: string } | null = null;

jest.mock('../middlewares/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.currentUser = mockCurrentUser;
    next();
  },
  optionalAuthenticate: (req: any, _res: any, next: any) => {
    if (mockCurrentUser) req.currentUser = mockCurrentUser;
    next();
  },
}));

jest.mock('../services/audit.service', () => ({
  auditService: { log: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../models/liveClassRecording.model', () => ({
  LiveClassRecording: {
    findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
  },
  COMPLETED_RECORDING_STATUSES: ['completed', 'available'],
  RECORDING_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    DELETED: 'deleted',
  },
}));

const mockLiveClassService = {
  listByInstructor: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  cancel: jest.fn(),
  startClass: jest.fn(),
  endClass: jest.fn(),
  listRecordings: jest.fn(),
  addRecording: jest.fn(),
  deleteRecording: jest.fn(),
  syncRecordingsForClass: jest.fn(),
  getRecordingById: jest.fn(),
  listStudentRecordings: jest.fn(),
  joinClass: jest.fn(),
  leaveClass: jest.fn(),
  listByStudent: jest.fn(),
  incrementRecordingView: jest.fn(),
  handleZoomRecordingWebhook: jest.fn(),
  listAllRecordings: jest.fn(),
  deleteRecordingAsAdmin: jest.fn(),
};
jest.mock('../services/liveClass.service', () => ({
  liveClassService: mockLiveClassService,
}));

import liveClassRoutes from '../routes/liveClass.routes';
import adminRoutes from '../routes/admin.routes';
import zoomWebhookRoutes from '../routes/zoomWebhook.routes';
import { auditService } from '../services/audit.service';
import { LiveClassRecording } from '../models/liveClassRecording.model';

const STUDENT_ID = new mongoose.Types.ObjectId().toString();
const INSTRUCTOR_ID = new mongoose.Types.ObjectId().toString();
const INSTRUCTOR2_ID = new mongoose.Types.ObjectId().toString();
const LIVE_CLASS_ID = new mongoose.Types.ObjectId().toString();
const RECORDING_ID = new mongoose.Types.ObjectId().toString();

process.env.ZOOM_WEBHOOK_SECRET = 'test-webhook-secret';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/live-classes', liveClassRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use(errorHandler);
  return app;
}

function buildWebhookApp() {
  const app = express();
  app.use('/api/v1', zoomWebhookRoutes);
  app.use(errorHandler);
  return app;
}

function asUser(role: string, userId = INSTRUCTOR_ID) {
  mockCurrentUser = { userId, role, email: `${role}@test.com` };
}

function zoomSignature(rawBody: string, timestamp: string): string {
  return crypto
    .createHmac('sha256', 'test-webhook-secret')
    .update(`${timestamp}.${rawBody}`)
    .digest('base64');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = null;
  (auditService.log as jest.Mock).mockResolvedValue(undefined);
  Object.values(mockLiveClassService).forEach((fn) => (fn as jest.Mock).mockResolvedValue({}));
});

describe('Live class recordings RBAC', () => {
  it('allows instructor to list recordings', async () => {
    asUser(ROLES.INSTRUCTOR);
    mockLiveClassService.listRecordings.mockResolvedValue({ recordings: [], pagination: {} });
    const res = await request(buildApp()).get('/api/v1/live-classes/instructor/recordings');
    expect(res.status).toBe(200);
    expect(mockLiveClassService.listRecordings).toHaveBeenCalledWith(undefined, INSTRUCTOR_ID, 1, 20);
  });

  it('allows admin to list instructor recordings', async () => {
    asUser(ROLES.ADMIN);
    const res = await request(buildApp()).get('/api/v1/live-classes/instructor/recordings');
    expect(res.status).toBe(200);
  });

  it('rejects student listing instructor recordings with 403', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    const res = await request(buildApp()).get('/api/v1/live-classes/instructor/recordings');
    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated request with 401', async () => {
    mockCurrentUser = null;
    const res = await request(buildApp()).get('/api/v1/live-classes/instructor/recordings');
    expect(res.status).toBe(401);
  });

  it('allows instructor to sync own live class recordings', async () => {
    asUser(ROLES.INSTRUCTOR);
    mockLiveClassService.syncRecordingsForClass.mockResolvedValue({ liveClassId: LIVE_CLASS_ID, recordings: [] });
    const res = await request(buildApp())
      .post('/api/v1/live-classes/instructor/recordings/sync')
      .send({ liveClassId: LIVE_CLASS_ID });
    expect(res.status).toBe(200);
    expect(mockLiveClassService.syncRecordingsForClass).toHaveBeenCalledWith(LIVE_CLASS_ID, INSTRUCTOR_ID);
  });

  it('rejects sync without a liveClassId with 400', async () => {
    asUser(ROLES.INSTRUCTOR);
    const res = await request(buildApp())
      .post('/api/v1/live-classes/instructor/recordings/sync')
      .send({});
    expect(res.status).toBe(400);
  });

  it('allows instructor to fetch own recording by id', async () => {
    asUser(ROLES.INSTRUCTOR);
    mockLiveClassService.getRecordingById.mockResolvedValue({ _id: RECORDING_ID });
    const res = await request(buildApp()).get(`/api/v1/live-classes/instructor/recordings/${RECORDING_ID}`);
    expect(res.status).toBe(200);
    expect(mockLiveClassService.getRecordingById).toHaveBeenCalledWith(RECORDING_ID, INSTRUCTOR_ID);
  });

  it('allows student to list recordings for an enrolled course', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    mockLiveClassService.listStudentRecordings.mockResolvedValue({ recordings: [], pagination: {} });
    const res = await request(buildApp())
      .get('/api/v1/live-classes/student/recordings')
      .query({ courseId: new mongoose.Types.ObjectId().toString() });
    expect(res.status).toBe(200);
  });

  it('allows admin to list all recordings', async () => {
    asUser(ROLES.ADMIN);
    mockLiveClassService.listAllRecordings.mockResolvedValue({ recordings: [], pagination: {} });
    const res = await request(buildApp()).get('/api/v1/admin/recordings');
    expect(res.status).toBe(200);
    expect(mockLiveClassService.listAllRecordings).toHaveBeenCalled();
  });

  it('rejects student from admin recordings with 403', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    const res = await request(buildApp()).get('/api/v1/admin/recordings');
    expect(res.status).toBe(403);
  });

  it('allows admin to delete a recording', async () => {
    asUser(ROLES.ADMIN);
    mockLiveClassService.deleteRecordingAsAdmin.mockResolvedValue({ _id: RECORDING_ID });
    const res = await request(buildApp()).delete(`/api/v1/admin/recordings/${RECORDING_ID}`);
    expect(res.status).toBe(200);
    expect(mockLiveClassService.deleteRecordingAsAdmin).toHaveBeenCalledWith(RECORDING_ID);
  });

  it('allows admin to get a recording by id', async () => {
    asUser(ROLES.ADMIN);
    mockLiveClassService.getRecordingById.mockResolvedValue({ _id: RECORDING_ID });
    const res = await request(buildApp()).get(`/api/v1/admin/recordings/${RECORDING_ID}`);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/v1/live-classes/webhook/zoom', () => {
  const payload = {
    event: 'recording.ready',
    event_id: 'evt_api_1',
    payload: { object: { id: 'uuid-1', recording_files: [{ id: 'rec-1', meeting_id: '99123' }] } },
  };
  const rawBody = JSON.stringify(payload);

  it('accepts a request with a valid signature', async () => {
    const timestamp = String(Date.now());
    const signature = zoomSignature(rawBody, timestamp);
    mockLiveClassService.handleZoomRecordingWebhook.mockResolvedValue({ received: true, processed: true });
    const res = await request(buildWebhookApp())
      .post('/api/v1/live-classes/webhook/zoom')
      .set('Content-Type', 'application/json')
      .set('x-zm-signature', signature)
      .set('x-zm-request-timestamp', timestamp)
      .send(rawBody);
    expect(res.status).toBe(200);
    expect(mockLiveClassService.handleZoomRecordingWebhook).toHaveBeenCalledTimes(1);
  });

  it('rejects a request with an invalid signature with 401', async () => {
    const timestamp = String(Date.now());
    const signature = crypto
      .createHmac('sha256', 'wrong-secret')
      .update(`${timestamp}.${rawBody}`)
      .digest('base64');
    const res = await request(buildWebhookApp())
      .post('/api/v1/live-classes/webhook/zoom')
      .set('Content-Type', 'application/json')
      .set('x-zm-signature', signature)
      .set('x-zm-request-timestamp', timestamp)
      .send(rawBody);
    expect(res.status).toBe(401);
    expect(mockLiveClassService.handleZoomRecordingWebhook).not.toHaveBeenCalled();
  });

  it('rejects a request with a missing signature with 401', async () => {
    const res = await request(buildWebhookApp())
      .post('/api/v1/live-classes/webhook/zoom')
      .set('Content-Type', 'application/json')
      .send(rawBody);
    expect(res.status).toBe(401);
  });

  it('rejects a replayed request with a stale timestamp with 401', async () => {
    const timestamp = String(Date.now() - 10 * 60 * 1000);
    const signature = zoomSignature(rawBody, timestamp);
    const res = await request(buildWebhookApp())
      .post('/api/v1/live-classes/webhook/zoom')
      .set('Content-Type', 'application/json')
      .set('x-zm-signature', signature)
      .set('x-zm-request-timestamp', timestamp)
      .send(rawBody);
    expect(res.status).toBe(401);
  });

  it('handles endpoint.url_validation with a valid signature', async () => {
    const vPayload = { event: 'endpoint.url_validation', payload: { plainToken: 'plain-token' } };
    const vRaw = JSON.stringify(vPayload);
    const timestamp = String(Date.now());
    const signature = zoomSignature(vRaw, timestamp);
    mockLiveClassService.handleZoomRecordingWebhook.mockResolvedValue({ encryptedToken: 'encrypted-token' });
    const res = await request(buildWebhookApp())
      .post('/api/v1/live-classes/webhook/zoom')
      .set('Content-Type', 'application/json')
      .set('x-zm-signature', signature)
      .set('x-zm-request-timestamp', timestamp)
      .send(vRaw);
    expect(res.status).toBe(200);
    expect(res.body.encryptedToken).toBe('encrypted-token');
  });
});
