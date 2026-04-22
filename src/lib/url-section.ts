import { LAB_CATEGORIES, type LabCategory } from './lab-scene-data';
import type { Screen } from './store';

/**
 * Canonical section keys that appear in the URL. Stable, human-readable
 * labels so links are self-describing (e.g. `?s=shelf&cat=eyes`).
 */
export type Section = 'intro' | 'lab' | 'shelf' | 'assembly';

const SCREEN_TO_SECTION: Record<Screen, Section> = {
  s1: 'intro',
  s2: 'lab',
  s3: 'shelf',
  s4: 'assembly',
};

const SECTION_TO_SCREEN: Record<Section, Screen> = {
  intro: 's1',
  lab: 's2',
  shelf: 's3',
  assembly: 's4',
};

const VALID_SECTIONS = new Set<Section>(['intro', 'lab', 'shelf', 'assembly']);
const VALID_CATEGORIES = new Set<LabCategory>([...LAB_CATEGORIES]);

export function sectionFromScreen(screen: Screen): Section {
  return SCREEN_TO_SECTION[screen];
}

export function screenFromSection(section: Section): Screen {
  return SECTION_TO_SCREEN[section];
}

/**
 * Parse the current URL into a (section, cat) pair. Unknown or missing
 * values fall back to `intro` / null so malformed URLs degrade gracefully.
 */
export function readSectionFromLocation(search: string): {
  section: Section;
  cat: LabCategory | null;
} {
  const params = new URLSearchParams(search);
  const rawSection = params.get('s');
  const rawCat = params.get('cat');

  const section = VALID_SECTIONS.has(rawSection as Section)
    ? (rawSection as Section)
    : 'intro';
  const cat = VALID_CATEGORIES.has(rawCat as LabCategory)
    ? (rawCat as LabCategory)
    : null;

  return { section, cat };
}

/**
 * Build a `?s=...&cat=...` query string for the given state. Omits the cat
 * param when not on the shelf section so links stay tidy.
 */
export function buildSectionQuery(section: Section, cat: LabCategory | null): string {
  const params = new URLSearchParams();
  params.set('s', section);
  if (section === 'shelf' && cat) {
    params.set('cat', cat);
  }
  return `?${params.toString()}`;
}
