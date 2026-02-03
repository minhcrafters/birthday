export interface LetterData {
  id: string;
  nickname: string;
  content: string[]; // Array of paragraphs
  imageSrc?: string; // Path to profile picture
}

export const letters: LetterData[] = [
  {
    id: "1",
    nickname: "test1",
    imageSrc: "/images/the architect.svg",
    content: [
      "To the one who builds dreams out of thin air,",
      "It has been a privilege to watch you grow this past year. Like a skyscraper finding its footing, you've grounded yourself while reaching for the clouds.",
      "May this next chapter be your most structural sound and beautifully designed yet.",
      "Happy Birthday.",
    ],
  },
  {
    id: "2",
    nickname: "test2",
    imageSrc: "/images/stargazer.svg",
    content: [
      "Hey you,",
      "Remember that night we spent looking for the northern lights? Even though we missed them, the waiting was the best part.",
      "You have this gravity about you that pulls people in and keeps them in orbit. Don't ever lose that light.",
      "Keep shining.",
    ],
  },
  {
    id: "3",
    nickname: "test3",
    imageSrc: "/images/velvet.svg",
    content: [
      "Dearest,",
      "Some people are loud like thunderstorms. You are quiet like snowfall. It accumulates, soft and heavy, changing the whole landscape before anyone notices.",
      "Thank you for the peace you bring to this chaotic world.",
      "With all my love.",
    ],
  },
];
