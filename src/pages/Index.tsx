import { useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { FileUploadZone } from '@/components/FileUploadZone';
import { OutputModeSelector } from '@/components/OutputModeSelector';
import { ResultsView } from '@/components/ResultsView';
import { FeaturesSection } from '@/components/FeaturesSection';
import { Footer } from '@/components/Footer';
import { type UploadedFile } from '@/lib/file-utils';
import { type OutputMode } from '@/lib/output-modes';
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

  const handleModeSelect = useCallback(async (mode: OutputMode, level: number) => {
    setSelectedMode(mode);
    setKnowledgeLevel(level);
    setStep('results');
    setIsLoading(true);
    setResult('');

    try {
      const documentText = await extractTextFromFiles(
        uploadedFiles.map(f => ({ file: f.file, tag: f.tag }))
      );

      let accumulated = '';
      await streamDocument({
        documentText,
        modeId: mode.id,
        knowledgeLevel: level,
        fileTags: uploadedFiles.map(f => f.tag),
        onDelta: (text) => {
          accumulated += text;
          setResult(accumulated);
        },
        onDone: () => {
          setIsLoading(false);
        },
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
  }, [uploadedFiles]);

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
        <>
          <HeroSection />
          <FileUploadZone onFilesReady={handleFilesReady} />
          <FeaturesSection />
        </>
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
        <div className="pt-20">
          <ResultsView
            mode={selectedMode}
            knowledgeLevel={knowledgeLevel}
            isLoading={isLoading}
            result={result}
            onBack={handleBackToModes}
          />
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Index;
