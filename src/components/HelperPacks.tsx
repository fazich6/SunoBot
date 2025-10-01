'use client';

import React from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import { Utensils, HeartPulse, BookOpen, Sun } from 'lucide-react';

const packData = [
  { id: 'recipes', title: 'Recipes', urdu: 'ترکیبیں', icon: Utensils, prompt: "Tell me a recipe for chicken karahi" },
  { id: 'health-tips', title: 'Health Tips', urdu: 'صحت کے نکات', icon: HeartPulse, prompt: "Give me a health tip for today" },
  { id: 'kids-stories', title: 'Kids Stories', urdu: 'بچوں کی کہانیاں', icon: BookOpen, prompt: "Tell me a short story for kids" },
  { id: 'daily-life', title: 'Daily Life', urdu: 'روزمرہ زندگی', icon: Sun, prompt: "Give me some advice for daily life" },
];

export default function HelperPacks({ onPackClick }: { onPackClick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col h-full justify-center">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">How can I help you?</h1>
        <p className="font-urdu text-muted-foreground text-lg">میں آپ کی کیا مدد کر سکتا ہوں؟</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {packData.map(pack => {
          const imageData = PlaceHolderImages.find(img => img.id === pack.id);
          const Icon = pack.icon;
          return (
            <Card 
              key={pack.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
              onClick={() => onPackClick(pack.prompt)}
            >
              <CardContent className="p-0 text-center">
                <div className="w-full h-24 flex items-center justify-center bg-primary/10 text-primary">
                    <Icon className="w-10 h-10 group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-foreground">{pack.title}</h3>
                  <p className="font-urdu text-muted-foreground">{pack.urdu}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
