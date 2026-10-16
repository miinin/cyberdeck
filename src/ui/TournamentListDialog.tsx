import { useEffect, useId, useMemo, useRef } from 'react';
import type { DeckContent } from '../domain/deck';
import { validateDeck } from '../domain/deckRules';
import type { CardsByKey } from '../domain/deckRules';
import { tournamentList } from '../domain/tournamentList';
import { deckTexts } from './deckTexts';

/** Printable tournament deck list in a modal dialog (T-168). Always black on white; only the list is printed. */
export function TournamentListDialog({ open, deck, cardsByKey, onClose }: { open: boolean; deck: DeckContent; cardsByKey: CardsByKey; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);
  // The print rules in styles.css hide the rest of the page only while this dialog is open.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('is-tournament-list');
    return () => document.body.classList.remove('is-tournament-list');
  }, [open]);
  const list = useMemo(() => (open ? tournamentList(deck, cardsByKey) : null), [open, deck, cardsByKey]);
  const errors = useMemo(
    () => (open ? validateDeck(deck, cardsByKey).filter((issue) => issue.severity === 'error').map((issue) => issue.message) : []),
    [open, deck, cardsByKey],
  );
  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog tournament-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      {list !== null && (
        <div className="confirm-dialog-body tournament-dialog-body">
          <h2 id={titleId} className="visually-hidden">
            {deckTexts.tlTitle(list.deckName)}
          </h2>
          {errors.length > 0 && <p className="notice notice-warning tournament-screen">{deckTexts.tlIllegal(errors.join(' '))}</p>}
          <article className="tournament-list">
            <h3 className="tournament-heading">{deckTexts.tlHeading}</h3>
            <dl className="tournament-fields">
              {[deckTexts.tlPlayer, deckTexts.tlEvent, deckTexts.tlDate].map((label) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd />
                </div>
              ))}
            </dl>
            <p className="tournament-deck">
              <strong>{deckTexts.tlDeck}:</strong> {list.deckName}
              {errors.length === 0 && <span className="tournament-legal"> · {deckTexts.tlLegal}</span>}
            </p>
            <div className="tournament-groups">
              {list.groups.map((group) => (
                <section key={group.id} className="tournament-group">
                  <h4>
                    {deckTexts.tlGroups[group.id]} ({group.total})
                  </h4>
                  <ul>
                    {group.rows.map((row) => (
                      <li key={row.name}>
                        <span className="tournament-count">{row.count}</span> {row.name}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <p className="tournament-totals">{deckTexts.tlTotals(list.totals.main, list.totals.legends, list.totals.sideboard)}</p>
          </article>
          <div className="row-actions tournament-screen">
            <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
              {deckTexts.tlClose}
            </button>
            <button type="button" className="button-primary" onClick={() => window.print()}>
              {deckTexts.tlPrint}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
