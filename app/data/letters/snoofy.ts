import { LetterData } from "./types";

export const snoofy: LetterData = {
  id: "snoofy",
  nickname: "Snoofy",
  imageSrc: "/images/pfp/snoofy.png",
  content: {
    layout: "standard",
    blocks: [
      { type: "paragraph", text: "To Shiori," },
      { type: "image", src: "/images/pfp/snoofy.png", alt: "Snoofy" },
      {
        type: "paragraph",
        text: "no need for a paragraph, you alr know the deal. the voice of my actions express my gratitude for your existence far better than text on a screen. happy birthday shiori",
      },
      { type: "video", src: "/video/happy-birthday-shiori.mp4" },
      { type: "signature", text: "- Snoofy" },
    ],
  },
};
