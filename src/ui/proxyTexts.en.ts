import { MAX_PROXY_CARDS } from '../domain/proxySheet';
import type { proxyTextsFi } from './proxyTexts.fi';

/** English texts of the Proxy section (T-102); the same shape as the Finnish ones. */
export const proxyTextsEn: typeof proxyTextsFi = {
  navProxy: 'Proxy',
  heading: 'Proxy',
  stepsLabel: 'How it works',
  steps: ['Pick cards', 'Check the sheet', 'Print at 100% size'],
  panelHeading: 'Print sheet',
  pickHeading: 'Pick cards',
  sheetPager: 'Sheet pages',
  prevSheet: 'Previous sheet',
  nextSheet: 'Next sheet',
  removeFromSheet: (name: string) => `Remove from the sheet: ${name}`,
  addByImage: 'Add to the sheet: ',
  emptySheet: 'The sheet is empty. Add cards from the picker.',
  barSummary: (cards: number, sheets: number) =>
    `Sheet: ${cards === 1 ? '1 card' : `${cards} cards`} · ${sheets === 1 ? '1 sheet' : `${sheets} sheets`}`,
  showSheet: 'Show sheet',
  disclaimer: 'For personal playtesting only, not for sale or tournaments.',
  summary: (cards: number, sheets: number) =>
    `${cards === 1 ? '1 card' : `${cards} cards`} · ${sheets === 1 ? '1 sheet' : `${sheets} sheets`}`,

  queueLoading: 'Loading the queue…',
  queueUnavailable: 'The queue could not be read. Reload the page. If the problem continues, check your browser privacy settings.',
  queueFull: `The queue is full: it holds at most ${MAX_PROXY_CARDS} cards.`,
  queueFullLive: `The queue is full, at most ${MAX_PROXY_CARDS} cards.`,
  clearQueue: 'Clear the queue',
  queueCleared: 'The queue was cleared.',
  queuedLive: (name: string, count: number) => `${name}: ${count} in the queue`,

  filtersHeading: 'Search and filters',
  resultsHeading: 'Search results',
  resultsCaption: 'Cards to add',
  noResults: 'No cards match the search.',
  clearFilters: 'Clear search and filters',

  increaseOne: 'Add one copy to the queue: ',
  decreaseOne: 'Remove one copy from the queue: ',
  countPrefix: 'In the queue: ',
  notQueued: 'Not in the queue',

  settingsHeading: 'Settings',
  gapLegend: 'Gap between cards',
  gapOption: (mm: number) => `${mm} mm`,
  cutMarks: 'Cut marks at the sheet edges',
  proxyMark: 'Small PROXY mark at the bottom of the cards',
  calibration: 'Print a calibration sheet first',
  calibrationHint: 'One extra sheet to check that the printer does not scale the size.',

  sheetLabel: (n: number, total: number) => `Sheet ${n}/${total}`,
  calibrationSheetLabel: 'Calibration sheet',
  printButton: 'Print',
  preparing: 'Preparing the print…',
  printHint:
    'In the browser print dialog choose paper A4 and scale 100% (actual size), not "Fit to page". Turn off headers and footers if the browser offers them.',

  calibrationTitle: 'Calibration sheet',
  calibrationBody:
    'Measure the printout: the frame should be 63 × 88 mm and the ruler 100 mm. If not, the printer or browser is scaling. Check that the scale is 100%.',
  calibrationFrame: '63 × 88 mm',
  calibrationRuler: '100 mm',
  calibrationFooter: 'Cyberdeck TCG · calibration sheet',
  imageMissing: 'Image missing',

  clearTitle: 'Clear the queue?',
  clearBody: (cards: number) => `Printing is done. The queue has ${cards === 1 ? '1 card' : `${cards} cards`}. Clear the queue now?`,
  clearManualBody: (cards: number) => `The queue has ${cards === 1 ? '1 card' : `${cards} cards`}. Remove them from the queue?`,
  clearConfirm: 'Clear the queue',
  clearKeep: 'Keep the queue',

  sendAllWants: 'Send all want cards to the proxy queue',
  sendWant: 'To proxy queue',
  sendWantName: (name: string) => `Send to the proxy queue: ${name}`,
  sendDeck: 'Send the deck to the proxy queue',
  sendMissing: 'Send the missing cards to the proxy queue',
  sentResult: (added: number) => (added === 1 ? 'Added 1 card to the queue.' : `Added ${added} cards to the queue.`),
  sentPartial: (added: number, skipped: number) =>
    `Added ${added} ${added === 1 ? 'card' : 'cards'} to the queue. ${skipped} left out because the queue is full (at most ${MAX_PROXY_CARDS}).`,
  sentNothing: 'Nothing to add.',
  sentFull: `The queue is full (at most ${MAX_PROXY_CARDS} cards), nothing was added.`,
  openProxy: 'Open the Proxy section',
};
