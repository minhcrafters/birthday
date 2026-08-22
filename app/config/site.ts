export interface BirthdayDate {
  month: number;
  day: number;
}

/**
 * Optional "typo reveal" gag in the intro sequence: types out `revealText`,
 * backspaces it down to `keepPrefix`, then types `finalText` in its place.
 * Used in the original for a Valentine's Day / birthday pun. Leave undefined
 * if the new birthday has no such coincidence to play with.
 */
export interface IntroTwist {
  revealText: string;
  keepPrefix: string;
  finalText: string;
  /** Seconds to budget for this line's animation (typing + pause + backspace + retype). */
  revealDuration?: number;
}

export interface SiteConfig {
  recipientName: string;
  birthday: BirthdayDate;
  monthName: string;
  introTexts: string[];
  introTwist?: IntroTwist;
}

export const siteConfig: SiteConfig = {
  recipientName: "Shiori",
  birthday: { month: 8, day: 2 },
  monthName: "August",
  introTexts: [
    "Hey...",
    "Do you know what day it is today?",
    "That's ri",
    "I missed your birthday.",
    "Sorry for the disappointment.",
    "Even though it's nothing flashy...",
    "What really counts is the thought, true?",
    "For now...",
    "Enjoy this little thing that my friend made with me.",
    "Happy late birthday.",
  ],
  introTwist: {
    revealText: "That's ri",
    keepPrefix: "",
    finalText: "Nevermind.",
  },
};
