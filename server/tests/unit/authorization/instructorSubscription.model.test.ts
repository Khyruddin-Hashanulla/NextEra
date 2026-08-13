import mongoose from 'mongoose';
import { InstructorSubscription } from '../../../src/models/instructorSubscription.model';

describe('InstructorSubscription status canonicalization', () => {
  it('uppercases a legacy lowercase status on save', async () => {
    const doc = new InstructorSubscription({
      instructor: new mongoose.Types.ObjectId(),
      plan: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      endDate: new Date(),
      status: 'active',
    });

    await doc.validate();

    expect(doc.status).toBe('ACTIVE');
  });

  it('normalizes canceled -> CANCELLED on save', async () => {
    const doc = new InstructorSubscription({
      instructor: new mongoose.Types.ObjectId(),
      plan: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      endDate: new Date(),
      status: 'canceled',
    });

    await doc.validate();

    expect(doc.status).toBe('CANCELLED');
  });

  it('leaves an already-canonical status untouched', async () => {
    const doc = new InstructorSubscription({
      instructor: new mongoose.Types.ObjectId(),
      plan: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      endDate: new Date(),
      status: 'EXPIRED',
    });

    await doc.validate();

    expect(doc.status).toBe('EXPIRED');
  });
});
