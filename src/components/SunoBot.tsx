'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getAIAnswer, getSpokenResponse, getTranscription, getTopicSuggestions } from '@/app/actions';
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder';
import { SunoBotLogo, ThinkingIcon, Volume2 } from '@/components/icons';
import { Sparkles } from 'lucide-react';
import HelperPacks from '@/components/HelperPacks';
import ConversationView from '@/components/ConversationView';
import MicrophoneButton from '@/components/MicrophoneButton';
import { useToast } from "@/hooks/use-toast";
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt?: any;
};

type UserProfile = {
    bookmarkedMessageIds?: string[];
}

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
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);


  const settingsRef = useMemoFirebase(() => user ? doc(firestore, 'settings', user.uid) : null, [user, firestore]);
  const { data: settings } = useDoc<Settings>(settingsRef);
  const language = settings?.language || 'English';
  const voicePreference = settings?.voicePreference || 'Male';

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const chatHistoryColRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'chatHistory') : null, [user, firestore]);
  const chatHistoryQuery = useMemoFirebase(() => chatHistoryColRef ? query(chatHistoryColRef, orderBy('createdAt', 'asc')) : null, [chatHistoryColRef]);
  const { data: conversation, isLoading: isHistoryLoading } = useCollection<Message>(chatHistoryQuery);
  
  useEffect(() => {
    if (userProfile?.bookmarkedMessageIds) {
        setBookmarkedIds(new Set(userProfile.bookmarkedMessageIds));
    }
  }, [userProfile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, suggestedTopics]);


  const fetchSuggestions = useCallback(async () => {
    const currentConversation = conversation || [];
    if (currentConversation.length === 0 || !settings?.enableTopicSuggestions) {
      setSuggestedTopics([]);
      return;
    };

    try {
      const result = await getTopicSuggestions({
        userHistory: currentConversation.map(m => m.text),
      });
      setSuggestedTopics(result.suggestedTopics.slice(0, 3)); // Limit to 3 suggestions
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestedTopics([]); // Clear suggestions on error
    }
  }, [conversation, settings?.enableTopicSuggestions]);
  
  const handleLanguageToggle = () => {
    if (!settingsRef || !settings) return;
    const newLanguage = language === 'English' ? 'Urdu' : 'English';
    setDocumentNonBlocking(settingsRef, { ...settings, language: newLanguage }, { merge: true });
  }
  
  const saveMessage = async (message: Omit<Message, 'id' | 'createdAt'>) => {
      if (!chatHistoryColRef) return null;
      await addDocumentNonBlocking(chatHistoryColRef, { ...message, createdAt: new Date().toISOString() });
  }

  const processQuery = useCallback(async (query: string) => {
    if (!query || status === 'thinking') return;
  
    setStatus('thinking');
    setSuggestedTopics([]);
  
    // Create an immediate, up-to-date history for the AI
    const currentMessages = conversation || [];
    const updatedHistoryForAI = [...currentMessages.map(m => ({role: m.role, text: m.text})), { role: 'user' as const, text: query }];
  
    // Save user message to Firestore
    await saveMessage({ role: 'user', text: query });
  
    setShowFavorites(false);
  
    try {
        const { answer } = await getAIAnswer({
            question: query,
            conversationHistory: updatedHistoryForAI.slice(-6), // Send last 6 messages for context
            language,
        });
  
        // Save assistant response to Firestore
        await saveMessage({ role: 'assistant', text: answer });
        
        // Fetch suggestions based on the full, now-updated conversation
        if (settings?.enableTopicSuggestions) {
            fetchSuggestions();
        }
  
    } catch (error) {
        console.error('Error processing query:', error);
        toast({
            title: "Error",
            description: "Something went wrong while getting your answer. Please try again.",
            variant: "destructive",
        });
    } finally {
        setStatus('idle');
    }
  }, [conversation, language, settings?.enableTopicSuggestions, status, fetchSuggestions, toast]);


  const handleRecordingComplete = useCallback(async (audioDataUri: string) => {
    setStatus('thinking');
    try {
      const { transcription } = await getTranscription({ audioDataUri, language });

      if (!transcription) {
        throw new Error('Transcription failed or returned empty.');
      }
      
      await processQuery(transcription);

    } catch (error) {
      console.error('Error during transcription and response:', error);
      toast({
        title: "Error",
        description: "Sorry, I couldn't understand that. Please try again.",
        variant: "destructive",
      });
      setStatus('idle');
    }
  }, [language, processQuery, toast]);

  const { isRecording, startRecording, stopRecording } = useAudioRecorder(handleRecordingComplete);
  
  const handleMicClick = () => {
    if (showFavorites) setShowFavorites(false);
  
    if (status === 'speaking' && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
      setCurrentlyPlayingId(null);
      setStatus('idle');
      return;
    }
    
    if (isRecording) {
      stopRecording();
      setStatus('thinking'); 
    } else {
      startRecording();
      setStatus('listening');
    }
  };

  useEffect(() => {
    if (status === 'listening') {
      startRecording();
    } else {
      stopRecording();
    }
  }, [status, startRecording, stopRecording]);


  const handlePlaybackToggle = async (messageId: string) => {
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
    
    if (message?.text) {
      setStatus('speaking');
      setCurrentlyPlayingId(messageId);
      try {
        const { media } = await getSpokenResponse({ text: message.text, voice: voicePreference });
        if (media) {
          const audio = new Audio(media);
          audioPlayerRef.current = audio;
          audio.play();
          audio.onended = () => {
            setCurrentlyPlayingId(null);
            setStatus('idle');
            audioPlayerRef.current = null;
          };
        } else {
          throw new Error('No audio media returned');
        }
      } catch (error) {
        console.error('Error generating audio:', error);
        toast({
          title: "Audio Error",
          description: "Could not generate the audio response.",
          variant: "destructive",
        });
        setStatus('idle');
        setCurrentlyPlayingId(null);
      }
    }
  };

  const handleHelperPackClick = async (prompt: string) => {
    if (status !== 'idle') return;
    setShowFavorites(false);
    await processQuery(prompt);
  };
  
  const handleBookmarkToggle = (messageId: string) => {
    const newSet = new Set(bookmarkedIds);
    if (newSet.has(messageId)) {
        newSet.delete(messageId);
    } else {
        newSet.add(messageId);
    }
    setBookmarkedIds(newSet);

    if (userProfileRef) {
        setDocumentNonBlocking(userProfileRef, { bookmarkedMessageIds: Array.from(newSet) }, { merge: true });
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'listening': return "Listening... Tap to stop";
      case 'thinking': return "Thinking...";
      case 'speaking': return "Speaking...";
      default: return "Tap to speak";
    }
  };
  
  const currentConversation = conversation || [];
  const messagesToDisplay = showFavorites 
    ? currentConversation.filter(msg => msg.role === 'assistant' && bookmarkedIds.has(msg.id))
    : currentConversation;


  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex justify-between items-center p-4 border-b">
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
       <div ref={scrollRef} className="flex-grow overflow-y-auto p-4">
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
                 language={language}
               />
            )}
            
            {/* Mic section is now inside the scrollable area */}
            <footer className="mt-8 flex flex-col items-center justify-center space-y-2">
                <MicrophoneButton
                    status={status}
                    onClick={() => setStatus(status === 'listening' ? 'idle' : 'listening')}
                />
                <p className="text-sm text-muted-foreground h-4">{getStatusMessage()}</p>
                {suggestedTopics.length > 0 && (
                    <div className="w-full pt-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-green-500" />
                        <h3 className="text-sm font-semibold">Suggested For You</h3>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2" dir="rtl">
                        {suggestedTopics.map((topic, index) => (
                        <Badge 
                            key={index} 
                            variant="outline" 
                            className="cursor-pointer font-urdu text-sm"
                            onClick={() => processQuery(topic)}
                        >
                            {topic}
                        </Badge>
                        ))}
                    </div>
                    </div>
                )}
            </footer>
      </div>
    </div>
  );
}
