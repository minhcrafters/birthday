import { LetterData } from "../data/letters";

export function isLetterLocked(
  letter: LetterData,
  allLetters: LetterData[],
  readLetterIds: string[],
): boolean {
  if (!letter.unlock) return false;

  switch (letter.unlock.type) {
    case "readAllOthers":
      return !allLetters
        .filter((l) => l.id !== letter.id)
        .every((l) => readLetterIds.includes(l.id));
    default:
      return false;
  }
}

export function getLetterAudioSrc(letter: LetterData): string {
  return letter.bgmSrc ?? `/audio/${letter.id}.mp3`;
}
