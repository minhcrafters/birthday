import { LetterData } from "./types";

export const ella: LetterData = {
  id: "ella",
  nickname: "Ella",
  imageSrc: "/images/pfp/ella.png",
  content: {
    layout: "standard",
    blocks: [
      { type: "paragraph", text: "Dear Halo," },
      { type: "image", src: "/images/pfp/ella.png", alt: "Ella" },
      {
        type: "paragraph",
        text: "Uhh we haven't known each other long at all, I'd say I barely know you at all, but hey that can change in the future for sure!",
      },
      {
        type: "paragraph",
        text: "You're 19 now huh, your gonna be out of education soon I guess, good luck on your studies and whatever you want to achieve.",
      },
      {
        type: "paragraph",
        text: "Also stop thinking so negatively about yourself, I still believe you'll find a partner that genuinely cares about you.",
      },
      {
        type: "paragraph",
        text: "So good luck with everything, and many many returns of the day.",
      },
      { type: "signature", text: "- Ella" },
    ],
  },
};
