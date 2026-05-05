import React, { useState, useEffect } from 'react';
import { auth, signIn, signOut } from '@/src/lib/firebase';
import { Dashboard } from './components/Dashboard';
import { PracticeSession } from './components/PracticeSession';
import { FreeSpeechSession } from './components/FreeSpeechSession';
import { Glossary } from './components/Glossary';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Mic2, LayoutDashboard, LogOut, Github, User, ShieldCheck, Sparkles, MessageSquare, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [activeTab, setActiveTab] = useState("practice");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      console.log("Auth state changed:", u?.email || "No user");
      setUser(u);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    try {
      if (window.self !== window.top) {
        toast.info("If sign-in doesn't appear, please open the app in a new tab.", { duration: 5000 });
      }
      await signIn();
    } catch (error: any) {
      console.error("Sign in error:", error);
      if (error.code === 'auth/popup-blocked') {
        toast.error("Sign-in popup was blocked. Please allow popups or open in a new tab.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed the popup, no need for error toast usually
      } else {
        toast.error(`Sign in failed: ${error.message}`);
      }
    }
  };

  // Removed check for user to allow guest access
  
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg shadow-lg shadow-primary/20">
                <Mic2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-serif italic tracking-tight">SpeakFlow</span>
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
                <TabsTrigger value="glossary" className="rounded-full px-4 h-9 gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-transparent">
                  <BookOpen className="h-4 w-4" /> Glossary
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-4">
             {user ? (
               <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border border-border/50">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-[1px]">
                     <div className="w-full h-full rounded-full bg-background overflow-hidden">
                        {user.photoURL ? <img src={user.photoURL} alt="avatar" /> : <User className="w-full h-full p-1" />}
                     </div>
                  </div>
                  <span className="text-xs font-medium max-w-[100px] truncate">{user.displayName || "Voice Explorer"}</span>
               </div>
             ) : (
               <Button variant="outline" size="sm" onClick={handleSignIn} className="rounded-full gap-2">
                 <Github className="h-4 w-4" /> Sign In
               </Button>
             )}
             {user && (
               <Button variant="ghost" size="icon" onClick={signOut} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="h-5 w-5" />
               </Button>
             )}
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
            <p>© 2026 SpeakFlow AI. Built with Gemini 1.5 Flash.</p>
          </div>
        </div>
      </footer>
      
      <Toaster position="top-center" richColors />
    </div>
  );
}
