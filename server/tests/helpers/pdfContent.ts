import { inflateSync } from 'zlib';

export interface PdfTextRun {
  text: string;
  x: number;
  /** Distance from the TOP of the page in PDF points (flip applied). */
  yTop: number;
  /** Distance from the BOTTOM of the page in PDF points (PDF native y). */
  yBottom: number;
  fontSize: number | null;
  font: string | null;
}

export interface PdfHLine {
  x1: number;
  x2: number;
  /** Distance from the TOP of the page in PDF points. */
  yTop: number;
  yBottom: number;
}

const STREAM_RE = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
const HEX_RE = /<([0-9A-Fa-f]+)>/g;

function decodeHex(hex: string): string {
  try {
    return Buffer.from(hex, 'hex').toString('latin1');
  } catch {
    return '';
  }
}

export interface PdfContent {
  textRuns: PdfTextRun[];
  hLines: PdfHLine[];
  pageW: number;
  pageH: number;
  /** Joined, inflated page content streams (text + path ops). */
  content: string;
}

export function parsePdfContent(buf: Buffer): PdfContent {
  const raw = buf.toString('latin1');

  const mediaBox = raw.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/);
  const pageW = mediaBox ? parseFloat(mediaBox[1]) : 841.89;
  const pageH = mediaBox ? parseFloat(mediaBox[2]) : 595.28;

  // Inflate every Flate content stream; keep the ones that carry text operators.
  let m: RegExpExecArray | null;
  STREAM_RE.lastIndex = 0;
  const contentParts: string[] = [];
  while ((m = STREAM_RE.exec(raw))) {
    try {
      const decoded = inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1');
      if (/\bTm\b/.test(decoded) || /(?:m|l)\b.*\bS\b/.test(decoded)) {
        contentParts.push(decoded);
      }
    } catch {
      // image streams that are not Flate encoded, or other binary — skip
    }
  }
  const content = contentParts.join('\n');

  // Extract text runs: find `x y Tm` and decode the TJ array that follows.
  const textRuns: PdfTextRun[] = [];
  const runRe = /(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) Tm/g;
  let rm: RegExpExecArray | null;
  runRe.lastIndex = 0;
  while ((rm = runRe.exec(content))) {
    const x = parseFloat(rm[1]);
    const y = parseFloat(rm[2]);
    const rest = content.slice(rm.index);
    const tj = /\[([\s\S]*?)\]\s*TJ/.exec(rest.slice(0, 400));
    if (!tj) continue;
    let text = '';
    HEX_RE.lastIndex = 0;
    let hm: RegExpExecArray | null;
    while ((hm = HEX_RE.exec(tj[1]))) text += decodeHex(hm[1]);
    if (!text.trim()) continue;

    // Font size: look back for the nearest `Tf`.
    const head = content.slice(0, rm.index);
    const tf = /\/F\d+\s+([\d.]+)\s+Tf/.exec(head);
    const fontSize = tf ? parseFloat(tf[1]) : null;
    const softFont = /\/F\d+/.exec(head);
    const font = softFont ? softFont[0] : null;

    textRuns.push({
      text,
      x,
      yTop: pageH - y,
      yBottom: y,
      fontSize,
      font,
    });
  }

  // Extract cartesian pairs for `m ... l` horizontal strokes (underline +
  // instructor rule are horizontal).
  const lines: PdfHLine[] = [];
  const hre = /(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) m\s+(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) l/g;
  let lr: RegExpExecArray | null;
  hre.lastIndex = 0;
  while ((lr = hre.exec(content))) {
    const x1 = parseFloat(lr[1]);
    const y1 = parseFloat(lr[2]);
    const x2 = parseFloat(lr[3]);
    const y2 = parseFloat(lr[4]);
    if (Math.abs(y1 - y2) < 0.01) {
      lines.push({ x1, x2, yTop: pageH - y1, yBottom: y1 });
    }
  }

  return { textRuns, hLines: lines, pageW, pageH, content };
}
