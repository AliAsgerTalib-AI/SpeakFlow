import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export const AudioVisualizer: React.FC<{ isRecording: boolean }> = ({ isRecording }) => {
  const [bars, setBars] = useState<number[]>(new Array(15).fill(20));

  useEffect(() => {
    if (!isRecording) {
      setBars(new Array(15).fill(20));
      return;
    }

    const interval = setInterval(() => {
      setBars(new Array(15).fill(0).map(() => Math.random() * 80 + 20));
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className="flex items-end gap-1 h-24 px-4 bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-2 bg-primary rounded-full"
          animate={{ height: `${height}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ minHeight: '4px' }}
        />
      ))}
    </div>
  );
};
