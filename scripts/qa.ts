/**
 * Global QA (skill qa-global, PLAN §10.3): plays each flow in headless Chromium and prints a
 * PASS/FAIL checklist. Each group runs in a fresh browser context (clean localStorage) and fails
 * on any console error. Needs `bun run dev` (or `vite preview`; the suite adds `?qa=1`).
 *   bun scripts/qa.ts [--url http://localhost:5191] [--only table,eleven]
 * Groups: menu, settings, rules, pause, table, eleven, iron, score, manhas, run, newrun, shop,
 * pack, skip, boss, continue, save, end, runend, touch, tutorial, deck.
 */
import { type Browser, type BrowserContextOptions, chromium, type Page } from 'playwright';

const args = process.argv.slice(2);
const opt = (name: string, d: string): string => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? (args[i + 1] ?? d) : d;
};
const base = opt('url', 'http://localhost:5191');
const only = opt('only', '')
	.split(',')
	.filter((s) => s.length > 0);

interface T {
	open(query: string): Promise<void>;
	press(...keys: string[]): Promise<void>;
	/** Runs `(game, table) => …` in the page; `table` is the Table scene (private fields too). */
	eval<R>(fn: string): Promise<R>;
	until(what: string, fn: string, ms?: number): Promise<boolean>;
	check(what: string, ok: boolean, detail?: string): void;
	/** Clicks (or taps, in a touch context) the object `pick` returns: `(game, table) => object`. */
	click(pick: string): Promise<boolean>;
}

/**
 * Picks the `nth` visible text of `scene` that matches `re` (labels, menu rows; a Button's label
 * resolves to the button). Use a regex that accepts EN and PT-BR.
 */
const textIn = (scene: string, re: RegExp, nth = 0): string => `(g) => {
	const found = [];
	const walk = (list) => {
		for (const o of list) {
			if (o.type === 'Text' && o.visible && o.parentContainer?.visible !== false && ${re}.test(o.text)) found.push(o);
			if (o.list) walk(o.list);
		}
	};
	walk(g.scene.keys.${scene}.children.list);
	return found[${nth}];
}`;
const hasText = (scene: string, re: RegExp): string => `(g) => Boolean((${textIn(scene, re)})(g))`;

/** Page coordinates of the centre of the object `pick` returns (camera zoom and CSS scale). */
const pagePos = (pick: string): string => `(g, t) => {
	const o = (${pick})(g, t);
	if (!o) return null;
	const b = (o.parentContainer?.bg ?? o).getBounds();
	const cam = o.scene.cameras.main;
	const r = g.canvas.getBoundingClientRect();
	const k = r.width / g.canvas.width;
	return {
		x: r.left + ((b.centerX - cam.worldView.x) * cam.zoom + cam.x) * k,
		y: r.top + ((b.centerY - cam.worldView.y) * cam.zoom + cam.y) * k,
	};
}`;

let fails = 0;
const results: string[] = [];

async function group(
	browser: Browser,
	name: string,
	body: (t: T) => Promise<void>,
	ctx: BrowserContextOptions = {},
	/** Script run in the page before the game (fake devices). */
	init?: string,
): Promise<void> {
	if (only.length && !only.includes(name)) return;
	const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...ctx });
	if (init) await context.addInitScript(init);
	const page: Page = await context.newPage();
	const errors: string[] = [];
	page.on('console', (m) => {
		if (m.type() === 'error') errors.push(m.text());
	});
	page.on('pageerror', (e) => errors.push(e.message));
	const check = (what: string, ok: boolean, detail = ''): void => {
		if (!ok) fails++;
		results.push(
			`${ok ? 'PASS' : 'FAIL'} [${name}] ${what}${ok || !detail ? '' : ` — ${detail}`}`,
		);
	};
	const evalIn = <R>(fn: string): Promise<R> =>
		page.evaluate((src) => {
			const g = (
				window as unknown as { __GAME__: { scene: { keys: Record<string, unknown> } } }
			).__GAME__;
			return new Function('game', 'table', `return (${src})(game, table);`)(
				g,
				g.scene.keys.Table,
			);
		}, fn) as Promise<R>;
	const t: T = {
		async open(query) {
			await page.goto(`${base}/${query}${query.includes('?') ? '&' : '?'}qa=1`);
			// Past the Boot scene, with the Table's match built (slow machines take longer).
			await page.waitForFunction(
				() => {
					const g = (
						window as unknown as {
							__GAME__?: {
								scene: {
									isActive(k: string): boolean;
									keys: { Table?: { match?: unknown } };
								};
							};
						}
					).__GAME__;
					if (!g) return false;
					const s = g.scene;
					return (
						s.isActive('Menu') ||
						s.isActive('Run') ||
						(s.isActive('Table') && s.keys.Table?.match !== undefined)
					);
				},
				undefined,
				{ timeout: 30000 },
			);
			await page.waitForTimeout(800);
		},
		async press(...keys) {
			for (const k of keys) {
				await page.keyboard.press(k);
				await page.waitForTimeout(200);
			}
		},
		eval: evalIn,
		async until(what, fn, ms = 15000) {
			const end = Date.now() + ms;
			while (Date.now() < end) {
				if (await evalIn<boolean>(fn)) return true;
				await page.waitForTimeout(150);
			}
			check(`${what} (timeout)`, false);
			return false;
		},
		check,
		async click(pick) {
			const p = await evalIn<{ x: number; y: number } | null>(pagePos(pick));
			if (!p) {
				check(`found ${pick.slice(0, 60)}`, false);
				return false;
			}
			if (ctx.hasTouch) await page.touchscreen.tap(p.x, p.y);
			else {
				// Phaser hit-tests a pointerdown with the list from the last move: a click that moves
				// and presses in the same frame used the old spot (flaky after a redraw).
				await page.mouse.move(p.x, p.y);
				await page.waitForTimeout(50);
				await page.mouse.click(p.x, p.y);
			}
			await page.waitForTimeout(250);
			return true;
		},
	};
	try {
		await body(t);
	} catch (e) {
		check('no exception', false, String(e));
	}
	check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
	await context.close();
}

const active = (key: string): string => `(g) => g.scene.keys.${key}.sys.isActive()`;
// The turn is really yours once the table handed it over (the arrow over your hand shows).
const humanTurn = '(g, t) => !t.busy && t.match.actor() === 0 && t.turnArrow.visible';

const browser = await chromium.launch({
	headless: true,
	args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

await group(browser, 'menu', async (t) => {
	await t.open('?seed=1');
	t.check('menu opens', await t.eval<boolean>(active('Menu')));
	await t.press('Enter');
	t.check('New run opens the run screen', await t.until('run opens', active('Run'), 5000));
});

await group(browser, 'pause', async (t) => {
	await t.open('?skipMenu=1&seed=3');
	await t.press('Escape');
	t.check('Esc pauses', await t.until('pause opens', active('Pause'), 3000));
	t.check('table is paused', await t.eval<boolean>('(g) => g.scene.isPaused("Table")'));
	await t.press('Escape');
	t.check('Esc resumes', await t.until('table resumes', active('Table'), 3000));
});

await group(browser, 'table', async (t) => {
	await t.open('?skipMenu=1&seed=3&speed=4');
	t.check(
		'a missing card texture stays straight instead of crashing (B-01)',
		await t.eval<boolean>('(g, t) => t.tilted("card.missing", 8) === "card.missing"'),
	);
	if (!(await t.until('your turn', humanTurn))) return;
	await t.press('KeyS');
	t.check('S opens the signal picker', await t.eval<boolean>('(g, t) => t.signPicker.visible'));
	await t.eval('(g, t) => t.sendSignal("nothing")');
	t.check(
		'a signal spends one of your signals',
		await t.until('signal sent', '(g, t) => t.match.state.signalsLeft[0] === 0', 5000),
	);
	await t.until('your turn', humanTurn);
	await t.press('KeyT');
	t.check(
		'T calls truco',
		await t.until('truco', '(g, t) => t.match.state.bet >= 3 || t.match.state.over', 8000),
	);
	// With seed 3 the rivals run from the truco and the next hand is dealt: wait until a card
	// can really be played (in this hand or the next), so the key is never pressed mid-deal.
	await t.until('your turn to play', humanTurn);
	const before = await t.eval<number>('(g, t) => t.match.state.hands[0].length');
	await t.press('Digit1');
	t.check(
		'1 plays the first card',
		await t.until('card played', `(g, t) => t.match.state.hands[0].length < ${before}`, 5000),
	);
	// Keep playing the first card (and accepting) until the hand is dealt again.
	for (let i = 0; i < 12; i++) {
		if (await t.eval<boolean>('(g, t) => t.match.hands >= 2')) break;
		await t.until('your turn', `(g, t) => (${humanTurn})(g, t) || t.match.hands >= 2`);
		await t.press('KeyA', 'Digit1');
	}
	t.check(
		'the match moves on to the next hand',
		await t.until('next hand', '(g, t) => t.match.hands >= 2', 10000),
	);
});

await group(browser, 'eleven', async (t) => {
	await t.open('?skipMenu=1&seed=3&speed=4&score=11-4');
	t.check(
		'score 11 deals a mão de 11',
		await t.eval<boolean>('(g, t) => t.match.state.kind === "eleven"'),
	);
	const mine = await t.eval<boolean>('(g, t) => t.match.actor() === 0');
	if (mine) {
		t.check(
			'the eleven panel shows',
			await t.until('eleven panel', '(g, t) => t.eleven.visible', 3000),
		);
		await t.eval('(g, t) => t.human({ kind: "eleven", seat: 0, play: true })');
	}
	t.check(
		'the team decides and the hand goes on',
		await t.until('eleven decided', '(g, t) => t.match.state.elevenDecided', 8000),
	);
});

await group(browser, 'iron', async (t) => {
	await t.open('?skipMenu=1&seed=3&speed=4&score=11-11');
	t.check(
		'11 × 11 deals the iron hand',
		await t.eval<boolean>('(g, t) => t.match.state.kind === "iron"'),
	);
	t.check(
		'your cards are face down',
		await t.eval<boolean>(
			'(g, t) => t.handCards.every((c) => c.getData("key") === "card.back.default")',
		),
	);
	await t.until('your turn', humanTurn);
	t.check('no truco in the iron hand', await t.eval<boolean>('(g, t) => !t.btn.truco.isEnabled'));
});

await group(browser, 'score', async (t) => {
	// A quick match is plain Truco to 12; `?goal` turns the roguelite scoring on.
	await t.open('?skipMenu=1&seed=3&auto=1&speed=4&goal=110');
	t.check(
		'a won hand is counted and the shown total matches scoreHand',
		await t.until(
			'hand scored',
			'(g, t) => t.match.lastScore?.lance && t.shownPoints === t.match.lastScore.points',
			40000,
		),
	);
	t.check('points add up at the table', await t.eval<boolean>('(g, t) => t.match.points > 0'));
});

await group(browser, 'manhas', async (t) => {
	await t.open(
		'?skipMenu=1&seed=3&auto=1&speed=4&champ=8&goal=110&manhas=peQuente,reviravolta,cangaceiro,maoDeLixo,seuZe',
	);
	t.check(
		'?manhas shows 5 Manha slots',
		await t.eval<boolean>('(g, t) => t.manhaRow.length === 5'),
	);
	t.check(
		'a Manha fires with a popup',
		await t.until(
			'manha popup',
			'(g, t) => t.popup.visible && t.popup.text.startsWith("[")',
			60000,
		),
	);
	t.check(
		'Manha steps are part of the counted total',
		await t.until(
			'manha counted',
			'(g, t) => t.match.lastScore?.steps.some((s) => s.source.startsWith("manha:")) && (!t.match.lastScore.lance || t.shownPoints === t.match.lastScore.points)',
			60000,
		),
	);
});

await group(browser, 'run', async (t) => {
	await t.open('?run=1&auto=1&speed=4&seed=5');
	t.check(
		'the bot plays a run: table, shop, next table',
		await t.until(
			'second table',
			'(g) => (g.registry.get("save").run?.table ?? 0) >= 1 || (g.registry.get("save").run?.champ ?? 1) >= 2',
			90000,
		),
	);
});

await group(browser, 'continue', async (t) => {
	await t.open('?run=1&seed=9');
	await t.eval('(g) => g.scene.keys.Run.choosePartner("donaCida")');
	await t.eval('(g) => g.scene.keys.Run.play()');
	t.check('the table of the run opens', await t.until('table', active('Table'), 5000));
	const before = await t.eval<string>(
		'(g, t) => JSON.stringify(t.match.state.hands[0].map((c) => c.id))',
	);
	t.check(
		'the hand is saved',
		await t.eval<boolean>('(g) => g.registry.get("save").run.tableSave !== null'),
	);
	await t.open('?seed=9');
	await t.press('Enter');
	t.check('Continue resumes the table', await t.until('table again', active('Table'), 5000));
	const after = await t.eval<string>(
		'(g, t) => JSON.stringify(t.match.state.hands[0].map((c) => c.id))',
	);
	t.check('reload re-deals the same hand (D-32)', before === after, `${before} vs ${after}`);
});

await group(browser, 'end', async (t) => {
	await t.open('?skipMenu=1&seed=1&auto=1&speed=4&score=10-10');
	t.check(
		'the match ends and shows the end panel',
		await t.until(
			'end panel',
			'(g, t) => t.match.winner !== null && t.endPanel.visible',
			40000,
		),
	);
	t.check(
		'the quick match ends at 12 tentos, with no points goal',
		await t.eval<boolean>(
			'(g, t) => t.match.goal === undefined && t.match.score[t.match.winner] >= 12',
		),
	);
	// The bot keeps playing after the restart (from ?score again), so check for a new match
	// rather than for its first hand.
	await t.eval('(g, t) => { t.match.qaOld = true; t.scene.restart(); }');
	t.check(
		'play again starts a new match',
		await t.until(
			'restart',
			'(g, t) => t.sys.isActive() && !t.match.qaOld && t.match.winner === null && !t.endPanel.visible',
			5000,
		),
	);
});

const runOf = '(g) => g.registry.get("save").run';
/** A run in the shop with known offers (the shop screen is tested, not the rolls). */
const SHOP = `(g) => {
	const r = g.scene.keys.Run.run;
	Object.assign(r, { phase: 'shop', money: 40, manhas: ['seuZe', 'peQuente'] });
	r.shop = {
		offers: [
			{ kind: 'manha', id: 'malandro', price: 4, sold: false },
			{ kind: 'consumable', item: { kind: 'lance', id: 'limpa' }, price: 3, sold: false },
		],
		packs: [{ kind: 'pack', pack: 'baralho', price: 4, sold: false }],
		upgrade: null,
		rerolls: 0,
		opened: null,
	};
	g.scene.keys.Run.draw();
}`;
const runWith = (cond: string): string => `(g) => { const r = (${runOf})(g); return ${cond}; }`;
const newRunIn = async (t: T, seed: number): Promise<void> => {
	await t.open(`?run=1&seed=${seed}`);
	await t.eval('(g) => g.scene.keys.Run.choosePartner("donaCida")');
};

await group(browser, 'settings', async (t) => {
	await t.open('?seed=1');
	// Menu labels carry a zero-width non-joiner between f and i (noLigatures).
	await t.click(textIn('Menu', /Settings|Conf\u200c?igurações/));
	t.check('Settings opens over the menu', await t.until('settings', active('Settings'), 3000));
	t.check('the menu waits paused', await t.eval<boolean>('(g) => g.scene.isPaused("Menu")'));
	await t.press('Escape');
	t.check(
		'Esc goes back to the menu',
		await t.until(
			'menu',
			'(g) => !g.scene.isActive("Settings") && g.scene.isActive("Menu")',
			3000,
		),
	);
});

await group(browser, 'rules', async (t) => {
	await t.open('?seed=1');
	await t.click(textIn('Menu', /^\W*(Rules|Regras)\W*$/));
	t.check('Rules opens', await t.until('rules', active('Rules'), 3000));
	t.check('the rules text shows', await t.eval<boolean>(hasText('Rules', /truco/i)));
	await t.press('ArrowRight', 'ArrowRight');
	t.check('→ turns the pages', await t.eval<boolean>('(g) => g.scene.keys.Rules.page === 2'));
	await t.press('Escape');
	t.check('Esc goes back to the menu', await t.until('menu', active('Menu'), 3000));
});

await group(browser, 'tutorial', async (t) => {
	await t.open('?seed=1');
	await t.click(textIn('Menu', /^\W*Tutorial\W*$/));
	const card = '(g) => g.scene.keys.Tutorial.sys.isActive() && g.scene.keys.Tutorial.showing';
	t.check('Tutorial opens with a step card', await t.until('first card', card, 8000));
	t.check(
		'the table waits while the card shows',
		await t.eval<boolean>('(g) => g.scene.isPaused("Table")'),
	);
	await t.press('Enter');
	t.check(
		'Next shows the following step',
		await t.until('second step', '(g) => g.scene.keys.Tutorial.current === 1', 3000),
	);
	await t.press('Escape');
	t.check('Esc skips back to the menu', await t.until('menu', active('Menu'), 3000));
	t.check(
		'skipping marks the tutorial as done',
		await t.eval<boolean>('(g) => g.registry.get("save").meta.tutorialDone'),
	);
});

await group(browser, 'newrun', async (t) => {
	await t.open('?seed=4');
	await t.press('Enter');
	t.check(
		'New run asks for a partner',
		await t.until('partners', hasText('Run', /partner|parceiro/i), 5000),
	);
	await t.click(textIn('Run', /Play with|Jogar com/, 1));
	t.check(
		'picking a partner starts the run at Championship 1',
		await t.eval<boolean>(runWith('r?.champ === 1 && r.table === 0 && r.phase === "select"')),
	);
	t.check('the next table shows its goal', await t.eval<boolean>(hasText('Run', /Goal|Meta/)));
	t.check('and the rivals', await t.eval<boolean>(hasText('Run', /Rivals|Rivais/)));
	await t.click(textIn('Run', /^\W*(Play|Jogar)$/));
	t.check('Play opens the table', await t.until('table', active('Table'), 5000));
});

await group(browser, 'shop', async (t) => {
	await newRunIn(t, 6);
	await t.eval(SHOP);
	await t.click(textIn('Run', /^\$4$/));
	t.check(
		'buying a Manha takes the money and fills a slot',
		await t.eval<boolean>(runWith('r.money === 36 && r.manhas.at(-1) === "malandro"')),
	);
	await t.eval('(g) => g.scene.keys.Run.drawManhaPanel(g.scene.keys.Run.run)');
	await t.click(textIn('Run', /^▶$/));
	t.check(
		'▶ moves the first Manha right',
		await t.eval<boolean>(runWith('r.manhas.join() === "peQuente,seuZe,malandro"')),
	);
	await t.click(textIn('Run', /^◀$/, 1));
	t.check(
		'◀ moves a Manha left',
		await t.eval<boolean>(runWith('r.manhas.join() === "peQuente,malandro,seuZe"')),
	);
	await t.click(textIn('Run', /(Sell|Vender) \$/));
	t.check(
		'selling returns half the price',
		await t.eval<boolean>(runWith('r.money === 38 && r.manhas.join() === "malandro,seuZe"')),
	);
	await t.eval('(g) => g.scene.keys.Run.closePanel?.()');
	await t.click(textIn('Run', /^(Refresh|Renovar)$/));
	t.check(
		'reroll costs $5 and redraws the offers',
		await t.eval<boolean>(
			runWith(
				'r.money === 33 && r.shop.rerolls === 1 && r.shop.offers.every((o) => !o.sold)',
			),
		),
	);
	await t.eval('(g) => { g.scene.keys.Run.run.money = 0; g.scene.keys.Run.draw(); }');
	await t.click(textIn('Run', /^\$[1-9]$/));
	t.check(
		'without money nothing is bought and the error shows',
		(await t.eval<boolean>(runWith('r.manhas.length === 2 && r.consumables.length === 0'))) &&
			(await t.eval<boolean>(hasText('Run', /Not enough|insuficiente/))),
	);
	await t.click(textIn('Run', /Next table|Próxima mesa/));
	t.check('Next table leaves the shop', await t.eval<boolean>(runWith('r.phase === "select"')));
});

await group(browser, 'pack', async (t) => {
	await newRunIn(t, 6);
	await t.eval(SHOP);
	// The pack card's buy button, found by the offer it sells (its label is just the price).
	await t.click(`(g) => {
		const card = g.scene.keys.Run.body.list.find((o) => o.getData?.('offer') === 'packs:0');
		return card?.list.find((o) => typeof o.click === 'function' && typeof o.setLabel === 'function');
	}`);
	t.check(
		'buying a pack opens its options',
		await t.eval<boolean>(runWith('r.shop.opened?.length === 4')),
	);
	t.check('the pick screen shows', await t.eval<boolean>(hasText('Run', /Pick 1|Escolha 1/)));
	// GD-001: four option cards must fit the 640-wide stage (each card holds one Choose button).
	const fit = await t.eval<string>(`(g) => {
		const run = g.scene.keys.Run;
		const L = run.cx - 320;
		const cards = [];
		const walk = (list) => {
			for (const o of list) {
				if (o.type === 'Text' && /^(Choose|Escolher)$/.test(o.text)) cards.push(o.parentContainer.parentContainer);
				else if (o.list) walk(o.list);
			}
		};
		walk(run.children.list);
		return cards.map((c) => { const b = c.getBounds(); return b.left >= L && b.right <= L + 640 ? 'ok' : Math.round(b.left) + '..' + Math.round(b.right); }).join(',');
	}`);
	t.check('all 4 pack options fit the stage', fit === 'ok,ok,ok,ok', fit);
	await t.click(textIn('Run', /^(Choose|Escolher)$/));
	t.check(
		'taking a card adds it to the deck and closes the pack',
		await t.eval<boolean>(runWith('r.deck.length === 42 && r.shop.opened === null')),
	);
});

await group(browser, 'skip', async (t) => {
	await newRunIn(t, 7);
	await t.click(textIn('Run', /Skip|Pular/));
	t.check(
		'skipping the small table gives a Promise and goes to the big one',
		await t.eval<boolean>(runWith('r.table === 1 && r.promises.length === 1')),
	);
	t.check('the Promise is shown', await t.eval<boolean>(hasText('Run', /Promise|Promessa/)));
	await t.eval('(g) => { g.scene.keys.Run.run.table = 2; g.scene.keys.Run.draw(); }');
	t.check(
		'the boss table cannot be skipped',
		!(await t.eval<boolean>(hasText('Run', /Skip|Pular/))),
	);
});

await group(browser, 'boss', async (t) => {
	await newRunIn(t, 8);
	await t.eval(
		'(g) => { const r = g.scene.keys.Run.run; r.table = 2; r.bosses[0] = "cartomante"; g.scene.keys.Run.draw(); }',
	);
	t.check(
		'the boss and its rule show before the table',
		await t.eval<boolean>(hasText('Run', /Cartomante|Fortune/)),
	);
	await t.eval('(g) => g.scene.keys.Run.play()');
	if (!(await t.until('table', active('Table'), 5000))) return;
	t.check(
		'the table knows its boss',
		await t.eval<boolean>('(g, t) => t.match.boss === "cartomante"'),
	);
	t.check(
		'the Cartomante hides the vira in the 1st trick',
		await t.until(
			'vira hidden',
			'(g, t) => t.vira.texture.key === "card.back.default" && t.viraLabel.text.includes("?")',
			5000,
		),
	);
});

await group(browser, 'save', async (t) => {
	await newRunIn(t, 9);
	await t.eval('(g) => g.scene.keys.Run.play()');
	if (!(await t.until('table', active('Table'), 5000))) return;
	if (!(await t.until('your turn', humanTurn))) return;
	const hand = '(g, t) => JSON.stringify(t.match.state.hands[0].map((c) => c.id))';
	const dealt = await t.eval<string>(hand);
	await t.press('Digit1');
	await t.until('card played', '(g, t) => t.match.state.hands[0].length === 2', 5000);
	await t.open('?seed=9');
	await t.press('Enter');
	if (!(await t.until('table again', active('Table'), 5000))) return;
	const again = await t.eval<string>(hand);
	t.check(
		'reload in the middle of a hand re-deals the same 3 cards (D-32)',
		dealt === again,
		`${dealt} vs ${again}`,
	);
});

await group(browser, 'runend', async (t) => {
	await newRunIn(t, 10);
	await t.eval('(g) => g.scene.keys.Run.play()');
	if (!(await t.until('table', active('Table'), 5000))) return;
	// Losing a whole table takes minutes even at 4×: the end of the table is forced as a loss.
	await t.eval('(g, t) => t.showEnd("them")');
	t.check('a lost table ends the run', await t.eval<boolean>(runWith('r.phase === "lost"')));
	await t.click(textIn('Table', /^(Continue|Continuar)$/));
	t.check(
		'the run summary shows',
		(await t.until('run screen', active('Run'), 5000)) &&
			(await t.eval<boolean>(hasText('Run', /run is over|run acabou/i))),
	);
	await t.click(textIn('Run', /Main menu|Menu principal/));
	t.check(
		'Main menu goes back and clears the run',
		await t.until('menu', `(g) => g.scene.isActive("Menu") && (${runOf})(g) === null`, 5000),
	);
});

await group(
	browser,
	'touch',
	async (t) => {
		await t.open('?skipMenu=1&seed=3');
		if (!(await t.until('your turn', humanTurn))) return;
		await t.click('(g, t) => t.handCards[0]');
		t.check(
			'tapping a card plays it',
			await t.until('card played', '(g, t) => t.match.state.hands[0].length === 2', 5000),
		);
	},
	{ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
);

/** A fake standard-mapping pad (Steam Deck controls): window.__pad.press(button) taps one button. */
const FAKE_PAD = `(() => {
	const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
	const pad = { id: 'Steam Deck (fake)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons };
	navigator.getGamepads = () => [pad];
	window.__pad = { press: (i) => { buttons[i].pressed = true; setTimeout(() => { buttons[i].pressed = false; }, 150); } };
})()`;
const pad = (i: number): string => `(g) => window.__pad.press(${i})`;

await group(
	browser,
	'deck',
	async (t) => {
		await t.open('?seed=1');
		await t.eval(pad(0));
		t.check('A on the menu starts a new run', await t.until('run opens', active('Run'), 5000));
		await t.open('?skipMenu=1&seed=3');
		if (!(await t.until('your turn', humanTurn))) return;
		t.check(
			'key hints stay hidden by default (Settings > Show key hints)',
			await t.until('no pad hint', '(g, t) => t.btn.truco.hintText === ""', 3000),
		);
		await t.eval(pad(15));
		await t.eval(pad(0));
		t.check(
			'D-pad right + A plays a card',
			await t.until('card played', '(g, t) => t.match.state.hands[0].length === 2', 5000),
		);
	},
	{ viewport: { width: 1280, height: 800 } },
	FAKE_PAD,
);

await browser.close();
for (const r of results) console.log(r);
console.log(fails ? `${fails} FAIL` : `all ${results.length} checks passed`);
process.exit(fails ? 1 : 0);
