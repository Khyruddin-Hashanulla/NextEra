import { createReminderSchema, updateReminderSchema } from '../../../src/validators/studyReminder.validator';

describe('studyReminder.validator', () => {
  it('validates reminder creation', () => {
    const valid = {
      body: {
        title: 'Study session',
        description: 'd',
        type: 'weekly',
        dayOfWeek: 2,
        time: '18:30',
        course: 'c1',
      },
    };
    expect(createReminderSchema.parse(valid).body.time).toBe('18:30');
    expect(() => createReminderSchema.parse({ body: { title: '', type: 'daily', time: '25:00' } })).toThrow();
    expect(() => createReminderSchema.parse({ body: { title: 't', type: 'bogus', time: '18:30' } })).toThrow();
  });

  it('validates reminder updates', () => {
    expect(updateReminderSchema.parse({ body: { type: 'one-time', isActive: false } }).body.isActive).toBe(false);
    expect(updateReminderSchema.parse({ body: { time: '09:00', dayOfWeek: 6 } }).body.time).toBe('09:00');
    expect(() => updateReminderSchema.parse({ body: { time: 'not-time' } })).toThrow();
  });
});
