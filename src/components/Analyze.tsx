'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCcw, Send, Loader2, Mic, Play, StopCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder';
import { getImageQuestionAnswer, getSpokenResponse } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Analyze() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [spokenResponseUrl, setSpokenResponseUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const stopPlayback = () => {
    if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
        audioPlayerRef.current = null;
        setIsPlaying(false);
    }
  };
  
  const resetState = () => {
    stopPlayback();
    setImageDataUri(null);
    setIsCapturing(true);
    setSpokenResponseUrl(null);
    setTranscribedText(null);
    setIsProcessing(false);
  }

  const startCamera = useCallback(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast({
          variant: 'destructive',
          title: 'Camera Error',
          description: 'Could not access the camera. Please check permissions.',
        });
      }
  }, [facingMode, toast]);

  useEffect(() => {
    if (isCapturing) {
      startCamera();
    } else {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
    }
  }, [isCapturing, startCamera]);
  
  useEffect(() => {
    // Start with the camera on
    setIsCapturing(true);
  }, []);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg');
    setImageDataUri(dataUri);
    setIsCapturing(false);
  };
  
  const handleVoiceAndSubmit = async (audioDataUri?: string) => {
    if (!imageDataUri || isProcessing) return;

    setIsProcessing(true);
    setTranscribedText(null);
    setSpokenResponseUrl(null);
    stopPlayback();

    try {
        const result = await getImageQuestionAnswer({ imageDataUri, audioDataUri, language: 'Urdu' });
        
        if(result.transcribedText) setTranscribedText(result.transcribedText);

        const spokenResponse = await getSpokenResponse({ text: result.answer, voice: 'Female' });
        setSpokenResponseUrl(spokenResponse.media);

    } catch (error) {
        console.error('Analysis failed:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to analyze the image.' });
    } finally {
        setIsProcessing(false);
    }
  };

  const { isRecording, startRecording, stopRecording } = useAudioRecorder((audioDataUri) => handleVoiceAndSubmit(audioDataUri));
  
  const handlePlaybackToggle = () => {
    if (isPlaying) {
      stopPlayback();
    } else if (spokenResponseUrl) {
      const audio = new Audio(spokenResponseUrl);
      audioPlayerRef.current = audio;
      setIsPlaying(true);
      audio.play();
      audio.onended = () => {
        setIsPlaying(false);
        audioPlayerRef.current = null;
      };
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    setIsCapturing(true);
  };


  return (
    <div className="flex flex-col h-full bg-black relative">
      <header className="absolute top-0 left-0 w-full p-4 z-10 bg-gradient-to-b from-black/50 to-transparent flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Analyze Vision</h1>
         {!isCapturing && (
            <Button onClick={resetState} variant="ghost" size="icon" className="text-white">
                <X />
            </Button>
         )}
      </header>

      <div className="flex-grow w-full h-full flex items-center justify-center">
        {isCapturing ? (
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
        ) : imageDataUri && (
            <Image src={imageDataUri} alt="Captured" layout="fill" objectFit="contain" />
        )}
      </div>

       {transcribedText && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[90%] z-10">
          <Alert>
              <AlertDescription className="text-center font-urdu text-lg">{transcribedText}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="absolute bottom-0 left-0 w-full p-4 z-10 bg-gradient-to-t from-black/50 to-transparent flex justify-center items-center gap-4">
        {isCapturing ? (
          <>
            <Button onClick={handleCapture} className="w-20 h-20 rounded-full border-4 border-black/50 bg-white hover:bg-gray-200" />
            <Button onClick={switchCamera} variant="outline" size="icon" className="absolute right-4 bg-black/30 text-white border-white/50 rounded-full w-12 h-12">
              <RefreshCcw />
            </Button>
          </>
        ) : (
          <>
            {isProcessing ? (
                <Loader2 className="w-16 h-16 animate-spin text-white" />
            ) : spokenResponseUrl ? (
                <Button onClick={handlePlaybackToggle} size="icon" className="w-20 h-20 rounded-full">
                    {isPlaying ? <StopCircle size={32} /> : <Play size={32} />}
                </Button>
            ) : (
                <>
                <Button 
                    size="icon" 
                    className="w-20 h-20 rounded-full"
                    variant={isRecording ? 'destructive' : 'default'}
                    onClick={isRecording ? stopRecording : startRecording}
                >
                    <Mic size={32} />
                </Button>
                 <Button onClick={() => handleVoiceAndSubmit()} size="icon" className="w-14 h-14 rounded-full" variant="secondary">
                    <Send />
                </Button>
                </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
