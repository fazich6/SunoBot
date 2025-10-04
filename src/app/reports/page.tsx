'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Bot, PlusCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getReportAnalysis } from '@/app/actions';
import { addDocumentNonBlocking, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { AnalyzeReportOutput, ExtractedReminder } from '@/ai/schemas';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection } from 'firebase/firestore';

export default function ReportsPage() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [remindersAdded, setRemindersAdded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  // Hardcoding language to Urdu as per feature description
  const language = 'Urdu';

  const remindersColRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'reminders') : null, [user, firestore]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        setImageDataUri(dataUri);
        setAnalysisResult(null);
        setRemindersAdded(false);
        setIsLoading(true);
        try {
          const result = await getReportAnalysis({ reportImage: dataUri, language });
          setAnalysisResult(result);
        } catch (error) {
          console.error('Report analysis failed:', error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to analyze the report.' });
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAddReminders = () => {
    if (!analysisResult?.extractedReminders || !remindersColRef) return;

    analysisResult.extractedReminders.forEach(reminder => {
      addDocumentNonBlocking(remindersColRef, { ...reminder, createdAt: new Date().toISOString() });
    });
    
    setRemindersAdded(true);
    toast({
      title: 'Reminders Added!',
      description: 'The extracted reminders have been saved.',
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">Upload Prescription / Report</h1>
      </header>
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        <div 
          className="w-full aspect-video bg-muted rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {isLoading ? (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          ) : imageDataUri ? (
            <Image src={imageDataUri} alt="Uploaded Report" layout="fill" objectFit="contain" className="rounded-lg" />
          ) : (
            <div className="text-center text-muted-foreground">
              <Upload className="mx-auto h-12 w-12" />
              <p className="mt-2">Click to upload a photo of your report</p>
              <p className="text-xs">Prescription, Lab Report, etc.</p>
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
        
        {analysisResult && (
          <Card>
            <CardHeader>
               <div className="flex items-center gap-2">
                 <Bot className="w-6 h-6 text-primary" />
                 <CardTitle>Analysis Summary</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertTitle className={`font-urdu text-right text-lg ${language === 'Urdu' ? 'font-urdu' : ''}`} dir="rtl">
                      {analysisResult.summary.split('Disclaimer:')[0]}
                    </AlertTitle>
                    <AlertDescription className={`font-urdu text-right ${language === 'Urdu' ? 'font-urdu' : ''}`} dir="rtl">
                      <span className="font-bold">Disclaimer:</span>
                      {analysisResult.summary.split('Disclaimer:')[1]}
                    </AlertDescription>
                </Alert>

                {analysisResult.reportType === 'prescription' && analysisResult.extractedReminders && analysisResult.extractedReminders.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">Extracted Reminders:</h3>
                        <div className="space-y-2">
                            {analysisResult.extractedReminders.map((rem, index) => (
                                <div key={index} className="p-2 bg-secondary rounded-md text-sm">
                                    <p><span className="font-medium">{rem.medicineName}</span> ({rem.dosage || 'N/A'}) at {rem.time}{rem.repeatDaily ? ' daily' : ''}</p>
                                </div>
                            ))}
                        </div>
                        <Button 
                          onClick={handleAddReminders} 
                          className="w-full mt-4"
                          disabled={remindersAdded}
                        >
                            {remindersAdded ? <CheckCircle /> : <PlusCircle />}
                            {remindersAdded ? 'Reminders Added' : 'Add All Reminders'}
                        </Button>
                    </div>
                )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
