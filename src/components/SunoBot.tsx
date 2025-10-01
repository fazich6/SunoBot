'use client';

import React, { useState, useRef, useEffect } from 'react';
import { getAIAnswer, getSpokenResponse } from '@/app/actions';
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder';
import { SunoBotLogo, ThinkingIcon, Volume2 } from '@/components/icons';
import HelperPacks from '@/components/HelperPacks';
import ConversationView from '@/components/ConversationView';
import MicrophoneButton from '@/components/MicrophoneButton';
import { useToast } from "@/hooks/use-toast";
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export type Message = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
};

export type Status = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function SunoBot() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => user ? doc(firestore, 'settings', user.uid) : null, [user, firestore]);
  const { data: settings } = useDoc<{ language: 'English' | 'Urdu' }>(settingsRef);
  const language = settings?.language || 'English';

  const handleRecordingComplete = async (audioDataUri: string) => {
    setStatus('thinking');
    try {
      const { answer, transcribedText } = await getAIAnswer({ 
        audioDataUri,
        conversationHistory: conversation.slice(-5).map(m => ({role: m.role, text: m.text})),
        language
       });

      if (!transcribedText) {
        throw new Error('Transcription failed.');
      }
      
      const userMessage: Message = { id: Date.now(), role: 'user', text: transcribedText };
      const assistantMessage: Message = { id: Date.now() + 1, role: 'assistant', text: answer, audioUrl: '' };

      setConversation(prev => [...prev, userMessage, assistantMessage]);
      setShowFavorites(false);
      
      await playResponse(answer, Date.now() + 1);

    } catch (error) {
      console.error('Error during transcription and response:', error);
      toast({
        title: "Error",
        description: "Sorry, I couldn't understand that. Please try again.",
        variant: "destructive",
      });
      setStatus('idle');
    }
  };

  const { isRecording, startRecording, stopRecording } = useAudioRecorder(handleRecordingComplete);

  useEffect(() => {
    if (status === 'listening' && !isRecording) {
      startRecording();
    } else if (status !== 'listening' && isRecording) {
      stopRecording();
    }
  }, [status, isRecording, startRecording, stopRecording]);

  const processQuery = async (query: string) => {
    try {
      setStatus('thinking');
      const { answer } = await getAIAnswer({
        question: query,
        conversationHistory: conversation.slice(-5).map(m => ({role: m.role, text: m.text})),
        language
      });

      const assistantMessage: Message = { id: Date.now() + 1, role: 'assistant', text: answer, audioUrl: '' };
      setConversation(prev => [...prev, assistantMessage]);

      await playResponse(answer, assistantMessage.id);
    } catch (error) {
      console.error('Error processing query:', error);
       toast({
        title: "Error",
        description: "Something went wrong while getting your answer. Please try again.",
        variant: "destructive",
      });
      setStatus('idle');
    }
  };

  const playResponse = async (text: string, messageId: number) => {
    try {
      const { media } = await getSpokenResponse(text);

      setConversation(prev => prev.map(m => m.id === messageId ? {...m, audioUrl: media} : m));

      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      
      const audio = new Audio(media);
      audioPlayerRef.current = audio;
      setStatus('speaking');
      audio.play();
      audio.onended = () => {
        setStatus('idle');
        audioPlayerRef.current = null;
      };
    } catch (error) {
       console.error('Error playing response:', error);
       toast({
        title: "Audio Error",
        description: "Could not play the audio response.",
        variant: "destructive",
      });
      setStatus('idle');
    }
  }


  const handleHelperPackClick = async (prompt: string) => {
    if (status !== 'idle') return;
    const userMessage: Message = { id: Date.now(), role: 'user', text: prompt };
    setConversation(prev => [...prev, userMessage]);
    setShowFavorites(false);
    await processQuery(prompt);
  };
  
  const handleBookmarkToggle = (messageId: number) => {
    setBookmarkedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleMicPress = () => {
    if (showFavorites) setShowFavorites(false);
    if (status === 'speaking' && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    setStatus('listening');
  };

  const handleMicRelease = () => {
    if (status === 'listening') {
      setStatus('thinking'); // This will trigger stopRecording via useEffect
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'listening': return "Listening...";
      case 'thinking': return "Thinking...";
      case 'speaking': return "Speaking...";
      default: return "Tap and hold to speak";
    }
  };
  
  const messagesToDisplay = showFavorites 
    ? conversation.filter(msg => msg.role === 'assistant' && bookmarkedIds.has(msg.id))
    : conversation;


  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex justify-between items-center p-4">
        <SunoBotLogo className="h-8 w-auto" />
        <div className="flex items-center gap-2">
          {status === 'thinking' && <ThinkingIcon className="animate-spin text-primary" />}
          {status === 'speaking' && <Volume2 className="animate-pulse text-primary"/>}
          <div className="text-sm font-medium">{language}</div>
          <Button variant="ghost" size="icon" onClick={() => setShowFavorites(!showFavorites)} className="h-9 w-9 text-muted-foreground" aria-label="View Bookmarks">
            <Bookmark size={18} className={cn("transition-colors", showFavorites && 'fill-primary text-primary')} />
          </Button>
        </div>
      </header>

      <div className="flex-grow overflow-hidden px-4 pb-4">
        { messagesToDisplay.length === 0 ? (
          showFavorites ? (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <Bookmark size={48} className="mb-4" />
                <h2 className="text-xl font-semibold text-foreground">No Bookmarked Answers</h2>
                <p className="mt-2">Tap the bookmark icon on any answer to save it here.</p>
            </div>
          ) : (
            <HelperPacks onPackClick={handleHelperPackClick} />
          )
        ) : (
          <ConversationView conversation={messagesToDisplay} bookmarkedIds={bookmarkedIds} onBookmark={handleBookmarkToggle} />
        )}
      </div>

      <footer className="p-4 flex flex-col items-center justify-center space-y-2 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <MicrophoneButton
          status={status}
          onMouseDown={handleMicPress}
          onMouseUp={handleMicRelease}
          onTouchStart={handleMicPress}
          onTouchEnd={handleMicRelease}
        />
        <p className="text-sm text-muted-foreground h-4">{getStatusMessage()}</p>
      </footer>
    </div>
  );
}
