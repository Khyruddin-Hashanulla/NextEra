import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { logger } from './logger';

const CERTIFICATES_DIR = path.join(__dirname, '../../uploads/certificates');

if (!fs.existsSync(CERTIFICATES_DIR)) {
  fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
}

interface CertificateData {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  certificateId: string;
  issuedAt: Date;
  qrCodeDataUrl?: string;
}

function wrapText(doc: InstanceType<typeof PDFDocument>, text: string, x: number, y: number, maxWidth: number, fontSize: number): number {
  doc.fontSize(fontSize);
  const words = text.split(' ');
  let line = '';
  let lineY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const testWidth = doc.widthOfString(testLine);

    if (testWidth > maxWidth && line) {
      doc.text(line, x, lineY, { align: 'center' });
      lineY += fontSize * 1.3 + 2;
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) {
    doc.text(line, x, lineY, { align: 'center' });
    lineY += fontSize * 1.3;
  }

  return lineY;
}

export async function generateCertificatePdf(data: CertificateData): Promise<string> {
  const filename = `certificate-${data.certificateId}.pdf`;
  const filePath = path.join(CERTIFICATES_DIR, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
        info: {
          Title: `Certificate of Completion - ${data.courseTitle}`,
          Author: 'NextEra LMS',
          Subject: 'Course Completion Certificate',
        },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Border
      doc.rect(20, 20, pageWidth - 40, pageHeight - 40).stroke('#f97316');
      doc.rect(25, 25, pageWidth - 50, pageHeight - 50).stroke('#f97316');

      // Decorative top line
      doc.moveTo(50, 55).lineTo(pageWidth - 50, 55).stroke('#f97316');

      // Branding
      doc.fontSize(14).fillColor('#f97316').font('Helvetica-Bold');
      doc.text('NextEra LMS', 60, 50, { align: 'left' });

      // Certificate ID
      doc.fontSize(8).fillColor('#666666').font('Helvetica');
      doc.text(`ID: ${data.certificateId}`, pageWidth - 170, 53, { align: 'right' });

      // Main title
      doc.fontSize(32).fillColor('#1e293b').font('Helvetica-Bold');
      const titleY = wrapText(doc, 'Certificate of Completion', 0, 100, pageWidth, 32);

      // Decorative divider
      doc.moveTo(pageWidth / 2 - 60, titleY + 10)
        .lineTo(pageWidth / 2 + 60, titleY + 10)
        .stroke('#f97316');

      // Awarded text
      doc.fontSize(13).fillColor('#475569').font('Helvetica');
      const awardedY = titleY + 30;
      doc.text('This certificate is proudly awarded to', 0, awardedY, { align: 'center' });

      // Student name
      doc.fontSize(28).fillColor('#f97316').font('Helvetica-Bold');
      const studentY = awardedY + 35;
      wrapText(doc, data.studentName, 0, studentY, pageWidth, 28);

      // Completion text
      doc.fontSize(13).fillColor('#475569').font('Helvetica');
      const compY = studentY + 50;
      doc.text('for successfully completing the course', 0, compY, { align: 'center' });

      // Course title
      doc.fontSize(20).fillColor('#1e293b').font('Helvetica-Bold');
      const courseY = compY + 30;
      wrapText(doc, data.courseTitle, 0, courseY, pageWidth, 20);

      // Instructor
      doc.fontSize(11).fillColor('#64748b').font('Helvetica');
      const instrY = courseY + 45;
      doc.text(`Instructor: ${data.instructorName}`, 0, instrY, { align: 'center' });

      // Date
      doc.fontSize(11).fillColor('#64748b').font('Helvetica');
      const dateStr = data.issuedAt.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      doc.text(`Date Issued: ${dateStr}`, 0, instrY + 22, { align: 'center' });

      // QR Code
      if (data.qrCodeDataUrl) {
        const qrSize = 80;
        const qrX = pageWidth - 130;
        const qrY = pageHeight - 160;
        doc.image(data.qrCodeDataUrl, qrX, qrY, { width: qrSize, height: qrSize });
        doc.fontSize(7).fillColor('#666666').font('Helvetica');
        doc.text('Scan to verify', qrX, qrY + qrSize + 5, { align: 'center', width: qrSize });
      }

      // Verification text
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica');
      doc.text(`Verify at: ${env.clientUrl || 'http://localhost:5173'}/verify-certificate/${data.certificateId}`,
        pageWidth - 250, pageHeight - 55, { align: 'right' });

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica');
      doc.text('This certificate is digitally signed and verified by NextEra LMS', 0, pageHeight - 65, { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        logger.info('Certificate PDF generated', { filename, certificateId: data.certificateId });
        resolve(filePath);
      });

      writeStream.on('error', (err) => {
        logger.error('Failed to write certificate PDF', { error: err.message, filename });
        reject(err);
      });
    } catch (error) {
      logger.error('Failed to generate certificate PDF', { error });
      reject(error);
    }
  });
}

export function getCertificateUrl(filename: string): string {
  const serverUrl = env.serverUrl || `http://localhost:${env.port || 5000}`;
  return `${serverUrl}/uploads/certificates/${filename}`;
}

export function getCertificateFilePath(filename: string): string {
  return path.join(CERTIFICATES_DIR, filename);
}
