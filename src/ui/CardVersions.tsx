import { MAX_COLLECTION_COUNT } from '../domain/collection';
import { RaritySymbol } from './RaritySymbol';
import type { Card } from '../domain/card';
import { officialRarity } from '../domain/cardSearch';
import { artsOf, ownedPerArt } from '../domain/arts';
import { editionPrinting } from '../domain/edition';
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

/** Words that become a lower case letter in a set abbreviation ("Welcome to Night City" -> "WtNC"). */
const SMALL_WORDS = /^(to|of|the|a|an|and|in|on)$/i;
/** Names longer than this are abbreviated. */
const SHORT_SET_NAME = 14;

/** "Welcome to Night City" -> "WtNC"; a short name stays as it is. */
export function setAbbreviation(family: string): string {
  if (family.length <= SHORT_SET_NAME) return family;
  return family
    .split(/[ ]+/)
    .map((word) => (/[0-9]/.test(word) ? word.toUpperCase() : SMALL_WORDS.test(word) ? word.slice(0, 1).toLowerCase() : word.slice(0, 1).toUpperCase()))
    .join('');
}

export interface SetChip {
  family: string;
  short: string;
  /** Retail, Beta, FR; "#005" for the printings of a set without those (promos, tournaments). */
  tags: string[];
}

/** One chip per set family with the printing types as tags, no repetition. */
export function setChips(printings: readonly Printing[]): SetChip[] {
  const families = new Map<string, string[]>();
  for (const printing of printings) {
    const family = setFamilyName(printing.setName);
    const tags = families.get(family) ?? [];
    const tag = printingTag(printing) ?? `#${printing.number}`;
    if (!tags.includes(tag)) tags.push(tag);
    families.set(family, tags);
  }
  return [...families].map(([family, tags]) => ({ family, short: setAbbreviation(family), tags }));
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
  // D-022: the base art of a Welcome to Night City card has a counter for Retail and one for Beta right on the tile.
  const editionRows = [
    { label: texts.editionRetail, printing: editionPrinting(card, 'retail') },
    { label: texts.editionBeta, printing: editionPrinting(card, 'beta') },
  ].flatMap((row) => (row.printing === null ? [] : [{ label: row.label, printing: row.printing }]));
  const unknownCopies = count - Object.values(versions).reduce((sum, n) => sum + n, 0);

  /** The printings in a tile's "Erittely": all but the two that have a counter of their own on the base tile. */
  const breakdown = (art: Art) =>
    art.rarity === null && editionRows.length > 0
      ? art.printings.filter((p) => !editionRows.some((row) => row.printing.key === p.key))
      : art.printings;

  // Browsing shows every version too (with the count as text); the counters are for editing only.
  const tiles = arts;

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
              <span className="art-name">{art.rarity === null ? name : <RaritySymbol rarity={art.rarity} showName />}</span>
              <span className="art-sets">
                {setChips(art.printings).map((chip) => (
                  <span key={chip.family} className="art-set">
                    <span className="set-chip set-chip--family" title={chip.family}>
                      {chip.short === chip.family ? (
                        chip.family
                      ) : (
                        <>
                          <span aria-hidden="true">{chip.short}</span>
                          <span className="visually-hidden">{chip.family}</span>
                        </>
                      )}
                    </span>
                    {chip.tags.map((tag) => (
                      <span key={tag} className="set-chip">{tag}</span>
                    ))}
                  </span>
                ))}
              </span>
              {art.rarity === null && editionRows.length > 0 ? (
                <div className="art-count art-count--editions">
                  {editionRows.map(({ label, printing }) => {
                    const m = versionCount(printing.key);
                    return (
                      <div key={printing.key} className="edition-row">
                        <span className="edition-label">{label}</span>
                        <CountControl
                          card={card}
                          kind="version"
                          label={texts.artTileName(card.displayName, label)}
                          count={m}
                          mode="ready"
                          editable={editable}
                          onChange={(_card, next) => {
                            if (next > m && count >= MAX_COLLECTION_COUNT) onLimit(card);
                            else onChange(printing.key, next);
                          }}
                          onLimit={onLimit}
                        />
                      </div>
                    );
                  })}
                  {unknownCopies > 0 && <p className="edition-unknown">{texts.editionUnknown(unknownCopies)}</p>}
                </div>
              ) : (
                <div className="art-count">
                  {editable || n > 0 ? (
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
                  ) : (
                    <span className="count">
                      <span aria-hidden="true">{texts.missingValue}</span>
                      <span className="visually-hidden">{texts.notOwned}</span>
                    </span>
                  )}
                </div>
              )}
              {breakdown(art).length > 0 && (
              <details className="art-breakdown">
                <summary>{texts.artBreakdown}</summary>
                <ul className="version-list">
                  {breakdown(art)
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
                          {(editable || m > 0) && (
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
                          )}
                        </li>
                      );
                    })}
                </ul>
              </details>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
