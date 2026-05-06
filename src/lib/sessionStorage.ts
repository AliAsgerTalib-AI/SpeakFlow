import { SessionLog } from '@/src/types';

const STORAGE_KEY = 'speakflow_sessions';
const MAX_SESSIONS = 50;

export function saveSession(log: SessionLog): void {
  const saved = localStorage.getItem(STORAGE_KEY);
  const sessions: SessionLog[] = saved ? JSON.parse(saved) : [];
  sessions.unshift(log);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
}

export function downloadSessionJSON(data: object, prefix: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `speakflow-${prefix}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
