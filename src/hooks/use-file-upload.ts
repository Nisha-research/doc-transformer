import { useState, useCallback } from 'react';
import { v4 } from '@/lib/uuid';
import { validateFile, MAX_FILES, type UploadedFile } from '@/lib/file-utils';

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(newFiles);

    if (files.length + fileArray.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const validFiles: UploadedFile[] = [];
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      validFiles.push({
        id: v4(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        tag: file.name.replace(/\.[^.]+$/, ''),
        progress: 100,
        status: 'complete',
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, [files.length]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateTag = useCallback((id: string, tag: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, tag } : f));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  return { files, error, addFiles, removeFile, updateTag, clearFiles };
}
