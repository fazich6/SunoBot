'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCcw, Loader2, Play, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getImageAnalysis, getSpokenResponse } from '@/app/actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function Analyze() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{ description: string; extractedText?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
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
    };
  }, [facingMode, toast]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const dataUri = canvas.toDataURL('image/jpeg');
      setImageDataUri(dataUri);
      handleAnalysis(dataUri);
    }
  };
  
  const handleAnalysis = async (dataUri: string) => {
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await getImageAnalysis({ imageDataUri: dataUri, language: 'English' });
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Could not analyze the image.' });
    } finally {
      setIsLoading(false);
    }
  };

  const playAnalysisAudio = async () => {
    if (!analysis || isSpeaking) return;
    const textToSpeak = `Description: ${analysis.description}. ${analysis.extractedText ? `Extracted text: ${analysis.extractedText}` : ''}`;
    setIsSpeaking(true);
    try {
      const { media } = await getSpokenResponse(textToSpeak);
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

  const retakePhoto = () => {
    setImageDataUri(null);
    setAnalysis(null);
  };
  
  const switchCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="flex flex-col h-full bg-background">
       <header className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">Analyze Surroundings</h1>
      </header>
      <div className="flex-grow grid md:grid-cols-2 gap-4 p-4 overflow-y-auto">
        <div className="flex flex-col gap-4 items-center justify-center p-4 border rounded-lg">
          <div className="w-full aspect-video bg-muted rounded-md overflow-hidden relative flex items-center justify-center">
            {hasCameraPermission === false && <Alert variant="destructive"><AlertTitle>Camera Access Required</AlertTitle><AlertDescription>Please allow camera access.</AlertDescription></Alert>}
            {imageDataUri ? (
              <img src={imageDataUri} alt="Captured" className="w-full h-full object-contain" />
            ) : (
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            )}
          </div>
          <div className="flex gap-2">
            {imageDataUri ? (
              <Button onClick={retakePhoto} variant="outline" className="w-full">
                <RefreshCcw className="mr-2" /> Retake
              </Button>
            ) : (
              <>
                <Button onClick={capturePhoto} className="w-full" disabled={hasCameraPermission === false}>
                  <Camera className="mr-2" /> Capture Photo
                </Button>
                <Button onClick={switchCamera} variant="outline" disabled={hasCameraPermission === false}>
                  <RefreshCcw />
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 p-4 border rounded-lg">
           <h2 className="font-bold text-lg">Analysis Result</h2>
          {isLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" />Analyzing...</div>}
          {analysis && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Description</h3>
                <p className="text-sm text-muted-foreground">{analysis.description}</p>
              </div>
              {analysis.extractedText && (
                <div>
                  <h3 className="font-semibold">Extracted Text</h3>
                  <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">{analysis.extractedText}</p>
                </div>
              )}
              <Button onClick={playAnalysisAudio} disabled={isSpeaking}>
                {isSpeaking ? <Volume2 className="mr-2 animate-pulse"/> : <Play className="mr-2" />}
                {isSpeaking ? 'Playing...' : 'Play Audio'}
              </Button>
            </div>
          )}
          {!isLoading && !analysis && (
             <div className="text-center text-muted-foreground flex-grow flex flex-col items-center justify-center">
                <p>Capture a photo to get an AI-powered analysis of your surroundings.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
