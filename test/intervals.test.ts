import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property on the line above its it(, in this format:
// Pattern: <name>. <property in English>
// where <name> is invariant, algebraic, metamorphic, differential, or conditional.

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
const interval: fc.Arbitrary<Interval> = fc
  .tuple(fc.integer({ min: -20, max: 20 }), fc.nat(10))
  .map(([start, len]) => [start, start + len] as Interval);
const intervalList = fc.array(interval);

const disjointList: fc.Arbitrary<Interval[]> = fc
  .array(fc.tuple(fc.nat(5), fc.nat(5)), { maxLength: 6 })
  .map(pairs => {
    const out: Interval[] = [];
    let end = -20;
    for (const [gap, len] of pairs) {
      const start = end + gap + 1; // strictly after the previous end
      out.push([start, start + len]);
      end = start + len;
    }
    return out;
  });

// Helper oracle: is real point p covered by this list?
const covers = (xs: readonly Interval[], p: number) =>
  xs.some(([a, b]) => a <= p && p <= b);

describe('mergeIntervals', () => {
  // Pattern: invariant. The output is sorted and has no overlapping intervals.
  it('returns sorted, non-overlapping intervals', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (let i = 0; i + 1 < out.length; i++) {
          expect(out[i][1]).toBeLessThan(out[i + 1][0]);
        }
      }),
    );
  });

  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Pattern: invariant. The input array is not modified.
  it('does not modify its input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const copy = xs.map(([a, b]) => [a, b] as Interval);
        mergeIntervals(xs);
        expect(xs).toEqual(copy);
      }),
    );
  });

  // Pattern: differential. The output covers exactly the same points as the input.
  // twiceP is 2p, so this checks half-integer points from -22 to 32.
  it('covers exactly the same points as the input', () => {
    fc.assert(
      fc.property(intervalList, fc.integer({ min: -44, max: 64 }), (xs, twiceP) => {
        const p = twiceP / 2;
        expect(covers(mergeIntervals(xs), p)).toBe(covers(xs, p));
      }),
    );
  });

  // Pattern: metamorphic. Reordering and duplicating the input do not change the output.
  it('is unaffected by input order and duplicates', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const expected = mergeIntervals(xs);
        expect(mergeIntervals([...xs].reverse())).toEqual(expected);
        expect(mergeIntervals([...xs, ...xs])).toEqual(expected);
      }),
    );
  });

  // Pattern: algebraic. Merging an already-merged result changes nothing.
  it('is idempotent', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });

  // Pattern: conditional. If the input is already sorted and strictly separated,
  // the output is the input.
  it('returns already-disjoint sorted input unchanged', () => {
    fc.assert(
      fc.property(disjointList, xs => {
        expect(mergeIntervals(xs)).toEqual(xs);
      }),
    );
  });
});