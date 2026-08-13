import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { generateCertificatePdf } from '../../../src/utils/pdfGenerator';
import { parsePdfContent, type PdfTextRun } from '../../helpers/pdfContent';

function findRun(runs: PdfTextRun[], text: string): PdfTextRun | undefined {
  return runs.find((r) => r.text.includes(text));
}

describe('generateCertificatePdf', () => {
  const testCertId = 'NXLMS-TEST-LNG-000001';

  afterEach(() => {
    const file = path.join(__dirname, '../../..', 'uploads', 'certificates', `certificate-${testCertId}.pdf`);
    fs.rmSync(file, { force: true });
  });

  it('produces a valid A4-landscape PDF with no wrapped title/name/instructor', async () => {
    const file = await generateCertificatePdf({
      studentName: 'Ada Lovelace',
      courseTitle: 'Intro to Computer Science',
      instructorName: 'Jane Doe',
      certificateId: testCertId,
      issuedAt: new Date('2026-08-08T00:00:00.000Z'),
      courseLevel: 'beginner',
      verificationUrl: `http://localhost:5173/certificates/verify/${testCertId}`,
    });

    const pdf = fs.readFileSync(file);
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(5000);

    const c = parsePdfContent(pdf);
    expect(c.pageW).toBeCloseTo(841.89, 0);
    expect(c.pageH).toBeCloseTo(595.28, 0);

    const wants = [
      'CERTIFICATE OF',
      'ACHIEVEMENT',
      'This certificate is proudly presented to',
      'Ada Lovelace',
      'Intro to Computer Science',
      'ISSUE DATE',
      'INSTRUCTOR',
      'SCAN TO VERIFY',
      'NXLMS-TEST-LNG-000001',
    ];
    for (const w of wants) {
      expect(findRun(c.textRuns, w), `missing text run: ${w}`).toBeDefined();
    }

    // The date must render month word-full and unspaced.
    const date = c.textRuns.find((r) => /August/.test(r.text));
    expect(date?.text).toBe('August 8, 2026');

    // Bug regression: "INSTRUCTOR" previously wrapped into "INSTRUCTO"+"R".
    expect(c.textRuns.some((r) => r.text.includes('INSTRUCT')));
    expect(
      c.textRuns.find((r) => r.text.trim().toUpperCase() === 'INSTRUCTOR'),
      'INSTRUCTOR must be a single line'
    ).toBeDefined();
    expect(
      c.textRuns.some((r) => r.text === 'R'),
      'no stray wrapped R line'
    ).toBe(false);

    // Bug regression: "OF" previously wrapped on its own line beneath CERTIFICATE.
    const certRun = c.textRuns.find((r) => r.text.includes('CERTIFICATE OF'));
    expect(certRun).toBeDefined();
    expect(c.textRuns.filter((r) => r.text === 'OF')).toHaveLength(0);

    // The verification URL is only encoded in the QR; never printed as text.
    for (const r of c.textRuns) {
      expect(r.text, `URL leaked into printed text: ${r.text}`).not.toMatch(/^https?:\/\//);
    }
    // Nothing may overrun the page bounds.
    for (const r of c.textRuns) {
      expect(r.x, `text x out of bounds: ${r.text}`).toBeGreaterThanOrEqual(0 - 0.5);
      expect(r.x, `text x beyond page width: ${r.text}`).toBeLessThan(c.pageW + 0.5);
      expect(r.yTop, `text y beyond page height: ${r.text}`).toBeLessThan(c.pageH + 0.5);
    }

    // Underline sits strictly below the last name line.
    const nameRun = c.textRuns.filter((r) => r.text.includes('Ada Lovelace')).pop();
    const underline = c.hLines.find(
      (l) =>
        l.x2 - l.x1 > 100 &&
        l.x1 <= (nameRun?.x ?? 0) &&
        l.x2 >= (nameRun?.x ?? 0) + 80 &&
        l.yTop >= (nameRun?.yTop ?? 0) + 4 &&
        l.yTop <= (nameRun?.yTop ?? 0) + 40
    );
    expect(underline, 'underline must be drawn below the name baseline').toBeDefined();
  });

  it('handles long names and long course titles without throwing', async () => {
    const file = await generateCertificatePdf({
      studentName: 'Alexandrina Victoria Regina Sanctissima the First of Great Britain and Ireland',
      courseTitle:
        'Advanced Cloud-Native Microservices Architecture with Kubernetes, Observability, and Multi-Region Deployment Patterns',
      instructorName: 'Professor Veronika El-Amin Rahmanovic',
      certificateId: testCertId,
      issuedAt: new Date('2026-08-08T00:00:00.000Z'),
      courseLevel: 'Advanced',
      verificationUrl: `https://localhost:5173/certificates/verify/${testCertId}`,
    });

    const pdf = fs.readFileSync(file);
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');

    const c = parsePdfContent(pdf);

    // Long name wraps into a maximum of two centered lines that stay inside the plate.
    const nameRuns = c.textRuns.filter((r) => r.text.includes('Alexandrina') || r.text.includes('Great Britain'));
    expect(nameRuns.length).toBeGreaterThanOrEqual(1);
    for (const r of nameRuns) {
      expect(r.x, 'long name line escaped the left plate').toBeGreaterThanOrEqual(40);
      expect(r.yTop, 'long name line escaped the plate').toBeGreaterThan(100);
    }

    // Underline must still sit below the LAST name line.
    const last = [...nameRuns].sort((a, b) => b.yTop - a.yTop)[0];
    const underlineBelow = c.hLines.find(
      (l) => l.yTop - last.yTop > 4 && l.yTop - last.yTop < 50 && l.x1 <= last.x + 60 && l.x2 >= last.x + 60
    );
    expect(underlineBelow, 'underline drawn below the wrapped name').toBeDefined();

    const instructor = c.textRuns.find((r) => r.text.includes('INSTRUCTOR'));
    expect(instructor, 'INSTRUCTOR label must remain on a single line').toBeDefined();
  });

  it('embeds the verification URL only inside the QR code', async () => {
    const qrCodeData = await QRCode.toBuffer(`https://localhost:5173/certificates/verify/${testCertId}`, {
      width: 300,
      margin: 2,
      type: 'png',
    });
    const file = await generateCertificatePdf({
      studentName: 'Grace Hopper',
      courseTitle: 'Compiler Design',
      instructorName: 'Alan Turing',
      certificateId: testCertId,
      issuedAt: new Date('2026-08-08T00:00:00.000Z'),
      courseLevel: 'intermediate',
      verificationUrl: `https://localhost:5173/certificates/verify/${testCertId}`,
      qrCodeData,
    });

    const pdf = fs.readFileSync(file);
    const c = parsePdfContent(pdf);

    // QR is painted via an XObject Do (e.g. `/I2 Do`).
    expect(c.content).toMatch(/\/I\d+\s+Do\b/);
    // The full URL stays inside the QR payload — never a printed string.
    const runs = c.textRuns
      .map((r) => r.text)
      .join(' ')
      .toLowerCase();
    expect(runs).not.toContain('localhost');
    expect(runs).not.toContain('http');

    // Short human-readable ID hint sits under the QR too.
    const idHints = c.textRuns.filter((r) => r.text.includes(testCertId));
    expect(idHints.length).toBeGreaterThanOrEqual(1);
  });
});
