export const ACCEPTED_TYPES = {
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
} as const;

// Per-type size limits (bytes). Tighter than the global cap so individual file
// types can't be abused (e.g. a 20MB plain-text file is almost certainly bogus).
export const PER_TYPE_LIMITS: Record<string, number> = {
  'application/pdf': 20 * 1024 * 1024,
  'text/plain': 2 * 1024 * 1024,
  'application/vnd.ms-powerpoint': 20 * 1024 * 1024,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 20 * 1024 * 1024,
};

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

// File magic-byte signatures. We sniff the first bytes of the file and verify
// they match the claimed MIME type. This blocks the trivial "rename .exe to
// .pdf" attack and many polyglot tricks.
const SIGNATURES: { type: string; bytes: number[]; offset?: number }[] = [
  // PDF: "%PDF-"
  { type: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  // PPTX (and any OOXML): ZIP "PK\x03\x04"
  { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    bytes: [0x50, 0x4b, 0x03, 0x04] },
  // Legacy PPT (compound file binary): D0 CF 11 E0 A1 B1 1A E1
  { type: 'application/vnd.ms-powerpoint',
    bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
];

async function sniffHeader(file: File, length = 16): Promise<Uint8Array> {
  const slice = file.slice(0, Math.min(length, file.size));
  const buf = await slice.arrayBuffer();
  return new Uint8Array(buf);
}

function matchesSig(header: Uint8Array, bytes: number[], offset = 0): boolean {
  if (header.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (header[offset + i] !== bytes[i]) return false;
  }
  return true;
}

/** Quick sync validation (size, declared mime, extension). */
export function validateFile(file: File): string | null {
  if (file.size === 0) return `File "${file.name}" is empty`;
  if (file.size > MAX_FILE_SIZE) return `File "${file.name}" exceeds 20MB limit`;

  const validTypes = Object.keys(ACCEPTED_TYPES);
  if (!validTypes.includes(file.type)) {
    return `File "${file.name}" is not a supported format (PDF, TXT, PPT/PPTX)`;
  }
  const perType = PER_TYPE_LIMITS[file.type];
  if (perType && file.size > perType) {
    const mb = (perType / (1024 * 1024)).toFixed(0);
    return `File "${file.name}" exceeds the ${mb}MB limit for this file type`;
  }
  return null;
}

/**
 * Async validation that also sniffs file magic bytes. Use this on the upload
 * path so users can't bypass the file-type filter by renaming the extension.
 */
export async function validateFileDeep(file: File): Promise<string | null> {
  const quick = validateFile(file);
  if (quick) return quick;

  try {
    const header = await sniffHeader(file);

    if (file.type === 'text/plain') {
      // Reject if the file contains null bytes in the first 4KB — that's a
      // strong indicator of binary content masquerading as text.
      const probeLen = Math.min(4096, file.size);
      const probe = new Uint8Array(await file.slice(0, probeLen).arrayBuffer());
      for (let i = 0; i < probe.length; i++) {
        if (probe[i] === 0x00) return `File "${file.name}" doesn't look like plain text`;
      }
      return null;
    }

    const sig = SIGNATURES.find(s => s.type === file.type);
    if (!sig) return `File "${file.name}" is not a supported format`;
    if (!matchesSig(header, sig.bytes, sig.offset)) {
      return `File "${file.name}" doesn't match its declared type (failed signature check)`;
    }
    return null;
  } catch {
    return `File "${file.name}" could not be read`;
  }
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
