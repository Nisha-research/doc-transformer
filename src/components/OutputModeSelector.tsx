import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { categories, type CategoryId, type OutputMode } from '@/lib/output-modes';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface OutputModeSelectorProps {
  onSelect: (mode: OutputMode, knowledgeLevel: number) => void;
  onBack: () => void;
  fileCount: number;
}

export function OutputModeSelector({ onSelect, onBack, fileCount }: OutputModeSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [selectedMode, setSelectedMode] = useState<OutputMode | null>(null);
  const [knowledgeLevel, setKnowledgeLevel] = useState([50]);

  const levelLabel = knowledgeLevel[0] < 33 ? 'Beginner' : knowledgeLevel[0] < 66 ? 'Intermediate' : 'Expert';

  return (
    <section className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Choose your output</h2>
            <p className="text-sm text-muted-foreground">{fileCount} file{fileCount > 1 ? 's' : ''} ready to transform</p>
          </div>
        </div>

        {/* Knowledge Level Slider */}
        <div className="mb-8 p-5 rounded-xl bg-card border border-border shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">Knowledge Level</label>
            <span className="text-sm font-semibold text-student">{levelLabel}</span>
          </div>
          <Slider
            value={knowledgeLevel}
            onValueChange={setKnowledgeLevel}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Analogies & simple language</span>
            <span>Technical density</span>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`
                relative p-4 rounded-xl border text-left transition-all duration-300
                ${activeCategory === cat.id
                  ? 'border-foreground/20 shadow-elevated bg-card'
                  : 'border-border hover:border-border/80 bg-card/50 hover:bg-card'
                }
              `}
            >
              <div className={`w-8 h-8 rounded-lg ${cat.gradient} flex items-center justify-center mb-3`}>
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <p className="font-display font-semibold text-sm text-foreground">{cat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
            </motion.button>
          ))}
        </div>

        {/* Mode Cards */}
        <AnimatePresence mode="wait">
          {activeCategory && (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
            >
              {categories
                .find(c => c.id === activeCategory)
                ?.modes.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = selectedMode?.id === mode.id;
                  return (
                    <motion.button
                      key={mode.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedMode(isSelected ? null : mode)}
                      className={`
                        p-4 rounded-xl border text-left transition-all duration-200
                        ${isSelected
                          ? 'border-primary shadow-elevated bg-primary/5'
                          : 'border-border bg-card hover:border-primary/30'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-semibold text-foreground">{mode.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
                    </motion.button>
                  );
                })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Button */}
        {selectedMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-8"
          >
            <Button
              size="lg"
              onClick={() => onSelect(selectedMode, knowledgeLevel[0])}
              className="bg-gradient-hero text-primary-foreground hover:opacity-90 px-8 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate {selectedMode.label}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
