import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { SpeechFeedback, Exercise } from '@/src/types';
import { generateExercises } from '@/src/lib/gemini';
import { toast } from 'sonner';

interface ExercisePanelProps {
  feedback: SpeechFeedback;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: 'bg-emerald-500/20', text: 'text-emerald-600' },
  intermediate: { bg: 'bg-amber-500/20', text: 'text-amber-600' },
  advanced: { bg: 'bg-rose-500/20', text: 'text-rose-600' },
};

const METRIC_COLORS: Record<string, string> = {
  pronunciation: 'text-red-500',
  pace: 'text-blue-500',
  intonation: 'text-purple-500',
  rhythm: 'text-indigo-500',
  breath: 'text-emerald-500',
  articulation: 'text-amber-500',
  filler: 'text-orange-500',
  confidence: 'text-primary',
};

export const ExercisePanel: React.FC<ExercisePanelProps> = ({ feedback }) => {
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateExercises = async () => {
    setIsLoading(true);
    try {
      const result = await generateExercises(feedback);
      if (!result.success) {
        toast.error('Failed to generate exercises. Please try again.');
        return;
      }
      setExercises(result.data);
      toast.success('Exercises generated!');
    } catch (err) {
      toast.error('An unexpected error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg">Targeted Practice Exercises</CardTitle>
          </div>
          {exercises === null && (
            <Button
              onClick={handleGenerateExercises}
              disabled={isLoading}
              size="sm"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Generating...
                </>
              ) : (
                '✨ Generate Exercises'
              )}
            </Button>
          )}
        </div>
        {exercises !== null && (
          <CardDescription className="mt-2">
            {exercises.length} personalized drills based on your analysis
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-5">
        {exercises === null && !isLoading && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              Generate AI-powered micro-drills targeting your weakest areas
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Creating personalized drills...</p>
            </div>
          </div>
        )}

        {exercises && exercises.length > 0 && (
          <div className="space-y-4">
            {exercises.map((exercise, idx) => {
              const colors = DIFFICULTY_COLORS[exercise.difficulty] || DIFFICULTY_COLORS.beginner;
              const metricColor = METRIC_COLORS[exercise.targetMetric.toLowerCase()] || METRIC_COLORS.confidence;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-5 bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 ${colors.bg} rounded-lg mt-0.5`}>
                        <span className="text-lg font-bold">{idx + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-base">{exercise.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{exercise.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant="outline" className={`${colors.text} border-current text-[10px]`}>
                        {exercise.difficulty.toUpperCase()}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`${metricColor} text-[10px] bg-transparent border-0`}
                      >
                        {exercise.targetMetric}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 pl-14">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Steps
                    </p>
                    <ol className="space-y-2">
                      {exercise.steps.map((step, stepIdx) => (
                        <li key={stepIdx} className="text-sm text-muted-foreground flex gap-2">
                          <span className="font-bold text-primary shrink-0">{stepIdx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
