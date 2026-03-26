import { motion } from 'framer-motion';
import { Shield, Zap, Users, FileText, Brain } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: '20+ Output Modes',
    description: 'From flashcards to executive summaries, podcasts scripts to research analysis.',
  },
  {
    icon: Zap,
    title: 'Knowledge Slider',
    description: 'Adjust output complexity from beginner-friendly analogies to expert-level density.',
  },
  {
    icon: FileText,
    title: 'Multi-Doc Synthesis',
    description: 'Upload multiple files and compare, contrast, and synthesize across them.',
  },
  {
    icon: Shield,
    title: 'Privacy-First',
    description: 'No login required. Files auto-deleted within 1 hour. Zero data stored.',
  },
  {
    icon: Users,
    title: 'Study Rooms',
    description: 'Share a room link. Collaborate on documents and generate content together.',
  },
];

export function FeaturesSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-display font-bold text-foreground">
          More than just notes
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Built for students, professionals, creators, researchers — and everyone in between.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-elevated transition-shadow"
            >
              <Icon className="w-5 h-5 text-student mb-3" />
              <h3 className="font-display font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
