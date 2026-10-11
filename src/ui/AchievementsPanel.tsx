import { useMemo } from 'react';
import { achievements, nextAchievements } from '../domain/achievements';
import type { Achievement } from '../domain/achievements';
import type { Card } from '../domain/card';
import type { Collection } from '../domain/collection';
import { collectionTexts } from './collectionTexts';

/** How many of the closest open goals are shown with a bar. */
const NEXT_COUNT = 3;

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false" className="achievement-check">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Badge({ item }: { item: Achievement }) {
  return (
    <li className={item.done ? 'achievement is-done' : 'achievement'}>
      {item.done && <CheckIcon />}
      <span className="achievement-label">{collectionTexts.achievementLabel(item)}</span>
      {!item.done && (
        <span className="achievement-count">
          {item.owned}/{item.total}
        </span>
      )}
    </li>
  );
}

/**
 * Achievements (T-132, I-8): computed from the collection, so nothing is stored. The earned badges, the closest open goals
 * with a bar, and the rest of the open ones behind a disclosure (no inner scroll).
 */
export function AchievementsPanel({ cards, collection }: { cards: readonly Card[]; collection: Collection }) {
  const list = useMemo(() => achievements(cards, collection), [cards, collection]);
  const earned = list.filter((item) => item.done);
  const next = nextAchievements(list, NEXT_COUNT);
  const open = list.filter((item) => !item.done);
  return (
    <section className="panel collection-wide achievements" aria-labelledby="coll-achievements">
      <div className="achievements-head">
        <h2 id="coll-achievements" className="panel-title">
          {collectionTexts.achievementsHeading}
        </h2>
        <span className="achievements-score">{collectionTexts.achievementsEarned(earned.length, list.length)}</span>
      </div>
      {earned.length > 0 && (
        <ul className="achievement-grid" aria-label={collectionTexts.achievementsEarnedList}>
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
          <ul className="progress-list">
            {next.map((item) => (
              <li key={item.id} className="progress-row">
                <span className="progress-label">{collectionTexts.achievementLabel(item)}</span>
                <span className="progress-bar" aria-hidden="true">
                  <span className="progress-fill" style={{ inlineSize: `${(item.owned / item.total) * 100}%` }} />
                </span>
                <span className="progress-numbers">
                  <strong>{item.owned}</strong> / {item.total}
                </span>
              </li>
            ))}
          </ul>
          {open.length > next.length && (
            <details className="disclosure progress-more">
              <summary>{collectionTexts.achievementsOpen(open.length)}</summary>
              <ul className="achievement-grid" aria-label={collectionTexts.achievementsOpenList}>
                {open.map((item) => (
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
