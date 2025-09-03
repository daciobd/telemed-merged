import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';

export async function htmlToSimplePdf(html: string, outDir: string, filename: string): Promise<string> {
  // Minimal PDF renderer (no full HTML engine). For MVP we place raw text; can swap for Puppeteer later.
  fs.mkdirSync(outDir, { recursive: true });
  const fullPath = path.join(outDir, filename);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(fullPath);
  doc.pipe(stream);

  // Very naive text rendering: strip tags and print. Replace with proper HTML renderer in v2.
  const text = html
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

  doc.fontSize(12).text(text, { align: 'left' });
  doc.end();

  await new Promise((resolve) => stream.on('finish', resolve));
  return fullPath;
}