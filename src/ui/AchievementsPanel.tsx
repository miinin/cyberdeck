import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { achievements, nextAchievements } from '../domain/achievements';
import type { Achievement } from '../domain/achievements';
import type { Card } from '../domain/card';
import type { Collection } from '../domain/collection';
import { collectionTexts } from './collectionTexts';
import { RaritySymbol } from './RaritySymbol';

/** Open badges shown before "the rest": the closest ones. */
const SHOWN_OPEN = 6;

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
    {children}
  </svg>
);
const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** The icon of a badge (T-150): what it is about, drawn in the game's look; a rarity uses its own symbol. */
function BadgeIcon({ item }: { item: Achievement }) {
  switch (item.kind) {
    case 'rarity':
      return <RaritySymbol rarity={String(item.subject)} size={30} />;
    case 'color':
      return svg(<path d="M16 3l11 13-11 13L5 16z" className={`badge-color badge-color--${String(item.subject).toLowerCase()}`} />);
    case 'distinct':
    case 'all':
      // A skyline.
      return svg(<path {...line} d="M3 28h26M6 28V16h5v12M11 28V9h6v19M17 28V13h4v15M21 28V5h6v23" />);
    case 'copies':
      // A stack of cards.
      return svg(<path {...line} d="M8 6h14v20H8zM11 3h14v20M5 9v20h14" />);
    case 'playsets':
      // Three cards fanned out.
      return svg(<path {...line} d="M5 9l8-3 4 18-8 3zM12 6h8v20h-8M19 6l8 3-4 18" />);
    case 'set':
      return svg(
        <text x="16" y="21" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor" fontFamily="inherit">
          WNC
        </text>,
      );
    case 'type': {
      const paths: Record<string, string> = {
        // A crown, a figure, a wrench, a chip.
        Legend: 'M5 24h22L25 10l-5 6-4-9-4 9-5-6z',
        Unit: 'M16 4a5 5 0 110 10 5 5 0 010-10zM6 28c0-6 4-10 10-10s10 4 10 10',
        Gear: 'M22 4a6 6 0 00-6 8L5 23l4 4 11-11a6 6 0 008-6l-4 3-3-3z',
        Program: 'M9 9h14v14H9zM13 5v4M19 5v4M13 23v4M19 23v4M5 13h4M5 19h4M23 13h4M23 19h4',
      };
      return svg(<path {...line} d={paths[String(item.subject)] ?? paths.Program} />);
    }
  }
}

/** The color classes of a badge (T-154): a color badge its card color, a type badge the deck chart's type color. */
function badgeClasses(item: Achievement): string {
  if (item.kind === 'color') return ` badge--color-${String(item.subject).toLowerCase()}`;
  if (item.kind === 'type') return ` badge--type-${String(item.subject).toLowerCase()}`;
  return '';
}

function Badge({ item }: { item: Achievement }) {
  const share = item.total === 0 ? 0 : item.owned / item.total;
  return (
    <li
      className={`badge badge--tier-${item.tier}${badgeClasses(item)}${item.done ? ' is-done' : ''}`}
    >
      <span className="badge-icon">
        <BadgeIcon item={item} />
      </span>
      <span className="badge-body">
        <strong className="badge-title">{collectionTexts.achievementTitle(item)}</strong>
        <span className="badge-flavor">{collectionTexts.achievementFlavor(item)}</span>
        {item.done ? (
          <span className="badge-stamp">{collectionTexts.achievementUnlocked}</span>
        ) : (
          <span className="badge-progress">
            <span className="badge-bar" aria-hidden="true">
              <span className="badge-fill" style={{ inlineSize: `${share * 100}%` }} />
            </span>
            <span className="badge-count">
              {item.owned} / {item.total}
            </span>
          </span>
        )}
      </span>
    </li>
  );
}

/**
 * Achievements (T-132, T-150): computed from the collection, so nothing is stored. A meter with one cell per badge, the
 * earned badges (hardest first), the closest open ones, and the rest behind a disclosure (no inner scroll).
 */
export function AchievementsPanel({
  cards,
  collection,
  hasArt,
}: {
  cards: readonly Card[];
  collection: Collection;
  /** Whether a special art has its own picture (as in the overview's special art rows). */
  hasArt: (cardKey: string, rarity: string) => boolean;
}) {
  const list = useMemo(() => achievements(cards, collection, hasArt), [cards, collection, hasArt]);
  const earned = list.filter((item) => item.done).sort((a, b) => b.tier - a.tier);
  const open = nextAchievements(list, list.length);
  const shown = open.slice(0, SHOWN_OPEN);
  const rest = open.slice(SHOWN_OPEN);
  return (
    <section className="panel collection-wide achievements" aria-labelledby="coll-achievements">
      <div className="achievements-head">
        <h2 id="coll-achievements" className="panel-title">
          {collectionTexts.achievementsHeading}
        </h2>
        <span className="achievements-score">{collectionTexts.achievementsEarned(earned.length, list.length)}</span>
      </div>
      <div className="achievements-meter" aria-hidden="true">
        {list.map((item) => (
          <span
            key={item.id}
            className={`badge--tier-${item.tier}${badgeClasses(item)}${item.done ? ' is-on' : ''}`}
          />
        ))}
      </div>
      {earned.length > 0 && (
        <ul className="badge-grid" aria-label={collectionTexts.achievementsEarnedList}>
          {earned.map((item) => (
            <Badge key={item.id} item={item} />
          ))}
        </ul>
      )}
      {open.length === 0 ? (
        <p className="achievements-all-done">{collectionTexts.achievementsAllDone}</p>
      ) : (
        <>
          <h3 className="progress-subtitle">{collectionTexts.achievementsNext}</h3>
          <ul className="badge-grid" aria-label={collectionTexts.achievementsOpenList}>
            {shown.map((item) => (
              <Badge key={item.id} item={item} />
            ))}
          </ul>
          {rest.length > 0 && (
            <details className="disclosure progress-more">
              <summary>{collectionTexts.achievementsOpen(rest.length)}</summary>
              <ul className="badge-grid">
                {rest.map((item) => (
                  <Badge key={item.id} item={item} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
