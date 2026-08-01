import mongoose from 'mongoose';
import { logger } from './logger';

export interface ICertificateCounter {
  _id: string;
  seq: number;
  year: number;
  category: string;
}

const counterSchema = new mongoose.Schema<ICertificateCounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
  year: { type: Number, required: true },
  category: { type: String, required: true },
});

export const CertificateCounter = mongoose.model<ICertificateCounter>('CertificateCounter', counterSchema);

const CATEGORY_MAP: Record<string, string> = {
  development: 'CS',
  design: 'DS',
  business: 'BS',
  marketing: 'MK',
  music: 'MU',
  lifestyle: 'LS',
  photography: 'PH',
  health: 'HF',
  teaching: 'TE',
  it: 'IT',
  other: 'OT',
};

function mapCategory(categoryName: string): string {
  const cat = categoryName?.toLowerCase() || 'other';
  for (const [key, code] of Object.entries(CATEGORY_MAP)) {
    if (cat.includes(key)) return code;
  }
  return 'OT';
}

export async function generateCertificateId(categoryName: string): Promise<string> {
  const year = new Date().getFullYear();
  const category = mapCategory(categoryName);

  const counter = await CertificateCounter.findByIdAndUpdate(
    `cert_${year}_${category}`,
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const seq = String(counter.seq).padStart(6, '0');
  const certId = `NXLMS-${year}-${category}-${seq}`;

  logger.info('Certificate ID generated', { certId, year, category, seq });
  return certId;
}
