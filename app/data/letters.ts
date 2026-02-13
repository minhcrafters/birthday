export interface LetterData {
  id: string;
  nickname: string;
  imageSrc?: string;
  bgmSrc?: string;
  content?: string[]; // Kept for compatibility with SurpriseReveal (slideshow mode)
}

// Order matters for the list
export const letters: LetterData[] = [
  {
    id: "ella",
    nickname: "Ella",
    imageSrc: "/images/pfp/ella.png",
  },
  {
    id: "snoofy",
    nickname: "Snoofy",
    imageSrc: "/images/pfp/snoofy.png",
  },
  {
    id: "aoco",
    nickname: "Aoco",
    imageSrc: "/images/pfp/aoco.png",
  },
  {
    id: "pychael",
    nickname: "Pychael",
    imageSrc: "/images/pfp/pychael.png",
  },
  {
    id: "turtles",
    nickname: "Turtles",
    imageSrc: "/images/pfp/turtles.webp",
  },
  {
    id: "surprise",
    nickname: "A Surprise",
    imageSrc: "/images/stargazer.svg",
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
