import { LetterData } from "./types";
import { ella } from "./ella";
import { snoofy } from "./snoofy";
import { aoco } from "./aoco";
import { pychael } from "./pychael";
import { turtles } from "./turtles";
import { surprise } from "./surprise";

// Order here is display order in the letters grid. To add a new letter:
// create a data file like the ones above, then add it to this array.
export const letters: LetterData[] = [
  ella,
  snoofy,
  aoco,
  pychael,
  turtles,
  surprise,
];

export * from "./types";
