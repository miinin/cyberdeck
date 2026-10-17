import type { Card } from '../domain/card';
import type { Deck } from '../domain/deck';
import type { Repositories } from '../storage';
import { BoostersView, SealedView } from './SealedView';
import { sealedTexts as t } from './sealedTexts';
import { routeHash } from './useHashRoute';
import { useDecks } from './useDecks';

export type PlaytestTab = 'sealed' | 'boosters' | 'solo';

function cardCount(deck: Deck): number {
  return deck.sections.reduce((sum, section) => sum + section.cards.reduce((inner, row) => inner + row.count, 0), 0);
}

/** Pick one of your own decks to play alone (T-176). The choice opens the solo play (goldfish) of that deck. */
function SoloPick({ repositories }: { repositories: Repositories }) {
  const { phase, decks } = useDecks(repositories.decks);
  return (
    <section className="solo-pick" aria-labelledby="solo-pick-heading">
      <h2 id="solo-pick-heading">{t.soloHeading}</h2>
      <p>{t.soloIntro}</p>
      {phase === 'loading' && <p className="status-line">{t.soloLoading}</p>}
      {phase === 'unavailable' && (
        <div className="notice notice-danger" role="alert">
          <p>{t.soloUnavailable}</p>
        </div>
      )}
      {phase === 'ready' && decks.length === 0 && (
        <p>
          {t.soloEmpty} <a href={routeHash({ name: 'decks' })}>{t.soloEmptyLink}</a>
        </p>
      )}
      {phase === 'ready' && decks.length > 0 && (
        <ul className="solo-deck-list" aria-label={t.soloListLabel}>
          {decks.map((deck) => (
            <li key={deck.id}>
              <a className="solo-deck-link" href={routeHash({ name: 'goldfish', id: deck.id })} aria-label={t.soloPlayDeck(deck.name)}>
                <span className="solo-deck-name">{deck.name}</span>
                <span className="solo-deck-count">{t.soloCards(cardCount(deck))}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The Playtest section (T-176, D-036): Sealed, Boosters and Play solo as tabs. */
export function PlaytestView({ cards, repositories, tab }: { cards: readonly Card[]; repositories: Repositories; tab: PlaytestTab }) {
  return (
    <>
      <div className="page-head decks-head">
        <h1>{t.playtestHeading}</h1>
      </div>
      <nav className="segmented decks-tabs playtest-tabs" aria-label={t.playtestTabsLabel}>
        <a className="segmented-option" href={routeHash({ name: 'sealed' })} aria-current={tab === 'sealed' ? 'page' : undefined}>
          {t.tab}
        </a>
        <a className="segmented-option" href={routeHash({ name: 'boosters' })} aria-current={tab === 'boosters' ? 'page' : undefined}>
          {t.tabBoosters}
        </a>
        <a className="segmented-option" href={routeHash({ name: 'soloPick' })} aria-current={tab === 'solo' ? 'page' : undefined}>
          {t.tabSolo}
        </a>
      </nav>
      {tab === 'sealed' && <SealedView cards={cards} repositories={repositories} />}
      {tab === 'boosters' && <BoostersView cards={cards} />}
      {tab === 'solo' && <SoloPick repositories={repositories} />}
    </>
  );
}
