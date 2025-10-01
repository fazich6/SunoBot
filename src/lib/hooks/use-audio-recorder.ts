'use client';

import { useState, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useAudioRecorder = (onRecordingComplete: (audioDataUri: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.addEventListener('dataavailable', (event) => {
        audioChunksRef.current.push(event.data);
      });

      recorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          onRecordingComplete(base64String);
        };
        stream.getTracks().forEach(track => track.stop()); // Stop the mic access
      });

      recorder.start();
    } catch (err) {
      console.error('Failed to start recording', err);
      toast({
        title: "Microphone Error",
        description: "Could not access the microphone. Please check your browser permissions.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  }, [isRecording, onRecordingComplete, toast]);

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }, [isRecording]);

  return { isRecording, startRecording, stopRecording };
};
