'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCcw, Loader2, Bot, Type, Play, StopCircle, Video, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getImageAnalysis, getSpokenResponse } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function Analyze() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(true);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ description: string; extractedText?: string; } | null>(null);
  const [spokenResponseUrl, setSpokenResponseUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
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
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  }, [facingMode, toast]);

  useEffect(() => {
    startCamera();
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [startCamera]);

  const stopPlayback = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      setIsPlaying(false);
      audioPlayerRef.current = null;
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setIsCapturing(false);
    setIsProcessing(true);
    setAnalysisResult(null);
    setSpokenResponseUrl(null);
    stopPlayback();

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg');
    setImageDataUri(dataUri);

    try {
      const result = await getImageAnalysis({ imageDataUri: dataUri, language: 'Urdu' });
      setAnalysisResult(result);
      if (result.description) {
        const spokenResponse = await getSpokenResponse({ text: result.description, voice: 'Male' });
        setSpokenResponseUrl(spokenResponse.media);
      }
    } catch (error) {
      console.error('Image analysis failed:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to analyze the image.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setIsCapturing(true);
    setImageDataUri(null);
    setAnalysisResult(null);
    setSpokenResponseUrl(null);
    stopPlayback();
  };

  const switchCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };
  
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

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">Analyze Image</h1>
      </header>
      <div className="flex-grow grid md:grid-cols-2 gap-4 p-4 overflow-hidden">
        {/* Left Column: Input */}
        <div className="flex flex-col gap-4 border rounded-lg p-4">
          <div className="w-full aspect-video bg-muted rounded-md overflow-hidden relative flex items-center justify-center">
            {hasCameraPermission === false ? (
               <div className="text-center text-destructive">
                <AlertCircle className="mx-auto h-12 w-12" />
                <p className="mt-2 font-semibold">Camera Access Required</p>
                <p className="text-sm">Please allow camera access in your browser.</p>
              </div>
            ) : isCapturing ? (
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            ) : imageDataUri ? (
              <Image src={imageDataUri} alt="Captured" layout="fill" objectFit="contain" />
            ) : (
                <div className="text-center text-muted-foreground">
                    <Video className="mx-auto h-12 w-12" />
                    <p>Loading Camera...</p>
                </div>
            )}
          </div>
          <div className="flex justify-center items-center gap-4">
            {isCapturing ? (
              <>
                <Button onClick={handleCapture} className="w-20 h-20 rounded-full border-4 border-black/50 bg-white hover:bg-gray-200" disabled={!hasCameraPermission}/>
                <Button onClick={switchCamera} variant="outline" size="icon" className="absolute right-8" disabled={!hasCameraPermission}>
                  <RefreshCcw />
                </Button>
              </>
            ) : (
              <Button onClick={handleRetake} variant="outline">
                <Camera className="mr-2 h-4 w-4" />
                Retake Photo
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="flex flex-col border rounded-lg overflow-hidden">
          {isProcessing ? (
             <div className="flex-grow flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
             </div>
          ) : analysisResult ? (
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bot className="w-6 h-6 text-primary" />
                                <CardTitle>Description</CardTitle>
                            </div>
                            <Button onClick={handlePlaybackToggle} size="icon" variant="outline" disabled={!spokenResponseUrl}>
                                {isPlaying ? <StopCircle/> : <Play />}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p dir="rtl" className="font-urdu text-right text-lg leading-relaxed">{analysisResult.description}</p>
                    </CardContent>
                </Card>
                {analysisResult.extractedText && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Type className="w-6 h-6 text-primary" />
                                <CardTitle>Extracted Text</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="font-mono text-sm whitespace-pre-wrap">{analysisResult.extractedText}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-center text-muted-foreground p-8">
                <p>Capture a photo to see the AI analysis here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
