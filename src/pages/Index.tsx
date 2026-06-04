import { useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { FileUploadZone } from '@/components/FileUploadZone';
import { OutputModeSelector } from '@/components/OutputModeSelector';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { FeaturesSection } from '@/components/FeaturesSection';
import { Footer } from '@/components/Footer';
import { type UploadedFile } from '@/lib/file-utils';
import { type OutputMode, getModeById } from '@/lib/output-modes';
import { streamDocument, extractTextFromFiles } from '@/lib/ai-stream';
import { toast } from 'sonner';

type AppStep = 'upload' | 'select-mode' | 'results';

const Index = () => {
  const [step, setStep] = useState<AppStep>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedMode, setSelectedMode] = useState<OutputMode | null>(null);
  const [knowledgeLevel, setKnowledgeLevel] = useState(50);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilesReady = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    setStep('select-mode');
  };

  const runGeneration = useCallback(async (mode: OutputMode, level: number, files: UploadedFile[]) => {
    setIsLoading(true);
    setResult('');
    try {
      const documentText = await extractTextFromFiles(
        files.map(f => ({ file: f.file, tag: f.tag }))
      );
      let accumulated = '';
      await streamDocument({
        documentText,
        modeId: mode.id,
        knowledgeLevel: level,
        fileTags: files.map(f => f.tag),
        onDelta: (text) => {
          accumulated += text;
          setResult(accumulated);
        },
        onDone: () => setIsLoading(false),
        onError: (error) => {
          setIsLoading(false);
          setResult(null);
          toast.error(error);
        },
      });
    } catch (e) {
      setIsLoading(false);
      setResult(null);
      toast.error('Failed to process document. Please try again.');
    }
  }, []);

  const handleModeSelect = useCallback(async (mode: OutputMode, level: number) => {
    setSelectedMode(mode);
    setKnowledgeLevel(level);
    setStep('results');
    await runGeneration(mode, level, uploadedFiles);
  }, [uploadedFiles, runGeneration]);

  const handleRegenerate = useCallback(() => {
    if (!selectedMode) return;
    runGeneration(selectedMode, knowledgeLevel, uploadedFiles);
  }, [selectedMode, knowledgeLevel, uploadedFiles, runGeneration]);

  const handleSwitchMode = useCallback((modeId: string) => {
    const newMode = getModeById(modeId);
    if (!newMode) return;
    setSelectedMode(newMode);
    runGeneration(newMode, knowledgeLevel, uploadedFiles);
  }, [knowledgeLevel, uploadedFiles, runGeneration]);

  const handleBackToUpload = () => {
    setStep('upload');
    setSelectedMode(null);
    setResult(null);
  };

  const handleBackToModes = () => {
    setStep('select-mode');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {step === 'upload' && (
        <div className="pt-16">
          <HeroSection />
          <FileUploadZone onFilesReady={handleFilesReady} />
          <FeaturesSection />
          <Footer />
        </div>
      )}

      {step === 'select-mode' && (
        <div className="pt-20">
          <OutputModeSelector
            onSelect={handleModeSelect}
            onBack={handleBackToUpload}
            fileCount={uploadedFiles.length}
          />
        </div>
      )}

      {step === 'results' && selectedMode && (
        <div className="pt-16">
          <WorkspaceShell
            mode={selectedMode}
            files={uploadedFiles}
            result={result}
            isLoading={isLoading}
            knowledgeLevel={knowledgeLevel}
            onBack={handleBackToModes}
            onRegenerate={handleRegenerate}
            onSwitchMode={handleSwitchMode}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
