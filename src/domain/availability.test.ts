import type { Printing } from './printing';
import { artOutsideBoosters, availabilityOf } from './availability';

function printing(setName: string, key: string): Printing {
  return { key, setCode: key.split(':')[0] ?? key, setName, number: '1', rarity: null, language: 'en', artist: null, imageKey: key };
}

describe('availabilityOf (T-166)', () => {
  it('a booster card is in the boosters; no other sources when it only has set printings', () => {
    const result = availabilityOf([printing('Welcome to Night City — Retail', 'welcometonightcityretail:010'), printing('Welcome to Night City — Beta', 'welcometonightcitybeta:010')]);
    expect(result).toEqual({ inBoosters: true, sources: [] });
  });

  it('a starter deck card is not in the boosters', () => {
    const result = availabilityOf([printing('Embracing Power — Retail Starter Deck', 'a:1'), printing('Embracing Power — Beta Starter Deck', 'b:1')]);
    expect(result).toEqual({ inBoosters: false, sources: [{ kind: 'starter', names: ['Embracing Power Starter Deck'] }] });
  });

  it('V Streetkid 144 (T-160) is not a booster printing and gives no source of its own', () => {
    const result = availabilityOf([printing('Welcome to Night City — Retail', 'welcometonightcityretail:144'), printing('Welcome to Night City — Beta', 'welcometonightcitybeta:144'), printing('Welcome to Night City — Retail — FR', 'welcometonightcityretail-fr:144')]);
    expect(result).toEqual({ inBoosters: false, sources: [] });
  });

  it('groups in the order starter, demo, promo, prize; names in data order without duplicates', () => {
    const result = availabilityOf([
      printing('Edgerunner Open S 1', 'e:1'),
      printing('Night City Showdown S1', 'f:1'),
      printing('Box Toppers — Retail', 'g:1'),
      printing('Box Toppers — Beta', 'h:1'),
      printing('Merc Demo Deck', 'i:1'),
      printing('The Heist — Retail Starter Deck', 'j:1'),
      printing('The Heist — Beta Starter Deck', 'k:1'),
      printing('Set 1 Promos', 'l:1'),
    ]);
    expect(result.inBoosters).toBe(false);
    expect(result.sources).toEqual([
      { kind: 'starter', names: ['The Heist Starter Deck'] },
      { kind: 'demo', names: ['Merc Demo Deck'] },
      { kind: 'promo', names: ['Box Toppers', 'Set 1 Promos'] },
      { kind: 'prize', names: ['Edgerunner Open S 1', 'Night City Showdown S1'] },
    ]);
  });

  it('a booster card also keeps its other sources', () => {
    const result = availabilityOf([printing('Welcome to Night City — Retail', 'welcometonightcityretail:010'), printing('Night City Brawl S 1', 'x:1')]);
    expect(result).toEqual({ inBoosters: true, sources: [{ kind: 'prize', names: ['Night City Brawl S 1'] }] });
  });

  it('flags an art outside the boosters only for a booster card', () => {
    const wtnc = printing('Welcome to Night City — Retail', 'welcometonightcityretail:010');
    const prize = printing('Edgerunner Open S 1', 'e:1');
    const card = availabilityOf([wtnc, prize]);
    expect(artOutsideBoosters(card, [prize])).toBe(true);
    expect(artOutsideBoosters(card, [wtnc])).toBe(false);
    expect(artOutsideBoosters(availabilityOf([prize]), [prize])).toBe(false);
  });
});
