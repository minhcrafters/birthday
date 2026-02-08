export interface LetterData {
  id: string;
  nickname: string;
  content: string[]; // Array of paragraphs
  imageSrc?: string; // Path to profile picture
}

export const letters: LetterData[] = [
  {
    id: "architect",
    nickname: "The Architect",
    imageSrc: "/images/the architect.svg",
    content: [
      "To the one who builds dreams out of thin air,",
      "It has been a privilege to watch you grow this past year. Like a skyscraper finding its footing, you've grounded yourself while reaching for the clouds.",
      "May this next chapter be your most structural sound and beautifully designed yet.",
      "Happy Birthday.",
    ],
  },
  {
    id: "ella",
    nickname: "Ella",
    imageSrc: "/images/pfp/ella.png",
    content: [
      "Dear Halo,",
      "Uhh we haven't known each other long at all, I'd say I barely know you at all, but hey that can change in the future for sure!",
      "You're 19 now huh, your gonna be out of education soon I guess, good luck on your studies and whatever you want to achieve.",
      "Also stop thinking so negatively about yourself, I still believe you'll find a partner that genuinely cares about you.",
      "So good luck with everything, and many many returns of the day.",
    ],
  },
  {
    id: "velvet",
    nickname: "Velvet",
    imageSrc: "/images/velvet.svg",
    content: [
      "Dearest,",
      "Some people are loud like thunderstorms. You are quiet like snowfall. It accumulates, soft and heavy, changing the whole landscape before anyone notices.",
      "Thank you for the peace you bring to this chaotic world.",
      "With all my love.",
    ],
  },
  {
    id: "pilot",
    nickname: "The Pilot",
    imageSrc: "/images/pilot.svg",
    content: [
      "To our fearless navigator,",
      "Navigating through life isn't always easy, but you handle the turbulence with such grace.",
      "Here's to clear skies and smooth landings for the year ahead.",
      "Fly high!",
    ],
  },
  {
    id: "gardener",
    nickname: "The Gardener",
    imageSrc: "/images/the gardener.svg",
    content: [
      "To the one who nurtures,",
      "Just as you tend to your garden, you tend to the hearts of everyone around you. Watching you bloom has been the highlight of my year.",
      "May your year be filled with vibrant colors and sweet scents.",
      "Growth is beautiful on you.",
    ],
  },
  {
    id: "scholar",
    nickname: "The Scholar",
    imageSrc: "/images/scholar.svg",
    content: [
      "To the seeker of truth,",
      "Your curiosity is infectious. Every conversation with you leaves me wondering, thinking, and learning.",
      "Never stop asking 'why'. It's your superpower.",
      "Happy Birthday!",
    ],
  },
  {
    id: "surprise",
    nickname: "A Surprise",
    imageSrc: "/images/stargazer.svg", // Placeholder or reuse
    content: [
      "Shiori.",
      "私が崇拝していた人。",
      "心から信頼できる人。",
      "あなたが好む方法ではないにしても、私が愛した人。",
      "愛してます。",
      "( as a friend of course, ehe )",
      "長く幸せな人生を送れるよう願っております。",
      "私もです。",
      "だって、あなたは私にとってなくてはならない天使の一人だから。",
      "あなたの存在は、ディナーデートのときのろうそくのように私を慰めてくれます。",
      "もしあの運命の日に出会わなかったら、",
      "私たちの人生はどうなるか神のみぞ知る。",
      "幸運を, Shiori",
      "あなたは私の人生を覆う暗闇の中で私の光です。",
      "最愛なるあなたへ — Miyamura",
    ],
  },
];
