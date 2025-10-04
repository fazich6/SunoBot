'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Loader2, Play, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getImageAnalysis, getSpokenResponse } from '@/app/actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function Analyze() {
  const [analysis, setAnalysis] = useState<{ description: string; extractedText?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isLive, setIsLive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

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
          description: 'Please enable camera permissions to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [facingMode, toast]);

  const playAnalysisAudio = async (textToSpeak: string) => {
    if (!textToSpeak || isSpeaking) return;
    
    setIsSpeaking(true);
    try {
      const { media } = await getSpokenResponse({ text: textToSpeak });
      const audio = new Audio(media);
      audioPlayerRef.current = audio;
      audio.play();
      audio.onended = () => {
        setIsSpeaking(false);
        audioPlayerRef.current = null;
      }
    } catch (error) {
      console.error("Audio playback failed:", error);
      toast({ variant: 'destructive', title: 'Audio Error', description: 'Could not play the analysis.' });
      setIsSpeaking(false);
    }
  };

  const handleAnalysis = useCallback(async () => {
    if (!videoRef.current || isLoading) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg');
    
    setIsLoading(true);
    try {
      const result = await getImageAnalysis({ imageDataUri: dataUri, language: 'Urdu' });
      setAnalysis(result);
      await playAnalysisAudio(result.description);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Could not analyze the image.' });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, toast, isSpeaking]);
  
  const switchCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const toggleLiveAnalysis = () => {
    if (isLive) {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      setIsLive(false);
    } else {
      setIsLive(true);
      handleAnalysis(); // Analyze immediately
      analysisIntervalRef.current = setInterval(handleAnalysis, 5000); // then every 5 seconds
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
       <header className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">Live Vision</h1>
      </header>
      <div className="flex-grow grid md:grid-cols-2 gap-4 p-4 overflow-y-auto">
        <div className="flex flex-col gap-4 items-center justify-center p-4 border rounded-lg">
          <div className="w-full aspect-video bg-muted rounded-md overflow-hidden relative flex items-center justify-center">
            {hasCameraPermission === false && <Alert variant="destructive"><AlertTitle>Camera Access Required</AlertTitle><AlertDescription>Please allow camera access.</AlertDescription></Alert>}
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          </div>
          <div className="flex gap-2 w-full">
            <Button onClick={toggleLiveAnalysis} className="w-full" disabled={hasCameraPermission === false}>
                {isLive ? <Square className="mr-2" /> : <Play className="mr-2" />}
                {isLive ? 'Stop' : 'Start'} Live Feed
              </Button>
              <Button onClick={switchCamera} variant="outline" disabled={hasCameraPermission === false || isLive}>
                <RefreshCcw />
              </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-4 border rounded-lg">
           <h2 className="font-bold text-lg font-urdu text-right">تجزیہ کا نتیجہ</h2>
          {isLoading && !analysis && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" />Analyzing...</div>}
          {analysis && (
            <div className="space-y-4 text-right" dir="rtl">
              <div>
                <h3 className="font-semibold font-urdu">تفصیل</h3>
                <p className="text-sm text-muted-foreground font-urdu text-lg">{analysis.description}</p>
              </div>
              {analysis.extractedText && (
                <div>
                  <h3 className="font-semibold font-urdu">نکالا ہوا متن</h3>
                  <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">{analysis.extractedText}</p>
                </div>
              )}
            </div>
          )}
          {!isLoading && !analysis && (
             <div className="text-center text-muted-foreground flex-grow flex flex-col items-center justify-center">
                <p>Press "Start Live Feed" to get an AI-powered analysis of your surroundings.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
