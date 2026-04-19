import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

async function extractFromPdf(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    pages.push(tc.items.map((item) => item.str).join(' '));
  }
  return pages.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function extractFromDocx(file) {
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return value.trim();
}

export const SUPPORTED_UPLOAD_EXTENSIONS = ['.pdf', '.docx'];

export async function extractTextFromFile(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractFromPdf(file);
  }
  if (
    name.endsWith('.docx') ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return extractFromDocx(file);
  }
  throw new Error('Unsupported file type. Please upload a PDF or DOCX.');
}
