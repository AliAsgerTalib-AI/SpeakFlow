import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookMarked, Search } from 'lucide-react';
import { SessionLog } from '@/src/types';

interface DictionaryEntry {
  word: string;
  frequency: number;
  suggestions: string[];
}

function isValidSessionLog(obj: unknown): obj is SessionLog {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.userId === 'string' &&
    typeof s.timestamp === 'number' &&
    typeof s.script === 'string' &&
    typeof s.feedback === 'object' &&
    s.feedback !== null &&
    (s.feedback as Record<string, unknown>).paceAnalysis !== undefined
  );
}

export const PronunciationDictionary: React.FC = () => {
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('speakflow_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validSessions: SessionLog[] = parsed.filter(isValidSessionLog);

          // Aggregate pronunciation feedback
          const wordMap: Record<string, DictionaryEntry> = {};
          validSessions.forEach((session) => {
            if (session.feedback?.pronunciationFeedback) {
              session.feedback.pronunciationFeedback.forEach((pf) => {
                const wordLower = pf.word.toLowerCase();
                if (!wordMap[wordLower]) {
                  wordMap[wordLower] = {
                    word: pf.word,
                    frequency: 0,
                    suggestions: [],
                  };
                }
                wordMap[wordLower].frequency += 1;
                if (pf.suggestions && !wordMap[wordLower].suggestions.includes(pf.suggestions)) {
                  wordMap[wordLower].suggestions.push(pf.suggestions);
                }
              });
            }
          });

          const entries = Object.values(wordMap).sort((a, b) => b.frequency - a.frequency);
          setDictionary(entries);
        }
      } catch (e) {
        console.error('Failed to parse sessions', e);
      }
    }
    setIsLoading(false);
  }, []);

  const filteredDictionary = useMemo(() => {
    if (!searchTerm.trim()) return dictionary;
    return dictionary.filter((entry) =>
      entry.word.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dictionary, searchTerm]);

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading dictionary...</div>;
  }

  if (dictionary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
        <BookMarked className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-medium">No pronunciation data yet</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-center">
          Complete a practice or free speech session to build your personalized pronunciation dictionary.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-2 border-primary/10">
        <CardHeader className="border-b bg-muted/30">
          <div className="space-y-4">
            <div>
              <CardTitle>Pronunciation Dictionary</CardTitle>
              <CardDescription>Words to focus on based on your sessions</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search words..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {filteredDictionary.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No words match "{searchTerm}"
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDictionary.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-card border border-border/60 rounded-xl hover:border-primary/20 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{entry.word}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Appeared {entry.frequency} time{entry.frequency !== 1 ? 's' : ''} across sessions
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-amber-500/20 text-amber-600 border-amber-500/30"
                    >
                      {entry.frequency}x
                    </Badge>
                  </div>

                  {entry.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                        Suggestions
                      </p>
                      <ul className="space-y-1.5">
                        {entry.suggestions.slice(0, 2).map((suggestion, sIdx) => (
                          <li key={sIdx} className="text-xs text-muted-foreground leading-relaxed">
                            <span className="text-primary font-semibold">•</span> {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-xs text-muted-foreground">
              💡 <span className="font-semibold text-primary">Tip:</span> Focus on high-frequency words (3+
              occurrences). Consider creating targeted exercises for these words using the "Targeted Practice
              Exercises" feature after each session.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
