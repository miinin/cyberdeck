import type { CardKey } from '../domain/cardKey';
import { LEGEND_COUNT, MAX_MAIN_DECK, MIN_MAIN_DECK } from '../domain/deckRules';
import type { DeckIssue, DeckIssueType } from '../domain/deckRules';
import { SIDEBOARD_SIZE } from '../domain/deck';
import { deckTexts } from './deckTexts';

/** What is wrong with one row of the deck (T-101): a short visible reason and the full explanation. */
export interface RowProblem {
  readonly short: string;
  readonly message: string;
}

/** What is wrong with a whole section: the count is off. */
export interface SectionProblem {
  readonly short: string;
  readonly message: string;
}

export interface DeckProblems {
  /** Rows of the Legends and the main deck. */
  readonly main: ReadonlyMap<CardKey, readonly RowProblem[]>;
  readonly side: ReadonlyMap<CardKey, readonly RowProblem[]>;
  readonly legends: SectionProblem | null;
  readonly mainSection: SectionProblem | null;
  readonly sideSection: SectionProblem | null;
}

const ROW_SHORT: Partial<Record<DeckIssueType, () => string>> = {
  copies: () => deckTexts.problemCopies,
  ram: () => deckTexts.problemRam,
  'legend-duplicate': () => deckTexts.problemLegendDuplicate,
  'sideboard-copies': () => deckTexts.problemSideboardCopies,
  'sideboard-legend': () => deckTexts.problemSideboardLegend,
};

/** Splits the issues of validateDeck into per-row and per-section problems for the list (T-101). Warnings are left out. */
export function deckProblems(issues: readonly DeckIssue[], mainCount: number): DeckProblems {
  const main = new Map<CardKey, RowProblem[]>();
  const side = new Map<CardKey, RowProblem[]>();
  let legends: SectionProblem | null = null;
  let mainSection: SectionProblem | null = null;
  let sideSection: SectionProblem | null = null;
  for (const issue of issues) {
    if (issue.severity !== 'error') continue;
    if (issue.type === 'legend-count') legends = { short: deckTexts.problemLegendsSize(LEGEND_COUNT), message: issue.message };
    else if (issue.type === 'main-size') {
      const short = mainCount < MIN_MAIN_DECK ? deckTexts.problemMainLow(MIN_MAIN_DECK) : deckTexts.problemMainHigh(MAX_MAIN_DECK);
      mainSection = { short, message: issue.message };
    } else if (issue.type === 'sideboard-size') {
      sideSection = { short: deckTexts.problemSideboardSize(SIDEBOARD_SIZE), message: issue.message };
    } else {
      const short = ROW_SHORT[issue.type]?.();
      if (short === undefined) continue;
      const target = issue.type.startsWith('sideboard-') ? side : main;
      for (const key of issue.cards) target.set(key, [...(target.get(key) ?? []), { short, message: issue.message }]);
    }
  }
  return { main, side, legends, mainSection, sideSection };
}

/** The warning mark of a row: visible "⚠ reason", the full explanation as title and for screen readers. */
export function ProblemFlag({ problems }: { problems: readonly RowProblem[] }) {
  const full = problems.map((problem) => problem.message).join(' ');
  return (
    <span className="problem-flag" title={full}>
      <span aria-hidden="true">⚠ {problems.map((problem) => problem.short).join(', ')}</span>
      <span className="visually-hidden">
        {deckTexts.problemFlagLabel}
        {problems.map((problem) => problem.short).join(', ')}
      </span>
    </span>
  );
}

/** The mark next to a section heading whose count is wrong. */
export function SectionFlag({ problem }: { problem: SectionProblem | null }) {
  if (problem === null) return null;
  return (
    <span className="problem-flag problem-flag--section" title={problem.message}>
      <span aria-hidden="true">⚠ {problem.short}</span>
      <span className="visually-hidden">
        {deckTexts.problemFlagLabel}
        {problem.short}
      </span>
    </span>
  );
}
