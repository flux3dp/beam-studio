export interface PdfHelper {
  pdfToSvgBlob: (file: File) => Promise<{ blob?: Blob, errorMessage?: string }>;
}
