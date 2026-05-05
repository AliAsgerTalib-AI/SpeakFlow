import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, Zap, Clock, Trophy } from 'lucide-react';
import { SessionLog } from '@/src/types';

export const Dashboard: React.FC = () => {
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('speakflow_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure we only show sessions that have paceAnalysis (type safety check)
        const validSessions = parsed.filter((s: any) => s.feedback && s.feedback.paceAnalysis);
        setSessions(validSessions);
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
    setIsLoading(false);
  }, []);

  const chartData = sessions.map((s, i) => ({
    name: `Session ${i + 1}`,
    confidence: s.feedback.confidenceScore,
    pace: s.feedback.paceAnalysis.wpm
  }));

  const avgConfidence = sessions.length > 0 
    ? (sessions.reduce((acc, curr) => acc + curr.feedback.confidenceScore, 0) / sessions.length).toFixed(1)
    : 0;

  const avgWpm = sessions.length > 0 
    ? (sessions.reduce((acc, curr) => acc + curr.feedback.paceAnalysis.wpm, 0) / sessions.length).toFixed(0)
    : 0;

  const fillerCounts: Record<string, number> = {};
  sessions.forEach(s => {
    if (s.feedback && s.feedback.fillerWordDetection) {
      s.feedback.fillerWordDetection.forEach(f => {
        const word = f.word.toLowerCase();
        fillerCounts[word] = (fillerCounts[word] || 0) + f.count;
      });
    }
  });
  
  const topFillerArr = Object.entries(fillerCounts).sort((a, b) => b[1] - a[1]);
  const topFillerWord = topFillerArr.length > 0 ? `"${topFillerArr[0][0].charAt(0).toUpperCase() + topFillerArr[0][0].slice(1)}"` : "None";

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading dashboard...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
        <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-medium">No sessions yet</h3>
        <p className="text-muted-foreground mt-2">Start your first practice session to see insights here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-3 pt-3 md:pt-6 md:px-6">
            <CardTitle className="text-[10px] md:text-sm font-medium uppercase tracking-wider text-muted-foreground">Sessions</CardTitle>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground opacity-50" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:pb-6 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{sessions.length}</div>
            <p className="text-[9px] md:text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-3 pt-3 md:pt-6 md:px-6">
            <CardTitle className="text-[10px] md:text-sm font-medium uppercase tracking-wider text-muted-foreground">Confidence</CardTitle>
            <Zap className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground opacity-50" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:pb-6 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{avgConfidence}%</div>
            <p className="text-[9px] md:text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-3 pt-3 md:pt-6 md:px-6">
            <CardTitle className="text-[10px] md:text-sm font-medium uppercase tracking-wider text-muted-foreground">Pace</CardTitle>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground opacity-50" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:pb-6 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{avgWpm}</div>
            <p className="text-[9px] md:text-xs text-muted-foreground">WPM</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-3 pt-3 md:pt-6 md:px-6">
            <CardTitle className="text-[10px] md:text-sm font-medium uppercase tracking-wider text-muted-foreground">Fillers</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground opacity-50" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:pb-6 md:px-6">
            <div className="text-sm md:text-2xl font-bold truncate">{topFillerWord}</div>
            <p className="text-[9px] md:text-xs text-muted-foreground">Frequent</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader className="p-4 md:p-6 pb-2">
            <CardTitle className="text-sm md:text-base">Confidence Trend</CardTitle>
            <CardDescription className="text-xs">Progress over sessions</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[300px] p-2 md:p-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 100]} fontSize={10} />
                <Tooltip 
                   contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '10px' }}
                   itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Line type="monotone" dataKey="confidence" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="p-4 md:p-6 pb-2">
            <CardTitle className="text-sm md:text-base">Pace Volatility</CardTitle>
            <CardDescription className="text-xs">WPM consistency</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[300px] p-2 md:p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" hide />
                <YAxis fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '10px' }}
                />
                <Bar dataKey="pace" fill="hsl(var(--primary))" opacity={0.3} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
