import { gameTextsEn } from './gameTexts.en';
import { gameTextsFi, formatDay } from './gameTexts.fi';

describe('game texts (T-122)', () => {
  it('have the same keys in Finnish and English', () => {
    expect(Object.keys(gameTextsEn).sort()).toEqual(Object.keys(gameTextsFi).sort());
    expect(Object.keys(gameTextsEn.resultName).sort()).toEqual(Object.keys(gameTextsFi.resultName).sort());
  });

  it('inflect counts', () => {
    expect(gameTextsFi.showAll(12)).toBe('Näytä kaikki (12)');
    expect(gameTextsEn.showAll(12)).toBe('Show all (12)');
    expect(gameTextsFi.deleteDeckGames(2)).toBe('Myös pakan 2 kirjattua peliä poistetaan.');
    expect(gameTextsEn.deleteDeckGames(1)).toBe('The deck’s 1 logged game is deleted too.');
    expect(gameTextsEn.deleteDeckGames(2)).toBe('The deck’s 2 logged games are deleted too.');
    expect(gameTextsFi.recordAria(2, 1, 1)).toBe('2 voittoa, 1 tappiota, 1 tasapeliä');
    expect(gameTextsEn.recordAria(1, 1, 1)).toBe('1 win, 1 loss, 1 draw');
    expect(gameTextsEn.recordAria(2, 2, 0)).toBe('2 wins, 2 losses, 0 draws');
    expect(gameTextsFi.percent(60)).toBe('60 %');
    expect(gameTextsEn.percent(60)).toBe('60%');
  });

  it('write the day in the reader’s way, whatever the time zone', () => {
    expect(formatDay('2026-10-05', 'fi-FI')).toBe('5.10.2026');
    expect(formatDay('2026-10-05', 'en-GB')).toBe('05/10/2026');
    expect(formatDay('nonsense', 'fi-FI')).toBe('nonsense');
  });

  it('keep the privacy hint for other people’s details in both languages', () => {
    expect(gameTextsFi.opponentHint).toContain('Älä kirjaa muiden henkilötietoja');
    expect(gameTextsEn.opponentHint).toContain('personal details');
    expect(gameTextsFi.noteHint).toContain('Älä kirjaa muiden henkilötietoja');
    expect(gameTextsFi.opponentPlaceholder).toBe('Esim. sininen aggro');
    expect(gameTextsEn.opponentPlaceholder).toBe('E.g. blue aggro');
  });
});
