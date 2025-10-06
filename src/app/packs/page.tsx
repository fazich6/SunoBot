'use client';
import { useState, useEffect } from 'react';
import { getTopicSuggestions } from '@/app/actions';
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Loader2, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Message } from '@/components/SunoBot';

interface PacksPageProps {
    onPackClick: (prompt: string) => void;
}

const staticPacks = [
  { title: "Bedtime Stories", urdu: "سونے کے وقت کی کہانیاں", prompt: "Tell me a bedtime story for a 5-year-old." },
  { title: "Quick Recipes", urdu: "فوری ترکیبیں", prompt: "Give me a recipe that takes less than 20 minutes." },
  { title: "Daily Health Tips", urdu: "روزانہ صحت کے نکات", prompt: "What is one simple health tip I can follow today?" },
  { title: "Islamic Wisdom", urdu: "اسلامی حکمت", prompt: "Share a short hadith about kindness." },
  { title: "Funny Jokes", urdu: "مزاحیہ لطیفے", prompt: "Tell me a funny joke in Urdu." },
  { title: "Travel Ideas", urdu: "سفر کے خیالات", prompt: "Suggest a good weekend travel destination near Lahore." },
];

export default function PacksPage({ onPackClick }: PacksPageProps) {
  const [suggestedPacks, setSuggestedPacks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const firestore = useFirestore();

  const chatHistoryColRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'chatHistory') : null, [user, firestore]);
  const chatHistoryQuery = useMemoFirebase(() => chatHistoryColRef ? query(chatHistoryColRef, orderBy('createdAt', 'desc'), limit(10)) : null, [chatHistoryColRef]);
  const { data: conversation, isLoading: isHistoryLoading } = useCollection<Message>(chatHistoryQuery);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (isHistoryLoading || !conversation) return;
      
      setIsLoading(true);
      try {
        const result = await getTopicSuggestions({
          userHistory: conversation.map(m => m.text),
          currentInterests: [],
        });
        // Filter suggestions to find matches in our static pack data
        const matchedPacks = staticPacks.filter(sp => 
            result.suggestedHelperPacks.some(suggestion => sp.urdu.includes(suggestion) || sp.title.toLowerCase().includes(suggestion.toLowerCase()))
        ).map(sp => sp.prompt);

        setSuggestedPacks(matchedPacks);

      } catch (error) {
        console.error("Failed to fetch helper packs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [conversation, isHistoryLoading]);

  // Use suggested packs if available, otherwise fall back to static packs
  const packsToShow = suggestedPacks.length > 0 
    ? staticPacks.filter(sp => suggestedPacks.includes(sp.prompt))
    : staticPacks;


  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">Helper Packs</h1>
      </header>
      <div className="flex-grow p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {packsToShow.map((pack) => (
              <Card 
                key={pack.prompt} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => onPackClick(pack.prompt)}
              >
                <CardContent className="p-0 text-center">
                  <div className="w-full h-24 flex items-center justify-center bg-primary/10 text-primary">
                      <Package className="w-10 h-10 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-foreground">{pack.title}</h3>
                    <p className="font-urdu text-muted-foreground">{pack.urdu}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
