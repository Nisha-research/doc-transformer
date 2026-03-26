export const ACCEPTED_TYPES = {
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
} as const;

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_FILES = 5;

export type AcceptedMimeType = keyof typeof ACCEPTED_TYPES;

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  tag: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File "${file.name}" exceeds 20MB limit`;
  }

  const validTypes = Object.keys(ACCEPTED_TYPES);
  if (!validTypes.includes(file.type)) {
    return `File "${file.name}" is not a supported format (PDF, TXT, PPT/PPTX)`;
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(type: string): string {
  if (type === 'application/pdf') return '📄';
  if (type === 'text/plain') return '📝';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📊';
  return '📁';
}
