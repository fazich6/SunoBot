'use client';

import React from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Status } from './SunoBot';
import { SoundWave } from './icons';

interface MicrophoneButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  status: Status;
}

const MicrophoneButton = React.forwardRef<HTMLButtonElement, MicrophoneButtonProps>(
  ({ status, className, ...props }, ref) => {
    const isListening = status === 'listening';
    const isThinking = status === 'thinking';

    return (
      <button
        ref={ref}
        className={cn(
          'relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isListening ? 'bg-red-500 text-white scale-110' : 'bg-primary text-primary-foreground hover:bg-primary/90',
          isThinking ? 'bg-secondary text-secondary-foreground cursor-not-allowed' : '',
          className
        )}
        disabled={isThinking}
        {...props}
      >
        <span className="sr-only">
          {isListening ? 'Stop recording' : 'Start recording'}
        </span>
        {isListening ? (
          <SoundWave className="w-8 h-8 text-white" />
        ) : isThinking ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </button>
    );
  }
);
MicrophoneButton.displayName = 'MicrophoneButton';

export default MicrophoneButton;
