import React from "react";
import { letters, StandardLetterContent } from "../data/letters";
import StandardLetter from "./letters/StandardLetter";

interface LetterViewProps {
  activeLetterId: string | null;
  onDismiss: () => void;
  onCloseComplete?: () => void;
}

const isStandard = (
  letter: (typeof letters)[number],
): letter is (typeof letters)[number] & { content: StandardLetterContent } =>
  letter.content.layout === "standard";

const LetterView = ({
  activeLetterId,
  onDismiss,
  onCloseComplete,
}: LetterViewProps) => {
  // We render every standard letter. Only the one matching activeLetterId is
  // "open" — the rest stay mounted so their exit animation can play when
  // activeLetterId becomes null. Slideshow-layout letters (e.g. the unlockable
  // finale) are handled separately by Experience, since they take over the
  // whole screen rather than opening as a letter.
  return (
    <>
      {letters.filter(isStandard).map((letter) => (
        <StandardLetter
          key={letter.id}
          letter={letter}
          isOpen={letter.id === activeLetterId}
          onDismiss={onDismiss}
          onCloseComplete={onCloseComplete}
        />
      ))}
    </>
  );
};

export default LetterView;
