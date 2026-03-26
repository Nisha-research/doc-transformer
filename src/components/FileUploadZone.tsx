import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFileUpload } from '@/hooks/use-file-upload';
import { formatFileSize, getFileIcon, MAX_FILES, ACCEPTED_TYPES } from '@/lib/file-utils';

interface FileUploadZoneProps {
  onFilesReady: (files: ReturnType<typeof useFileUpload>['files']) => void;
}

export function FileUploadZone({ onFilesReady }: FileUploadZoneProps) {
  const { files, error, addFiles, removeFile, updateTag, clearFiles } = useFileUpload();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
    }
  }, [addFiles]);

  const acceptString = Object.keys(ACCEPTED_TYPES).join(',');

  return (
    <section className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300
            ${isDragging
              ? 'border-student bg-student-light scale-[1.01] shadow-glow'
              : 'border-border hover:border-student/50 hover:bg-muted/50'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptString}
            multiple
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${isDragging ? 'bg-gradient-student' : 'bg-muted'}`}>
              <Upload className={`w-6 h-6 ${isDragging ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">
                {isDragging ? 'Drop files here' : 'Drag & drop your files'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse · PDF, TXT, PPT/PPTX · Up to {MAX_FILES} files, 20MB each
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-destructive mt-3 text-center"
          >
            {error}
          </motion.p>
        )}

        {/* File list */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-3"
            >
              {files.map(file => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-soft"
                >
                  <span className="text-2xl">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={file.tag}
                      onChange={(e) => updateTag(file.id, e.target.value)}
                      className="w-32 h-7 text-xs"
                      placeholder="Tag this file"
                    />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeFile(file.id); }} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}

              <div className="flex justify-between items-center pt-2">
                <p className="text-xs text-muted-foreground">{files.length}/{MAX_FILES} files</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={clearFiles}>Clear all</Button>
                  <Button size="sm" onClick={() => onFilesReady(files)} className="bg-gradient-hero text-primary-foreground hover:opacity-90">
                    Continue
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
