/**
 * One sentence per line: paragraphs (`\n`) stay apart with an empty line, and inside one a
 * sentence ends at `.`, `!` or `?` followed by a space and a capital, a digit or a quote (so
 * "6♣. depois" or "1.5" do not break).
 */
export function sentenceLines(text: string): string {
	return text
		.split('\n')
		.map((p) => p.trim().replace(/([.!?…])\s+(?=[A-ZÀ-ÖØ-Þ0-9"“'(«])/gu, '$1\n'))
		.filter(Boolean)
		.join('\n\n');
}
