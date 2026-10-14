import { availabilityOf } from '../domain/availability';
import type { Printing } from '../domain/printing';
import { texts } from './texts';

/** Where the card comes from (T-166): the boosters, or a highlighted note that it is not in them, and the other sources. */
export function CardAvailability({ printings }: { printings: readonly Printing[] }) {
  if (printings.length === 0) return null;
  const { inBoosters, sources } = availabilityOf(printings);
  const list = sources.length > 0 && (
    <ul className="availability-list">
      {sources.map((source) => {
        const kind = texts.availabilityKinds[source.kind];
        return <li key={source.kind}>{`${inBoosters ? texts.availabilityAlso(kind) : kind}: ${source.names.join(', ')}`}</li>;
      })}
    </ul>
  );
  return (
    <section aria-labelledby="card-detail-availability" className="detail-availability">
      <h3 id="card-detail-availability">{texts.availabilityHeading}</h3>
      {inBoosters ? <p className="availability-main">{texts.availabilityInBoosters}</p> : <p className="availability-notice">{texts.availabilityNotInBoosters}</p>}
      {list}
    </section>
  );
}
