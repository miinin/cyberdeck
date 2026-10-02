import type { Card } from '../domain/card';
import type { Repositories } from '../storage';

export function DeckEditor({ deckId }: { deckId: string; cards: readonly Card[]; repositories: Repositories; onBack: () => void }) {
  return <h1>{deckId}</h1>;
}
