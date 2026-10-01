import type { CollectionNotice, CollectionSnapshot, SaveErrorKind } from './collectionStore';
import { texts } from './texts';

/**
 * Notice boxes of the collection (UX.md 6.8). Texts are chosen from the notice or error kind only:
 * no keys, versions, backup key names (SEC-007) or error messages are ever shown.
 */
interface NoticeContent {
  /** Identifies the box; also what "Sulje" dismisses. */
  id: 'unavailable' | CollectionNotice['kind'] | 'not-persistent' | 'save-error';
  tone: 'danger' | 'warning';
  title: string;
  body: string;
  /** Text for the live region. */
  live: string;
  closable: boolean;
}

function loadNoticeContent(notice: CollectionNotice): NoticeContent {
  switch (notice.kind) {
    case 'newer-version':
      return {
        id: 'newer-version',
        tone: 'warning',
        title: texts.newerVersionTitle,
        body: texts.newerVersionBody,
        live: texts.newerVersionLive,
        closable: false,
      };
    case 'reset':
      return notice.backupKey === null
        ? {
            id: 'reset',
            tone: 'danger',
            title: texts.resetNoBackupTitle,
            body: texts.resetNoBackupBody,
            live: texts.resetNoBackupLive,
            closable: false,
          }
        : {
            id: 'reset',
            tone: 'warning',
            title: texts.resetTitle,
            body: texts.resetBody,
            live: texts.resetLive,
            closable: true,
          };
    case 'repaired':
      return {
        id: 'repaired',
        tone: 'warning',
        title: texts.repairedTitle,
        body: texts.repairedBody(notice.dropped),
        live: texts.repairedLive,
        closable: true,
      };
  }
}

const NOTICE_ORDER: readonly CollectionNotice['kind'][] = ['newer-version', 'reset', 'repaired'];

/** Boxes shown after loading, in the order of UX.md 6.8. */
export function loadNotices(snapshot: CollectionSnapshot, persistent: boolean): NoticeContent[] {
  if (snapshot.phase === 'loading') return [];
  if (snapshot.phase === 'unavailable') {
    return [
      {
        id: 'unavailable',
        tone: 'danger',
        title: texts.collectionUnavailableTitle,
        body: texts.collectionUnavailableBody,
        live: texts.collectionUnavailableLive,
        closable: false,
      },
    ];
  }
  const boxes = [...snapshot.notices]
    .sort((a, b) => NOTICE_ORDER.indexOf(a.kind) - NOTICE_ORDER.indexOf(b.kind))
    .map(loadNoticeContent);
  if (!persistent) {
    boxes.push({
      id: 'not-persistent',
      tone: 'warning',
      title: texts.notPersistentTitle,
      body: texts.notPersistentBody,
      live: texts.notPersistentLive,
      closable: false,
    });
  }
  return boxes;
}

export function saveErrorContent(kind: SaveErrorKind): NoticeContent {
  const base = { id: 'save-error', tone: 'danger', closable: true } as const;
  switch (kind) {
    case 'newer-version':
      return { ...base, title: texts.newerVersionTitle, body: texts.newerVersionBody, live: texts.newerVersionLive };
    case 'limit-reached':
      return { ...base, title: texts.collectionFullTitle, body: texts.collectionFullBody, live: texts.collectionFullTitle };
    case 'quota':
      return { ...base, title: texts.saveFailedTitle, body: texts.saveFailedQuotaBody, live: texts.saveFailedTitle };
    case 'unavailable':
      return {
        ...base,
        title: texts.saveFailedTitle,
        body: texts.saveFailedUnavailableBody,
        live: texts.saveFailedTitle,
      };
    default:
      return { ...base, title: texts.saveFailedTitle, body: texts.saveFailedOtherBody, live: texts.saveFailedTitle };
  }
}

/** What the live region says right after a failed save (UX.md 6.8). */
export function saveErrorLive(kind: SaveErrorKind): string {
  return `${saveErrorContent(kind).live} ${texts.countNotChanged}`;
}

export interface CollectionNoticesProps {
  snapshot: CollectionSnapshot;
  persistent: boolean;
  onDismiss: (kind: 'reset' | 'repaired') => void;
  onDismissSaveError: () => void;
  onReload: () => void;
}

export function CollectionNotices({
  snapshot,
  persistent,
  onDismiss,
  onDismissSaveError,
  onReload,
}: CollectionNoticesProps) {
  const boxes = loadNotices(snapshot, persistent);
  if (snapshot.saveError !== null) boxes.push(saveErrorContent(snapshot.saveError));

  return boxes.map((box) => (
    <div key={box.id} className={`notice notice-${box.tone}`}>
      <h2>{box.title}</h2>
      <p>{box.body}</p>
      {box.id === 'unavailable' && (
        <button type="button" className="button-secondary" onClick={onReload}>
          {texts.reloadCollection}
        </button>
      )}
      {box.closable && (
        <button
          type="button"
          className="button-secondary"
          aria-label={texts.closeNoticeLabel(box.title)}
          onClick={() => {
            if (box.id === 'save-error') onDismissSaveError();
            else if (box.id === 'reset' || box.id === 'repaired') onDismiss(box.id);
          }}
        >
          {texts.closeNotice}
        </button>
      )}
    </div>
  ));
}
