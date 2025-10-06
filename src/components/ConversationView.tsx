'use client';

import React, { useRef, useEffect } from 'react';
import type { Message } from './SunoBot';
import { cn } from '@/lib/utils';
import { User, Bot, Play, Share2, Bookmark, StopCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useToast } from "@/hooks/use-toast";

interface AssistantMessageProps {
  message: Message;
  onBookmark: (id: string) => void;
  isBookmarked: boolean;
  onPlaybackToggle: (messageId: string) => void;
  currentlyPlayingId: string | null;
  language: 'English' | 'Urdu';
}

const AssistantMessage = ({ message, onBookmark, isBookmarked, onPlaybackToggle, currentlyPlayingId, language }: AssistantMessageProps) => {
  const { toast } = useToast();
  const isPlaying = message.id === currentlyPlayingId;
  
  const handleShare = async () => {
    const shareData = {
      title: 'SunoBot Answer',
      text: `SunoBot said: "${message.text}"`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
        // Fail silently if user cancels share dialog
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.text);
        toast({
          title: 'Copied to clipboard',
          description: 'The answer has been copied to your clipboard.',
        });
      } catch (err) {
        console.error('Failed to copy: ', err);
        toast({
          title: 'Error',
          description: 'Could not copy the text.',
          variant: 'destructive',
        });
      }
    }
  };

  const isUrdu = language === 'Urdu';

  return (
    <div className="flex items-start gap-3">
      <Avatar className="w-8 h-8 border border-primary/20">
        <AvatarFallback className="bg-primary/10 text-primary">
          <Bot size={18} />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className={cn(
          "bg-primary/10 text-foreground rounded-lg p-3 rounded-tl-none",
          isUrdu ? "font-urdu text-right text-lg leading-relaxed" : "text-left"
        )}
        dir={isUrdu ? 'rtl' : 'ltr'}>
          <p>{message.text}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onPlaybackToggle(message.id)}>
            {isPlaying ? <StopCircle size={16} className="text-primary" /> : <Play size={16} />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onBookmark(message.id)}>
            <Bookmark size={16} className={cn("transition-colors", isBookmarked && "fill-primary text-primary")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleShare}>
            <Share2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const UserMessage = ({ message }: { message: Message }) => {
  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="flex-1 space-y-2 max-w-[80%]">
        <div className="bg-secondary text-secondary-foreground rounded-lg p-3 rounded-tr-none">
          <p>{message.text}</p>
        </div>
      </div>
       <Avatar className="w-8 h-8">
        <AvatarFallback>
          <User size={18} />
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

export default function ConversationView({ conversation, bookmarkedIds, onBookmark, onPlaybackToggle, currentlyPlayingId, language }: { conversation: Message[]; bookmarkedIds: Set<string>; onBookmark: (id: string) => void; onPlaybackToggle: (messageId: string) => void; currentlyPlayingId: string | null; language: 'English' | 'Urdu'; }) {

  return (
    <div className="space-y-6">
      {conversation.map((message) => (
        <div key={message.id}>
          {message.role === 'assistant' ? (
            <AssistantMessage 
              message={message} 
              onBookmark={onBookmark} 
              isBookmarked={bookmarkedIds.has(message.id)}
              onPlaybackToggle={onPlaybackToggle}
              currentlyPlayingId={currentlyPlayingId}
              language={language}
            />
          ) : (
            <UserMessage message={message} />
          )}
        </div>
      ))}
    </div>
  );
}
