'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Loader2, Play, Square, CameraOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getImageAnalysis, getSpokenResponse } from '@/app/actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function Analyze() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isLive, setIsLive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const stopAllActivity = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsLive(false);
    setIsProcessing(false);
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
      stopAllActivity();
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [facingMode, toast, stopAllActivity]);


  const handleAnalysis = useCallback(async () => {
    if (!videoRef.current || isProcessing || !isLive) return;

    setIsProcessing(true);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        setIsProcessing(false);
        return;
    };
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg');

    try {
      const { description } = await getImageAnalysis({ imageDataUri: dataUri, language: 'Urdu' });
      
      if (description && isLive) { // Check if still live before speaking
        const { media } = await getSpokenResponse({ text: description });
        if (media && isLive) { // Check again
          setIsSpeaking(true);
          const audio = new Audio(media);
          audioPlayerRef.current = audio;
          audio.play();
          audio.onended = () => {
            setIsSpeaking(false);
            audioPlayerRef.current = null;
          };
        }
      }
    } catch (error) {
      console.error('Analysis or speech failed:', error);
       toast({ variant: 'destructive', title: 'Error', description: 'Could not process the analysis or speech.' });
    } finally {
        setIsProcessing(false);
    }
  }, [isProcessing, toast, isLive]);
  
  const switchCamera = () => {
    if (isLive) return;
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const toggleLiveAnalysis = () => {
    if (isLive) {
      stopAllActivity();
    } else {
      setIsLive(true);
      // Analyze immediately, then set interval
      handleAnalysis(); 
      analysisIntervalRef.current = setInterval(handleAnalysis, 7000); 
    }
  };

  return (
    <div className="flex flex-col h-full bg-black relative">
       <header className="absolute top-0 left-0 w-full p-4 z-10 bg-gradient-to-b from-black/50 to-transparent">
        <h1 className="text-xl font-bold text-center text-white">Live Vision</h1>
      </header>
      
      <div className="flex-grow w-full h-full flex items-center justify-center">
        {hasCameraPermission === false ? (
             <div className="text-center text-white p-4">
                <CameraOff size={48} className="mx-auto mb-4" />
                <Alert variant="destructive">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>Please allow camera access in your browser settings.</AlertDescription>
                </Alert>
             </div>
        ) : (
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
        )}
      </div>

       <div className="absolute bottom-0 left-0 w-full p-4 z-10 bg-gradient-to-t from-black/50 to-transparent flex justify-center items-center gap-4">
          <Button 
            onClick={toggleLiveAnalysis} 
            className="w-20 h-20 rounded-full" 
            variant={isLive ? 'destructive' : 'default'}
            disabled={hasCameraPermission === false}
          >
              {isProcessing && !isSpeaking ? <Loader2 className="animate-spin" size={32}/> : isLive ? <Square size={32} /> : <Play size={32} />}
          </Button>
          {!isLive && (
             <Button onClick={switchCamera} variant="outline" size="icon" className="bg-black/30 text-white border-white/50 rounded-full w-12 h-12" disabled={hasCameraPermission === false}>
                <RefreshCcw />
              </Button>
          )}
      </div>
    </div>
  );
}
