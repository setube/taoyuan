import type { TextScript } from "@/types/script";
import { BASE_LOOK_OUT_WINDOW } from "@/data/baseCopy";

/**
 * Registry of text scripts. Scripts run in the game log (addLog / runChoiceScene).
 * Look up by id for trigger system or direct use (e.g. base_look_out_window).
 */
export const TEXT_SCRIPTS: TextScript[] = [
  {
    id: "base_look_out_window",
    steps: [
      {
        type: "choice",
        flavorText: BASE_LOOK_OUT_WINDOW.flavorText,
        options: [...BASE_LOOK_OUT_WINDOW.options],
        followUps: [...BASE_LOOK_OUT_WINDOW.followUps],
      },
    ],
  },
];

const scriptById = new Map(TEXT_SCRIPTS.map((s) => [s.id, s]));

export function getScript(id: string): TextScript | undefined {
  return scriptById.get(id);
}
