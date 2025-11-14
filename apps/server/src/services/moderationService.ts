const banned = ['harm', 'suicide', 'weapon'];

export function moderateTranscript(transcript: string) {
  const lowered = transcript.toLowerCase();
  const flagged = banned.some((word) => lowered.includes(word));
  return {
    flagged,
    warning: flagged ? 'Content flagged for review' : undefined,
  };
}
