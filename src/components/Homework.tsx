'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Send, Loader2, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getHomeworkHelp } from '@/app/actions';
import Image from 'next/image';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

export default function Homework() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageDataUri(e.target?.result as string);
        setConversation([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAskQuestion = async () => {
    if (!imageDataUri || !question.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: question };
    setConversation(prev => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      const result = await getHomeworkHelp({ imageDataUri, question });
      const assistantMessage: ChatMessage = { role: 'assistant', text: result.answer };
      setConversation(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Homework help failed:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to get an answer.' });
      setConversation(prev => prev.slice(0, -1)); // remove user message on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">Homework Helper</h1>
      </header>
      <div className="flex-grow flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
        <div className="md:w-1/2 flex flex-col gap-4 items-center justify-center p-4 border rounded-lg">
          <div 
            className="w-full aspect-video bg-muted rounded-md overflow-hidden relative flex items-center justify-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {imageDataUri ? (
              <Image src={imageDataUri} alt="Homework upload" layout="fill" objectFit="contain" />
            ) : (
              <div className="text-center text-muted-foreground">
                <Upload className="mx-auto h-12 w-12" />
                <p>Click to upload a photo of your homework</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          {imageDataUri && (
             <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                Change Photo
             </Button>
          )}
        </div>
        <div className="md:w-1/2 flex flex-col border rounded-lg overflow-hidden">
          <div className="flex-grow p-4 space-y-4 overflow-y-auto">
            {conversation.length === 0 && (
                <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                    <p>Upload an image and ask a question to get started.</p>
                </div>
            )}
            {conversation.map((msg, index) => (
              <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                 {msg.role === 'assistant' && <Bot className="w-6 h-6 text-primary" />}
                <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-secondary' : 'bg-primary/10'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
                {msg.role === 'user' && <User className="w-6 h-6" />}
              </div>
            ))}
             <div ref={conversationEndRef} />
          </div>
          <div className="p-4 border-t flex items-center gap-2">
            <Input
              type="text"
              placeholder={imageDataUri ? "Ask about your homework..." : "Upload an image first"}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
              disabled={!imageDataUri || isLoading}
            />
            <Button onClick={handleAskQuestion} disabled={!imageDataUri || !question.trim() || isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
