import { MAX_COLLECTION_COUNT } from '../domain/collection';
import type { Card } from '../domain/card';
import type { PrintingKey } from '../domain/printing';
import type { Printing } from '../domain/printing';
import { variantImageUrl } from '../data/variantImages';
import { CountControl } from './CountControl';
import { texts } from './texts';

export interface CardVersionsProps {
  card: Card;
  /** Total copies of the card on screen. */
  count: number;
  /** Copies of one printing on screen. */
  versionCount: (printing: PrintingKey) => number;
  editable: boolean;
  onChange: (printing: PrintingKey, count: number) => void;
  onLimit: (card: Card) => void;
  /** Art of a printing's rarity, or null. Default: the bundled variant images. */
  imageUrl?: (cardKey: string, rarity: string | null) => string | null;
  /** The art now shown in the enlarged image, or null for the base image. */
  shownArt?: string | null;
  /** Shows the art in the enlarged image; null returns to the base image. Without it the thumbnails are plain pictures. */
  onShowArt?: (url: string | null) => void;
}

interface SetGroup {
  setCode: string;
  setName: string;
  printings: Printing[];
}

function groupBySet(printings: readonly Printing[]): SetGroup[] {
  const groups = new Map<string, SetGroup>();
  for (const printing of printings) {
    const group = groups.get(printing.setCode) ?? { setCode: printing.setCode, setName: printing.setName, printings: [] };
    group.printings.push(printing);
    groups.set(printing.setCode, group);
  }
  return [...groups.values()];
}

/**
 * The "Versiot" section of the card details (D-020): the printings grouped by set, each with its own counter,
 * and the copies whose version is not known. Names and numbers are React text, never HTML.
 */
export function CardVersions({ card, count, versionCount, editable, onChange, onLimit, imageUrl = variantImageUrl, shownArt = null, onShowArt }: CardVersionsProps) {
  const printings = card.printings ?? [];
  if (printings.length === 0) return null;
  const known = printings.reduce((sum, printing) => sum + versionCount(printing.key), 0);
  const unknown = Math.max(0, count - known);

  return (
    <section aria-labelledby="card-detail-versions" className="card-versions">
      <h3 id="card-detail-versions">{texts.versionsHeading}</h3>
      {shownArt !== null && onShowArt !== undefined && (
        <button type="button" className="button-secondary version-base-art" onClick={() => onShowArt(null)}>
          {texts.versionBaseArt}
        </button>
      )}
      {groupBySet(printings).map((group) => (
        <div key={group.setCode} role="group" aria-label={group.setName} className="version-set">
          <h4>{group.setName}</h4>
          <ul className="version-list">
            {group.printings
              .filter((printing) => editable || versionCount(printing.key) > 0)
              .map((printing) => {
              const url = imageUrl(card.key, printing.rarity);
              const name = `${group.setName} ${texts.versionNumber(printing.number)}`;
              const n = versionCount(printing.key);
              return (
                <li key={printing.key} className="version-row">
                  {url !== null && onShowArt === undefined && <img className="version-thumb" src={url} alt="" loading="lazy" width={36} height={50} />}
                  {url !== null && onShowArt !== undefined && (
                    <button type="button" className="version-thumb-button" aria-label={texts.versionShowArt(name)} aria-pressed={shownArt === url} onClick={() => onShowArt(url)}>
                      <img className="version-thumb" src={url} alt="" loading="lazy" width={36} height={50} />
                    </button>
                  )}
                  <span className="version-info">
                    <span className="version-number">{printing.number}</span>
                    {printing.rarity !== null && <span className="version-rarity">{printing.rarity}</span>}
                    {printing.language !== 'en' && (
                      <span className="version-lang">
                        <span aria-hidden="true">{printing.language === 'fr' ? texts.versionFrench : printing.language.toUpperCase()}</span>
                        <span className="visually-hidden">{printing.language === 'fr' ? texts.versionFrenchSpoken : printing.language}</span>
                      </span>
                    )}
                  </span>
                  <CountControl
                    card={card}
                    kind="version"
                    label={name}
                    count={n}
                    mode="ready"
                    editable={editable}
                    onChange={(_card, next) => {
                      // The total follows the version (D-020), so the total limit applies.
                      if (next > n && count >= MAX_COLLECTION_COUNT) onLimit(card);
                      else onChange(printing.key, next);
                    }}
                    onLimit={onLimit}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {count > 0 && <p className="version-unknown">{texts.versionsUnknown(unknown)}</p>}
    </section>
  );
}
