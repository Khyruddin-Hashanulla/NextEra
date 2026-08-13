import {
  createLiveClassSchema,
  updateLiveClassSchema,
  addRecordingSchema,
  syncRecordingSchema,
  recordingParamsSchema,
  recordingsQuerySchema,
} from '../../../src/validators/liveClass.validator';

describe('liveClass.validator', () => {
  it('validates live class creation with defaults', () => {
    const valid = {
      body: {
        course: 'c1',
        title: 'Intro',
        description: 'd',
        topic: 't',
        agenda: 'a',
        startTime: '2026-01-01T10:00:00Z',
        duration: 60,
        timezone: 'Asia/Kolkata',
        meetingProvider: 'zoom',
        password: 'pw',
        settings: {
          muteOnEntry: true,
          approvalType: 'automatic',
          waitingRoom: false,
          qa: true,
          chat: true,
          allowRecording: false,
        },
        notifyStudents: true,
        recording: { autoRecord: true },
      },
    };
    const parsed = createLiveClassSchema.parse(valid);
    expect(parsed.body.duration).toBe(60);
    expect(parsed.body.settings.muteOnEntry).toBe(true);
    expect(() =>
      createLiveClassSchema.parse({ body: { course: '', title: '', startTime: '', duration: 0 } })
    ).toThrow();
  });

  it('applies live class defaults', () => {
    const parsed = createLiveClassSchema.parse({ body: { course: 'c', title: 't', startTime: 's', duration: 30 } });
    expect(parsed.body.description).toBe('');
    expect(parsed.body.timezone).toBe('UTC');
    expect(parsed.body.meetingProvider).toBe('zoom');
    expect(parsed.body.notifyStudents).toBe(true);
  });

  it('validates live class updates', () => {
    expect(updateLiveClassSchema.parse({ body: { title: 'Updated', duration: 90 } }).body.title).toBe('Updated');
    expect(() => updateLiveClassSchema.parse({ body: { duration: 0 } })).toThrow();
  });

  it('validates recording additions', () => {
    const valid = {
      body: {
        liveClass: 'lc1',
        course: 'c1',
        title: 'Recording',
        url: 'https://example.com/rec.mp4',
        password: 'p',
        duration: 120,
        format: 'mp4',
        thumbnailUrl: 't',
      },
    };
    expect(addRecordingSchema.parse(valid).body.url).toBe('https://example.com/rec.mp4');
    expect(() =>
      addRecordingSchema.parse({ body: { liveClass: '', course: '', title: '', url: 'not-a-url' } })
    ).toThrow();
  });

  it('validates recording sync and params', () => {
    expect(syncRecordingSchema.parse({ body: { liveClassId: 'lc1' } }).body.liveClassId).toBe('lc1');
    expect(() => syncRecordingSchema.parse({ body: { liveClassId: '' } })).toThrow();
    expect(recordingParamsSchema.parse({ params: { id: 'r1' } }).params.id).toBe('r1');
    expect(() => recordingParamsSchema.parse({ params: { id: '' } })).toThrow();
  });

  it('validates recordings query', () => {
    const valid = { query: { page: '1', limit: '10', courseId: 'c', instructorId: 'i', status: 'ready', search: 's' } };
    expect(recordingsQuerySchema.parse(valid).query.page).toBe(1);
    expect(recordingsQuerySchema.parse({ query: {} }).query).toMatchObject({ page: 1, limit: 20 });
    expect(recordingsQuerySchema.parse({ query: { page: 'abc', limit: 'x' } }).query).toMatchObject({
      page: 1,
      limit: 20,
    });
  });
});
