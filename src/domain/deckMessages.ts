/** Plain-language rule explanations for the player (T-013), in the UI language (T-068, D-019). */
export interface DeckMessages {
  legendCount(found: number, required: number): string;
  legendDuplicate(name: string, copies: number): string;
  mainSize(size: number, min: number, max: number): string;
  copies(name: string, count: number, max: number): string;
  sideboardSize(count: number, size: number): string;
  sideboardCopies(name: string, count: number, max: number): string;
  sideboardLegend(name: string): string;
  ram(color: string, limit: number, names: string): string;
  unknownCards(count: number, keys: readonly string[]): string;
  legendsFull(required: number): string;
  legendInDeck(name: string): string;
  copiesFull(max: number): string;
  ramOver(ram: number, color: string, limit: number): string;
  /** Name of a new deck and the export file name of a deck without a name. */
  defaultDeckName: string;
  defaultExportFileName: string;
}

export const deckMessagesFi: DeckMessages = {
  legendCount: (found, required) => `Legendejä on ${found}, pitää olla tasan ${required}.`,
  legendDuplicate: (name, copies) => `Legendien nimien pitää olla erilaiset, mutta ${name} on mukana ${copies} kertaa.`,
  mainSize: (size, min, max) =>
    `Pääpakassa on ${size} korttia, ${size < min ? `vähintään ${min}` : `enintään ${max}`}.`,
  copies: (name, count, max) => `${name}: ${count} kopiota, enintään ${max}.`,
  sideboardSize: (count, size) => `Sideboardissa on ${count} korttia, mutta sen pitää olla tyhjä tai tasan ${size} korttia.`,
  sideboardCopies: (name, count, max) => `${name}: ${count} kopiota pääpakassa ja sideboardissa yhteensä, enintään ${max}.`,
  sideboardLegend: (name) => `${name}: Legend-korttia ei voi pitää sideboardissa.`,
  ram: (color, limit, names) =>
    `${limit === 0 ? `Legendeillä ei ole väriä ${color}` : `${color}-värin RAM-raja on ${limit}`}, mutta ylittää: ${names}.`,
  unknownCards: (count, keys) => `Pakassa on ${count} korttia, jota ei löydy korttitiedoista: ${keys.join(', ')}.`,
  legendsFull: (required) => `Pakassa on jo ${required} Legendiä.`,
  legendInDeck: (name) => `Pakassa on jo Legend ${name}.`,
  copiesFull: (max) => `Pakassa on jo ${max} kopiota.`,
  ramOver: (ram, color, limit) => `RAM ${ram} ylittää ${color}-värin rajan ${limit}.`,
  defaultDeckName: 'Uusi pakka',
  defaultExportFileName: 'pakka',
};

export const deckMessagesEn: DeckMessages = {
  legendCount: (found, required) => `The deck has ${found} Legends, it needs exactly ${required}.`,
  legendDuplicate: (name, copies) => `Legend names must be different, but ${name} is in the deck ${copies} times.`,
  mainSize: (size, min, max) =>
    `The main deck has ${size} cards, ${size < min ? `at least ${min} are needed` : `at most ${max} are allowed`}.`,
  copies: (name, count, max) => `${name}: ${count} copies, at most ${max}.`,
  sideboardSize: (count, size) => `The sideboard has ${count} cards, but it must be empty or exactly ${size} cards.`,
  sideboardCopies: (name, count, max) => `${name}: ${count} copies in the main deck and sideboard together, at most ${max}.`,
  sideboardLegend: (name) => `${name}: a Legend cannot be in the sideboard.`,
  ram: (color, limit, names) =>
    `${limit === 0 ? `Your Legends have no ${color} color` : `The ${color} RAM limit is ${limit}`}, but these exceed it: ${names}.`,
  unknownCards: (count, keys) =>
    `${count === 1 ? '1 card' : `${count} cards`} in the deck ${count === 1 ? 'is' : 'are'} missing from the card data: ${keys.join(', ')}.`,
  legendsFull: (required) => `The deck already has ${required} Legends.`,
  legendInDeck: (name) => `The deck already has the Legend ${name}.`,
  copiesFull: (max) => `The deck already has ${max} copies.`,
  ramOver: (ram, color, limit) => `RAM ${ram} exceeds the ${color} limit of ${limit}.`,
  defaultDeckName: 'New deck',
  defaultExportFileName: 'deck',
};

let active: DeckMessages = deckMessagesFi;

/** The messages in the UI language. Finnish until the UI layer picks the language at startup (src/ui/texts.ts). */
export function setDeckMessages(messages: DeckMessages): void {
  active = messages;
}

export function currentDeckMessages(): DeckMessages {
  return active;
}
