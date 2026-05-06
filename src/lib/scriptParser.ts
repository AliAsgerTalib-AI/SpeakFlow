export interface ParsedScript {
  instructions: string;
  readingText: string;
}

export const parseScript = (script: string): ParsedScript => {
  const lines = script.split('\n');
  const instructionEndIndex = lines.findIndex((line, i) => {
    const trimmed = line.trim();
    return i > 0 && trimmed === '' && lines.slice(0, i).join('\n').length > 20;
  });

  if (instructionEndIndex > 0) {
    return {
      instructions: lines.slice(0, instructionEndIndex).join('\n').trim(),
      readingText: lines.slice(instructionEndIndex + 1).join('\n').trim(),
    };
  }

  const midPoint = Math.floor(lines.length * 0.15);
  return {
    instructions: lines.slice(0, midPoint).join('\n').trim() || 'Read the text below naturally and clearly.',
    readingText: lines.slice(midPoint).join('\n').trim(),
  };
};
