import { expect, test } from 'bun:test';
import { sentenceLines } from '../src/logic/sentences';

test('one sentence per line; paragraphs keep an empty line between them', () => {
	expect(sentenceLines('Uma frase. Outra frase! E mais? Sim.')).toBe(
		'Uma frase.\nOutra frase!\nE mais?\nSim.',
	);
	expect(sentenceLines('Primeiro bloco. Segundo.\nNovo parágrafo.')).toBe(
		'Primeiro bloco.\nSegundo.\n\nNovo parágrafo.',
	);
	// No break inside numbers, after a card like "6♣." mid-sentence, or before lowercase.
	expect(sentenceLines('Vale 1.5 vezes o 6♣. depois segue.')).toBe(
		'Vale 1.5 vezes o 6♣. depois segue.',
	);
	expect(sentenceLines('Ganha 3. Depois "Truco" vale 3.')).toBe(
		'Ganha 3.\nDepois "Truco" vale 3.',
	);
});
