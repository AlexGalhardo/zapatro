import { type Seat, type Trick, teamOf } from './table';

/** One of the three tricks of a hand as the viewer sees it. */
export type TrickMark = 'won' | 'lost' | 'tied' | 'open';

/**
 * The three trick markers of the felt: the result of each trick from `viewer`'s side (a pair's
 * win counts for each of its seats), `open` while it is unplayed or still being played.
 */
export function trickMarks(
	tricks: readonly Pick<Trick, 'result'>[],
	viewer: Seat = 0,
): TrickMark[] {
	const team = teamOf(viewer);
	return [0, 1, 2].map((i): TrickMark => {
		const result = tricks[i]?.result;
		if (result === undefined) return 'open';
		if (result === 'tie') return 'tied';
		return result === team ? 'won' : 'lost';
	});
}
