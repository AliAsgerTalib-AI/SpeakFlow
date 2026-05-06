import { SpeechFeedback } from '@/src/types';
import { toast } from 'sonner';

interface SessionLog {
  id: string;
  userId: string;
  timestamp: number;
  script: string;
  feedback: SpeechFeedback;
}

export const useSessionPersistence = () => {
  const saveSession = (script: string, feedback: SpeechFeedback) => {
    const sessionLog: SessionLog = {
      id: Date.now().toString(),
      userId: 'anonymous',
      timestamp: Date.now(),
      script,
      feedback,
    };

    const saved = localStorage.getItem('speakflow_sessions');
    const sessions = saved ? JSON.parse(saved) : [];
    sessions.unshift(sessionLog);
    localStorage.setItem('speakflow_sessions', JSON.stringify(sessions.slice(0, 50)));

    toast.success('Analysis complete and saved locally!');
  };

  const downloadSession = (sessionType: 'scripted' | 'free-speech', feedback: SpeechFeedback, script?: string) => {
    const sessionData = {
      timestamp: new Date().toISOString(),
      type: sessionType,
      ...(script && { script }),
      feedback,
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speakflow-${sessionType}-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Session saved to device!');
  };

  return { saveSession, downloadSession };
};
