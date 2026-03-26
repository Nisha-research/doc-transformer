import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { FileUploadZone } from '@/components/FileUploadZone';
import { OutputModeSelector } from '@/components/OutputModeSelector';
import { ResultsView } from '@/components/ResultsView';
import { FeaturesSection } from '@/components/FeaturesSection';
import { Footer } from '@/components/Footer';
import { type UploadedFile } from '@/lib/file-utils';
import { type OutputMode } from '@/lib/output-modes';

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

  const handleModeSelect = (mode: OutputMode, level: number) => {
    setSelectedMode(mode);
    setKnowledgeLevel(level);
    setStep('results');
    setIsLoading(true);

    // Simulate AI processing for now — will be replaced with edge function
    setTimeout(() => {
      setResult(
        `# ${mode.label} — Generated Output\n\n` +
        `Knowledge level: ${level < 33 ? 'Beginner' : level < 66 ? 'Intermediate' : 'Expert'}\n` +
        `Files analyzed: ${uploadedFiles.map(f => f.tag).join(', ')}\n\n` +
        `This is a placeholder result. Once Lovable Cloud is enabled, this will be powered by AI to generate real ${mode.label.toLowerCase()} from your uploaded documents.\n\n` +
        `The output will be tailored to your selected knowledge level and formatted specifically for the "${mode.label}" output mode.`
      );
      setIsLoading(false);
    }, 2000);
  };

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
