import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Card } from '../domain/card';
import type { Deck } from '../domain/deck';
import { toCountMap } from '../domain/collection';
import { checkDeckName } from '../domain/deckEdit';
import { buildImportReport } from '../domain/deckReport';
import type { ImportReport, ReportRow } from '../domain/deckReport';
import {
  colorDistribution,
  costCurve,
  deckTotals,
  groupDeck,
  LEGEND_COUNT,
  MAX_MAIN_DECK,
  MIN_MAIN_DECK,
  ramLimits,
  toCardsByKey,
} from '../domain/deckRules';
import { parseDeckJson, MAX_JSON_IMPORT_BYTES } from '../domain/deckJson';
import { MAX_IMPORT_BYTES, parseDeckText } from '../domain/deckText';
import type { ParsedDeckText } from '../domain/deckText';
import { netdeckToParsedDeck, parseNetdeckUrl } from '../domain/netdeckDeck';
import { fetchNetdeckDeck, NetdeckFetchError } from '../netdeck/fetchNetdeckDeck';
import { StorageError } from '../storage';
import type { Repositories, StorageErrorKind } from '../storage';
import { typeColorClass } from './CardColor';
import { DeckCardImage } from './DeckList';
import { CostGem } from './DeckPickTable';
import { DeckStats } from './DeckStats';
import { deckTexts } from './deckTexts';

type InputError = keyof typeof deckTexts.importErrors;
type LinkError = keyof typeof deckTexts.linkErrors;

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
  startAtLink = false,
  sharedText,
}: {
  cards: readonly Card[];
  repositories: Repositories;
  decks: readonly Deck[];
  onOpen: (id: string) => void;
  onClose: () => void;
  /** Opened from "Hae Netdeck.gg:stä": focus starts in the link field (T-051). */
  startAtLink?: boolean;
  /** Shared deck link (T-056): the list is checked on open and the source forms are hidden. */
  sharedText?: string;
}) {
  const cardsByKey = useMemo(() => toCardsByKey(cards), [cards]);
  const [text, setText] = useState('');
  const [inputError, setInputError] = useState<InputError | null>(null);
  const [linkText, setLinkText] = useState('');
  const [linkError, setLinkError] = useState<LinkError | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const linkAbort = useRef<AbortController | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [collectionKnown, setCollectionKnown] = useState(true);
  const [nameText, setNameText] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveFailure, setSaveFailure] = useState<StorageErrorKind | 'unknown' | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reportRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sharedText !== undefined) return;
    if (startAtLink) linkRef.current?.focus();
    else headingRef.current?.focus();
    return () => linkAbort.current?.abort();
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // The size is checked before the file is read (SR-17, SR-18).
    const isJson = file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
    if (file.size > (isJson ? MAX_JSON_IMPORT_BYTES : MAX_IMPORT_BYTES)) {
      edit('');
      setInputError(isJson ? 'json-too-long' : 'file-too-big');
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
    setLinkError(null);
    // An exported .json deck starts with a brace; a deck list never does.
    const result = text.trimStart().startsWith('{') ? parseDeckJson(text, cards) : parseDeckText(text, cards);
    if (!result.ok) {
      setReport(null);
      setInputError(result.error);
      textRef.current?.focus();
      return;
    }
    await showReport(result.deck);
  };

  const showReport = async (parsed: ParsedDeckText) => {
    let owned = new Map<string, number>();
    let known = true;
    try {
      owned = toCountMap((await repositories.collection.load()).value);
    } catch {
      known = false;
    }
    const next = buildImportReport(parsed, owned, decks, cardsByKey);
    setInputError(null);
    setCollectionKnown(known);
    setReport(next);
    setNameText(next.content.name);
    setNameError(null);
    // Move focus to the result so a screen reader starts reading it.
    setTimeout(() => reportRef.current?.focus());
  };

  // Shared link (T-056): the report opens at once, and focus goes to it.
  useEffect(() => {
    if (sharedText === undefined) return;
    const result = parseDeckText(sharedText, cards);
    if (result.ok) void showReport(result.deck);
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFetch = async (event: FormEvent) => {
    event.preventDefault();
    setSaveFailure(null);
    setInputError(null);
    const uuid = parseNetdeckUrl(linkText);
    if (uuid === null) {
      setReport(null);
      setLinkError('bad-url');
      return;
    }
    linkAbort.current?.abort();
    const controller = new AbortController();
    linkAbort.current = controller;
    setLinkError(null);
    setReport(null);
    setLinkLoading(true);
    try {
      const deck = await fetchNetdeckDeck(uuid, { signal: controller.signal });
      await showReport(netdeckToParsedDeck(deck, cards));
    } catch (error) {
      if (controller.signal.aborted) return;
      setLinkError(error instanceof NetdeckFetchError ? error.kind : 'network');
    } finally {
      if (linkAbort.current === controller) setLinkLoading(false);
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (report === null || report.rows.length === 0) return;
    const name = checkDeckName(nameText);
    if (!name.ok) {
      setNameError(name.error === 'empty' ? deckTexts.nameEmpty : deckTexts.nameTooLong);
      return;
    }
    setSaveFailure(null);
    try {
      const deck = await repositories.decks.create({
        name: name.name,
        sections: report.content.sections,
      });
      onOpen(deck.id);
    } catch (error) {
      setSaveFailure(error instanceof StorageError ? error.kind : 'unknown');
    }
  };

  /** What the report shows in the deck column's style (T-051): groups, counts, curve and colours. */
  const view = useMemo(() => {
    if (report === null) return null;
    const grouped = groupDeck(report.content, cardsByKey);
    const totals = deckTotals(report.content, cardsByKey);
    const rows = new Map(report.rows.map((row) => [row.card.key, row]));
    const limits = ramLimits(report.content, cardsByKey);
    return {
      grouped,
      main: totals.main,
      legends: totals.legends,
      mainState: totals.main < MIN_MAIN_DECK ? 'under' : totals.main > MAX_MAIN_DECK ? 'over' : 'ok',
      curve: costCurve(report.content, cardsByKey),
      colors: colorDistribution(report.content, cardsByKey),
      ramLimitsText:
        limits.size === 0
          ? deckTexts.ramLimitsNone
          : `${deckTexts.ramLimitsLabel}: ${[...limits].map(([color, limit]) => deckTexts.ramLimit(color, limit)).join(' · ')}`,
      // Every grouped card comes from a report row (the import merges duplicate lines).
      rowOf: (key: string) => rows.get(key) as ReportRow,
    };
  }, [report, cardsByKey]);

  /** "omistat 1/3 · puuttuu 2" and the decks that already use the card. */
  const ownership = (row: ReportRow) => (
    <span className="import-row-meta">
      {collectionKnown && (
        <span className={row.missing > 0 ? 'import-missing' : undefined}>
          {deckTexts.owned(row.owned, row.needed)}
          {row.missing > 0 && ` · ${deckTexts.missingCount(row.missing)}`}
        </span>
      )}
      {row.inDecks.length > 0 && <span className="hint"> · {deckTexts.reportAlsoIn(row.inDecks)}</span>}
    </span>
  );

  return (
    <>
      <p className="editor-crumb">
        <button type="button" className="link-button" onClick={onClose}>
          <span aria-hidden="true">← </span>
          {deckTexts.importBack}
        </button>
      </p>
      <h1 ref={headingRef} tabIndex={-1}>
        {sharedText === undefined ? deckTexts.importHeading : deckTexts.shareHeading}
      </h1>
      <p>{sharedText === undefined ? deckTexts.importIntro : deckTexts.shareIntro}</p>

      <div className="import-sources" hidden={sharedText !== undefined}>
        <form className="deck-import-form import-source-panel" onSubmit={(event) => void handleFetch(event)} noValidate>
          <h2>{deckTexts.linkHeading}</h2>
          <label htmlFor="import-link">{deckTexts.linkLabel}</label>
          <input
            ref={linkRef}
            id="import-link"
            type="url"
            autoComplete="off"
            value={linkText}
            aria-invalid={linkError !== null ? 'true' : undefined}
            aria-describedby={linkError !== null ? 'import-link-hint import-link-error' : 'import-link-hint'}
            onChange={(event) => {
              setLinkText(event.target.value);
              setLinkError(null);
            }}
          />
          <p id="import-link-hint" className="hint">
            {deckTexts.linkHint}
          </p>
          {linkError !== null && (
            <p id="import-link-error" className="field-error" role="alert">
              {deckTexts.linkErrors[linkError]}
            </p>
          )}
          <div className="row-actions">
            <button type="submit" className="button-primary" disabled={linkLoading}>
              {linkLoading ? deckTexts.linkLoading : deckTexts.linkButton}
            </button>
          </div>
        </form>

        <form className="deck-import-form import-source-panel" onSubmit={(event) => void handleCheck(event)} noValidate>
          <h2>{deckTexts.textHeading}</h2>
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
          <input
            id="import-file"
            type="file"
            accept=".txt,.json,text/plain,application/json"
            onChange={(event) => void handleFile(event)}
          />
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
      </div>

      {report !== null && view !== null && (
        <section className="import-report" aria-labelledby="report-heading">
          <h2 id="report-heading" ref={reportRef} tabIndex={-1}>
            {deckTexts.reportHeading}
          </h2>
          {report.source !== null && (
            <p className="import-source">{deckTexts.reportSource(report.source.name, report.source.author)}</p>
          )}

          <div className="import-layout">
            <div className="deck-head import-head">
              <div className="deck-head-row">
                <p className="deck-head-main">{deckTexts.mainProgress(view.main)}</p>
                {report.issues.length === 0 ? (
                  <span className="legality is-legal">
                    <span aria-hidden="true">✓</span> {deckTexts.legalShort}
                  </span>
                ) : (
                  <span className="legality is-issues">
                    <span aria-hidden="true">⚠</span> {deckTexts.issuesCount(report.issues.length)}
                  </span>
                )}
              </div>
              <progress
                className={`deck-progress is-${view.mainState}`}
                max={MAX_MAIN_DECK}
                value={Math.min(view.main, MAX_MAIN_DECK)}
                aria-hidden="true"
              />
              <p className="deck-head-sub">{deckTexts.legendsProgress(view.legends)}</p>
              {report.rows.length === 0 ? (
                <p className="notice notice-warning">{deckTexts.reportNothingRecognized}</p>
              ) : collectionKnown ? (
                <p className={report.missingTotal > 0 ? 'import-missing-total' : 'import-owned-total'}>
                  {deckTexts.missingFromCollection(report.missingTotal)}
                </p>
              ) : (
                <p className="notice notice-warning">{deckTexts.collectionNotReady}</p>
              )}
            </div>

            <form className="deck-name-field import-save" onSubmit={(event) => void handleSave(event)} noValidate>
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
                <button type="submit" className="button-primary import-save-button" disabled={report.rows.length === 0}>
                  {sharedText === undefined ? deckTexts.reportSaveButton : deckTexts.shareSaveButton}
                </button>
              </div>
            </form>

            <div className="import-rules">
              <h3>{deckTexts.reportLegalityHeading}</h3>
              {report.issues.length === 0 ? (
                <p>{deckTexts.allGood}</p>
              ) : (
                <ul className="issue-list">
                  {report.issues.map((issue) => (
                    <li
                      key={issue.type + issue.cards.join(',')}
                      className={issue.severity === 'warning' ? 'is-warning' : undefined}
                    >
                      {issue.severity === 'warning' ? deckTexts.warningPrefix : ''}
                      {issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="import-cards">
              {report.unrecognized.length > 0 && (
                <div className="notice notice-warning import-unrecognized">
                  <h3>{deckTexts.reportUnrecognizedHeading(report.unrecognized.length)}</h3>
                  <p>{deckTexts.reportUnrecognizedHint}</p>
                  <ul className="import-lines">
                    {report.unrecognized.map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              <h3>{deckTexts.reportCards}</h3>
              {report.rows.length === 0 ? (
                <p>{deckTexts.reportNone}</p>
              ) : (
                <>
                  <div className="deck-section">
                    <h4 className="deck-section-title">
                      {deckTexts.legendsHeading} ({view.legends}/{LEGEND_COUNT})
                    </h4>
                    {view.grouped.legends.length === 0 ? (
                      <p className="hint">{deckTexts.legendsEmpty}</p>
                    ) : (
                      <ul className="legend-slots">
                        {view.grouped.legends.map(({ card }) => {
                          const row = view.rowOf(card.key);
                          return (
                            <li key={card.key} className={'legend-slot' + (row.missing > 0 ? ' is-missing' : '')}>
                              <span className="legend-slot-image import-legend-image" aria-hidden="true">
                                <DeckCardImage card={card} className="legend-slot-img" />
                              </span>
                              <span className="legend-slot-name import-row-name">
                                {deckTexts.reportRow(row.needed, card.displayName)}
                              </span>
                              {ownership(row)}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="deck-section">
                    <h4 className="deck-section-title">
                      {deckTexts.mainHeading} ({view.main})
                    </h4>
                    {view.grouped.groups.map((group) => (
                      <div key={group.type} className="deck-group">
                        <h5 className="deck-group-title" lang="en">
                          {group.type} ({group.rows.reduce((sum, row) => sum + row.count, 0)})
                        </h5>
                        <ul className="deck-tiles">
                          {group.rows.map(({ card }) => {
                            const row = view.rowOf(card.key);
                            return (
                              <li
                                key={card.key}
                                className={
                                  `deck-tile import-tile ${typeColorClass(card.color)}` +
                                  (row.missing > 0 ? ' is-missing' : '')
                                }
                              >
                                <span className="deck-tile-art" aria-hidden="true">
                                  <DeckCardImage card={card} className="deck-tile-img" />
                                </span>
                                <span className="deck-tile-gem">
                                  <CostGem card={card} />
                                </span>
                                <span className="import-row-name">
                                  {deckTexts.reportRow(row.needed, card.displayName)}
                                </span>
                                {ownership(row)}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {collectionKnown && report.missingRows.length > 0 && (
                <div className="deck-section">
                  <h3>{deckTexts.reportMissingHeading}</h3>
                  <ul className="import-lines">
                    {report.missingRows.map((row) => (
                      <li key={row.card.key}>{deckTexts.reportMissingRow(row.card.displayName, row.missing)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.sideboardRows.length > 0 && (
                <div className="deck-section">
                  <h3>{deckTexts.reportSideboardHeading}</h3>
                  <p className="hint">{deckTexts.reportSideboardHint}</p>
                  <ul className="import-lines">
                    {report.sideboardRows.map((row) => (
                      <li key={row.card.key}>
                        {deckTexts.reportRow(row.needed, row.card.displayName)}
                        {collectionKnown && ` · ${deckTexts.owned(row.owned, row.needed)}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="import-stats">
              <DeckStats
                deck={report.content}
                cardsByKey={cardsByKey}
                curve={view.curve}
                colors={view.colors}
                groups={view.grouped.groups}
                mainCount={view.main}
                ramLimitsText={view.ramLimitsText}
                missingText=""
              />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
