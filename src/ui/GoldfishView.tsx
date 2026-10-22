import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Card } from '../domain/card';
import type { DeckContent } from '../domain/deck';
import { mainDeckSize } from '../domain/deckStats';
import { toCardsByKey } from '../domain/deckRules';
import type { CardsByKey } from '../domain/deckRules';
import {
  GIG_DICE,
  GOLDFISH_TURNS,
  attack,
  attackProblem,
  availableMoney,
  canMulligan,
  chooseGig,
  costOf,
  endGame,
  endTurn,
  freeEddies,
  gigsStolen,
  invokeLegend,
  invokeProblem,
  keepHand,
  mulligan,
  needsTarget,
  play,
  playProblem,
  sell,
  sellProblem,
  selectableDice,
  start,
  streetCred,
} from '../domain/goldfish';
import type { GearTarget, GoldfishResult, GoldfishState, TurnLog } from '../domain/goldfish';
import type { Rng } from '../domain/testHand';
import { getCardImage } from '../data/cardImages';
import type { Repositories } from '../storage';
import { CardName, cardNameText } from './CardName';
import { DieShape } from './DieShape';
import { goldfishTexts as t } from './goldfishTexts';
import { sealedTexts } from './sealedTexts';
import { deckTexts } from './deckTexts';

/** A card picture of the table (hand, field, Legends). The image is decorative; text around it names the card. */
function Picture({ card }: { card: Card }) {
  const image = getCardImage(card.key);
  const [failed, setFailed] = useState(false);
  if (image === null || failed) {
    return (
      <span className="gf-picture gf-picture-missing" aria-hidden="true" lang="en">
        <span>
          <CardName card={card} />
        </span>
      </span>
    );
  }
  return (
    <img
      className="gf-picture"
      src={image.medium}
      width={360}
      height={503}
      alt=""
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

/** Text of one turn of the log. */
function logText(entry: TurnLog): string {
  return t.logEntry(entry.turn, {
    drawn: entry.drawn === null ? null : cardNameText(entry.drawn),
    gig: entry.gig === null ? null : t.logGig(entry.gig.die, entry.gig.value),
    sold: entry.sold === null ? null : cardNameText(entry.sold),
    played: entry.played.map((row) => t.logPlayed(cardNameText(row.card), row.cost)),
    invoked: entry.invoked === null ? null : cardNameText(entry.invoked),
    stolen: entry.stolen,
  });
}

type FocusTarget = 'hand' | 'gig' | 'field' | 'legends' | 'summary' | 'heading';

/** The deck as a table: set-up, mulligan, seven turns and a summary. Nothing is stored (T-172). */
export function GoldfishView({
  deck,
  cardsByKey,
  rng = Math.random,
  onBack,
  backLabel = t.back,
}: {
  deck: DeckContent;
  cardsByKey: CardsByKey;
  rng?: Rng;
  onBack: () => void;
  /** The text of the way back; the default leads to the deck. */
  backLabel?: string;
}) {
  const [game, setGame] = useState<GoldfishState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [targetChoice, setTargetChoice] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const lastGoFirst = useRef(true);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const handRef = useRef<HTMLHeadingElement>(null);
  const gigRef = useRef<HTMLHeadingElement>(null);
  const fieldRef = useRef<HTMLHeadingElement>(null);
  const legendsRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<FocusTarget | null>(null);
  const mainCount = useMemo(() => mainDeckSize(deck, cardsByKey), [deck, cardsByKey]);

  // The element that had the focus may have been disabled or removed by the action: hand it to a heading.
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    const refs: Record<FocusTarget, RefObject<HTMLHeadingElement | null>> = {
      hand: handRef,
      gig: gigRef,
      field: fieldRef,
      legends: legendsRef,
      summary: summaryRef,
      heading: headingRef,
    };
    refs[target].current?.focus({ preventScroll: true });
  });

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const begin = (goFirst: boolean) => {
    lastGoFirst.current = goFirst;
    const next = start(deck, cardsByKey, rng, goFirst);
    setGame(next);
    setSelected(null);
    pendingFocus.current = 'hand';
    setAnnouncement(t.announceNew(next.hand.map(cardNameText)));
  };

  const restart = () => {
    pendingFocus.current = 'heading';
    setGame(null);
  };

  /** Applies an action: a refusal leaves the state as it is (the buttons show why beforehand). */
  const apply = (result: GoldfishResult, announce: (next: GoldfishState) => string, focus: FocusTarget) => {
    if (!result.ok) return;
    setGame(result.state);
    setSelected(null);
    pendingFocus.current = result.state.phase === 'over' ? 'summary' : focus;
    setAnnouncement(announce(result.state));
  };

  if (mainCount === 0) {
    return (
      <section className="goldfish">
        <p className="editor-crumb">
          <button type="button" className="link-button" onClick={onBack}>
            <span aria-hidden="true">← </span>
            {backLabel}
          </button>
        </p>
        <h1 ref={headingRef} tabIndex={-1}>
          {t.heading}
        </h1>
        <p className="hint">{t.empty}</p>
      </section>
    );
  }

  const turnAnnouncement = (next: GoldfishState) =>
    next.phase === 'over' ? t.announceOver : t.announceTurn(next.turn, next.log.at(-1)?.drawn ? cardNameText(next.log.at(-1)?.drawn as Card) : null);

  const header = (
    <>
      <p className="editor-crumb">
        <button type="button" className="link-button" onClick={onBack}>
          <span aria-hidden="true">← </span>
          {backLabel}
        </button>
      </p>
      <h1 ref={headingRef} tabIndex={-1}>
        {t.heading}
        <span className="gf-deck-name">
          <span className="gf-deck-sep" aria-hidden="true">
            {' · '}
          </span>
          {deck.name}
        </span>
      </h1>
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </>
  );

  // 1. Order of play.
  if (game === null) {
    return (
      <section className="goldfish">
        {header}
        <p>{t.intro}</p>
        <div className="panel gf-order">
          <h2 className="panel-title">{t.orderTitle}</h2>
          <div className="gf-buttons">
            <button type="button" className="button-primary" onClick={() => begin(true)}>
              {t.goFirst}
            </button>
            <button type="button" className="button-secondary" onClick={() => begin(false)}>
              {t.goSecond}
            </button>
          </div>
          <p className="hint">{t.orderHint}</p>
        </div>
        <p className="hint">{t.note}</p>
      </section>
    );
  }

  // 2. Opening hand: keep or mulligan.
  if (game.phase === 'mulligan') {
    return (
      <section className="goldfish">
        {header}
        <div className="gf-board gf-board--opening">
          <h2 className="panel-title" ref={handRef} tabIndex={-1}>
            {t.openingTitle}
          </h2>
          <p className="hint">{t.openingHint(game.hand.length)}</p>
          <ul className="gf-hand" aria-label={t.handList(game.hand.length)}>
            {game.hand.map((card, index) => (
              <li key={`${index}-${card.key}`} className="gf-hand-item">
                <span className="gf-card">
                  <Picture card={card} />
                  <span className="visually-hidden">
                    <CardName card={card} />
                  </span>
                  <span className="gf-cap" aria-hidden="true">
                    {costOf(card)} $
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="gf-buttons gf-buttons--center">
            <button type="button" className="button-primary" onClick={() => apply(keepHand(game), turnAnnouncement, 'gig')}>
              {t.keep}
            </button>
            <button
              type="button"
              className="button-secondary"
              disabled={!canMulligan(game)}
              onClick={() => {
                const result = mulligan(game, rng);
                apply(result, (next) => t.announceNew(next.hand.map(cardNameText)), 'hand');
              }}
            >
              {game.mulliganUsed ? t.mulliganUsed : t.mulligan}
            </button>
          </div>
        </div>
        <p className="hint">{t.note}</p>
      </section>
    );
  }

  const over = game.phase === 'over';
  const last = game.log.at(-1);
  const money = availableMoney(game);

  const selectedCard = selected === null ? undefined : game.hand[selected];
  const targets: { key: string; label: string; target: GearTarget }[] = [
    ...game.field.map((unit) => ({
      key: `u:${unit.id}`,
      label: t.targetUnit(cardNameText(unit.card)),
      target: { kind: 'unit', id: unit.id } as GearTarget,
    })),
    ...game.legends.map((slot, index) => ({
      key: `l:${index}`,
      label: slot.faceUp ? t.targetLegend(cardNameText(slot.card), index) : t.targetLegendDown(index),
      target: { kind: 'legend', index } as GearTarget,
    })),
  ];
  const chosenTarget = targets.find((entry) => entry.key === targetChoice) ?? targets[0];
  const gearTarget = selectedCard !== undefined && needsTarget(selectedCard) ? chosenTarget?.target : undefined;
  const sellReason = selected === null || over ? null : sellProblem(game, selected);
  const playReason = selected === null || over ? null : playProblem(game, selected, gearTarget);
  const invokeReason = over ? 'wrong-phase' : invokeProblem(game);
  const selectable = selectableDice(game);
  // The latest roll of each die, so a rolled die keeps its place in the row and shows its value.
  const rolledDice = new Map<number, { value: number; fresh: boolean }>();
  for (const entry of game.log) {
    if (entry.gig !== null) rolledDice.set(entry.gig.die, { value: entry.gig.value, fresh: entry.turn === game.turn && !game.gigPending });
  }

  const gigLine = game.gigPending
    ? t.gigChoose + (game.dice.length > 1 && game.dice.includes(20) ? ` ${t.error('die-last')}.` : '')
    : last?.gig
      ? t.gigDone(last.gig.die, last.gig.value)
      : game.dice.length === 0
        ? t.gigChooseNone
        : '';

  const statusItems: { label: string; value: string; hint?: string; pips?: boolean; key?: string }[] = [
    { label: t.turn, value: t.turnValue(Math.min(game.turn, GOLDFISH_TURNS), GOLDFISH_TURNS), pips: true },
    { label: t.money, value: t.moneyValue(money), hint: t.moneyHint },
    { label: t.eddies, value: t.eddiesValue(freeEddies(game), game.eddies), hint: t.eddiesHint },
    {
      label: t.gigs,
      value: game.gigs.length === 0 ? t.gigsNone : game.gigs.join(' + '),
      hint: t.streetCred(streetCred(game)),
    },
    { label: t.stolen, value: String(game.stolen), hint: t.stolenHint, key: 'stolen' },
  ];

  return (
    <section className="goldfish">
      {header}
      <div className="gf-layout">
        <div className="gf-main" aria-label={t.boardLabel}>
          <div className="gf-board">
            <dl className="gf-status gf-hud" aria-label={t.statusLabel}>
              {statusItems.map((item) => (
                <div key={item.label} title={item.hint} className={(item.label === t.gigs ? 'is-gigs ' : '') + (item.key === 'stolen' ? 'is-stolen' : '')}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                  <dd className="gf-status-hint">
                    {item.pips ? (
                      <span className="gf-pips" aria-hidden="true">
                        {Array.from({ length: GOLDFISH_TURNS }, (_, i) => (
                          <span key={i} className={i < game.turn ? 'is-on' : ''} />
                        ))}
                      </span>
                    ) : (
                      (item.hint ?? ' ')
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {over && (
              <div className="gf-summary">
                <h2 className="panel-title" ref={summaryRef} tabIndex={-1}>
                  {t.summaryTitle}
                </h2>
                <p>{t.summaryEnd(game.end)}</p>
                <dl className="gf-summary-list">
                  <div>
                    <dt>{t.summaryFirstUnit}</dt>
                    <dd>{t.summaryFirstUnitValue(game.firstUnitTurn)}</dd>
                  </div>
                  <div>
                    <dt>{t.summaryWasted}</dt>
                    <dd>
                      {game.wasted} $ <span className="hint">({t.summaryWastedHint})</span>
                    </dd>
                  </div>
                  <div>
                    <dt>{t.summaryStolen}</dt>
                    <dd>{game.stolen}</dd>
                  </div>
                  <div>
                    <dt>{t.summaryGigs}</dt>
                    <dd>{t.summaryGigsValue(game.gigs.length, streetCred(game))}</dd>
                  </div>
                  <div>
                    <dt>{t.summaryPlayed}</dt>
                    <dd>{game.played.length === 0 ? t.summaryPlayedNone : game.played.map(cardNameText).join(', ')}</dd>
                  </div>
                </dl>
                <div className="gf-buttons">
                  <button type="button" className="button-primary" onClick={() => begin(lastGoFirst.current)}>
                    {t.playAgain}
                  </button>
                  <button type="button" className="button-secondary" onClick={restart}>
                    {t.restart}
                  </button>
                </div>
              </div>
            )}

            <div className="gf-areas">
              <div className="gf-zone gf-legends-panel">
                <h2 className="panel-title" ref={legendsRef} tabIndex={-1}>
                  {t.legendsTitle}
                </h2>
                {game.legends.length === 0 && <p className="hint">{t.legendsNone}</p>}
                <ul className="gf-legends">
                  {game.legends.map((slot, index) => (
                    <li key={`${index}-${slot.card.key}`} className={'gf-slot' + (slot.spent ? ' is-spent' : '')}>
                      <span className="gf-card">
                        {slot.faceUp ? <Picture card={slot.card} /> : <span className="gf-picture gf-back" aria-hidden="true" />}
                      </span>
                      <span className="gf-state">
                        <span className="gf-state-name" lang={slot.faceUp ? 'en' : undefined}>
                          {slot.faceUp ? <CardName card={slot.card} /> : t.legendDown}
                        </span>
                        <span className="gf-state-meta">{slot.spent ? t.legendSpent : t.legendReady}</span>
                      </span>
                      {slot.gear.map((gear, gearIndex) => (
                        <span key={gearIndex} className="gf-gear" lang="en">
                          {t.gearOn(cardNameText(gear))}
                        </span>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="gf-zone gf-field-panel">
                <h2 className="panel-title" ref={fieldRef} tabIndex={-1}>
                  {t.fieldTitle}
                </h2>
                {game.field.length === 0 ? (
                  <p className="gf-empty">{t.fieldEmpty}</p>
                ) : (
                  <ul className="gf-field">
                    {game.field.map((unit) => {
                      const reason = over ? 'wrong-phase' : attackProblem(game, unit.id);
                      return (
                        <li key={unit.id} className={'gf-slot' + (unit.spent ? ' is-spent' : '') + (unit.lag ? ' is-lag' : '')}>
                          <span className="gf-card">
                            <Picture card={unit.card} />
                            {unit.lag && (
                              <span className="gf-badge" aria-hidden="true">
                                {t.unitLag}
                              </span>
                            )}
                          </span>
                          <span className="gf-state">
                            <span className="gf-state-name" lang="en">
                              <CardName card={unit.card} />
                            </span>
                            <span className="gf-state-meta">
                              {t.unitPower(unit.card.power)}
                              {' · '}
                              {unit.lag ? t.unitLag : unit.spent ? t.unitSpent : t.unitReady}
                            </span>
                          </span>
                          {unit.gear.map((gear, gearIndex) => (
                            <span key={gearIndex} className="gf-gear" lang="en">
                              {t.gearOn(cardNameText(gear))}
                            </span>
                          ))}
                          <button
                            type="button"
                            className="button-secondary button--sm gf-attack"
                            disabled={reason !== null}
                            onClick={() =>
                              apply(
                                attack(game, unit.id),
                                () => t.announceAttack(cardNameText(unit.card), gigsStolen(unit.card.power)),
                                'field',
                              )
                            }
                          >
                            {t.attack(gigsStolen(unit.card.power))}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="gf-zone gf-gig">
                <h2 className="panel-title" ref={gigRef} tabIndex={-1}>
                  {t.gigTitle}
                </h2>
                <div className="gf-dice">
                  {GIG_DICE.map((die) => {
                    const rolled = rolledDice.get(die);
                    const inFixer = game.dice.includes(die);
                    const state = rolled !== undefined && !inFixer ? 'rolled' : selectable.includes(die) && game.gigPending && !over ? 'ready' : 'waiting';
                    return (
                      <button
                        key={die}
                        type="button"
                        className={'gf-die is-' + state + (rolled?.fresh === true ? ' is-fresh' : '')}
                        aria-label={t.gigRollLabel(die)}
                        disabled={over || !game.gigPending || !selectable.includes(die)}
                        onClick={() => apply(chooseGig(game, die, rng), (next) => t.announceGig(die, next.log.at(-1)?.gig?.value ?? 0), 'hand')}
                      >
                        <DieShape die={die} value={state === 'rolled' ? (rolled?.value ?? null) : null} />
                        <span className="gf-die-name" aria-hidden="true">
                          {t.gigRoll(die)}
                        </span>
                        <span className="gf-die-state" aria-hidden="true">
                          {state === 'rolled' ? t.dieRolled : t.dieInFixer}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="gf-line">{gigLine}</p>
              </div>
            </div>

            <div className="gf-lower">
              <div className="gf-zone gf-hand-zone">
                <h2 className="panel-title" ref={handRef} tabIndex={-1}>
                  {t.handTitle(game.hand.length)}
                </h2>
                {game.hand.length === 0 ? (
                  <p className="gf-empty">{t.handEmpty}</p>
                ) : (
                  <ul className="gf-hand" aria-label={t.handList(game.hand.length)}>
                    {game.hand.map((card, index) => (
                      <li key={`${index}-${card.key}`} className="gf-hand-item">
                        <button
                          type="button"
                          className={'gf-card gf-pick' + (selected === index ? ' is-selected' : '')}
                          aria-pressed={selected === index}
                          disabled={over}
                          onClick={() => setSelected(selected === index ? null : index)}
                        >
                          <Picture card={card} />
                          <span className="visually-hidden">
                            {t.pickCard}
                            <CardName card={card} />
                          </span>
                          <span className="gf-cap" aria-hidden="true">
                            {costOf(card)} $ {card.eddiable === true ? '· €$' : ''}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="gf-piles">
                <div className="gf-pile">
                  <span className="gf-pile-stack" aria-hidden="true">
                    {game.library.length}
                  </span>
                  <span className="gf-pile-label">
                    {t.library}
                    <span className="visually-hidden">: {game.library.length}</span>
                  </span>
                </div>
                <div className="gf-pile gf-pile--trash">
                  <span className="gf-pile-stack" aria-hidden="true">
                    {game.trash.length}
                  </span>
                  <span className="gf-pile-label">
                    {t.trash}
                    <span className="visually-hidden">: {game.trash.length}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="gf-bar">
            <div className="gf-bar-card">
              {selectedCard === undefined ? (
                <p className="gf-line">{t.selectedNone}</p>
              ) : (
                <>
                  <p className="gf-line gf-selected-name" lang="en">
                    <CardName card={selectedCard} />
                  </p>
                  {needsTarget(selectedCard) && (
                    <label className="gf-target">
                      <span>{t.gearTarget}</span>
                      <select value={chosenTarget?.key ?? ''} onChange={(event) => setTargetChoice(event.target.value)}>
                        {targets.map((entry) => (
                          <option key={entry.key} value={entry.key}>
                            {entry.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </>
              )}
            </div>
            <div className="gf-actions gf-bar-actions">
              <div className="gf-action">
                <button
                  type="button"
                  className="button-primary"
                  disabled={selectedCard === undefined || playReason !== null}
                  onClick={() =>
                    selected !== null &&
                    selectedCard !== undefined &&
                    apply(
                      play(game, selected, gearTarget),
                      () => t.announcePlayed(cardNameText(selectedCard), costOf(selectedCard)),
                      'hand',
                    )
                  }
                >
                  {selectedCard === undefined ? t.playBare : t.play(costOf(selectedCard))}
                </button>
                <small>{selectedCard === undefined || playReason === null ? ' ' : t.error(playReason)}</small>
              </div>
              <div className="gf-action">
                <button
                  type="button"
                  className="button-secondary"
                  disabled={selectedCard === undefined || sellReason !== null}
                  onClick={() =>
                    selected !== null &&
                    selectedCard !== undefined &&
                    apply(sell(game, selected), () => t.announceSold(cardNameText(selectedCard)), 'hand')
                  }
                >
                  {t.sell}
                </button>
                <small>{selectedCard === undefined ? ' ' : sellReason === null ? t.sellHint : t.error(sellReason)}</small>
              </div>
              <div className="gf-action">
                <button
                  type="button"
                  className="button-secondary"
                  disabled={invokeReason !== null}
                  onClick={() =>
                    apply(
                      invokeLegend(game, rng),
                      (next) => t.announceInvoke(next.log.at(-1)?.invoked ? cardNameText(next.log.at(-1)?.invoked as Card) : ''),
                      'legends',
                    )
                  }
                >
                  {t.invoke}
                </button>
                <small>{invokeReason === null || over ? ' ' : t.error(invokeReason)}</small>
              </div>
              <div className="gf-action">
                <button
                  type="button"
                  className="button-primary"
                  disabled={over || game.gigPending}
                  onClick={() => apply(endTurn(game), turnAnnouncement, 'gig')}
                >
                  {t.endTurn}
                </button>
                <small>{game.gigPending && !over ? t.error('gig-pending') : ' '}</small>
              </div>
            </div>
          </div>

          <div className="gf-buttons">
            <button type="button" className="button-secondary" onClick={restart}>
              {t.restart}
            </button>
            <button
              type="button"
              className="button-secondary"
              disabled={over}
              onClick={() => apply({ ok: true, state: endGame(game) }, () => t.announceOver, 'summary')}
            >
              {t.endGame}
            </button>
          </div>
          <p className="hint">{t.note}</p>
        </div>

        <aside className="gf-log">
          <h2 className="panel-title">{t.logTitle}</h2>
          {game.log.length === 0 ? (
            <p className="hint">{t.logEmpty}</p>
          ) : (
            <ol className="gf-log-list" reversed>
              {[...game.log].reverse().map((entry) => (
                <li key={entry.turn}>{logText(entry)}</li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </section>
  );
}

/** Loads the deck (null = it does not exist) and shows the solo play view for it. */
function GoldfishLoadedPage({
  load,
  cards,
  onBack,
  backLabel,
  missingText,
  rng,
}: {
  load: () => Promise<DeckContent | null>;
  cards: readonly Card[];
  onBack: () => void;
  backLabel: string;
  missingText: string;
  rng?: Rng;
}) {
  const cardsByKey = useMemo(() => toCardsByKey(cards), [cards]);
  const [state, setState] = useState<{ phase: 'loading' | 'not-found' | 'unavailable' } | { phase: 'ready'; deck: DeckContent }>({
    phase: 'loading',
  });
  useEffect(() => {
    let active = true;
    load().then(
      (deck) => {
        if (!active) return;
        setState(deck === null ? { phase: 'not-found' } : { phase: 'ready', deck });
      },
      () => active && setState({ phase: 'unavailable' }),
    );
    return () => {
      active = false;
    };
  }, [load]);

  if (state.phase === 'ready') return <GoldfishView deck={state.deck} cardsByKey={cardsByKey} rng={rng} onBack={onBack} backLabel={backLabel} />;
  return (
    <section className="goldfish">
      <h1>{state.phase === 'loading' ? t.loading : deckTexts.listHeading}</h1>
      {state.phase !== 'loading' && (
        <div className="notice notice-danger" role="alert">
          <p>{state.phase === 'not-found' ? missingText : t.unavailable}</p>
        </div>
      )}
      <p className="editor-crumb">
        <button type="button" className="link-button" onClick={onBack}>
          <span aria-hidden="true">← </span>
          {backLabel}
        </button>
      </p>
    </section>
  );
}

/** The route page: loads the stored deck and shows the solo play view for it. */
export function GoldfishDeckPage({
  deckId,
  cards,
  repository,
  onBack,
  rng,
}: {
  deckId: string;
  cards: readonly Card[];
  repository: Repositories['decks'];
  onBack: () => void;
  rng?: Rng;
}) {
  const load = useCallback(async () => {
    const deck = await repository.get(deckId);
    return deck === null ? null : { name: deck.name, sections: deck.sections };
  }, [repository, deckId]);
  return <GoldfishLoadedPage load={load} cards={cards} onBack={onBack} backLabel={t.back} missingText={t.notFound} rng={rng} />;
}

/** The route page of the running sealed (T-173): the Legends and the main deck as built so far. */
export function GoldfishSealedPage({
  cards,
  repository,
  onBack,
  rng,
}: {
  cards: readonly Card[];
  repository: Repositories['sealed'];
  onBack: () => void;
  rng?: Rng;
}) {
  const load = useCallback(async () => {
    const { value: run } = await repository.load();
    if (run === null) return null;
    return {
      name: sealedTexts.soloName,
      sections: [{ name: '', cards: [...run.legends.map((card) => ({ card, count: 1 })), ...run.main] }],
    };
  }, [repository]);
  return <GoldfishLoadedPage load={load} cards={cards} onBack={onBack} backLabel={sealedTexts.soloBack} missingText={sealedTexts.soloMissing} rng={rng} />;
}
