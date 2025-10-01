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
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';


export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
  createdAt?: any;
};

export type Status = 'idle' | 'listening' | 'thinking' | 'speaking';

type Settings = {
  language: 'English' | 'Urdu';
  theme?: 'light' | 'dark' | 'system';
  voicePreference?: 'Male' | 'Female';
  enableTopicSuggestions?: boolean;
}

export default function SunoBot() {
  const [status, setStatus] = useState<Status>('idle');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => user ? doc(firestore, 'settings', user.uid) : null, [user, firestore]);
  const { data: settings } = useDoc<Settings>(settingsRef);
  const language = settings?.language || 'English';

  const chatHistoryColRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'chatHistory') : null, [user, firestore]);
  const chatHistoryQuery = useMemoFirebase(() => chatHistoryColRef ? query(chatHistoryColRef, orderBy('createdAt', 'asc')) : null, [chatHistoryColRef]);
  const { data: conversation, isLoading: isHistoryLoading } = useCollection<Message>(chatHistoryQuery);

  const handleLanguageToggle = () => {
    if (!settingsRef || !settings) return;
    const newLanguage = language === 'English' ? 'Urdu' : 'English';
    setDocumentNonBlocking(settingsRef, { ...settings, language: newLanguage }, { merge: true });
  }
  
  const saveMessage = (message: Omit<Message, 'id' | 'createdAt'>) => {
      if (!chatHistoryColRef) return;
      addDocumentNonBlocking(chatHistoryColRef, { ...message, createdAt: new Date().toISOString() });
  }

  const handleRecordingComplete = async (audioDataUri: string) => {
    setStatus('thinking');
    try {
      const { answer, transcribedText } = await getAIAnswer({ 
        audioDataUri,
        conversationHistory: conversation?.slice(-5).map(m => ({role: m.role, text: m.text})) || [],
        language
       });

      if (!transcribedText) {
        throw new Error('Transcription failed.');
      }
      
      saveMessage({ role: 'user', text: transcribedText });
      saveMessage({ role: 'assistant', text: answer, audioUrl: '' });
      
      setShowFavorites(false);
      
      const assistantMessage = conversation?.find(m => m.text === answer);
      if(assistantMessage) {
        await playResponse(answer, assistantMessage.id);
      }

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
      saveMessage({ role: 'user', text: query });

      const { answer } = await getAIAnswer({
        question: query,
        conversationHistory: conversation?.slice(-5).map(m => ({role: m.role, text: m.text})) || [],
        language
      });
      
      const assistantMsgData = { role: 'assistant', text: answer, audioUrl: '' };
      saveMessage(assistantMsgData);
      
      const assistantMessage = conversation?.find(m => m.text === answer);
      if(assistantMessage) {
        await playResponse(answer, assistantMessage.id);
      }

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

  const playResponse = async (text: string, messageId: string) => {
    if (!chatHistoryColRef) return;
    try {
      const { media } = await getSpokenResponse(text);
      const messageRef = doc(chatHistoryColRef, messageId);
      setDocumentNonBlocking(messageRef, { audioUrl: media }, { merge: true });
      handlePlaybackToggle(messageId, media);
    } catch (error) {
       console.error('Error playing response:', error);
       toast({
        title: "Audio Error",
        description: "Could not play the audio response.",
        variant: "destructive",
      });
      setStatus('idle');
      setCurrentlyPlayingId(null);
    }
  }

  const handlePlaybackToggle = (messageId: string, audioUrlOverride?: string) => {
    if (audioPlayerRef.current && currentlyPlayingId === messageId) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
      setCurrentlyPlayingId(null);
      setStatus('idle');
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const message = conversation?.find(m => m.id === messageId);
    const audioUrl = audioUrlOverride || message?.audioUrl;

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      setCurrentlyPlayingId(messageId);
      setStatus('speaking');
      audio.play();
      audio.onended = () => {
        setCurrentlyPlayingId(null);
        setStatus('idle');
        audioPlayerRef.current = null;
      };
    }
  };


  const handleHelperPackClick = async (prompt: string) => {
    if (status !== 'idle') return;
    setShowFavorites(false);
    await processQuery(prompt);
  };
  
  const handleBookmarkToggle = (messageId: string) => {
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
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
      setCurrentlyPlayingId(null);
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
    ? conversation?.filter(msg => msg.role === 'assistant' && bookmarkedIds.has(msg.id))
    : conversation;


  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex justify-between items-center p-4">
        <SunoBotLogo className="h-8 w-auto" />
        <div className="flex items-center gap-2">
          {status === 'thinking' && <ThinkingIcon className="animate-spin text-primary" />}
          {status === 'speaking' && <Volume2 className="animate-pulse text-primary"/>}
          <Button variant="ghost" onClick={handleLanguageToggle} className="text-sm font-medium">
            {language}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowFavorites(!showFavorites)} className="h-9 w-9 text-muted-foreground" aria-label="View Bookmarks">
            <Bookmark size={18} className={cn("transition-colors", showFavorites && 'fill-primary text-primary')} />
          </Button>
        </div>
      </header>

      <div className="flex-grow overflow-hidden px-4 pb-4">
        { (messagesToDisplay || []).length === 0 ? (
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
          <ConversationView 
             conversation={messagesToDisplay || []}
             bookmarkedIds={bookmarkedIds} 
             onBookmark={handleBookmarkToggle}
             onPlaybackToggle={handlePlaybackToggle}
             currentlyPlayingId={currentlyPlayingId}
           />
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
