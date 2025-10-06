'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getAIAnswer, getSpokenResponse, getTranscription, getTopicSuggestions } from '@/app/actions';
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder';
import { SunoBotLogo, ThinkingIcon, Volume2 } from '@/components/icons';
import HelperPacks from '@/components/HelperPacks';
import ConversationView from '@/components/ConversationView';
import MicrophoneButton from '@/components/MicrophoneButton';
import { useToast } from "@/hooks/use-toast";
import { Bookmark, Send } from 'lucide-react';
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

  const settingsRef = useMemoFirebase(() => user ? doc(firestore, 'settings', user.uid) : null, [user, firestore]);
  const { data: settings } = useDoc<Settings>(settingsRef);
  const language = settings?.language || 'English';

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const chatHistoryColRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'chatHistory') : null, [user, firestore]);
  const chatHistoryQuery = useMemoFirebase(() => chatHistoryColRef ? query(chatHistoryColRef, orderBy('createdAt', 'asc')) : null, [chatHistoryColRef]);
  const { data: conversation, isLoading: isHistoryLoading } = useCollection<Message>(chatHistoryQuery);
  
  useEffect(() => {
    // Check for a prompt from the Packs page
    const packPrompt = sessionStorage.getItem('sunobot_pack_prompt');
    if (packPrompt) {
      sessionStorage.removeItem('sunobot_pack_prompt');
      processQuery(packPrompt);
    }
  }, []);

  useEffect(() => {
    if (userProfile?.bookmarkedMessageIds) {
        setBookmarkedIds(new Set(userProfile.bookmarkedMessageIds));
    }
  }, [userProfile]);


  const fetchSuggestions = useCallback(async () => {
    if (!conversation || conversation.length === 0 || !settings?.enableTopicSuggestions) {
      setSuggestedTopics([]);
      return;
    };

    try {
      const result = await getTopicSuggestions({
        userHistory: conversation.map(m => m.text),
        currentInterests: [],
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

  const handleRecordingComplete = async (audioDataUri: string) => {
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
    if (!query || status === 'thinking') return;
    
    try {
      setStatus('thinking');
      setSuggestedTopics([]); // Clear old suggestions
      await saveMessage({ role: 'user', text: query });
      setShowFavorites(false);
      
      const currentConversation = conversation || [];
      const history = currentConversation.length > 0 ? currentConversation : [{ role: 'user', text: query }];

      const { answer } = await getAIAnswer({
        question: query,
        conversationHistory: history.slice(-6).map(m => ({role: m.role, text: m.text})),
        language
      });
      
      await saveMessage({ role: 'assistant', text: answer });
      
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
  };

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
        const { media } = await getSpokenResponse({ text: message.text });
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

  const handleMicClick = () => {
    if (showFavorites) setShowFavorites(false);
    if (status === 'speaking' && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
      setCurrentlyPlayingId(null);
      setStatus('idle');
      return;
    }
    
    if (status === 'listening') {
      setStatus('thinking'); 
    } else {
      setStatus('listening');
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
             language={language}
           />
        )}
      </div>
        
      <footer className="p-4 flex flex-col items-center justify-center space-y-2 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        {suggestedTopics.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-2" dir="rtl">
            {suggestedTopics.map((topic, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="cursor-pointer font-urdu text-base"
                onClick={() => processQuery(topic)}
              >
                {topic}
              </Badge>
            ))}
          </div>
        )}
        <MicrophoneButton
          status={status}
          onClick={handleMicClick}
        />
        <p className="text-sm text-muted-foreground h-4">{getStatusMessage()}</p>
      </footer>
    </div>
  );
}
