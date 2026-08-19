import { LetterData } from "./types";

export const turtles: LetterData = {
  id: "turtles",
  nickname: "Turtles",
  imageSrc: "/images/pfp/turtles.webp",
  content: {
    layout: "standard",
    blocks: [
      { type: "paragraph", text: "Happy Birthday Halo!!" },
      { type: "image", src: "/images/pfp/turtles.webp", alt: "Turtles" },
      {
        type: "paragraph",
        text: "Since you've joined Amycord, it's genuinely been alot more fun! Whether you're barking for gardenia or denying the cute allegations (which are 100% true) , every moment with you is so enjoyable that I do get a teeny weeny excited when you say morning.",
      },
      { type: "paragraph", text: "I hope for us to be closer friends this year!!" },
      { type: "signature", text: "- Turtles/Yuki" },
    ],
  },
};
