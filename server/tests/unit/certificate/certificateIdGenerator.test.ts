import { generateCertificateId, CertificateCounter } from '../../../src/utils/certificateIdGenerator';

describe('generateCertificateId', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates a zero-padded sequence id for a known category', async () => {
    vi.spyOn(CertificateCounter, 'findByIdAndUpdate').mockResolvedValue({
      _id: 'cert_2026_CS',
      seq: 12,
      year: 2026,
      category: 'CS',
    } as never);

    const id = await generateCertificateId('Development');
    const year = new Date().getFullYear();
    expect(id).toBe(`NXLMS-${year}-CS-000012`);
  });

  it('falls back to OT for unknown categories', async () => {
    vi.spyOn(CertificateCounter, 'findByIdAndUpdate').mockResolvedValue({
      _id: 'cert_2026_OT',
      seq: 1,
      year: 2026,
      category: 'OT',
    } as never);

    const id = await generateCertificateId('Quantum Physics');
    const year = new Date().getFullYear();
    expect(id).toBe(`NXLMS-${year}-OT-000001`);
  });

  it('maps partial category names', async () => {
    vi.spyOn(CertificateCounter, 'findByIdAndUpdate').mockResolvedValue({
      _id: 'cert_2026_IT',
      seq: 7,
      year: 2026,
      category: 'IT',
    } as never);

    const id = await generateCertificateId('IT Services');
    const year = new Date().getFullYear();
    expect(id).toBe(`NXLMS-${year}-IT-000007`);
  });

  it('increments the counter with upsert options', async () => {
    const spy = vi.spyOn(CertificateCounter, 'findByIdAndUpdate').mockResolvedValue({
      _id: 'cert_2026_MK',
      seq: 3,
      year: 2026,
      category: 'MK',
    } as never);

    await generateCertificateId('Marketing');
    const year = new Date().getFullYear();
    expect(spy).toHaveBeenCalledWith(
      `cert_${year}_MK`,
      { $inc: { seq: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  });

  it('pads sequences below 6 digits', async () => {
    vi.spyOn(CertificateCounter, 'findByIdAndUpdate').mockResolvedValue({
      _id: 'cert_2026_BS',
      seq: 42,
      year: 2026,
      category: 'BS',
    } as never);

    const id = await generateCertificateId('Business');
    const year = new Date().getFullYear();
    expect(id).toBe(`NXLMS-${year}-BS-000042`);
  });

  it('handles undefined category names', async () => {
    vi.spyOn(CertificateCounter, 'findByIdAndUpdate').mockResolvedValue({
      _id: 'cert_2026_OT',
      seq: 9,
      year: 2026,
      category: 'OT',
    } as never);

    const id = await generateCertificateId(undefined as unknown as string);
    const year = new Date().getFullYear();
    expect(id).toBe(`NXLMS-${year}-OT-000009`);
  });
});
