import React from "react";
import { LetterData } from "../data/letters";
import Ella from "./letters/Ella";
import Snoofy from "./letters/Snoofy";
import Aoco from "./letters/Aoco";
import Pychael from "./letters/Pychael";
import Scholar from "./letters/Scholar";
import Surprise from "./letters/Surprise";
import Turtles from "./letters/Turtles";

interface LetterViewProps {
  letter: LetterData | null;
  onDismiss: () => void;
  onCloseComplete?: () => void;
}

const LetterView = ({
  letter,
  onDismiss,
  onCloseComplete,
}: LetterViewProps) => {
  // We render all letter components.
  // Only the one matching letter.id will be "open".
  // When letter becomes null, all become "closed", triggering exit animations in the active one.

  return (
    <>
      <Ella
        isOpen={letter?.id === "ella"}
        onDismiss={onDismiss}
        onCloseComplete={onCloseComplete}
      />
      <Snoofy
        isOpen={letter?.id === "snoofy"}
        onDismiss={onDismiss}
        onCloseComplete={onCloseComplete}
      />
      <Aoco
        isOpen={letter?.id === "aoco"}
        onDismiss={onDismiss}
        onCloseComplete={onCloseComplete}
      />
      <Pychael
        isOpen={letter?.id === "pychael"}
        onDismiss={onDismiss}
        onCloseComplete={onCloseComplete}
      />
      <Turtles
        isOpen={letter?.id === "turtles"}
        onDismiss={onDismiss}
        onCloseComplete={onCloseComplete}
      />
      <Surprise
        isOpen={letter?.id === "surprise"}
        onDismiss={onDismiss}
        onCloseComplete={onCloseComplete}
      />
    </>
  );
};

export default LetterView;
