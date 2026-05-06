import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserProfile, VocalGoal } from '@/src/types';
import { saveUserProfile } from '@/src/lib/userProfile';

interface VocalProfileSetupProps {
  open: boolean;
  onComplete: (profile: UserProfile) => void;
  existingProfile?: UserProfile | null;
  mode: 'onboarding' | 'edit';
}

export const VocalProfileSetup: React.FC<VocalProfileSetupProps> = ({
  open,
  onComplete,
  existingProfile,
  mode,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [vocalGoal, setVocalGoal] = useState<VocalGoal | null>(
    existingProfile?.vocalGoal || null
  );
  const [ageDecade, setAgeDecade] = useState<number | null>(
    existingProfile?.ageDecade || null
  );
  const [biologicalSex, setBiologicalSex] = useState<string>(
    existingProfile?.biologicalSex || ''
  );
  const [neurodiversityFlag, setNeurodiversityFlag] = useState<boolean>(
    existingProfile?.neurodiversityFlag || false
  );

  const handleNext = () => {
    if (step === 1 && vocalGoal) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleComplete = () => {
    if (vocalGoal && ageDecade) {
      const profile: UserProfile = {
        vocalGoal,
        ageDecade,
        biologicalSex: biologicalSex || undefined,
        neurodiversityFlag,
        goldenStateBaseline: existingProfile?.goldenStateBaseline || null,
      };
      saveUserProfile(profile);
      onComplete(profile);
      // Reset state for next use
      setStep(1);
      setVocalGoal(null);
      setAgeDecade(null);
      setBiologicalSex('');
      setNeurodiversityFlag(false);
    }
  };

  const goalOptions: Array<{ value: VocalGoal; title: string; subtitle: string }> = [
    {
      value: 'FEMINIZATION',
      title: 'Feminine Expression',
      subtitle: 'Resonance, intonation lift, forward placement',
    },
    {
      value: 'MASCULINIZATION',
      title: 'Masculine Expression',
      subtitle: 'Resonance depth, chest register, projection',
    },
    {
      value: 'NEUTRAL',
      title: 'Expressive Speaker',
      subtitle: 'Confidence, clarity, and natural delivery',
    },
    {
      value: 'MAINTENANCE',
      title: 'Voice Care & Stamina',
      subtitle: 'Protect, restore, and sustain vocal health',
    },
  ];

  const ageOptions = [20, 30, 40, 50, 60, 70];

  const sexOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ];

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Let's personalize your experience</DialogTitle>
              <DialogDescription>
                Your coach adapts based on what you're working toward — no forms, just focus.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Select your vocal goal:</p>
              <div className="grid grid-cols-2 gap-3">
                {goalOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={vocalGoal === option.value ? 'default' : 'outline'}
                    className="h-auto flex flex-col items-start p-4 text-left"
                    onClick={() => setVocalGoal(option.value)}
                  >
                    <span className="font-semibold text-sm">{option.title}</span>
                    <span className="text-xs text-muted-foreground mt-1">{option.subtitle}</span>
                  </Button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleNext}
                disabled={!vocalGoal}
                className="w-full"
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>A few quick details</DialogTitle>
              <DialogDescription>
                Helps your AI mentor calibrate its ear for your voice.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Age Decade */}
              <div className="space-y-3">
                <p className="text-sm font-medium">What's your age range?</p>
                <div className="flex flex-wrap gap-2">
                  {ageOptions.map((age) => (
                    <Button
                      key={age}
                      variant={ageDecade === age ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAgeDecade(age)}
                    >
                      {age}s
                      {age === 70 && '+'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Biological Sex (Optional) */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Biological sex
                  <span className="text-xs ml-2 font-normal opacity-70">(optional)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {sexOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={biologicalSex === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBiologicalSex(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Neurodiversity Toggle */}
              <div className="space-y-3">
                <p className="text-sm font-medium">How I process feedback:</p>
                <Button
                  variant={neurodiversityFlag ? 'default' : 'outline'}
                  className="w-full text-left h-auto p-4"
                  onClick={() => setNeurodiversityFlag(!neurodiversityFlag)}
                >
                  <span className={`mr-3 text-lg ${neurodiversityFlag ? '✓' : '○'}`} />
                  <span className="text-sm">
                    I absorb feedback best when it's concrete, step-by-step, and jargon-free
                  </span>
                </Button>
              </div>
            </div>

            <DialogFooter className="flex gap-3">
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!ageDecade}
                className="flex-1"
              >
                Start Coaching
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
