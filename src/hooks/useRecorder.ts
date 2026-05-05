import { useState, useRef, useCallback } from 'react';

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      const recorder = MediaRecorder.isTypeSupported('audio/webm') 
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream);
        
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setMimeType(recorder.mimeType || 'audio/webm');

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const finalMimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: finalMimeType });
        setMimeType(finalMimeType);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert to base64 for Gemini
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          setAudioBase64(base64data);
        };
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    setAudioUrl(null);
    setAudioBase64(null);
    setRecordingTime(0);
    chunksRef.current = [];
  }, []);

  return {
    isRecording,
    recordingTime,
    audioUrl,
    audioBase64,
    mimeType,
    startRecording,
    stopRecording,
    resetRecording
  };
}
