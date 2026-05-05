import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Target, Music, Volume2, Zap, Activity, Heart, Smile, Wind, 
  MessageSquare, BookOpen, ShieldCheck, Stethoscope, Gauge,
  Timer, Waves, ShieldAlert, Globe
} from 'lucide-react';
import { motion } from 'motion/react';

const glossaryItems = [
  {
    title: "Confidence Score",
    icon: Target,
    color: "text-primary",
    description: "Measured by vocal stability and amplitude consistency. High scores indicate a steady, command-oriented delivery without wavering in volume or pitch under pressure.",
    benchmark: "Target: 85%+"
  },
  {
    title: "Rhythm & Prosody",
    icon: Music,
    color: "text-blue-500",
    description: "Evaluates the musicality of your speech. It looks for natural stress patterns and varied sentence lengths that prevent a 'robotic' or 'flat' delivery.",
    benchmark: "Target: 70%+"
  },
  {
    title: "Intonation",
    icon: Volume2,
    color: "text-indigo-500",
    description: "The rise and fall of your voice. Effective intonation distinguishes between questions, statements, and emphasis, preventing a monotone experience for the listener.",
    benchmark: "Dynamic range analysis"
  },
  {
    title: "Articulation",
    icon: Zap,
    color: "text-amber-500",
    description: "Refers to the clarity of consonant and vowel production. The AI identifies 'mumbled' terminals and slurred transitions between complex phonemes.",
    benchmark: "Phoneme clarity"
  },
  {
    title: "Vocal Resonance",
    icon: Activity,
    color: "text-purple-500",
    description: "Analyzes where the voice vibrates (Chest vs. Nasal vs. Head). Rich resonance typically indicates a relaxed throat and proper breath support.",
    benchmark: "Forward placement"
  },
  {
    title: "Breath Management",
    icon: Wind,
    color: "text-emerald-500",
    description: "Checks for audible 'gasping', end-of-sentence fading, and proper use of pauses for inhalation. Good breath control enables longer, more powerful phrases.",
    benchmark: "Support & Capacity"
  },
  {
    title: "Vocal Health",
    icon: Heart,
    color: "text-rose-500",
    description: "Detects signs of vocal strain, 'glottal fry', and excessive tension in the vocal folds. This metric prioritizes long-term voice preservation.",
    benchmark: "Strain Index"
  },
  {
    title: "Speaking Pace (WPM)",
    icon: Gauge,
    color: "text-slate-500",
    description: "Measured in Words Per Minute. Professional speaking typically falls between 120-160 WPM depending on the emotional intent and audience size.",
    benchmark: "120 - 150 WPM"
  },
  {
    title: "Sentiment Analysis",
    icon: Smile,
    color: "text-orange-500",
    description: "The emotional 'charge' of the speech. It maps vocal features to an emotional spectrum (Positive, Neutral, Negative) to ensure intent matches delivery.",
    benchmark: "Emotional Alignment"
  },
  {
    title: "Filler Words",
    icon: MessageSquare,
    color: "text-slate-400",
    description: "Tracks 'um', 'ah', 'like', and 'so'. Excessive fillers are often markers of cognitive load or anxiety and can undermine perceived authority.",
    benchmark: "Minimal occurrence"
  },
  {
    title: "Micro-Hesitations",
    icon: Timer,
    color: "text-amber-600",
    description: "Detection of brief, non-filler pauses (under 500ms) that interrupt the speaker's flow. These are often indicators of internal processing or uncertainty.",
    benchmark: "Flow interruptions"
  },
  {
    title: "Plosive Clarity",
    icon: Waves,
    color: "text-cyan-500",
    description: "Analysis of 'stop' consonants like /p/, /b/, /t/, and /d/. Proper release of these sounds ensures words are distinct and professional.",
    benchmark: "Consonant Release"
  },
  {
    title: "Environment Quality",
    icon: ShieldAlert,
    color: "text-emerald-600",
    description: "Evaluates the Signal-to-Noise ratio. High background noise or poor hardware resolution can mask phonetic details, potentially reducing AI accuracy.",
    benchmark: "Signal-to-Noise"
  },
  {
    title: "Mic Calibration",
    icon: Volume2,
    color: "text-rose-500",
    description: "Hardware-specific sensitivity calibration. Modern devices provide cleaner signals, while older hardware may introduce 'clipping' or 'hiss' that affects articulation scores.",
    benchmark: "System Gain"
  },
  {
    title: "Linguistic Accent",
    icon: Globe,
    color: "text-indigo-600",
    description: "Identifies regional or cultural phonetic patterns. This is used for contextual feedback on syllable stress and vowel length expectations in different speaking environments.",
    benchmark: "Phonetic Profile"
  },
  {
    title: "Clarity Index",
    icon: ShieldCheck,
    color: "text-blue-600",
    description: "A calculated metric of how easily a general audience would understand the speaker. It balances accent preservation with clear enunciation of key word terminals.",
    benchmark: "Listener Ease"
  }
];

export const Glossary = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono uppercase tracking-widest"
        >
          <BookOpen className="h-3 w-3" /> Technical Documentation
        </motion.div>
        <h1 className="text-4xl font-serif italic tracking-tight">Speech Intelligence Glossary</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Understand the biometric and linguistic metrics SpeakFlow uses to analyze your communication style.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {glossaryItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all group">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`p-2.5 rounded-xl bg-background border border-border group-hover:scale-110 transition-transform ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base tracking-tight">{item.title}</CardTitle>
                  <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mt-0.5">{item.benchmark}</p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20 p-6 rounded-[2rem]">
        <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2 text-center md:text-left">
                <h3 className="text-lg font-bold">Analysis Engine: Clinical & Coaching Expert Panel</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Our AI is prompted to simulate a joint evaluation by a **Speech Pathologist** (focusing on vocal health and articulation) and a **Professional Voice Coach** (focusing on delivery and executive presence). Every insight is cross-referenced between these two paradigms to give you the most balanced feedback possible.
                </p>
            </div>
        </div>
      </Card>

      <div className="flex items-center justify-center gap-2 pt-10 text-muted-foreground/40 font-mono text-[10px] uppercase tracking-widest">
        <Stethoscope className="h-3 w-3" /> Validated by SpeakFlow AI v1.5
      </div>
    </div>
  );
};
