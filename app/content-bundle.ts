/**
 * Browser-side content bundle: Vite imports the same JSON files the Node
 * loader reads, so the fingerprint computed here equals `npm run validate`'s.
 */
import mission from '../content/mission-gemini-8.json';
import characters from '../content/characters.json';
import evidence from '../content/evidence.json';
import procedures from '../content/procedures.json';
import followon from '../content/followon-gemini-9a.json';
import registry from '../content/registry.json';
import type { ContentBundle } from '../core/types';

export const bundle: ContentBundle = {
  mission: mission as unknown as ContentBundle['mission'],
  characters: (characters as unknown as { characters: ContentBundle['characters'] }).characters,
  evidence: (evidence as unknown as { evidence: ContentBundle['evidence'] }).evidence,
  procedures: (procedures as unknown as { procedures: ContentBundle['procedures'] }).procedures,
  followon: followon as unknown as ContentBundle['followon'],
  registry: registry as unknown as ContentBundle['registry'],
};
