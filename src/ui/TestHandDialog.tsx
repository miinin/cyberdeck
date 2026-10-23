import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Card } from '../domain/card';
import { CARD_IMAGE_SIZES, CARD_IMAGE_WIDTH, cardImageHeight, cardImageSrcSet } from '../domain/cardImage';
import type { DeckContent } from '../domain/deck';
import type { CardsByKey } from '../domain/deckRules';
import { DRAWS_PER_TURN } from '../domain/deckStats';
import { OPENING_HAND, canMulligan, drawCard, mulligan, startHand } from '../domain/testHand';
import type { Rng, TestHandState } from '../domain/testHand';
import { getCardImage } from '../data/cardImages';
import { CardName, cardNameText } from './CardName';
import { deckTexts } from './deckTexts';
import { InfoTip } from './InfoTip';
import { texts } from './texts';

/** One card of the hand: the image is the content, so its alt is the card's name (T-053). */
function HandCard({ card, newest }: { card: Card; newest: boolean }) {
  const image = getCardImage(card.key);
  const [failed, setFailed] = useState(false);
  return (
    <li className={'hand-card' + (newest ? ' is-newest' : '')}>
      {image !== null && !failed ? (
        <img
          className="hand-card-image"
          src={image.medium}
          srcSet={cardImageSrcSet(image)}
          sizes={CARD_IMAGE_SIZES}
          width={CARD_IMAGE_WIDTH.md}
          height={cardImageHeight('md')}
          alt={cardNameText(card)}
          lang="en"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        // No image: the name is shown in the frame and the frame is still one image of the hand.
        <span className="hand-card-image hand-card-missing" role="img" aria-label={cardNameText(card)} lang="en">
          <span aria-hidden="true">
            <CardName card={card} />
          </span>
        </span>
      )}
      {newest && <span className="visually-hidden">{deckTexts.testHandNewest}</span>}
    </li>
  );
}

const names = (cards: readonly Card[]) => cards.map(cardNameText);

/**
 * Test hand (T-053): a native modal dialog that deals an example opening hand when it opens. Nothing is
 * stored; closing forgets the hand. Esc and "Sulje" close it and the focus returns to the opener.
 * `open` false = closed. The random source is a prop so tests are deterministic.
 */
export function TestHandDialog({
  open,
  deck,
  cardsByKey,
  rng,
  onClose,
}: {
  open: boolean;
  deck: DeckContent;
  cardsByKey: CardsByKey;
  rng: Rng;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const drawRef = useRef<HTMLButtonElement>(null);
  const mulliganRef = useRef<HTMLButtonElement>(null);
  const newHandRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<TestHandState | null>(null);
  const [announcement, setAnnouncement] = useState('');
  /** Set when the dialog opens: the next render moves the focus to the first action. */
  const focusFirst = useRef(false);

  const deal = () => {
    const next = startHand(deck, cardsByKey, rng);
    setState(next);
    setAnnouncement(deckTexts.testHandAnnounceNew(names(next.hand)));
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) {
      deal();
      dialog.showModal();
      focusFirst.current = true;
    } else if (!open && dialog.open) dialog.close();
    // deal() reads the deck at the moment the dialog opens; later deck edits do not reshuffle the hand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Focus: "Nosta kortti" after opening; a button that a click disabled hands the focus to the first
  // enabled action, so it never falls to the page (T-053 kohta 13).
  useLayoutEffect(() => {
    if (!open || state === null) return;
    const active = document.activeElement;
    const inDialog =
      active instanceof HTMLElement && dialogRef.current?.contains(active) && active !== dialogRef.current;
    if (!focusFirst.current && inDialog && !(active as HTMLButtonElement).disabled) return;
    focusFirst.current = false;
    const target = [drawRef, mulliganRef, newHandRef]
      .map((ref) => ref.current)
      .find((button) => button && !button.disabled);
    target?.focus();
  }, [open, state]);

  const close = () => dialogRef.current?.close();

  const onDraw = () => {
    if (state === null) return;
    const next = drawCard(state);
    const drawn = next.hand.at(-1);
    setState(next);
    if (next !== state && drawn !== undefined) {
      setAnnouncement(deckTexts.testHandAnnounceDraw(cardNameText(drawn), next.hand.length));
    }
  };

  const onMulligan = () => {
    if (state === null) return;
    const next = mulligan(state, rng);
    setState(next);
    if (next !== state) setAnnouncement(deckTexts.testHandAnnounceMulligan(names(next.hand)));
  };

  const total = state === null ? 0 : state.hand.length + state.library.length;
  const status =
    state === null
      ? ''
      : [
          deckTexts.testHandInHand(state.hand.length),
          state.library.length === 0
            ? deckTexts.testHandLibraryEmpty
            : deckTexts.testHandInLibrary(state.library.length),
          deckTexts.testHandMulliganState(state.mulliganUsed),
        ].join(' · ');

  return (
    <dialog
      ref={dialogRef}
      className="test-hand-dialog"
      aria-labelledby="test-hand-title"
      onClose={() => {
        setState(null);
        setAnnouncement('');
        onClose();
      }}
    >
      <div className="test-hand-body">
        <div className="test-hand-header">
          <h2 id="test-hand-title">{deckTexts.testHandTitle}</h2>
          <button type="button" className="button-secondary dialog-close" aria-label={texts.closeDialog} onClick={close}>
            {texts.closeSymbol}
          </button>
        </div>
        <div className="visually-hidden" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
        {state !== null && (
          <>
            <p className="test-hand-status">
              {status}
              {total < OPENING_HAND && (
                <>
                  {' '}
                  <span className="test-hand-warning">{deckTexts.testHandSmallDeck(OPENING_HAND)}</span>
                </>
              )}
              {/* The explanations are a tip, so the hand and the buttons stay in view (T-181, 4b). */}
              <span className="has-info-tip test-hand-tip">
                <InfoTip>
                  {state.legends.length > 0 && (
                    <>
                      <span className="info-tip-line">{deckTexts.testHandLegendsHint}</span>
                    </>
                  )}
                  <span className="info-tip-line">{deckTexts.testHandNote(OPENING_HAND, DRAWS_PER_TURN)}</span>
                </InfoTip>
              </span>
            </p>
            <div className="test-hand-actions">
              <button
                ref={drawRef}
                type="button"
                className="button-primary"
                disabled={state.library.length === 0}
                onClick={onDraw}
              >
                {deckTexts.testHandDraw}
              </button>
              <button
                ref={mulliganRef}
                type="button"
                className="button-secondary"
                disabled={!canMulligan(state)}
                onClick={onMulligan}
              >
                {state.mulliganUsed ? deckTexts.testHandMulliganUsed : deckTexts.testHandMulligan}
              </button>
              <button ref={newHandRef} type="button" className="button-secondary" onClick={deal}>
                {deckTexts.testHandNew}
              </button>
            </div>
            <ul className="test-hand-cards" aria-label={deckTexts.testHandList(state.hand.length)}>
              {state.hand.map((card, index) => (
                <HandCard
                  // A hand may hold several copies of a card, so the position is part of the key.
                  key={`${index}-${card.key}`}
                  card={card}
                  newest={state.drawnAfterOpening > 0 && index === state.hand.length - 1}
                />
              ))}
            </ul>
            <div className="test-hand-legends">
              {state.legends.length === 0 ? (
                <p>{deckTexts.testHandNoLegends}</p>
              ) : (
                <>
                  <p>
                    <span className="test-hand-label">{deckTexts.testHandLegends}:</span>{' '}
                    {state.legends.map((legend, index) => (
                      <span key={`${index}-${legend.key}`}>
                        {index > 0 && ' · '}
                        <CardName card={legend} />
                      </span>
                    ))}
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
