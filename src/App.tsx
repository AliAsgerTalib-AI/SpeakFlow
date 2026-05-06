import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { PracticeSession } from './components/PracticeSession';
import { FreeSpeechSession } from './components/FreeSpeechSession';
import { Glossary } from './components/Glossary';
import { PronunciationDictionary } from './components/PronunciationDictionary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { Mic2, LayoutDashboard, ShieldCheck, MessageSquare, BookOpen, BookMarked } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState("practice");

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-3 cursor-pointer group transition-all"
              onClick={() => setActiveTab("practice")}
            >
              <div className="p-2 bg-primary rounded-lg shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <Mic2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-serif italic tracking-tight group-hover:text-primary transition-colors">SpeakFlow</span>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
              <TabsList className="bg-transparent p-0 h-9 gap-1">
                <TabsTrigger value="practice" className="rounded-full px-4 h-9 gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-transparent">
                  <Mic2 className="h-4 w-4" /> Practice
                </TabsTrigger>
                <TabsTrigger value="free-speech" className="rounded-full px-4 h-9 gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-transparent">
                  <MessageSquare className="h-4 w-4" /> Free Speech Lab
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="rounded-full px-4 h-9 gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-transparent">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="dictionary" className="rounded-full px-4 h-9 gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-transparent">
                  <BookMarked className="h-4 w-4" /> Dictionary
                </TabsTrigger>
                <TabsTrigger value="glossary" className="rounded-full px-4 h-9 gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-transparent">
                  <BookOpen className="h-4 w-4" /> Glossary
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-4">
          </div>
        </div>

        
        {/* Mobile Nav */}
        <div className="md:hidden border-t border-border/30 bg-background/50">
           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-transparent p-1 h-12 justify-around">
              <TabsTrigger value="practice" className="flex-1 rounded-none gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary transition-none">
                <Mic2 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="free-speech" className="flex-1 rounded-none gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary transition-none">
                <MessageSquare className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex-1 rounded-none gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary transition-none">
                <LayoutDashboard className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="dictionary" className="flex-1 rounded-none gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary transition-none">
                <BookMarked className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="glossary" className="flex-1 rounded-none gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary transition-none">
                <BookOpen className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "practice" && <PracticeSession />}
            {activeTab === "free-speech" && <FreeSpeechSession />}
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "dictionary" && <PronunciationDictionary />}
            {activeTab === "glossary" && <Glossary />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-border/50 mt-20 py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-left">
            <div className="space-y-3">
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">Educational Tool</h4>
              <p className="text-xs leading-relaxed max-w-md">
                SpeakFlow is an AI-powered training platform designed to improve public speaking performance through acoustic analysis. All feedback is generated by large language models based on vocal patterns.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-destructive/80 text-sm uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Medical Disclaimer
              </h4>
              <p className="text-xs leading-relaxed max-w-md">
                This application is <strong>not a medical diagnostic tool</strong>. Insights regarding vocal health, strain, or neurological markers are for information only. If you have concerns about your speech or respiratory health, consult a licensed healthcare professional.
              </p>
            </div>
          </div>
          
          <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
            </div>
            <p>Copyright Ali Asger Talib 2026</p>
          </div>
        </div>
      </footer>
      
      <Toaster position="top-center" richColors />
    </div>
  );
}
