/**
 * Node-side content loader: reads the JSON files under content/ from disk and
 * assembles the same ContentBundle shape the app builds from Vite imports.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ContentBundle } from '../../core/types';

export const CONTENT_FILES = {
  mission: 'content/mission-gemini-8.json',
  characters: 'content/characters.json',
  evidence: 'content/evidence.json',
  procedures: 'content/procedures.json',
  followon: 'content/followon-gemini-9a.json',
  registry: 'content/registry.json',
} as const;

export function readJson(root: string, rel: string): unknown {
  return JSON.parse(readFileSync(resolve(root, rel), 'utf8'));
}

export function loadBundle(root: string): ContentBundle {
  const mission = readJson(root, CONTENT_FILES.mission) as ContentBundle['mission'];
  const characters = (readJson(root, CONTENT_FILES.characters) as { characters: ContentBundle['characters'] }).characters;
  const evidence = (readJson(root, CONTENT_FILES.evidence) as { evidence: ContentBundle['evidence'] }).evidence;
  const procedures = (readJson(root, CONTENT_FILES.procedures) as { procedures: ContentBundle['procedures'] }).procedures;
  const followon = readJson(root, CONTENT_FILES.followon) as ContentBundle['followon'];
  const registry = readJson(root, CONTENT_FILES.registry) as ContentBundle['registry'];
  return { mission, characters, evidence, procedures, followon, registry };
}
