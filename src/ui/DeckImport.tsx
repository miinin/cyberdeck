import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Card } from '../domain/card';
import type { Deck } from '../domain/deck';
import { toCountMap } from '../domain/collection';
import { checkDeckName } from '../domain/deckEdit';
import { buildImportReport } from '../domain/deckReport';
import type { ImportReport } from '../domain/deckReport';
import { toCardsByKey } from '../domain/deckRules';
import { MAX_IMPORT_BYTES, parseDeckText } from '../domain/deckText';
import { StorageError } from '../storage';
import type { Repositories, StorageErrorKind } from '../storage';
import { deckTexts } from './deckTexts';

type InputError = keyof typeof deckTexts.importErrors;

/**
 * Import of a deck list pasted as text or read from a .txt file (T-014, SR-17). The report is shown
 * first; nothing is saved until the player presses "Tallenna pakaksi". All imported text is
 * rendered as text only (SR-14).
 */
export function DeckImport({
  cards,
  repositories,
  decks,
  onOpen,
  onClose,
}: {
  cards: readonly Card[];
  repositories: Repositories;
  decks: readonly Deck[];
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  const cardsByKey = useMemo(() => toCardsByKey(cards), [cards]);
  const [text, setText] = useState('');
  const [inputError, setInputError] = useState<InputError | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [collectionKnown, setCollectionKnown] = useState(true);
  const [nameText, setNameText] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveFailure, setSaveFailure] = useState<StorageErrorKind | 'unknown' | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reportRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const edit = (next: string) => {
    setText(next);
    setInputError(null);
    setReport(null);
    setSaveFailure(null);
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (file === undefined) return;
    // The size is checked before the file is read (SR-17).
    if (file.size > MAX_IMPORT_BYTES) {
      edit('');
      setInputError('file-too-big');
      return;
    }
    try {
      edit(await file.text());
    } catch {
      edit('');
      setInputError('file-unreadable');
    }
  };

  const handleCheck = async (event: FormEvent) => {
    event.preventDefault();
    setSaveFailure(null);
    const result = parseDeckText(text, cards);
    if (!result.ok) {
      setReport(null);
      setInputError(result.error);
      textRef.current?.focus();
      return;
    }
    let owned = new Map<string, number>();
    let known = true;
    try {
      owned = toCountMap((await repositories.collection.load()).value);
    } catch {
      known = false;
    }
    const next = buildImportReport(result.deck, owned, decks, cardsByKey);
    setInputError(null);
    setCollectionKnown(known);
    setReport(next);
    setNameText(next.content.name);
    setNameError(null);
    // Move focus to the result so a screen reader starts reading it.
    setTimeout(() => reportRef.current?.focus());
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (report === null) return;
    const name = checkDeckName(nameText);
    if (!name.ok) {
      setNameError(name.error === 'empty' ? deckTexts.nameEmpty : deckTexts.nameTooLong);
      return;
    }
    setSaveFailure(null);
    try {
      const deck = await repositories.decks.create({ name: name.name, sections: report.content.sections });
      onOpen(deck.id);
    } catch (error) {
      setSaveFailure(error instanceof StorageError ? error.kind : 'unknown');
    }
  };

  return (
    <>
      <p>
        <button type="button" className="button-secondary" onClick={onClose}>
          {deckTexts.importBack}
        </button>
      </p>
      <h1 ref={headingRef} tabIndex={-1}>
        {deckTexts.importHeading}
      </h1>
      <p>{deckTexts.importIntro}</p>

      <form className="deck-import-form" onSubmit={(event) => void handleCheck(event)} noValidate>
        <label htmlFor="import-text">{deckTexts.importTextLabel}</label>
        <textarea
          ref={textRef}
          id="import-text"
          rows={10}
          spellCheck={false}
          value={text}
          aria-invalid={inputError !== null ? 'true' : undefined}
          aria-describedby={inputError !== null ? 'import-error' : undefined}
          onChange={(event) => edit(event.target.value)}
        />
        <label htmlFor="import-file">{deckTexts.importFileLabel}</label>
        <input id="import-file" type="file" accept=".txt,text/plain" onChange={(event) => void handleFile(event)} />
        {inputError !== null && (
          <p id="import-error" className="field-error" role="alert">
            {deckTexts.importErrors[inputError]}
          </p>
        )}
        <div className="row-actions">
          <button type="submit" className="button-primary">
            {deckTexts.importCheck}
          </button>
        </div>
      </form>

      {report !== null && (
        <section className="import-report" aria-labelledby="report-heading">
          <h2 id="report-heading" ref={reportRef} tabIndex={-1}>
            {deckTexts.reportHeading}
          </h2>
          {!collectionKnown && <p className="notice notice-warning">{deckTexts.collectionNotReady}</p>}
          {collectionKnown && <p>{deckTexts.missingFromCollection(report.missingTotal)}</p>}

          <h3>{deckTexts.reportCards}</h3>
          {report.rows.length === 0 ? (
            <p>{deckTexts.reportNone}</p>
          ) : (
            <ul className="import-rows">
              {report.rows.map((row) => (
                <li key={row.card.key}>
                  <span>{deckTexts.reportRow(row.needed, row.card.displayName)}</span>{' '}
                  {collectionKnown && (
                    <span className={row.missing > 0 ? 'import-missing' : undefined}>
                      {deckTexts.owned(row.owned, row.needed)}
                      {row.missing > 0 && ` · ${deckTexts.missingBadge}`}
                    </span>
                  )}
                  {row.inDecks.length > 0 && <span className="hint"> · {deckTexts.reportAlsoIn(row.inDecks)}</span>}
                </li>
              ))}
            </ul>
          )}

          {collectionKnown && report.missingRows.length > 0 && (
            <>
              <h3>{deckTexts.reportMissingHeading}</h3>
              <ul>
                {report.missingRows.map((row) => (
                  <li key={row.card.key}>{deckTexts.reportMissingRow(row.card.displayName, row.missing)}</li>
                ))}
              </ul>
            </>
          )}

          {report.unrecognized.length > 0 && (
            <>
              <h3>{deckTexts.reportUnrecognizedHeading(report.unrecognized.length)}</h3>
              <p className="hint">{deckTexts.reportUnrecognizedHint}</p>
              <ul>
                {report.unrecognized.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </>
          )}

          <h3>{deckTexts.reportLegalityHeading}</h3>
          {report.issues.length === 0 ? (
            <p>{deckTexts.allGood}</p>
          ) : (
            <ul className="issue-list">
              {report.issues.map((issue) => (
                <li key={issue.type + issue.cards.join(',')} className={issue.severity === 'warning' ? 'is-warning' : undefined}>
                  {issue.severity === 'warning' ? deckTexts.warningPrefix : ''}
                  {issue.message}
                </li>
              ))}
            </ul>
          )}

          <form className="deck-name-field" onSubmit={(event) => void handleSave(event)} noValidate>
            <h3>{deckTexts.reportSaveHeading}</h3>
            <label htmlFor="import-name">{deckTexts.nameLabel}</label>
            <input
              id="import-name"
              type="text"
              value={nameText}
              aria-invalid={nameError !== null ? 'true' : undefined}
              aria-describedby={nameError !== null ? 'import-name-error' : undefined}
              onChange={(event) => {
                setNameText(event.target.value);
                setNameError(null);
              }}
            />
            {nameError !== null && (
              <p id="import-name-error" className="field-error">
                {nameError}
              </p>
            )}
            {saveFailure !== null && (
              <p className="field-error" role="alert">
                {deckTexts.actionFailed(saveFailure)}
              </p>
            )}
            <div className="row-actions">
              <button type="submit" className="button-primary" disabled={report.rows.length === 0}>
                {deckTexts.reportSaveButton}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
