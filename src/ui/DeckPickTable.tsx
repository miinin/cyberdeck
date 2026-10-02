import type { Card } from '../domain/card';
import { CardColor, typeBadgeClass, typeColorClass } from './CardColor';
import { CardImage } from './CardImage';
import type { HoverPreviewProps } from './CardHoverPreview';
import { Value } from './CardTable';
import { deckTexts } from './deckTexts';
import { pickGestures } from './pickGestures';
import { Stepper } from './Stepper';
import { texts } from './texts';

/** Why adding breaks a rule: the full text for the description, a short mark for the cell. */
export interface PickBlocker {
  reason: string;
  short: string;
}

/** "Unit · Red · Cost 3 · Power 2 · RAM 1 · Rare": plain values, missing ones left out. */
export function cardMeta(card: Card): string {
  return [
    card.type,
    card.color,
    card.cost === null ? null : `Cost ${card.cost}`,
    card.power === null ? null : `Power ${card.power}`,
    card.ram === null ? null : `RAM ${card.ram}`,
    card.rarity,
  ]
    .filter((part) => part !== null)
    .join(' · ');
}

/** Cost as a round gem with the card colour on its edge (T-050b). */
function CostGem({ card }: { card: Card }) {
  if (card.cost === null) return <Value value={null} missing={texts.noCost} />;
  return <span className={`cost-gem ${typeColorClass(card.color)}`}>{card.cost}</span>;
}

/**
 * "Rivit" view of the deck editor results (T-050b): one card per row with aligned columns. On a narrow
 * picker the type, Power, RAM and Rarity columns hide and the same values show as a line under the name.
 */
export function DeckPickTable({
  cards,
  countOf,
  blockerOf,
  onChange,
  onOpenImage,
  clickAdds,
  hoverProps,
}: {
  cards: readonly Card[];
  countOf: (card: Card) => number;
  blockerOf: (card: Card) => PickBlocker | null;
  onChange: (card: Card, count: number) => void;
  onOpenImage: (card: Card) => void;
  clickAdds: boolean;
  hoverProps: (card: Card) => HoverPreviewProps;
}) {
  return (
    <table className="pick-table">
      <caption className="visually-hidden">{deckTexts.resultsCaption}</caption>
      <thead>
        <tr>
          <th scope="col" className="col-image">
            <span className="visually-hidden">{texts.columnImage}</span>
          </th>
          <th scope="col" className="col-cost">
            {texts.columnCost}
          </th>
          <th scope="col" className="col-name">
            {texts.columnName}
          </th>
          <th scope="col" className="col-type">
            {texts.columnType}
          </th>
          <th scope="col" className="col-number col-power">
            {texts.columnPower}
          </th>
          <th scope="col" className="col-number col-ram">
            {texts.columnRam}
          </th>
          <th scope="col" className="col-rarity">
            {texts.columnRarity}
          </th>
          <th scope="col" className="col-deck">
            {deckTexts.colInDeck}
          </th>
        </tr>
      </thead>
      <tbody>
        {cards.map((card) => {
          const count = countOf(card);
          const blocker = blockerOf(card);
          const hintId = `blocker-${card.key}`;
          const change = (next: number) => onChange(card, next);
          return (
            <tr
              key={card.key}
              className={(blocker !== null ? 'is-dimmed' : '') + (count > 0 ? ' is-in-deck' : '')}
              {...pickGestures(count, change, clickAdds)}
              {...hoverProps(card)}
            >
              <td className="col-image">
                <CardImage card={card} onOpen={onOpenImage} />
              </td>
              <td className="col-cost">
                <CostGem card={card} />
              </td>
              <th scope="row" className="col-name">
                <span className="pick-name" lang="en">
                  {card.name}
                </span>
                {card.subname !== null && (
                  <span className="pick-subname">
                    <span className="visually-hidden">, </span>
                    <span lang="en">{card.subname}</span>
                  </span>
                )}
                <span className="pick-meta">{cardMeta(card)}</span>
              </th>
              <td className="col-type">
                <span className={typeBadgeClass(card.color)} lang="en">
                  {card.type}
                </span>{' '}
                <span className="pick-color">
                  <CardColor color={card.color} />
                </span>
              </td>
              <td className="col-number col-power">
                <Value value={card.power} missing={texts.noPower} />
              </td>
              <td className="col-number col-ram">
                <Value value={card.ram} missing={texts.noRam} />
              </td>
              <td className="col-rarity" lang="en">
                <Value value={card.rarity} missing={texts.noRarity} />
              </td>
              <td className="col-deck">
                <Stepper
                  name={card.displayName}
                  count={count}
                  onChange={change}
                  describedBy={blocker !== null ? hintId : undefined}
                  shortcuts
                />
                {blocker !== null && (
                  <>
                    <span className="pick-blocked" aria-hidden="true" title={blocker.reason}>
                      {blocker.short}
                    </span>
                    <span id={hintId} className="visually-hidden">
                      {blocker.reason}
                    </span>
                  </>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
