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
    id: "stargazer",
    nickname: "Stargazer",
    imageSrc: "/images/stargazer.svg",
    content: [
      "Hey you,",
      "Remember that night we spent looking for the northern lights? Even though we missed them, the waiting was the best part.",
      "You have this gravity about you that pulls people in and keeps them in orbit. Don't ever lose that light.",
      "Keep shining.",
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
];
