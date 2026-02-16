/**
 * Script system: data-driven sequences of log lines and choices that run in the game log.
 * Used for event-triggered text (e.g. first visit, first NPC talk) and reusable flows like "观察外面".
 */

export interface LogStep {
  type: "log";
  speaker?: string;
  text: string;
}

export interface ChoiceStep {
  type: "choice";
  flavorText: string;
  options: [string, string, string];
  followUps?: [string, string, string];
  speaker?: string;
}

export type ScriptStep = LogStep | ChoiceStep;

export interface TextScript {
  id: string;
  steps: ScriptStep[];
}
