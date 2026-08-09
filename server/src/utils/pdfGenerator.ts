import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { logger } from './logger';

const CERTIFICATES_DIR = path.join(__dirname, '../../uploads/certificates');

if (!fs.existsSync(CERTIFICATES_DIR)) {
  fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
}

// ── Brand asset (official NextEra logo reused for PDF embedding) ──
const LOGO_CANDIDATES = [
  path.join(__dirname, '../../assets/NextEra.png'),
  path.join(__dirname, '../assets/NextEra.png'),
];

function resolveLogoPath(): string | null {
  for (const p of LOGO_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const LOGO_PATH = resolveLogoPath();

// Palette shared with the web preview (orange/pink/purple identity)
const C = {
  orange: '#f97316',
  pink: '#ec4899',
  purple: '#8b5cf6',
  purpleLight: '#a78bfa',
  orangeLight: '#fdba74',
  slate: '#0f172a',
  slate700: '#334155',
  slate500: '#64748b',
  slate400: '#94a3b8',
  white: '#ffffff',
};

interface CertificateData {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  certificateId: string;
  issuedAt: Date;
  courseLevel?: string;
  categoryName?: string;
  courseDuration?: number;
  verificationUrl?: string;
  qrCodeData?: Buffer | string;
}

type PDF = InstanceType<typeof PDFDocument>;

function roundedRectPath(
  doc: PDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  doc.moveTo(x + radius, y)
    .lineTo(x + w - radius, y)
    .quadraticCurveTo(x + w, y, x + w, y + radius)
    .lineTo(x + w, y + h - radius)
    .quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
    .lineTo(x + radius, y + h)
    .quadraticCurveTo(x, y + h, x, y + h - radius)
    .lineTo(x, y + radius)
    .quadraticCurveTo(x, y, x + radius, y)
    .closePath();
}

function wrapText(doc: PDF, text: string, maxWidth: number, metrics: FontMetrics): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (stringWidth(doc, candidate, metrics) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

interface TextStyle {
  font: string;
  size: number;
  color?: string;
  characterSpacing?: number;
}

/**
 * Draw a single line of text that is guaranteed NOT to wrap, horizontally
 * centered on centerX. PDFKit only honors `align: 'center'` inside a fixed
 * `width`, which triggers word-wrapping; instead we measure the string, then
 * anchor it at `centerX - width / 2` and disable line breaks.
 */
function drawCenteredLine(
  doc: PDF,
  text: string,
  centerX: number,
  topY: number,
  options: TextStyle
): void {
  if (!text) return;
  const spacing = options.characterSpacing || 0;
  doc.font(options.font).fontSize(options.size);
  if (options.color) doc.fillColor(options.color);
  doc.text(text, centerX - doc.widthOfString(text, { characterSpacing: spacing }) / 2, topY, {
    lineBreak: false,
    characterSpacing: spacing,
  });
}

/** Draw text anchored at its left edge at (x, topY). */
function drawLeftLine(
  doc: PDF,
  text: string,
  x: number,
  topY: number,
  options: TextStyle
): void {
  if (!text) return;
  const spacing = options.characterSpacing || 0;
  doc.font(options.font).fontSize(options.size);
  if (options.color) doc.fillColor(options.color);
  doc.text(text, x, topY, { lineBreak: false, characterSpacing: spacing });
}

interface FontMetrics {
  font: string;
  size: number;
  characterSpacing?: number;
}

/** Exact advance width of a string with the given settings. */
function stringWidth(doc: PDF, text: string, m: FontMetrics): number {
  doc.font(m.font).fontSize(m.size);
  return doc.widthOfString(text, { characterSpacing: m.characterSpacing || 0 });
}

/** Current line height for the given font metrics. */
function lineHeight(doc: PDF, m: FontMetrics): number {
  doc.font(m.font).fontSize(m.size);
  return doc.currentLineHeight();
}

// Decorative gradient curves (orange/pink top-left; purple bottom-right)
function drawDecorativeCurves(doc: PDF, w: number, h: number) {
  doc.save();

  // Top-left soft orange glow
  const orangeGlow = doc.radialGradient(20, 20, 0, 20, 20, 480);
  orangeGlow.stop(0, C.orangeLight, 0.5);
  orangeGlow.stop(0.6, C.orangeLight, 0.22);
  orangeGlow.stop(1, C.orangeLight, 0);
  doc.ellipse(20, 20, 380, 260).fill(orangeGlow);

  // Top-left pink accent
  const pinkTop = doc.radialGradient(320, 0, 0, 320, 0, 420);
  pinkTop.stop(0, C.pink, 0.28);
  pinkTop.stop(0.6, C.pink, 0.1);
  pinkTop.stop(1, C.pink, 0);
  doc.ellipse(320, 0, 290, 200).fill(pinkTop);

  // Bottom-right purple gradient curves
  const purpleGlow = doc.radialGradient(w, h, 0, w, h, 500);
  purpleGlow.stop(0, C.purpleLight, 0.42);
  purpleGlow.stop(0.55, C.purpleLight, 0.18);
  purpleGlow.stop(1, C.purpleLight, 0);
  doc.ellipse(w - 20, h - 20, 420, 300).fill(purpleGlow);

  const purpleAccent = doc.radialGradient(w - 30, h - 30, 0, w - 30, h - 30, 340);
  purpleAccent.stop(0, C.purple, 0.28);
  purpleAccent.stop(0.6, C.purple, 0.1);
  purpleAccent.stop(1, C.purple, 0);
  doc.ellipse(w - 60, h - 50, 240, 180).fill(purpleAccent);

  doc.restore();
}

export async function generateCertificatePdf(data: CertificateData): Promise<string> {
  const filename = `certificate-${data.certificateId}.pdf`;
  const filePath = path.join(CERTIFICATES_DIR, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        info: {
          Title: `Certificate of Completion - ${data.courseTitle}`,
          Author: 'NextEra LMS',
          Subject: 'Course Completion Certificate',
          Producer: 'NextEra LMS',
          Creator: 'NextEra LMS',
        },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const pageW = doc.page.width; // 841.89
      const pageH = doc.page.height; // 595.28

      // Layout grid (single source of truth for coordinates)
      const BOARD = { left: 40, top: 40, right: pageW - 40, bottom: pageH - 40 };
      const PLATE_L = BOARD.left + 22;
      const PLATE_R = BOARD.right - 22;
      const CX = pageW / 2;

      // White base
      doc.rect(0, 0, pageW, pageH).fill(C.white);

      // Decorative gradient curves
      drawDecorativeCurves(doc, pageW, pageH);

      // Outer gradient border
      const borderGrad = doc.linearGradient(26, 26, pageW - 26, pageH - 26);
      borderGrad.stop(0, C.orange);
      borderGrad.stop(0.5, C.pink);
      borderGrad.stop(1, C.purple);
      roundedRectPath(doc, 26, 26, pageW - 52, pageH - 52, 20);
      doc.lineWidth(2.6).stroke(borderGrad);

      // Inner hairline
      roundedRectPath(doc, BOARD.left, BOARD.top, BOARD.right - BOARD.left, BOARD.bottom - BOARD.top, 14);
      doc.lineWidth(0.7).stroke(C.slate400);

      const logoSize = 60;
      if (LOGO_PATH) {
        try {
          doc.image(LOGO_PATH, PLATE_L, BOARD.top + 10, { fit: [logoSize, logoSize], valign: 'center' });
        } catch (err) {
          logger.warn('Could not embed NextEra logo in certificate PDF', { certificateId: data.certificateId });
        }
      }

      // ── Header region ────────────────
      const brandX = PLATE_L + (LOGO_PATH ? logoSize + 18 : 0);
      drawLeftLine(doc, 'NextEra', brandX, BOARD.top + 30, { font: 'Helvetica-Bold', size: 24, color: C.slate });
      drawLeftLine(doc, 'LEARNING PLATFORM', brandX, BOARD.top + 62, { font: 'Helvetica', size: 9, color: C.slate400, characterSpacing: 2 });

      // Verified badge (top right)
      const badgeW = 168;
      const badgeH = 36;
      const badgeX = PLATE_R - badgeW;
      const badgeTop = BOARD.top + 18;
      roundedRectPath(doc, badgeX, badgeTop, badgeW, badgeH, 18);
      doc.fill(C.white);
      roundedRectPath(doc, badgeX, badgeTop, badgeW, badgeH, 18);
      doc.lineWidth(1.2).stroke(C.orange);

      doc.save();
      doc.translate(badgeX + 60, badgeTop + badgeH / 2);
      doc.moveTo(0, -5).lineTo(4.2, -1).lineTo(9, -8);
      doc.lineWidth(1.8).lineCap('round').lineJoin('round').stroke(C.orange);
      doc.restore();

      drawLeftLine(doc, 'Verified', badgeX + 72, badgeTop + (badgeH - 12) / 2, {
        font: 'Helvetica-Bold',
        size: 12,
        color: C.orange,
      });

      // ── Title + recipient region (vertically centered in the plate) ──
      const mtl = { font: 'Helvetica-Bold', size: 15, characterSpacing: 4 };
      const mti = { font: 'Helvetica-Bold', size: 40, characterSpacing: 1 };
      const mIntro = { font: 'Helvetica', size: 13, color: C.slate500 };
      const mName = { font: 'Helvetica-BoldOblique', size: 30, color: C.slate };
      const mMid = { font: 'Helvetica', size: 13, color: C.slate500 };
      const mCourse = { font: 'Helvetica-Bold', size: 20, color: C.slate700 };
      const mLevel = { font: 'Helvetica-Bold', size: 12 };

      const titleText = 'CERTIFICATE OF';
      const achText = 'ACHIEVEMENT';
      const introText = 'This certificate is proudly presented to';
      const nameText = data.studentName || 'Student';
      const midText = 'who has successfully completed the course';
      const courseBase = data.courseTitle || 'Course';
      const levelText = data.courseLevel
        ? data.courseLevel.charAt(0).toUpperCase() + data.courseLevel.slice(1)
        : '';

      // Wrap long names / courses with measured widths (max 2 lines each)
      const nameMaxW = pageW - 340;
      const nameLines = wrapText(doc, nameText, nameMaxW, mName).slice(0, 2);
      const courseLines = wrapText(doc, courseBase, 560, mCourse).slice(0, 2);
      const maxNameW = Math.max(...nameLines.map((l) => stringWidth(doc, l, mName)));
      const maxCourseW = Math.max(...courseLines.map((l) => stringWidth(doc, l, mCourse)));

      const kickerH = lineHeight(doc, mtl);
      const titleH = lineHeight(doc, mti);
      const introH = lineHeight(doc, mIntro) + 2;
      const nameH = lineHeight(doc, mName) + 4;
      const midH = lineHeight(doc, mMid) + 2;
      const courseH = lineHeight(doc, mCourse) + 4;

      const blockH =
        kickerH +
        4 +
        titleH +
        8 +
        introH +
        6 +
        nameLines.length * nameH +
        14 +
        midH +
        6 +
        courseLines.length * courseH +
        10 +
        (levelText ? 30 : 0);

      const plateTop = BOARD.top + 16;
      const plateBottom = BOARD.bottom - 74; // reserve footer band
      const startY = plateTop + Math.max(0, (plateBottom - plateTop - blockH) / 2);

      let y = startY;

      // Kicker
      drawCenteredLine(doc, titleText, CX, y, mtl);
      y += kickerH + 4;

      // Title
      drawCenteredLine(doc, achText, CX, y, mti);
      y += titleH + 8;

      // Gradient divider
      const divY = y;
      const divider = doc.linearGradient(CX - 130, divY, CX + 130, divY);
      divider.stop(0, C.purple);
      divider.stop(0.5, C.pink);
      divider.stop(1, C.orange);
      doc.moveTo(CX - 130, divY).lineTo(CX + 130, divY);
      doc.lineWidth(3).stroke(divider);
      y += 12;

      // Intro
      drawCenteredLine(doc, introText, CX, y, mIntro);
      y += introH + 6;

      // Student name (one or two centered lines)
      for (const nl of nameLines) {
        drawCenteredLine(doc, nl, CX, y, mName);
        y += nameH;
      }

      // Underline strictly BELOW the last name line (never through glyphs).
      // PDFKit's y is the TOP of the text, so the first baseline sits ~size pt
      // lower; placing the rule at y + 10 guarantees clear separation.
      const underlineY = y + 8;
      const ulw = Math.min(Math.max(maxNameW, 120), 380);
      doc.lineWidth(2);
      doc.moveTo(CX - ulw / 2, underlineY).lineTo(CX + ulw / 2, underlineY).stroke(C.orange);
      y += 12;

      // Mid line
      drawCenteredLine(doc, midText, CX, y, mMid);
      y += midH + 6;

      // Course title
      for (const cl of courseLines) {
        drawCenteredLine(doc, cl, CX, y, mCourse);
        y += courseH;
      }
      y += 6;

      // Level pill
      if (levelText) {
        const lw = Math.min(stringWidth(doc, levelText, mLevel) + 40, 360);
        const lh = 30;
        const pillGrad = doc.linearGradient(CX - lw / 2, y, CX + lw / 2, y);
        pillGrad.stop(0, C.orange);
        pillGrad.stop(1, C.purple);
        roundedRectPath(doc, CX - lw / 2, y, lw, lh, 15);
        doc.fill(pillGrad);
        drawCenteredLine(doc, levelText, CX, y + 9, { ...mLevel, color: C.white });
      }

      // ── Footer region ── (fixed heights; nothing may leave the plate) ──
      const footTop = BOARD.bottom - 66;

      // Bottom-left: issue date + certificate id
      const lx = PLATE_L;
      drawLeftLine(doc, 'ISSUE DATE', lx, footTop, { font: 'Helvetica-Bold', size: 9, color: C.slate400, characterSpacing: 1.5 });
      const dateStr = data.issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      drawLeftLine(doc, dateStr, lx, footTop + 14, { font: 'Helvetica-Bold', size: 13, color: C.slate700 });
      drawLeftLine(doc, 'CERTIFICATE ID', lx, footTop + 34, { font: 'Helvetica-Bold', size: 9, color: C.slate400, characterSpacing: 1.5 });
      drawLeftLine(doc, data.certificateId, lx, footTop + 48, { font: 'Courier', size: 11, color: C.slate700 });

      // Bottom-center: instructor signature block
      const sig = data.instructorName || 'Instructor';
      const sigM = { font: 'Helvetica-Oblique', size: 17, color: C.slate };
      drawCenteredLine(doc, sig, CX, footTop + 2, sigM);
      const sigW = stringWidth(doc, sig, sigM);
      doc.lineWidth(1);
      doc.moveTo(CX - sigW / 2 - 4, footTop + 22).lineTo(CX + sigW / 2 + 4, footTop + 22).stroke(C.slate400);
      drawCenteredLine(doc, 'INSTRUCTOR', CX, footTop + 28, { font: 'Helvetica-Bold', size: 10, color: C.slate500, characterSpacing: 2 });

      // Bottom-right: QR code + caption (quiet-zone box keeps it fully on-page).
      // The full verification URL is encoded in the QR; only a short hint is shown.
      const qrSize = 80;
      const qrP = 6;
      const qrBox = qrSize + qrP * 2; // 92
      const qrX = PLATE_R - qrBox;
      const qrY = BOARD.bottom - 115; // keep box + captions inside the plate
      doc.save();
      doc.rect(qrX, qrY, qrBox, qrBox).fill(C.white);
      if (data.qrCodeData) {
        doc.image(data.qrCodeData, qrX + qrP, qrY + qrP, { fit: [qrSize, qrSize] });
      }
      doc.restore();
      drawCenteredLine(doc, 'SCAN TO VERIFY', qrX + qrBox / 2, qrY + qrBox + 2, {
        font: 'Helvetica-Bold',
        size: 9,
        color: C.slate500,
        characterSpacing: 1,
      });

      // Short human-readable certificate id hint under the QR (URL stays in the QR)
      drawCenteredLine(doc, data.certificateId, qrX + qrBox / 2, qrY + qrBox + 13, {
        font: 'Helvetica',
        size: 7.5,
        color: C.slate400,
      });

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
