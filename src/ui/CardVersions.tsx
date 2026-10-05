import { MAX_COLLECTION_COUNT } from '../domain/collection';
import type { Card } from '../domain/card';
import { officialRarity } from '../domain/cardSearch';
import { artsOf, ownedPerArt } from '../domain/arts';
import type { Art } from '../domain/arts';
import type { PrintingKey } from '../domain/printing';
import { setFamilyName } from '../domain/printing';
import type { Printing } from '../domain/printing';
import { getCardImage } from '../data/cardImages';
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
  /** Changes one printing (the "Erittely" counters). */
  onChange: (printing: PrintingKey, count: number) => void;
  /** Changes the copies of one art (the gallery counters). */
  onArtChange?: (art: Art, count: number) => void;
  onLimit: (card: Card) => void;
  /** Art of a printing's rarity, or null. Default: the bundled variant images. */
  imageUrl?: (cardKey: string, rarity: string | null) => string | null;
  /** The card's own picture for the base art. Default: the bundled card image. */
  baseImage?: string | null;
  /** The art now shown in the enlarged image, or null for the base image. */
  shownArt?: string | null;
  /** Shows the art in the enlarged image; null returns to the base image. Without it the tiles are not selectable. */
  onShowArt?: (url: string | null) => void;
}

/** Retail, Beta, FR: what tells the printings of one set family apart. Other sets have no tag. */
function printingTag(printing: Printing): string | null {
  if (printing.language === 'fr') return texts.versionFrench;
  if (/Retail/.test(printing.setName)) return 'Retail';
  if (/Beta/.test(printing.setName)) return 'Beta';
  return null;
}

/** "Welcome to Night City · Retail, Beta, FR": one line per set family, no repetition. */
export function setLines(printings: readonly Printing[]): string[] {
  const families = new Map<string, string[]>();
  for (const printing of printings) {
    const family = setFamilyName(printing.setName);
    const tags = families.get(family) ?? [];
    const tag = printingTag(printing);
    if (tag !== null && !tags.includes(tag)) tags.push(tag);
    families.set(family, tags);
  }
  return [...families].map(([family, tags]) => (tags.length === 0 ? family : `${family} · ${tags.join(', ')}`));
}

export function artName(art: Art): string {
  return art.rarity === null ? texts.artBase : officialRarity(art.rarity);
}

/**
 * The "Versiot" section of the card details (D-021): a gallery with one tile per art (base art and each special
 * rarity) with a thumbnail, the sets in short, the owned copies and a counter, and a "Erittely" with the
 * counters of the single printings (D-020). Names and numbers are React text, never HTML.
 */
export function CardVersions({
  card, count, versionCount, editable, onChange, onArtChange, onLimit,
  imageUrl = variantImageUrl, baseImage, shownArt = null, onShowArt,
}: CardVersionsProps) {
  const arts = artsOf(card, (key, rarity) => imageUrl(key, rarity) !== null);
  if (arts.length === 0) return null;
  const base = baseImage === undefined ? (getCardImage(card.key)?.medium ?? null) : baseImage;
  const versions = Object.fromEntries((card.printings ?? []).map((p) => [p.key, versionCount(p.key)]));
  const owned = ownedPerArt({ card: card.key, count, versions }, card, arts);

  const tiles = arts.filter((art) => editable || (owned.get(art.artId) ?? 0) > 0);

  return (
    <section aria-labelledby="card-detail-versions" className="card-versions">
      <h3 id="card-detail-versions">{texts.versionsHeading}</h3>
      <ul className="art-gallery">
        {tiles.map((art) => {
          const url = art.rarity === null ? base : imageUrl(card.key, art.rarity);
          const name = artName(art);
          const n = owned.get(art.artId) ?? 0;
          const selected = art.rarity === null ? shownArt === null : shownArt === url;
          const picture = url !== null && <img className="art-thumb" src={url} alt="" loading="lazy" />;
          return (
            <li key={art.artId} className={'art-tile' + (selected && onShowArt !== undefined ? ' is-selected' : '')}>
              {onShowArt !== undefined ? (
                <button
                  type="button"
                  className="art-pick"
                  aria-label={texts.artShow(name)}
                  aria-pressed={selected}
                  onClick={() => onShowArt(art.rarity === null ? null : url)}
                >
                  {picture}
                </button>
              ) : (
                picture
              )}
              <span className="art-name">{name}</span>
              <span className="art-sets">
                {setLines(art.printings).map((line) => (
                  <span key={line} className="art-set">{line}</span>
                ))}
              </span>
              <CountControl
                card={card}
                kind="version"
                label={name}
                count={n}
                mode="ready"
                editable={editable}
                onChange={(_card, next) => {
                  // The total follows the art (D-020), so the total limit applies.
                  if (next > n && count >= MAX_COLLECTION_COUNT) onLimit(card);
                  else onArtChange?.(art, next);
                }}
                onLimit={onLimit}
              />
              <details className="art-breakdown">
                <summary>{texts.artBreakdown}</summary>
                <ul className="version-list">
                  {art.printings
                    .filter((printing) => editable || versionCount(printing.key) > 0)
                    .map((printing) => {
                      const label = `${setFamilyName(printing.setName)} ${printingTag(printing) ?? ''} ${texts.versionNumber(printing.number)}`.replace(/\s+/g, ' ');
                      const m = versionCount(printing.key);
                      return (
                        <li key={printing.key} className="version-row">
                          <span className="version-info">
                            <span>{setFamilyName(printing.setName)}</span>
                            {printingTag(printing) !== null && <span className="version-lang">{printingTag(printing)}</span>}
                            <span className="version-number">{printing.number}</span>
                          </span>
                          <CountControl
                            card={card}
                            kind="version"
                            label={label}
                            count={m}
                            mode="ready"
                            editable={editable}
                            onChange={(_card, next) => {
                              if (next > m && count >= MAX_COLLECTION_COUNT) onLimit(card);
                              else onChange(printing.key, next);
                            }}
                            onLimit={onLimit}
                          />
                        </li>
                      );
                    })}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
