export function computeWordStatuses(
  scriptWords: string[],
  transcriptWords: string[]
): Array<'pending' | 'correct' | 'current' | 'error'> {
  const statuses: Array<'pending' | 'correct' | 'current' | 'error'> = [];
  let transcriptIndex = 0;

  for (let i = 0; i < scriptWords.length; i++) {
    const cleanWord = scriptWords[i].toLowerCase();
    let status: 'pending' | 'correct' | 'current' | 'error' = 'pending';

    let foundIndex = -1;
    const searchLimit = Math.min(transcriptIndex + 10, transcriptWords.length);
    for (let j = transcriptIndex; j < searchLimit; j++) {
      if (transcriptWords[j] === cleanWord) {
        foundIndex = j;
        break;
      }
    }

    if (foundIndex !== -1) {
      status = 'correct';
      transcriptIndex = foundIndex + 1;
    } else if (i < scriptWords.length - 1) {
      const nextCleanWord = scriptWords[i + 1].toLowerCase();
      for (let j = transcriptIndex; j < searchLimit; j++) {
        if (transcriptWords[j] === nextCleanWord) {
          status = 'error';
          break;
        }
      }
    }

    if (status === 'pending' && transcriptIndex > 0 && statuses.every(s => s !== 'pending')) {
      status = 'current';
    }

    statuses.push(status);
  }

  return statuses;
}
