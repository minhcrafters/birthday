// Content model for letters. Add a new letter by creating a data file in
// this folder and registering it in index.ts — no new components needed
// unless you want a genuinely different presentation (see StandardLetter /
// SlideshowLetter).

export type LetterBlock =
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt: string; grayscale?: boolean }
  | { type: "video"; src: string }
  | { type: "signature"; text: string };

export interface StandardLetterContent {
  layout: "standard";
  blocks: LetterBlock[];
}

export interface SlideshowLetterContent {
  layout: "slideshow";
  slides: string[];
  /** Ambient track looped behind the slideshow. Defaults to /audio/prelude.wav. */
  preludeSrc?: string;
}

export type LetterContent = StandardLetterContent | SlideshowLetterContent;

/** Locks a letter until every other letter has been read. */
export interface ReadAllOthersUnlock {
  type: "readAllOthers";
}

export type LetterUnlockCondition = ReadAllOthersUnlock;

export interface LetterData {
  id: string;
  nickname: string;
  imageSrc?: string;
  /** Overrides the default `/audio/${id}.mp3` background track for this letter. */
  bgmSrc?: string;
  /** Renders as the large highlighted card in the letters grid, spanning full width. */
  featured?: boolean;
  /** If set, the letter starts locked until the condition is met. */
  unlock?: LetterUnlockCondition;
  content: LetterContent;
}
