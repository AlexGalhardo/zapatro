---
name: art-of-game-design
description: "Knowledge base from \"The Art of Game Design: A Book of Lenses\" by Jesse Schell (1st edition, 100 lenses). Use when designing, evaluating or balancing Zapatro (Truco Paulista roguelite) systems — essential experience and boteco theme, Fichas × Mult scoring and the truco bet, Manhas/modifiers/Simpatias/Lances balance and synergies, probability and expected value (manilha, ZAP, flagra, coringa), shop economy, partner AI and signals, bosses that change rules, Stakes and run pacing, table HUD and count feedback, characters and portraits, prototyping, sim/balance gates and playtesting, scope and documents. Triggers on: game design, lens, balance, mechanics, elemental tetrad, flow, interest curve, playtest, prototype, indirect control, reward, economy, story structure."
---

# The Art of Game Design: A Book of Lenses
**Author**: Jesse Schell | **Pages**: ~518 | **Chapters**: 33 | **Lenses**: 100 | **Generated**: 2026-10-10

## How to use

- **A lens is a set of questions**, not a rule. To evaluate a design, pick the lenses for the task (see *Lens index by design task*), answer every question in writing against the actual design, and turn each weak answer into a change or an open question.
- **Designing a system** → read *Core frameworks*, then the chapter block for that system.
- **Stuck on a decision** → *Decision rules*.
- **Reviewing a feature or a playtest** → run the listed lenses and report by lens number and name.
- Preserve the author's names and numbers when citing (Lens #33 Triangularity, Balance Type #9 Punishment).

Project context: **Zapatro**, a pixel-art roguelite of Truco Paulista 2×2 (you + AI partner vs an AI pair) with a Balatro-like run: each won hand scores Fichas × Mult with the truco bet (1/3/6/9/12) as base Mult; 8 Campeonatos × 3 tables (Pequena, Grande, Chefe) with a shop between tables (Manhas, card modifiers, Simpatias, Lance cards, Melhorias, Promessas), partner signals, Fama, bosses that change rules and Stakes. Design source: `docs/gdd-game-design-document.md`; art bible: `docs/visual.md`; numbers: `src/data/` mirrored in `docs/balancing.md`.

## Core frameworks

1. **Experience, not artifact (Ch 2).** The game only enables an experience in the player's mind. Write the **Essential Experience** first; keep what is essential to it, deliver it through any element, cut the rest.
2. **The elemental tetrad (Ch 4).** Mechanics, Story, Aesthetics, Technology — equally essential, mutually constraining. A limit in one is fixed in another. Audit every feature against all four.
3. **Unifying theme (Ch 5).** Step 1: figure out the theme (a point of view, not a topic). Step 2: reinforce it by every means. What does not reinforce it goes — even genre conventions.
4. **The Rule of the Loop (Ch 7).** More test-and-improve loops = better game. Each loop: state the problem → brainstorm → choose → list risks → prototype the biggest risk → test → restate. Prototypes answer one question, are rough and disposable; turn-based combat prototypes on paper.
5. **Six game mechanics (Ch 10).** Space; Objects, Attributes, and States; Actions; Rules; Skill; Chance. Specify any system by walking the six. Emergence comes from resultant actions ≈ subjects × verbs × objects; the strongest lever is a verb that acts on many objects.
6. **Expected value and perceived probability (Ch 10).** Value = Σ probability × real outcome (count overkill and hidden penalties). Players act on perceived odds and regret, not actual odds.
7. **The Twelve Most Common Types of Game Balance (Ch 11).** Fairness; Challenge vs. Success; Meaningful Choices; Skill vs. Chance; Head vs. Hands; Competition vs. Cooperation; Short vs. Long; Rewards; Punishment; Freedom vs. Controlled Experience; Simple vs. Complex; Detail vs. Imagination. Balance only once playable; double or halve, never nudge 10%.
8. **Flow channel in waves (Ch 9).** Rising challenge → power reward → easier stretch → new ramp ("tense and release"), with clear goals and immediate feedback.
9. **Interest curve, fractal (Ch 14).** Hook → back off → rising peaks with rests → climax → short resolution, at game, level and challenge scale.
10. **String of Pearls + Story Machine (Ch 15).** Authored story between free-play pearls; systems inside the pearls generate stories worth retelling. Bend story to fit mechanics, not the reverse.
11. **Indirect Control and Collusion (Ch 16).** Steer with Constraints, Goals, Interface, Visual Design, Characters, Music; give AI characters the designer's pacing goal alongside their in-world goal.
12. **Interface as information channels (Ch 13).** List and prioritize information → list channels → map → review dimensions. Few, non-overlapping, visibly different modes. Acknowledge input within 0.1 s.
13. **Playtest by question list (Ch 25).** Why, Who, Where, What, How. Write the questions before scheduling; watch faces; log events automatically; investigate every surprise.

## Applying it to Zapatro

- **Essential experience and theme.** Keep/cut test: *"I didn't win because I had the best cards: I won because I built an absurd way to play Truco."* Theme is the boteco do interior paulista (affectionate bar-table banter, never casino). Pillars P1–P5 (GDD 1.4) are the theme in rule form: a feature that would fit any card game is questioned (P1 Truco first = theme over tradition; Lenses #1, #9).
- **Six mechanics, specified.** Space: the table cross (you bottom, partner top, rivals at the sides), the 3-card hand fan, the vaza, and the Manha row whose left-to-right order changes the count. Objects/states: card (rank, suit, modifier, manilha/ZAP from the vira, encoberta), Manhas, tentos, Fama. Actions: play a card or an encoberta, pedir/aceitar/correr/aumentar truco, send a signal, buy/sell/reroll. Prefer verbs that act on many objects (Simpatias that edit the deck, Manhas keyed on tags) over one-off effects (Lenses #21, #23, #24).
- **Hierarchy of knowers.** Public: vira, manilha and ZAP plaque, played cards, tentos, Fama. Private: your hand; the partner's hand only in the mão de 11; nobody's own hand in the mão de ferro; encoberta never revealed. Partial: signals (category only in the partner's balloon, 20% base flagra). The game never shows exact odds (incomplete information as a resource). Changing who knows what is the strongest design lever here (bosses Cartomante, Mudo, Irmãos; Lens #22).
- **The truco bet = triangularity.** Correr is the safe-small option (the previous value), aceitar/aumentar the risky-big one; the bet is the base Mult, so EV must be computed on Points, not tentos. Keep the honourable retreat legible ("Correu: poupou N") so a penalty reads as a choice (Lenses #33, #41).
- **Expected value and perceived odds.** Compute EV against real targets: Points above the table goal are overkill, a lost hand scores 0 whatever the Mult, rival tentos are the clock. The AI's `p` is Monte Carlo (40 deals). Expect "the flagra never happens" (20%), "the Sortuda always gets the manilha" (35%) and coringa rolls (1 of 10) to feel worse than they are; show the reason of every activation (`[Manha] motivo · ganho`) (Lenses #28, #29).
- **Manhas, modifiers, Lances = asymmetric balance + emergence.** 60 Manhas with rarity and price; weak alone, absurd together (synergy 2+2=5) but always explainable by the `steps`. Measure pick rate and win rate per Manha, partner and deck in `scripts/sim.ts`; an option always picked or never picked gets reweighted (double or halve the value in `src/data/`, then bisect). Skipping tables measured as dominant (GDD 5.3) is exactly a Lens #32 dominant strategy (Lenses #30, #32, #43, #47).
- **Economy.** Two looping choices: earn (prêmio + rapidez + juros, selling at 50%) and spend (2 offers, 2 packs, reroll, 1 Melhoria per Campeonato). Every currency must feed the build; ~$54 left at run end means money is too easy (Lenses #5, #46). Meta-progression unlocks variety and difficulty only, never power (D-11): real skill (reading the table, the bet) is never replaced by virtual skill.
- **Punishment.** Two rival quedas end the run (no lives); your own Queda scores a Lance; Agiota costs $1 per lost hand; Juiz disables the leftmost Manha for one table — temporary loss of power, as the book advises. Punish only what the player can see coming (the boss rule is shown before the table; Lens #41).
- **Bosses and Stakes are puzzles by rule, not by number (P5).** Each boss bends one Truco axis (bet, information, build, economy, Lance, bluff, signals, luck). Clear goal (table goal + boss rule), obvious first moves, visible progress (Points vs goal, rival quedas). A light boss "intention" per hand turns the rule into a decision (Lenses #48, #49, #52).
- **Partner = cooperation.** The partner must change decisions: one signal per hand, category balloon, passives that level up per Campeonato. Communication is the co-op mechanic, so bosses that cut it (Mudo) are the strongest tests. 2v2 vazas are tasks no one wins alone (Lens #37; Ch 22 "force players to depend on each other").
- **AI profiles as collusion and pacing.** Covarde, Valentão, Calculista, Blefador, Novato, Profissional give each table a readable personality; tune them for tension, not only for strength (Valentão boss truca every hand, Novato errs on purpose). Readable bluff by rule (belief + Fama), never a hidden die (Lenses #72, #73).
- **Interface: channels and modes.** Every moment: hand, vira plaque, whose turn, current bet, Points vs goal. At a glance: tentos NÓS × ELES, Fama, Manha row, money. Occasionally: Lance levels (L), deck, rules. Fichas always blue + icon, Mult always red + icon, never colour alone. Modes that must look different: playing a card, answering a truco (fixed response column: red raise, green accept, blue run), the count, the shop. Acknowledge input within 0.1 s even when `TABLE_TIMING` plays the card in 220 ms; 4× speed must stay readable; juice scales with the number (Lenses #57–#60).
- **Interest curve, fractal (GDD 2.1).** Hand: TRUCO! accepted, count climbing, ZAP in hand. Table: comeback from 11. Campeonato: Pequena → shop → Grande → shop → boss reveal, the shop being the rest. Run: the build "closes"; watch the C3–C5 valley and measure where runs are abandoned (Lenses #18, #61).
- **Story machine, not campaign.** There is no authored plot: the run must generate stories worth retelling ("the ZAP on a DOZE with Tonhão bluffing"). Cast by function: 4 partner archetypes, 6 rivals, 10 bosses with the Rei do Truco as the fixed climax; traits shown through the 10 portrait expressions; keep the partner's face on screen; status play between rivals and bosses (Lenses #65, #76, #77, #80).
- **Space types.** Linear for the run (8 Campeonatos × 3 tables), a fixed table layout for play, one signature landmark object per room (Ch 19; Echoes: a boss resembles the rivals of its room).
- **Process.** Build the toy first: playing a card and pressing TRUCO! must feel good with no goal (Lens #15). Balance with the gates (`bun scripts/sim.ts`, `bun run balance`: good bot 40–60% at Stake 1, random < 5%) and record results in `docs/balancing.md`; playtest with a written question list and an instrumented build (Lenses #14, #91). Documents that serve memory and communication: GDD, art bible, `docs/balancing.md`, `docs/decisions.md` (Lens #90).
- **Out of scope.** No multiplayer (Ch 21–22 only inform the partner design); premium, no ads, no gambling look (Lenses #96, #98).

## Decision rules

| When | Do | Because |
|---|---|---|
| A feature's value is unclear | Test it against the Essential Experience and the theme | Reinforces → stays; otherwise goes (Ch 2, 5) |
| One tetrad element is limited | Fix it in another element | Elements are mutually constraining (Ch 4) |
| Starting a system | Write the problem statement as goal + constraints | Too broad misses the goal, too narrow assumes a solution (Ch 6) |
| Choosing what to build next | Prototype the biggest risk first, as cheaply as possible | Rule of the Loop (Ch 7) |
| A value feels off | Double or halve it, then bisect | Small tweaks hide the direction (Ch 11) |
| One option always wins | Reweight its attributes or add a counter | Dominant strategy ends choice (Ch 11) |
| Players stall on a choice | Cut to a few attractive options | Choices > desires overwhelms (Ch 11, 16) |
| Players feel constrained | Add options or goals reachable in more than one way | Choices < desires frustrates (Ch 11) |
| A decision feels flat | Add low-risk/low-reward vs high-risk/high-reward | Triangularity (Ch 11) |
| A part is tedious | Add chance; if too random, add skill or strategy | Alternate chance and skill (Ch 11) |
| Rules need many "unless/except" | Replace with simple rules that interact | Innate vs emergent complexity (Ch 11) |
| An element has one purpose | Merge or cut it | Elegance (Ch 11) |
| Tempted to use a penalty | Reframe as a bonus for the opposite behaviour | Rewards reinforce better (Ch 11) |
| A challenge can block progress | Offer parallel challenges | Parallelism lets the player rest (Ch 12) |
| Adding a UI state | Reuse an existing mode or make the new one look clearly different | Fewer, distinct modes (Ch 13) |
| An action resolves later | Acknowledge the input within 0.1 s anyway | Tenth-of-a-second rule (Ch 13) |
| A section drags | Cut or bypass it, whatever it cost | Flat stretches fall under the interest threshold (Ch 14) |
| Tempted to branch the story | Use string of pearls; put variation in systems | Combinatorial explosion, unity (Ch 15) |
| Story and mechanics conflict | Rewrite the story | Story is the most pliable element (Ch 15) |
| Tempted to take control from the player | Use one of the six indirect control methods | Players need the feeling of freedom (Ch 16) |
| Art cannot show detail in-game | Show it once in rich art, keep sprites simple | Binocular effect; avoid the uncanny valley (Ch 17, 18) |
| A technology is costly | Keep it only if foundational | Decorational tech is icing (Ch 26) |
| Planning a playtest | Write the question list, then pick testers to match | Five key questions (Ch 25) |
| Someone asks for an odd change | Ask "What problem are you trying to solve?" | A bad suggestion solves an unstated problem (Ch 27) |

**Tells & smells**
- Players set their own bans or house rules → balance hole (Lens #26).
- Players ignore a currency or collectible → no endogenous value (Lens #5).
- "The flagra never happens" / "the Sortuda always gets the manilha" → perceived probability below actual (Lens #28).
- Players ask "what do I do now?" (or ignore the table goal) → goal not concrete or not visible (Lens #25).
- Playtesters fumble under pressure → mode or channel problem; find which of the six interface arrows (Lens #56).
- Nobody retells what happened in a run → story machine too scripted (Lens #65).
- Players always skip Pequena/Grande, or always buy the same Manha → dominant strategy (Lens #32).

## Lens index by design task

| Task | Lenses |
|---|---|
| Vision, theme, concept | #1 Essential Experience, #7 Elemental Tetrad, #8 Holographic Design, #9 Unification, #10 Resonance, #11 Infinite Inspiration, #12 Problem Statement |
| Is it fun at the core | #2 Surprise, #3 Fun, #4 Curiosity, #5 Endogenous Value, #6 Problem Solving, #15 Toy |
| Players | #16 The Player, #17 Pleasure, #18 Flow, #19 Needs, #20 Judgment |
| Specifying mechanics | #21 Functional Space, #22 Dynamic State, #23 Emergence, #24 Action, #25 Goals, #26 Rules, #27 Skill |
| Probability and risk | #28 Expected Value, #29 Chance, #33 Triangularity, #34 Skill vs. Chance |
| Balance of Manhas, modifiers, Lances, partners, bosses, Stakes | #30 Fairness, #31 Challenge, #32 Meaningful Choices, #35 Head and Hands, #42 Simplicity/Complexity, #43 Elegance, #44 Character, #47 Balance |
| Progression, rewards, economy | #39 Time, #40 Reward, #41 Punishment, #46 Economy |
| Partner co-op, signals, rival pair | #36 Competition, #37 Cooperation, #38 Competition vs. Cooperation |
| Tables, bosses and puzzle design | #48 Accessibility, #49 Visible Progress, #50 Parallelism, #51 The Pyramid, #52 The Puzzle |
| Table HUD, count, shop, feedback | #53 Control, #54 Physical Interface, #55 Virtual Interface, #56 Transparency, #57 Feedback, #58 Juiciness, #59 Channels and Dimensions, #60 Modes |
| Pacing | #61 The Interest Curve, #62 Inherent Interest, #63 Beauty, #64 Projection |
| Story | #65 The Story Machine, #66 The Obstacle, #67 Simplicity and Transcendence, #68 The Hero's Journey, #69 The Weirdest Thing, #70 Story |
| Guiding the player, AI profiles | #71 Freedom, #72 Indirect Control, #73 Collusion |
| World and characters | #74 The World, #75 The Avatar, #76 Character Function, #77 Character Traits, #78 The Interpersonal Circumplex, #79 The Character Web, #80 Status, #81 Character Transformation |
| Table and room space, art detail | #82 Inner Contradiction, #83 The Nameless Quality, #45 Imagination |
| Community (multiplayer only) | #84 Friendship, #85 Expression, #86 Community, #87 Griefing |
| Process and team | #13 Eight Filters, #14 Risk Mitigation, #88 Love, #89 The Team, #90 Documentation, #91 Playtesting, #92 Technology, #93 The Crystal Ball |
| Business, purpose | #94 The Client, #95 The Pitch, #96 Profit, #97 Transformation, #98 Responsibility, #99 The Raven, #100 Your Secret Purpose |

## Chapters

### Ch 1 — In the Beginning, There Is the Designer
**Core idea:** Game design is the act of deciding what a game should be; designer is a role, held by anyone making those decisions. Decide with confidence and treat failure as the route to a good game.
**Frameworks:**
- **Game design = decision making** — Thousands of decisions on rules, look and feel, pacing, rewards, punishments. Write them down; many cannot be settled until the game runs.
- **The Most Important Skill: Listening** — Observe everything, assume nothing, accept that what you hear may overturn your view.
- **The Five Kinds of Listening** — Team, Audience, Game, Client, Self. Listening to the game means diagnosing it by watching it run.
- **Minor gift vs. major gift** — Innate skill vs. love of the work; the latter grows skill through practice.
**Lenses:** none.
**Avoid:** Surface listening: taking words or playtest comments at face value.
**Takeaways:**
- Do write the decision down when a question is open.
- Do check all five kinds of listening when a choice stalls.

### Ch 2 — The Designer Creates an Experience
**Core idea:** The game is not the experience; it is an artifact that enables one in the player's mind, and only that experience matters. Define it precisely and shape the artifact toward it.
**Frameworks:**
- **Artifact vs. experience** — You control the artifact only; interactivity and randomness widen the gap. Games repay that with feelings only they give: choice, freedom, responsibility, accomplishment, friendship.
- **Three Practical Approaches** — Psychology, Anthropology (put yourself in the players' place), Design (borrow from every discipline).
- **Introspection Peril #1 / Peril #2** — #1: false conclusions about reality; minor, since designers care what feels true. #2: what is true of my experience may not be true for others; reject both "I only design for people like me" and "only playtesting can be trusted". Observe yourself and others, map the differences, then predict.
- **Dissect Your Feelings** — State what you like, dislike and why, concretely.
- **Defeating Heisenberg** — Observe without spoiling: Analyze Memories; Two Passes (play untainted, then replay with notes); Sneak Glances; Observe Silently.
- **Essential Experience** — List what defines the target experience, drop the incidental, deliver each essential through any element (art, sound, rules) rather than by simulation. Wii Sports baseball kept the swing and dropped nine innings.
**Lenses:**
- **#1 Essential Experience** — What experience do I want the player to have? / What is essential to that experience? / How can my game capture that essence?
**Avoid:**
- "I like playing this, therefore it is good."
- Simulating the source instead of capturing its essence.
**Takeaways:**
- Do write the essential experience before choosing systems; it shows which elements may change safely.
- Do cut features that serve the source but not the essence when scope is tight.

### Ch 3 — The Experience Rises Out of a Game
**Core idea:** Defining terms matters for the thinking it forces. Working result: a game is a problem-solving activity, approached with a playful attitude.
**Frameworks:**
- **The definitions** — Fun is pleasure with surprises. / Play is manipulation that indulges (satisfies) curiosity. / A toy is an object you play with. / A good toy is an object that is fun to play with. / A game is a problem-solving activity, approached with a playful attitude.
- **Ten game qualities** — Games Q1 are entered willfully; Q2 have goals; Q3 have conflict; Q4 have rules; Q5 can be won and lost; Q6 are interactive; Q7 have challenge; Q8 can create their own internal value; Q9 engage players; Q10 are closed, formal systems.
- **Work vs. play** — The difference is obligation, not activity; a self-set goal turns work into play.
- **Endogenous value** — Items and scores matter only when tied to the player's motivation. Bubsy's yarn balls only score, so players ignore them; Sonic 2's rings protect you and grant lives.
- **Problem Solving 101 / the magic circle** — Goal, boundaries, allowed methods, a simplified internal model, win or lose: Q2–Q10 describe our internal problem-solving system. A problem seen as unsolvable (the card game War) becomes mere activity.
**Lenses:**
- **#2 Surprise** — What will surprise players when they play my game? / Does the story have surprises? The rules? The artwork? The technology? / Do the rules give players ways to surprise each other? / Do the rules give players ways to surprise themselves?
- **#3 Fun** — What parts of my game are fun? Why? / What parts need to be more fun?
- **#4 Curiosity** — What questions does my game put into the player's mind? / What am I doing to make them care about these questions? / What can I do to make them invent even more questions?
- **#5 Endogenous Value** — What is valuable to the players in my game? / How can I make it more valuable to them? / What is the relationship between value in the game and the player's motivations?
- **#6 Problem Solving** — What problems does my game ask the player to solve? / Are there hidden problems to solve that arise as part of gameplay? / How can my game generate new problems so that players keep coming back?
**Avoid:**
- Rewards that feed no goal the player holds.
- Obligatory activity; it reads as work.
**Takeaways:**
- Do tie every currency, item and score to something that helps the player succeed.
- Do list the questions each encounter plants, and add reasons to care.

### Ch 4 — The Game Consists of Elements
**Core idea:** Every game is built from four equally essential, mutually constraining elements. Know the anatomy while still feeling the experience.
**Frameworks:**
- **The elemental tetrad** — (1) **Mechanics**: procedures and rules; the goal, how players may pursue it, what happens when they try. (2) **Story**: the sequence of events, pre-scripted or branching and emergent. (3) **Aesthetics**: how it looks, sounds and feels; the most direct tie to experience. (4) **Technology**: the medium; enables some things, prohibits others. Visibility gradient: aesthetics most visible, technology least. None is primary; a choice in one demands support from the other three.
- **Space Invaders example** — Re-theming soldiers to aliens justified the camera; colored screen strips and a quickening heartbeat sound covered hardware limits. A deficit in one element prompts a fix in another.
- **Skin and Skeleton** — Skin = experience; skeleton = elements. Skin only: you feel but cannot fix. Skeleton only: fine in theory, horrible in practice. Hold both at once (holographic design).
**Lenses:**
- **#7 Elemental Tetrad** — Is my game design using elements of all four types? / Could my design be improved by enhancing elements in one or more of the categories? / Are the four elements in harmony, reinforcing each other, and working together toward a common theme?
- **#8 Holographic Design** — What elements of the game make the experience enjoyable? / What elements of the game detract from the experience? / How can I change game elements to improve the experience?
**Avoid:** Treating one element as primary and the rest as dressing.
**Takeaways:**
- Do audit each feature against all four elements when adding it.
- Do look to another element for the fix when one is limited.

### Ch 5 — The Elements Support a Theme
**Core idea:** A single unifying theme makes every element reinforce the others; a resonant theme, touching a deep desire or held truth, lifts craft to art.
**Frameworks:**
- **Unifying theme, two steps** — Step 1: figure out what your theme is. Step 2: use every means possible to reinforce it. If it reinforces the theme it stays, otherwise it goes.
- **Experience-based theme** — Delivers an essential experience. The Pirates ride was not about pirates but "the fantasy of being a pirate"; moving from topic to point of view settled every later choice.
- **Truth-based theme** — A deeply held, rarely stated truth. Titanic: "Love is more important than life, and stronger than death." Hercules: the virtuous can defeat death. Toontown Online: "Work wants to destroy play, but play must survive, because play is more important."
- **Theme over tradition** — Pirates made players invulnerable until a dramatic sinking at the end, because respawning broke the fantasy.
- **Sub-themes** — Serve the main theme; give the theme an opponent for conflict (play gained "work").
**Lenses:**
- **#9 Unification** — What is my theme? / Am I using every means possible to reinforce that theme?
- **#10 Resonance** — What is it about my game that feels powerful and special? / When I describe my game to people, what ideas get them really excited? / If I had no constraints of any kind, what would this game be like? / I have certain instincts about how this game should be; what is driving those instincts?
**Avoid:**
- Mistaking a topic ("pirates") for a theme.
- Dropping theme because "players will never notice"; it works subconsciously.
**Takeaways:**
- Do state the theme as one sentence with a point of view; use it as the keep/cut test.
- Do override a genre convention when it conflicts with the theme.
- Do theme cheap details too: a line of text, a color, a sound.

### Ch 6 — The Game Begins with an Idea
**Core idea:** Real designers think of an idea, try it out, then change and test until good enough. Improve step one through outside inspiration, a precise problem statement and the subconscious.
**Frameworks:**
- **Inspiration** — Draw from life, not from games like yours.
- **State the Problem** — Write goal plus constraints as a question. Too broad misses the goal; too narrow assumes a solution. Three advantages: Broader creative space, Clear measurement, Better communication. Note which tetrad elements are already fixed.
- **Your Silent Partner** — The creative subconscious. Subconscious Tips: #1 Pay Attention, #2 Record Your Ideas, #3 Manage Its Appetites (Judiciously), #4 Sleep, #5 Don't Push Too Hard.
- **Fifteen Nitty-Gritty Brainstorming Tips** — #1–#2 missing from source; #3 sketch (truncated); #4 Toys; #5 Change Your Perspective; #6 Immerse Yourself; #7 Crack Jokes; #8 Spare No Expense; #9 The Writing on the Wall; #10 The Space Remembers; #11 Write Everything; #12 Number Your Lists; #13 Mix and Match Categories (ideas per tetrad element, combined across lists); #14 Talk To Yourself; #15 Find a Partner (groups of four at most).
**Lenses:**
- **#11 Infinite Inspiration** — What is an experience I have had in my life that I would want to share with others? / In what small way can I capture the essence of that experience and put it into my game?
- **#12 Problem Statement** — What problem, or problems, am I really trying to solve? / Have I been making assumptions about this game that really have nothing to do with its true purpose? / Is a game really the best solution? Why? / How will I be able to tell if the problem is solved?
**Avoid:**
- Jumping to solutions before stating the problem.
- Censoring "stupid" ideas; brainstorming with hole-pokers.
**Takeaways:**
- Do write a goal-plus-constraints problem statement before ideation.
- Do list ideas per tetrad element and cross-combine when a concept feels generic.

### Ch 7 — The Game Improves Through Iteration
**Core idea:** Quality follows the number of test-and-improve loops. Spend each loop on the biggest risk and keep loops cheap with rough, disposable prototypes.
**Frameworks:**
- **Choosing an Idea** — Commit fast, since commitment exposes flaws; reverse the moment it fails.
- **The Eight Filters** — Finished only when all eight pass unchanged; after any change, rerun all: #1 Artistic Impulse, #2 Demographics, #3 Experience Design, #4 Innovation, #5 Business and Marketing, #6 Engineering, #7 Social/Community, #8 Playtesting.
- **The Rule of the Loop** — The more times you test and improve your design, the better your game will be. Loop Question 1: how can I make every loop count? Loop Question 2: how can I loop as fast as possible?
- **Spiral model (Barry Boehm, 1986)** — 1 basic design; 2 find the greatest risks; 3 build prototypes that mitigate them; 4 test; 5 more detailed design; 6 return to step 2. Beats the linear waterfall model, which violates the Rule of the Loop.
- **Risk assessment and mitigation** — List what could jeopardize the project, then act now: abstract mechanic prototype, tech stress test, one timed sample asset, art/storyboard prototype shown to the audience.
- **Eight Tips for Productive Prototyping** — #1 Answer a Question; #2 Forget Quality; #3 Don't Get Attached; #4 Prioritize Your Prototypes (biggest risk first); #5 Parallelize Prototypes Productively; #6 It Doesn't Have to be Digital (Toontown Online's turn-based combat was balanced as a board game); #7 Pick a "Fast Loop" Game Engine; #8 Build the Toy First.
- **The Formal Loop** — 1 State the problem. 2 Brainstorm solutions. 3 Choose one. 4 List its risks. 5 Build prototypes to mitigate them. 6 Test; if good enough, stop. 7 State the new problems; go to 2.
- **"The Method" (Mark Cerny)** — Pre-production lasts until two publishable levels with all features exist, usually at about 30% of budget; only then schedule production.
**Lenses:**
- **#13 Eight Filters** — Does this game feel right? / Will the intended audience like this game enough? / Is this a well-designed game? / Is this game novel enough? / Will this game sell? / Is it technically possible to build this game? / Does this game meet our social and community goals? / Do the playtesters enjoy this game enough?
- **#14 Risk Mitigation** — What could keep this game from being great? / How can we stop that from happening?
- **#15 Toy** — If my game had no goal, would it be fun at all? If not, how can I change that? / When people see my game, do they want to start interacting with it, even before they know what to do? If not, how can I change that?
**Avoid:**
- Slapping the game together and hoping.
- Polished prototypes; attachment to throwaway work.
- Working only on the parts you feel confident about.
**Takeaways:**
- Do prototype the core mechanic on paper first when the game is turn-based.
- Do write a risk list each loop and attack the top risk first.
- Do state the question a prototype answers before building it.

### Ch 8 — The Game is Made for a Player
**Core idea:** Know what the audience will enjoy better than they do, by projecting yourself into them and watching them play.
**Frameworks:**
- **Demographics** — Group by age and gender. Nine age brackets: 0-3, 4-6, 7-9, 10-13, 13-18, 18-24, 25-35, 35-50, 50+.
- **Five Things Males / Females Like** — Males: Mastery, Competition, Destruction, Spatial Puzzles, Trial and Error. Females: Emotion, Real World, Nurturing, Dialog and Verbal Puzzles, Learning by Example. Use as a coverage checklist.
- **LeBlanc's Taxonomy of Game Pleasures** — Sensation, Fantasy, Narrative, Challenge, Fellowship, Discovery, Expression, Submission.
- **Bartle's Taxonomy of Player Types** — Achievers (act on world), Explorers (interact with world), Socializers (interact with players), Killers (act on players).
- **Extra pleasures** — Anticipation, Delight in Another's Misfortune, Gift Giving, Humor, Possibility, Pride in an Accomplishment, Purification ("clear the level"), Surprise, Thrill, Triumph over Adversity, Wonder.
**Lenses:**
- **#16 The Player** — What do they like in general? / What don't they like, why? / What do they expect in a game? / In their place, what would I want? / What would they like or dislike about my game?
- **#17 Pleasure** — What pleasures does the game give; can they be improved? / Which are missing, why; can they be added?
**Avoid:** Treating any taxonomy as complete.
**Takeaways:** Do watch each target group play and support the style it shows (offense vs defense) when groups diverge. Do audit the pleasure lists when the design feels flat.

### Ch 9 — The Experience is in the Player's Mind
**Core idea:** Play runs on four mental abilities (modeling, focus, empathy, imagination), driven by needs.
**Frameworks:**
- **Modeling** — A game is a pre-digested, simplified model of reality.
- **Flow** — Requires Clear goals, No distractions, Direct feedback, Continuously challenging.
- **Flow channel** — Challenge vs skill, between anxiety and boredom. Climb it in waves: rising challenge, a reward of power, an easier stretch, a new ramp ("tense and release").
- **Empathy / Imagination** — Players project their decision-making into characters and fill gaps unprompted; choose what to show and what to omit.
- **Maslow's Hierarchy of Needs** — Physiological, Safety, Belonging-Love, Self-Esteem, Self-Actualization. Most games sit at level 4.
**Lenses:**
- **#18 Flow** — Are goals clear; if not, how to fix? / Are the player's goals the ones I intended? / Do parts distract players from the goal; can they be reduced or tied to it? / Is there a steady stream of not-too-easy, not-too-hard challenges as skill improves? / Are skills improving at the hoped rate; if not, what to change?
- **#19 Needs** — Which Maslow levels does the game operate on? / How can it fulfill more basic needs? / How can it fulfill its current levels better?
- **#20 Judgment** — What does the game judge? / How is that communicated? / Do players feel it is fair? / Do they care? / Does it make them want to improve?
**Avoid:** Judging flow from ten-minute sessions.
**Takeaways:** Do follow each difficulty ramp with a power reward and a short easy stretch. Do give immediate feedback on every action.

### Ch 10 — Some Elements are Game Mechanics
**Core idea:** Mechanics are what remains without aesthetics, technology and story. Six: Space, Objects/Attributes/States, Actions, Rules, Skill, Chance.
**Frameworks:**
- **Mechanic 1: Space** — Discrete or continuous; number of dimensions; bounded areas and their connections. **Nested Spaces**: a map icon opens a separate space.
- **Mechanic 2: Objects, Attributes, and States** — Objects are nouns, attributes adjectives, each with a current state. Draw a state diagram per complex attribute. Same behavior, same look.
- **Hierarchy of knowers** — Classify each state by who knows it: all players, some, one, the game only, nobody yet (random).
- **Mechanic 3: Actions** — Operative actions (base verbs) vs resultant actions (emergent strategic uses); their ratio measures emergence. Five tips: Add more verbs; Verbs that can act on many objects (strongest); Goals that can be achieved more than one way; Many subjects; Side effects that change constraints. Resultant actions ≈ subjects × verbs × objects.
- **Mechanic 4: Rules (Parlett's Rule Analysis)** — Operational, Foundational, Behavioral, Written, Laws, Official, Advisory, House Rules.
- **Modes** — One main mode plus sub-modes; always signal the current one.
- **The Most Important Rule** — The Object of the Game, stated simply. Goals: Concrete, Achievable, Rewarding; mix short and long term.
- **Mechanic 5: Skill** — Physical, Mental, Social. Real skills (the player's) vs virtual skills (the character's).
- **Mechanic 6: Chance (Ten Rules of Probability)** — 1 Fractions are Decimals are Percents; 2 Zero to One; 3 "Looked For" / "Possible Outcomes" = Probability; 4 Enumerate; 5 OR means Add (mutually exclusive only); 6 AND means Multiply (independent events); 7 One minus "Does" = "Doesn't" (at least one six in four rolls = 1−(5/6)^4 ≈ 51.77%); 8 The sum of multiple linear random selections is NOT linear (3d6 clusters at 10-11); 9 Roll the Dice (Monte Carlo simulation); 10 Geeks Love Showing Off (Gombauld's Law).
- **Expected Value** — Sum of probability × value. Use real value: a 20%-hit 40-damage attack is worth 8 against a big HP pool but 3 against 15 HP, below a sure 4.
- **The Human Element** — Players act on perceived probability and avoid regret.
- **Skill and Chance Get Tangled** — Estimating chance is a skill; Skills have a probability of success; Estimating an opponent's skill is a skill; Predicting pure chance is an imagined skill; Controlling pure chance is an imagined skill.
**Lenses:**
- **#21 Functional Space** — Discrete or continuous? / How many dimensions? / What boundaries? / Sub-spaces, and how connected? / More than one useful abstract model?
- **#22 Dynamic State** — What objects? / What attributes? / What states per attribute, and what triggers changes? / What state does only the game know? / All players? / Some or one player? / Would changing who knows what improve the game?
- **#23 Emergence** — How many verbs? / How many objects per verb? / How many ways to reach goals? / How many subjects do players control? / How do side effects change constraints?
- **#24 Action** — What are the operational actions? / The resultant actions? / Which resultant actions do I want, and what change enables them? / Am I happy with the resultant-to-operational ratio? / What do players wish they could do, and can I enable it?
- **#25 Goals** — What is the ultimate goal? / Is it clear to players? / Do they understand the series of goals? / Are goals meaningfully related? / Concrete, achievable, rewarding? / Good balance of short and long term? / Can players set their own goals?
- **#26 Rules** — What are the foundational rules, and how do they differ from operational ones? / Are laws or house rules forming; should they be incorporated? / Are there modes; do they simplify or complicate; fewer or more? / Who enforces the rules? / Are rules easy to understand; if not, change them or explain them better?
- **#27 Skill** — What skills are required? / Which categories are missing? / Which dominate? / Do they create the experience I want? / Are some players much better, making it feel unfair? / Can players improve with practice? / Is the demanded level right?
- **#28 Expected Value** — Actual chance of an event? / Perceived chance? / What value does the outcome have; quantifiable; intangibles ignored? / Am I happy with each action's expected value: interesting choices, too rewarding, too punishing?
- **#29 Chance** — What is truly random, and what only feels random? / Does randomness give excitement and challenge, or hopelessness and lack of control? / Would other probability distribution curves improve the game? / Can players take interesting risks? / How do chance and skill relate; can random elements feel like skill, and skills like risk-taking?
**Avoid:** Verbs that do not interact. Single-solution goals. Too many states to track. Summing random numbers without checking the curve.
**Takeaways:** Do draw the functional space and a state diagram per unit attribute before adding art. Do prefer one verb acting on many objects over several narrow verbs. Do compute expected value against real targets (overkill, hidden penalties) for every ability.

### Ch 11 — Game Mechanics Must be in Balance
**Core idea:** Balancing means adjusting elements until the game delivers the intended experience; it starts only once the game is playable.
**Frameworks:**
- **The Twelve Most Common Types of Game Balance** — #1 Fairness; #2 Challenge vs. Success; #3 Meaningful Choices; #4 Skill vs. Chance; #5 Head vs. Hands; #6 Competition vs. Cooperation; #7 Short vs. Long; #8 Rewards; #9 Punishment; #10 Freedom vs. Controlled Experience; #11 Simple vs. Complex; #12 Detail vs. Imagination.
- **Symmetrical vs Asymmetrical Games** — Symmetry measures skill. Asymmetry serves simulation, exploring the gamespace (10 fighters = 100 matchups), personalization, leveling the field against AI, interesting situations.
- **Value-sum model (Biplane Battle)** — Score attributes (Low 1, Medium 2, High 3), total per option, playtest; on mismatch, reweight an attribute and equalize totals.
- **Rock, Paper, Scissors** — Whatever beats something is beaten by something else.
- **Challenge techniques** — Increase difficulty with each success; let players get through easy parts fast; "layers of challenge" (grades); let players choose difficulty; playtest with novices and experts.
- **Dominant strategy** — One clearly best option ends choice; hidden ones are "exploits".
- **Choices vs Desires** — More choices than desires overwhelms; fewer frustrates; equal feels free.
- **Triangularity** — Low risk/low reward vs high risk/high reward. Balance by constant expected value (20% × 100 = 10% × 200).
- **Skill vs Chance** — Alternate them: chance deals, skill plays.
- **Reward types** — Praise, Points, Prolonged Play, A Gateway, Spectacle, Expression, Powers, Resources, Completion. Grow them over time; variable beats fixed at the same average.
- **Punishment types** — Shaming, Loss of points, Shortened Play, Terminated Play, Setback, Removal of Powers (temporary only), Resource Depletion. Rewards reinforce better: turn penalties into bonuses. Punish only what players can understand and prevent.
- **Innate vs Emergent complexity** — Innate = exceptions ("unless", "except", "but", "even if"); emergent = simple rules, complex situations.
- **Elegance / Character** — Count an element's purposes; merge or cut single-purpose ones; keep a few quirks.
- **Detail vs Imagination** — Only detail what you can do well; binocular effect (close-up once, small sprite after).
- **Game Balancing Methodologies** — Lens of the Problem Statement; Doubling and halving; Train your intuition by guessing exactly; Document your model; Tune your model as you tune your game; Plan to balance (runtime-editable values); Let the players do it (usually fails).
- **Balancing Game Economies** — Two looping choices: how to earn, how to spend ("money" includes skill points).
- **Dynamic Game Balancing** — Exploitable; robs players of mastery.
**Lenses:**
- **#30 Fairness** — Symmetrical, why? / Asymmetrical, why? / Which matters more: a reliable measure of skill or an interesting challenge for all? / How do mixed-skill players stay challenged together?
- **#31 Challenge** — What are the challenges? / Too easy, too hard, just right? / Do they fit a wide range of skill? / How does challenge rise as the player succeeds? / Enough variety? / What is the maximum challenge?
- **#32 Meaningful Choices** — What choices am I asking for? / Are they meaningful, how? / Right number: would more feel powerful, fewer feel clearer? / Any dominant strategies?
- **#33 Triangularity** — Do I have triangularity; if not, how to get it? / Are rewards commensurate with risks?
- **#34 Skill vs. Chance** — Are players here to be judged or to take risks? / Serious or casual? / Would chance enliven tedious parts? / Would skill or strategy fix parts that feel too random?
- **#35 Head and Hands** — Mindless action or intellectual challenge? / Would more puzzle-solving help? / Are there places to relax the brain? / Can players win by dexterity or by clever strategy? / From 1 (physical) to 10 (mental), where is the game?
- **#36 Competition** — Is skill measured fairly? / Do people want to win, why? / Is winning something to be proud of, why? / Can novices meaningfully compete? / Can experts? / Can experts count on beating novices?
- **#37 Cooperation** — Can players communicate enough; how to enhance it? / Friends or strangers; can I break the ice? / Synergy (2+2=5) or antergy (2+2=3), why? / Same role or special jobs? / Are there tasks no one can do alone? / Do tasks force communication?
- **#38 Competition vs. Cooperation** — From 1 (competition) to 10 (cooperation), what should the game be? / Can players choose? / What does the audience prefer? / Does team competition fit; is it more fun than solo?
- **#39 Time** — What determines activity length? / Do players feel it ends too early; how to change? / Does it run too long; how to change? / Would a time limit add excitement? / Would a hierarchy of time structures help (short rounds within a larger round)?
- **#40 Reward** — What rewards are given; can others be added? / Are players excited or bored by them, why? / Do they understand them? / Too regular; can they be variable? / How are rewards related; can they connect better? / Building too fast, too slow, just right?
- **#41 Punishment** — What are the punishments? / Why punish; what do I hope to achieve? / Do they seem fair, why? / Can they become rewards with the same or better effect? / Are strong punishments matched by strong rewards?
- **#42 Simplicity/Complexity** — What innate complexity is there? / Could it become emergent? / Does emergent complexity arise; if not, why? / Is anything too simple?
- **#43 Elegance** — What are the elements? / How many purposes does each have ("elegance rating")? / Can one- or two-purpose elements be merged or removed? / Can multi-purpose ones take on more?
- **#44 Character** — Anything strange that players talk about excitedly? / Funny qualities that make the game unique? / Flaws players like?
- **#45 Imagination** — What must the player understand to play? / Can imagination help them understand? / What high-quality realistic details can we provide? / Which would be low quality; can imagination fill the gap? / Which details get reused again and again? / Which inspire imagination? / Which stifle it?
- **#46 Economy** — How do players earn; should there be other ways? / What can they buy, why? / Is money too easy or too hard to get; how to change? / Are earning and spending choices meaningful? / Universal currency or specialized ones?
- **#47 Balance** — Does my game feel right? Why or why not?
**Avoid:** Options that play alike. Tweaking values by 10%. Unpreventable punishment. Permanent loss of earned powers. Upkeep chores enforced by penalty.
**Takeaways:** Do score each option's attributes and reweight from playtests when one option keeps winning or losing. Do double or halve a value that feels off, then bisect. Do add a safe-small vs risky-big choice to any decision that feels flat.

### Ch 12 — Game Mechanics Support Puzzles
**Core idea:** A puzzle is anything that makes the player stop and think; formally, "a game with a dominant strategy" (fun to find once, not to replay).
**Frameworks:**
- **Explicit/incongruous vs implicit/integrated puzzles** — Use world elements; make the solution an avatar goal.
- **Ten Puzzle Principles** — **#1 Make the Goal Easily Understood. #2 Make It Easy to Get Started** ("first build a good toy"). **#3 Give a Sense of Progress** (puzzle vs riddle). **#4 Give a Sense of Solvability** (show a solution exists). **#5 Increase Difficulty Gradually** (let players choose step order). **#6 Parallelism Lets the Player Rest** (several related challenges at once). **#7 Pyramid Structure Extends Interest** (small puzzles feed one final puzzle). **#8 Hints Extend Interest** (escalating, small cost). **#9 Give the Answer!** (seeing it still gives the "Aha!"). **#10 Perceptual Shifts are a Double-Edged Sword** ("get it or you don't"; use sparingly).
**Lenses:**
- **#48 Accessibility** — How will players know how to begin; explain or self-evident? / Does it act like something seen before; if so how to highlight that, if not how to make its behavior understood? / Does it draw people in to touch and manipulate it; if not, what to change?
- **#49 Visible Progress** — What does progress mean in my game/puzzle? / Is there enough; can I add interim steps of success? / What progress is visible vs hidden; can I reveal the hidden?
- **#50 Parallelism** — Are there bottlenecks where one failed challenge blocks the player; can I add parallel challenges? / Are they different enough to give variety? / Can they connect so progress on one eases the others?
- **#51 The Pyramid** — Can all pieces feed a singular final challenge? / Can I build a hierarchy of ever harder elements leading to it? / Is the top challenge interesting, compelling, clear; do people want to work toward it?
- **#52 The Puzzle** — What are my game's puzzles? / More or fewer; why? / Which of the ten principles apply to each? / Any incongruous; how to integrate them (Lens #43)?
**Avoid:** Riddle-style "stone walls". / Incongruous puzzles. / Single mandatory bottlenecks.
**Takeaways:** Do run the ten principles on every moment the player stops to plan. Do offer parallel challenges wherever one could block progress.

### Ch 13 — Players Play Games Through an Interface
**Core idea:** The interface is the membrane between player and world; its goal is to make players feel in control, ideally while becoming invisible.
**Frameworks:**
- **Interface data-flow model (six mapping arrows)** — Player ↔ Physical input/output ↔ Virtual interface ↔ World: **1. Physical Input → World**; **2. World → Physical Output** (camera); **3. Physical Input → Virtual Interface**; **4. Virtual Interface → World** (command effect, timing); **5. World → Virtual Interface** (bars, pop-ups, battle menus); **6. Virtual Interface → Physical Output** (layout, color, font).
- **The Loop of Interaction** — Feedback drives the player's next action: judgment, reward, instruction, encouragement, challenge. **Tenth-of-a-second rule:** no response within 0.1 s feels broken.
- **Juiciness / second-order motion** — Motion derived from player action; many rewards at once.
- **Channels of Information** — **Step 1: List and Prioritize Information** (every moment / glance from time to time / only occasionally). **Step 2: List Channels** (screen regions, avatar, sound, music, enemy body). **Step 3: Map Information to Channels** (space by importance; group similar data). **Step 4: Review Use of Dimensions** (number, color, size, font: reinforce one fact, or one fact per dimension).
- **Modes** — A mode is a change in any of the six mappings. **Mode Tip #1: Use as Few Modes as Possible. #2: Avoid Overlapping Modes** (else use different input channels). **#3: Make Different Modes Look as Different as Possible** (change something large on screen, avatar action, on-screen data, camera perspective).
- **Other Interface Tips** — **#1 Steal** (top-down). **#2 Customize** (bottom-up). **#3 Theme Your Interface. #4 Sound Maps to Touch. #5 Balance Options and Simplicity with Layers**. **#6 Use Metaphors. #7 Test, Test, Test!**. **#8 Break the Rules to Help Your Player.**
**Lenses:**
- **#53 Control** — Does the interface do what is expected; if not, why? / Easy or hard to master? / Do players feel strong influence over the outcome; if not, how to change that? / Do they feel powerful; can they feel more so?
- **#54 Physical Interface** — What does the player pick up and touch; can it be more pleasing? / How does it map to world actions; can it be more direct? / Without a custom device, what metaphor maps inputs to the world? / How does it look under the Lens of the Toy? / How does the player see, hear, touch the world; could a physical output device make it more real?
- **#55 Virtual Interface** — What information is needed that is not obvious from the world? / When: always, occasionally, at level end? / How to deliver it without interfering with world interaction? / Which world elements are easier to use via a virtual interface (pop-up menu) than directly? / Which virtual interface suits my physical interface?
- **#56 Transparency** — What are the player's desires; does the interface let them do what they want? / Simple enough to use without thinking after practice? / Intuitive to new players; if not, how to fix; would customizable controls help or hurt? / Does it work in all situations, or confuse in some? / Usable under stress, or do players fumble and miss crucial information; how to improve? / What confuses players, and on which of the six arrows?
- **#57 Feedback** — (every moment) What do players need to know? / Want to know? / What do I want them to feel; what feedback creates it? / What do they want to feel; can they create a situation to feel it? / What is their goal now; what feedback helps?
- **#58 Juiciness** — Is feedback for actions continuous; if not, why? / Do player actions create second-order motion; is it powerful and interesting? / In how many ways do I reward simultaneously; can I find more?
- **#59 Channels and Dimensions** — What data must travel to and from the player? / Which matter most? / What channels are available? / Which suit which data; why? / Which dimensions does each channel have? / How should I use them?
- **#60 Modes** — What modes do I need; why? / Can any be collapsed or combined? / Do any overlap; can they move to different input channels? / How does the player know the mode changed; can it be signalled in more than one way?
**Avoid:** Look-alike modes. / Unacknowledged delay. / Dry interfaces.
**Takeaways:** Do acknowledge every input within 0.1 s even when the effect resolves later. Do run the four channel steps before drawing any HUD.

### Ch 14 — Experiences Can be Judged by Their Interest Curves
**Core idea:** An experience is as good as its event sequence is at holding interest; plot it, compare with observed, then reorder or cut.
**Frameworks:**
- **Interest Curve (A–H)** — (A) entry interest from expectations; do not over-inflate. (B) **the hook**, an early spike that carries the set-up. Back off, then rise through peaks (C, E) and rests (D, F). (G) climax exceeding everything before. (H) resolution, leaving them wanting more. Bad curve: no hook, decline below the **interest threshold** (guest quits), petering out. Cut or bypass flat stretches.
- **Fractal interest curve** — Same shape at three levels: **1. Overall game** (intro, rising levels, major climax); **2. Each level** (new aesthetics/challenges, rising challenges, often a boss battle); **3. Each challenge** (interesting introduction, stepped difficulty).
- **Three interest factors** — **Factor 1: Inherent Interest** (risk over safety, fancy over plain, unusual over ordinary). **Factor 2: Poetry of Presentation. Factor 3: Projection** (empathy and imagination: strangers → friends → self). Games can win on 3 alone because events happen to the player.
- **Building projection** — Empathetic characters; a consistent world (one contradiction taints it past, present, future); multiple ways in.
**Lenses:**
- **#61 The Interest Curve** — How is my interest curve shaped? / Is there a hook? / Does interest rise gradually, punctuated by rest? / Is there a grand finale beating everything else? / What changes would improve it? / Is there fractal structure; should there be? / Do my intuitions match observed interest; what curve do playtesters draw? (With Lens #16: one curve per player type.)
- **#62 Inherent Interest** — What captures interest immediately? / Does the player see or do something never seen or done before? / What base instincts does the game appeal to; can it appeal to more? / What higher instincts; more? / Do dramatic change and its anticipation happen; how to make it more dramatic?
- **#63 Beauty** — What elements make up my game; how can each be more beautiful? / How can elements not beautiful alone be composed poetically? / What does beauty mean in my game's context?
- **#64 Projection** — What can players relate to; what else can I add? / What captures their imagination; what else? / Are there places players have always wanted to visit? / Is the player a character they could imagine being? / Are there characters they would want to meet (or spy on)? / Do they do things they wish they could in real life? / Is there an activity that is hard to stop?
**Avoid:** Weakest act last. / Keeping flat sections for sunk effort.
**Takeaways:** Do draw the curve at campaign, mission and encounter level before building content. Do open with a hook, relax, then escalate to a finale that beats everything earlier.

### Ch 15 — One Kind of Experience Is the Story
**Core idea:** Stories and games are both machines for creating experiences; interactive storytelling is harder than traditional, not fundamentally different.
**Frameworks:**
- **Real World Method 1: The String of Pearls** ("rivers and lakes") — non-interactive story (string), then free play with a fixed goal (pearl), repeat. The player always knows the path is right.
- **Real World Method 2: The Story Machine** — systems generate event sequences worth retelling; more pre-scripting means fewer emergent stories.
- **The Problems (of the branching "dream")** — **#1 Good Stories Have Unity. #2 The Combinatorial Explosion** (10 three-way choices = 88,573 outcomes; 20 = 5,230,176,601; fusing branches empties choices). **#3 Multiple Endings Disappoint** ("Is this the real ending?"; "Must I replay it all?"). **#4 Not Enough Verbs**. **#5 Time Travel Makes Tragedy Obsolete** (retry removes inevitability).
- **Story Tips for Game Designers** — **#1 Goals, Obstacles, and Conflicts** (gameplay challenges = the character's dramatic obstacles). **#2 Provide Simplicity and Transcendence** (simpler world, more powerful player: Medieval, Futuristic, War, Modern). **#3 Consider the Hero's Journey. #4 Put Your Story to Work!** (story is the most pliable element; rewrite it to justify mechanics). **#5 Keep Your Story World Consistent. #6 Make your Story World Accessible** (believable beats accurate). **#7 Use Clichés Judiciously**. **#8 Sometimes a Map Brings a Story to Life.**
- **Vogler's Synopsis of the Hero's Journey** — 1 The Ordinary World; 2 The Call to Adventure; 3 Refusal of the Call; 4 Meeting with the Mentor; 5 Crossing the Threshold; 6 Tests, Allies, Enemies; 7 Approaching the Cave; 8 The Ordeal; 9 The Reward; 10 The Road Back; 11 Resurrection; 12 Returning with the Elixir. A "circuit tester" for a written story, not a starting formula.
**Lenses:**
- **#65 The Story Machine** — How can I add more choices about how to achieve goals? / How can more types of conflict arise? / How can players personalize characters and setting? / Do my rules produce stories with good interest curves? / Who can players tell the story to that will care?
- **#66 The Obstacle** — What is the main character's relationship to the goal; why care? / What obstacles stand between? / Is an antagonist behind them; what is the protagonist–antagonist relationship? / Do obstacles gradually increase in difficulty? / Are they big enough; can they be bigger? / How does the protagonist transform to overcome them?
- **#67 Simplicity and Transcendence** — How is my world simpler than the real one; simpler in other ways? / What transcendent power does the player get; how to give more without removing challenge? / Is the combination contrived, or special wish fulfillment?
- **#68 The Hero's Journey** — Does my story qualify as heroic? / If so, how does it match the Hero's Journey? / Would more archetypical elements improve it? / Does it match so closely it feels hackneyed?
- **#69 The Weirdest Thing** — What is the weirdest thing in my story? / How do I keep it from confusing or alienating the player? / With several weird things, should I remove or coalesce some? / If nothing is weird, is the story still interesting?
- **#70 Story** — Does my game really need a story; why? / Why will players be interested? / How does story support the rest of the tetrad (aesthetics, technology, gameplay); can it do better? / How does the rest support story; can it do better? / How can my story be better?
**Avoid:** Branching trees with fused outcomes. / Multiple endings forcing replays. / Breaking the world's own rules.
**Takeaways:** Do use the string of pearls for an authored story and put story-machine systems inside the pearls. Do align each gameplay challenge with a dramatic obstacle of the protagonist.

### Ch 16 — Story and Game Structures can be Artfully Merged with Indirect Control
**Core idea:** Players need the *feeling* of freedom, not actual freedom. Steer them invisibly so you keep the interest curve and they keep the sense of control.
**Frameworks:**
- **Six methods of Indirect Control** — use whenever tempted to seize control from the player:
  1. **Constraints** — offer a short menu, not an open field; a curated few both prompt a choice and steer it.
  2. **Goals** — players ignore what is irrelevant to a clear goal; sculpt the world around it, skip content nobody will visit.
  3. **Interface** — interface and avatar silently define what players think is possible.
  4. **Visual Design** — players go where the eye goes. Disney's "weenie" = landmark that pulls feet. One red line on a floor routed 90%+ of players, unnoticed.
  5. **Characters** — once players care about an NPC, it directs them.
  6. **Music** — tempo and mood change pace and action without awareness.
- **Collusion** — give AI characters two simultaneous goals: their in-world goal and the designer's (lead the player somewhere interesting, keep tension on curve). Enemy ships attack, then flee toward an unvisited island; the finale comes *to* the player on a clock.
**Lenses:**
- **#71 Freedom** — When do players have freedom of action, and do they feel free then? / When are they constrained, and do they feel constrained? / Where can I let them feel freer? / Where are they overwhelmed by too much freedom?
- **#72 Indirect Control** — Ideally, what do I want players to do? / Can I set constraints to get it? / Goals? / Interface? / Visual design? / In-game characters? / Music or sound? / Another method to coerce ideal behavior without impinging on the feeling of freedom?
- **#73 Collusion** — What do I want the player to experience? / How can the characters help fulfill it without compromising their in-world goals?
**Avoid:** Gluing the player in place. / Enemy AI tuned only for "smart" play, ignoring pacing.
**Takeaways:**
- Do cut choices to a few attractive ones when players stall.
- Do fix pacing through enemy behavior (retreat, lure, timed reinforcement) before scripting the player.

### Ch 17 — Stories and Games Take Place in Worlds
**Core idea:** The real product is a world existing apart from any medium; each game, show or toy is a gateway. Consistent gateways solidify it; contradictory ones destroy it.
**Frameworks:**
- **Transmedia Worlds** (Henry Jenkins) — worlds enterable through many media; the world, not plot or cast, is the appeal.
- **Binocular effect** — a rich depiction seen once (anime, key art) gets mapped onto crude in-game graphics. Use to back simple sprites with strong illustrations.
- **Properties of Transmedia Worlds** — **Powerful** (a personal utopia), **Long Lived**, **Evolve Over Time** (the audience accepts or rejects additions).
- **What Successful Transmedia Worlds Have in Common** — rooted in a single medium; intuitive; a creative individual at their core; facilitate the telling of many stories; make sense through any of their gateways; are about wish fulfillment.
**Lenses:**
- **#74 The World** — How is my world better than the real world? / Can there be multiple gateways to it? How do they differ? How do they support each other? / Is my world centered on a single story, or could many stories happen here?
**Avoid:** Gateways that contradict each other or only make sense together.
**Takeaways:**
- Do define the wish the world fulfills before writing plot.
- Do leave room for stories you will not tell.

### Ch 18 — Worlds Contain Characters
**Core idea:** Game characters skew physical, fantastic and simple; depth must be engineered through function, traits, relationships, status and change.
**Frameworks:**
- **Novel vs. movie vs. game characters** — three gradients: **Mental → Physical**, **Reality → Fantasy**, **Complex → Simple**.
- **Avatars: The Ideal Form / The Blank Slate** — players project into who they wish they were, or into an iconic low-detail character (McCloud: less detail = more projection; detail makes things "other"). Pair an iconic character with a detailed world.
- **Tip #1: List Character Functions** — list the roles the game needs (e.g. Hero, Mentor, Assistant, Tutor, Final Boss, Minions, Three Bosses, Hostage), list imagined characters, map creatively; fold roles together (mentor = final boss).
- **Tip #2: Define and Use Character Traits** — a short trait list per character (contradictions allowed); every line, action and animation shows one, ideally several.
- **Tip #3: Use the Interpersonal Circumplex** — axes hostile/friendly and submissive/dominant; one character at center, others plotted relative to them. Extremes are interesting.
- **Tip #4: Make a Character Web** — write what each character thinks of every other, and why.
- **Tip #5: Use Status** (Johnstone) — status is something you do, relative to who is present. Low: fidgeting, avoiding eye contact, tense, staying unnoticed. High: relaxed, strong eye contact, still head, slow motion, occupying the most important spot. Reversals drive interest.
- **Tip #6: Use the Power of the Voice** — build characters around voice performances, not the reverse.
- **Tip #7: Use the Power of the Face** — cheap eye/eyebrow animation carries emotion; keep a face on screen (portrait as health meter).
- **Tip #8: Powerful Stories Transform Characters** — **character transformation chart**: characters as rows, story sections as columns, mark each change. If the hero cannot change, change sidekick or villain.
- **Tip #9: Avoid the Uncanny Valley** (Mori) — empathy collapses just short of realistic; stay stylized.
**Lenses:**
- **#75 The Avatar** — Is my avatar an ideal form likely to appeal to my players? / Does it have iconic qualities that let a player project themselves into it?
- **#76 Character Function** — What roles do I need filled? / What characters have I already imagined? / Which map well to which roles? / Can any fill more than one role? / Do I need to change characters to fit the roles? / Do I need new characters?
- **#77 Character Traits** — What traits define my character? / How do they manifest in the character's words, actions and appearance?
- **#78 The Interpersonal Circumplex** — Are there gaps in the chart? Why? Would it be better filled? / Are there "extreme characters"? If not, should there be? / Are the character's friends in the same quadrant or different ones? What if that were different?
- **#79 The Character Web** — How, specifically, does each character feel about each of the others? / Are any connections unaccounted for? How can I use them? / Are there too many similar connections? How can they differ more?
- **#80 Status** — What are the relative status levels of my characters? / How can they show appropriate status behaviors? / How are they vying for status? / Where do changes of status happen? / How am I giving the player a chance to express status?
- **#81 Character Transformation** — How does each character change throughout the game? / How am I communicating those changes, and can I do it more clearly or strongly? / Is there enough change? / Are the changes surprising and interesting? / Believable?
**Avoid:** Fixed-type characters. / Characters who behave the same whoever is present.
**Takeaways:**
- Do write the function list before the cast list; merge roles when the cast is too big.
- Do rewrite any line expressing no trait of its speaker.

### Ch 19 — Worlds Contain Spaces
**Core idea:** The primary purpose of architecture is to control a person's experience. Functional space is the skeleton; what counts is how the space feels from inside.
**Frameworks:**
- **Organizing your Game Space** — five types, combinable: **1. Linear**; **2. Grid** (easy to understand, things line up, proportions hold, easy for computers; squares, rectangles, hexagons, triangles); **3. Web** (points joined by paths, several routes; travel meaningful or instant); **4. Points in Space** (wander and return to an oasis, RPG-style; player-defined spaces); **5. Divided Space** (irregular regions like a real map).
- **Landmarks** — every good space has them: they orient and make the space memorable.
- **The quality which has no name** (Christopher Alexander) — alive, whole, comfortable, free, exact, egoless, eternal, free from inner contradictions. Reached by iteration (plant grass, pave the worn paths later).
- **Alexander's Fifteen Properties of Living Structures** — 1 Levels of Scale (telescoping goals); 2 Strong Centers (avatar, goal); 3 Boundaries (territory, rules); 4 Alternating Repetition (level/boss, tense/release); 5 Positive Space (interlocking strategies); 6 Good Shape; 7 Local Symmetries; 8 Deep Interlock and Ambiguity (pieces meaningful only relative to opposing pieces); 9 Contrast; 10 Gradients (challenge curve); 11 Roughness; 12 Echoes (boss resembles minions); 13 The Void (boss in a large hollow space); 14 Simplicity and Inner Calm; 15 Not-Separateness.
- **Real vs. Virtual Architecture** — players store spaces relatively, so impossible layouts go unnoticed. **Know How Big:** one unit = a real measure; scale culprits: eye height, people and doorways, texture scaling. **Third-Person Distortion:** bigger room, slightly bigger furniture, spread out.
**Lenses:**
- **#82 Inner Contradiction** — What is the purpose of my game? / What are the purposes of each subsystem? / Does anything at all contradict these purposes? / If so, how can I change it?
- **#83 The Nameless Quality** — Does my design have a special feeling of life, or do parts feel dead? What would make it more alive? / Which of Alexander's fifteen qualities does it have? / Could it have more? / Where does my design feel like my self?
**Avoid:** Maps of identical or totally dissimilar areas. / Excusing an inner contradiction.
**Takeaways:**
- Do choose a space type per layer (in Zapatro: linear for the run, a fixed table cross for play).
- Do put a landmark in every space (in Zapatro: one signature object per room).

### Ch 20 — The Look and Feel of a World Is Defined by Its Aesthetics
**Core idea:** Aesthetics is a full quadrant of the tetrad: it attracts players, makes the world solid, makes each new sight a reward, and buys tolerance for flaws.
**Frameworks:**
- **Re-point existing lenses at the art** — #1, #2, #4, #9, #10, #11, #15, #16, #17, #40, #42, #43, #45, #48, #49, #54, #55, #59, #63, #64, #67, #72, #74, #75, #80, #82, #83.
- **Concept art as prototype** — involve artists from the start; alternate abstract prototypes and illustrations so art and play grow up together.
- **How Much Is Enough?** — rough sketches usually suffice (trick: one corner fully rendered). **"Distant mountains"** (Tolkien): name places and events never shown so the world feels larger.
- **Use Audio** — better audio made identical graphics rate higher. Pick music at the very start as a tone compass.
- **Balancing Art and Technology** — artists drive, engineers navigate; a technical artist bridges both.
**Lenses:** none new.
**Takeaways:**
- Do pick a reference track early and change features that clash with it.

### Ch 21 — Some Games are Played with Other Players
**Core idea:** Social play is the norm, but multiplayer must earn its cost.
**Frameworks:**
- **Why We Play With Others** — **1. Competition**; **2. Collaboration**; **3. Meeting Up**; **4. Exploring our Friends**; **5. Exploring Ourselves**.
- **4x rule** — online multiplayer costs about four times a comparable single-player game (debugging, balancing).
**Lenses:** none new.
**Takeaways:**
- Do name which of the five reasons a multiplayer mode serves before budgeting it.

### Ch 22 — Other Players Sometimes Form Communities
**Core idea:** Players come for the game and stay for the community, which is designed through conflict, interdependence, shared places and property, expression and events.
**Frameworks:**
- **Four elements of sense of community** — Membership; Influence; Integration and Fulfillment of Needs; Shared Emotional Connection.
- **Why community** — social need; longer "period of contagion"; more hours of play.
- **Ten Tips for Strong Communities** — 1 **Foster Friendships** (ability to talk, someone worth talking to, something worth talking about; phases: Breaking the Ice, Becoming Friends, Staying Friends); 2 **Put Conflict at the Heart** (against players or against the game); 3 **Use Architecture to Shape your Community** (places where the same people keep crossing paths); 4 **Create Community Property**; 5 **Let Players Express Themselves**; 6 **Support Three Levels** — Newbie, Player, Elder (elder games: A More Difficult Game, Governance Privileges, The Joy of Creation, Guild Management, A Chance to Teach); 7 **Force Players to Depend on Each Other** (take something away: heal only others, never yourself); 8 **Manage Your Community**; 9 **Obligation to Others is Powerful**; 10 **Create Community Events**.
- **Systems easiest to grief** — Player vs. Player Combat, Stealing (incl. kill stealing), Trading, Obscenities, Blocking the Way, Loopholes. Remove griefable systems rather than police them.
**Lenses:**
- **#84 Friendship** — What kind of friendships are my players looking for? / How do they break the ice? / Do they have enough chance to talk to each other, and enough to talk about? / When is the moment they become friends? / What tools do I give them to maintain friendships?
- **#85 Expression** — How am I letting players express themselves? / What ways am I forgetting? / Are players proud of their identity? Why or why not?
- **#86 Community** — What conflict is at the heart of my community? / How does architecture shape it? / Does my game support three levels of experience? / Are there community events? / Why do players need each other?
- **#87 Griefing** — What systems in my game are easy to grief? / How can I make my game boring to grief? / Am I ignoring any loopholes?
**Avoid:** Everything soloable. / Last-hit-takes-all rewards.
**Takeaways:**
- Do create roles that cannot sustain themselves when you want players (or the AI partner) to need each other.

### Ch 23 — The Designer Usually Works with a Team
**Core idea:** The secret of successful teamwork is love of the game and its audience. Everyone who touches the game shapes its design, so design together until there is unity.
**Frameworks:**
- **Three Love Problems** — #1 Members incapable of loving any game: remove them. #2 Members in love with a different game than the one being made: help them find something here to love. #3 Members in love with different visions of the same game (most common): align early; when someone silently doesn't buy in, stop and find out why. No decision is final until the team agrees it is final.
- **If You Can't Love the Game, Love the Audience** — find one thing to be proud of → treat the game as a gift for its audience → pretend until real love follows.
- **Designing Together** — yields more ideas, quick weeding of flawed ones, many perspectives, shared ownership. Avoid "over-fleshing": leave ambiguity so implementers own the detail.
- **Team design cycle** — 1. Initial Brainstorming (whole team) 2. Independent Design (core design team) 3. Design Discussion (core team, toward consensus) 4. Design Presentation (to whole team; restarts brainstorming).
- **Nine keys to team communication** — 1. Objectivity (judge ideas by how well they solve the problem, Lens #12; "the spaceship idea", not "my idea") 2. Clarity (deliverables with size, format, date) 3. Persistence (write things down) 4. Comfort 5. Respect ("What if I'm wrong?") 6. Trust (quantity of face-to-face communication) 7. Honesty 8. Privacy (one-on-ones) 9. Unity ("What would it take to bring you in?").
**Lenses:**
- **#88 Love** — Do I love my project? If not, how can I change that? / Does everyone on the team love the project? If not, how can that be changed?
- **#89 The Team** — Is this the right team for this project? Why? / Is the team communicating objectively? / Clearly? / Is the team comfortable with each other? / Is there an air of trust and respect? / Is the team ultimately able to unify around decisions?
**Takeaways:** Do stop the meeting when you sense unspoken disagreement. Do record every design decision where the whole team can check it.

### Ch 24 — The Team Sometimes Communicates Through Documents
**Core idea:** The magic template does not exist. Documents have exactly two purposes, memory and communication, and must grow from what this game needs remembered and communicated.
**Frameworks:**
- **The Purpose of Documents** — Memory (decisions and reasons, so problems are not re-solved) / Communication (a dialog that exposes flaws faster).
- **Types of Game Documents** (six groups, 14) — *Design:* 1. Game Design Overview (few pages) 2. Detailed Design Document (all mechanics and interfaces; usually abandoned mid-project) 3. Story Overview. *Engineering:* 4. Technical Design Document 5. Pipeline Overview (art do's and don'ts) 6. System Limitations. *Art:* 7. Art Bible 8. Concept Art Overview. *Management:* 9. Game Budget 10. Project Schedule (most frequently updated). *Writing:* 11. Story Bible 12. Script (designers check all dialog against gameplay rules) 13. Game Tutorial and Manual. *Players:* 14. Game Walkthrough (player-written).
- **So, Where Do I Start?** — a rough bullet list of ideas; write down every question that arises; record each answer and why; let sections emerge.
**Lenses:**
- **#90 Documentation** — What do we need to remember while making this game? / What needs to be communicated while making this game?
**Takeaways:** Do write only documents that serve memory or communication. Do log open design questions; answering them is the design work.

### Ch 25 — Good Games Are Created Through Playtesting
**Core idea:** A playtest is a prototype of the experience, run to answer specific questions and expose wrong decisions while they can still be fixed.
**Frameworks:**
- **Four types of testing** — Focus Groups / QA Testing (bugs) / Usability Testing (not sufficient for fun) / Playtesting (does the game engender the designed experience).
- **Five key questions: Why, Who, Where, What, How.**
- **Why?** — list specific questions; "Is my game fun?" is not enough. E.g. do players understand how to play; want to replay; feel it is fair; get bored, confused, frustrated; find dominant strategies or loopholes; which parts are most and least fun.
- **Who?** — Developers (too close) / Friends (too kind) / Expert Gamers (risk of overtuning for a hardcore niche) / Tissue Testers (fresh eyes; blind to repeat play). Match testers to questions.
- **Where?** — In your studio / In a playtesting lab / At some public venue / At the playtester's home / On the Internet (quantity over quality).
- **What?** — The First What: things you know you are looking for (cover every Why question). The Second What: things you don't know you are looking for (hold predictions, then investigate every surprise).
- **How?** — be present only if you can stay objective; script the briefing (the tuned briefing becomes the in-game tutorial); watch faces, not the screen; log key events automatically (hits to defeat the villain, most-used weapons); interrupt only for surprising behavior; use think-aloud selectively.
- **Surveys** — pictures / online / labeled five-point scale (Terrible, Pretty bad, So-so, Good, Excellent), not 1 to 10 / few questions / right after play / someone to clarify / note age and gender / not gospel.
- **Interviews** — scripted questions / private first / give permission to criticize / avoid memory tests / don't expect playtesters to be game designers (ask "were any parts boring?") / ask for more than you need (three least favorite parts) / set your ego aside.
**Lenses:**
- **#91 Playtesting** — Why are we doing a playtest? / Who should be there? / Where should we hold it? / What will we look for? / How will we get the information we need?
**Takeaways:** Do write the question list before scheduling a playtest. Do instrument the build to log key events. Do rotate tester types as questions shift from first-time clarity to long-term depth.

### Ch 26 — The Team Builds a Game with Technology
**Core idea:** Technology is the medium of the game and the most volatile tetrad element. Use it to deliver the experience, not for its own sake.
**Frameworks:**
- **Foundational vs. Decorational** — foundational technology makes a new kind of experience possible (cake); decorational only makes an existing one nicer (icing). Ico's ragdoll physics is foundational; a shooter's is decorational. Ask "How can I make this foundational to my game?"
- **The Hype Cycle** (Gartner) — 1. Technology Trigger 2. Peak of Inflated Expectations 3. Trough of Disillusionment 4. Slope of Enlightenment 5. Plateau of Productivity. Use for Immunity, Inoculation, Fundraising.
- **The Innovator's Dilemma** (Christensen) — "not good enough" technology improves until it suddenly disrupts; design for technologies about to break through, if foundational.
- **The Singularity** — accelerating change shrinks the prediction horizon.
- **Look Into Your Crystal Ball** — predict concretely; the value is the scaffolding of certainties and trends.
**Lenses:**
- **#92 Technology** — What technologies will help deliver the experience I want to create? / Am I using them in ways that are foundational or decorational? / If not foundationally, should I be using them at all? / Is this technology as cool as I think it is? / Is there a "disruptive technology" I should consider instead?
- **#93 The Crystal Ball** — What will ____ be like two years from now? Why? / Four years from now? Why? / Ten years from now? Why?
**Takeaways:** Do cut a technology when it is costly and merely decorational.

### Ch 27 — Your Game Will Probably Have a Client
**Core idea:** "Form follows funding." Compromises that delight both you and the client make happy designers.
**Frameworks:**
- **Coping with Bad Suggestions** — 1. agree from fear (disservice) 2. say why it is bad (backfires) 3. understand why (correct). A bad suggestion solves an unstated problem: ask "What problem are you trying to solve?" ("more chrome" meant the cars felt slow).
- **Not That Rock ("Bring Me a Rock")** — when the client doesn't know what they want, ask what it is for, then bring a few options.
- **The Three Layers of Desire** — words, mind, heart.
- **Firenza, 1498** — Michelangelo and Soderini's nose: make clients feel like creative partners without compromising the vision.
**Lenses:**
- **#94 The Client** — What does the client say he wants? / What does the client think she wants? / What does the client really want, deep down in his heart?
**Takeaways:** Do answer an odd request with "why?" before yes or no.

### Ch 28 — The Designer Gives the Client a Pitch
**Core idea:** A pitch is a negotiation of power (the ability to get what you want): know what you want and what they want.
**Frameworks:**
- **The Hierarchy of Ideas** — Idea $0.083 / Cool idea $5 / Really cool idea (shouted) $5 / Good idea (usable) $100 / Good idea in the right place at the right time, sold convincingly $1,000,000.
- **Twelve Tips for a Successful Pitch** — #1 Get in the Door (via contacts) #2 Show You Are Serious (working prototype, proof of thought) #3 Be Organized #4 Be Passionate #5 Assume Their Point of View (no jargon; give "handles", a report, gameplay videos so a fan can re-pitch) #6 Design the Pitch (hook, build, climax; what is unique, why it wins, why it fits them) #7 Know All the Details (design, schedule, financial with realistic minimum and maximum sales, risks with plans) #8 Exude Confidence ("Absolutely") #9 Be Flexible #10 Rehearse (never pitch while you play) #11 Get Them to Own It #12 Follow Up (patiently).
**Lenses:**
- **#95 The Pitch** — Why are you pitching this game to this client? / What will you consider "a successful pitch"? / What's in it for the people you are pitching to? / What do the people you are pitching to need to know about your game?
**Takeaways:** Do write a one-phrase handle for the game. Do keep risks and mitigations ready.

### Ch 29 — The Designer and Client Want the Game to Make a Profit
**Core idea:** Design and money control each other and "the one with the gold makes the rules"; learn enough business to defend features in profit terms.
**Frameworks:**
- **Know Your Business Model** — follow the money. Average $50 retail title: retailer $16, publisher $10, developer $8, platform holder $7, advertising $6, disk and box $3; markdown reserve about $3. Each business model shapes its games.
- **Units Sold** — comparable titles' sales drive estimates.
- **Breakeven** — units needed before the funder recovers the investment.
- **Know the Top Sellers** — hit-driven business; analyze why hits in your market succeeded.
- **Learn the Language** — SKU / COGS / Burn rate / Sold in vs. Sold through (only sold through matters) / NPV (ask "at what discount rate?", usually 4 to 10%) / Christmas (75% of US sales).
**Lenses:**
- **#96 Profit** — Where does the money go in my game's business model? Why? / How much will it cost to produce, market, and distribute this game? Why? / How many units will this game sell? Why do I think that? / How many units need to sell before my game breaks even?
**Takeaways:** Do compute breakeven before promising sales.

### Ch 30 — Games Transform Their Players
**Core idea:** We design experiences, and experiences are the only things that change people.
**Frameworks:**
- **Can Games Be Good For You?** — Emotional Maintenance (vent anger and frustration, cheer up, gain perspective, build confidence, relax) / Connecting / Exercise / Education.
- **Education** — school is a poorly designed game. Obstacles: time constraints, variable pacing, 1965, good educational games are hard to make. Games teach: Facts / Problem Solving / Systems of Relationships (Miller's pyramid: Knows → Knows how → Shows → Does; permission to fail and break the system) / New Insights / Curiosity.
- **Can Games Be Bad For You?** — Violence (concern tracks graphic realism; players see through aesthetics to problem solving) / Addiction (fit game structures into a well-balanced life; "On a sunny day, play outside").
**Lenses:**
- **#97 Transformation** — How can my game change players for the better? / How can my game change players for the worse?
**Takeaways:** Do let players break the system safely so they see why failure happens.

### Ch 31 — Designers Have Certain Responsibilities
**Core idea:** Designers work in obscurity and corporations have no ethical responsibility, so only you can answer for what you create.
**Frameworks:**
- **The Danger of Obscurity** / **Being Accountable** (strangers meeting online: one in a million happens five times at five million players) / **Your Hidden Agenda** (do good in secret, inside games people want) / **The Secret Hidden in Plain Sight** (the medium shapes how the young think) / **The Ring**.
**Lenses:**
- **#98 Responsibility** — Does my game help people? How?
**Takeaways:** Do design safeguards before enabling stranger-to-stranger communication.

### Ch 32 — Each Designer has a Motivation
**Core idea:** Listen to yourself: find your personal theme so conscious and subconscious motivations unite. Time is short.
**Frameworks:**
- **The Deepest Theming** — a known purpose gives the work passion, focus, intensity.
**Lenses:**
- **#99 The Raven** — Is making this game worth my time?
- **#100 Your Secret Purpose** — Why am I doing this?
**Takeaways:** Do write down why this game matters to you before committing to a long project.

### Ch 33 — Goodbye
**Core idea:** Farewell only: keep the map, the ring and the lenses, and use them.

## Scope & limits

- Source: 1st edition (2008), 100 lenses, 33 chapters. Later editions renumber and add lenses.
- Built from text extraction; **all figures are lost** (tetrad diamond, flow channel, interface arrows, interest curves, interpersonal circumplex trait wheel, hype cycle, document flow). They are reconstructed from the surrounding prose.
- Math operators were stripped in extraction; probability formulas, expected-value figures and the $50 revenue split were restored from context.
- Missing from the source PDF: Brainstorming Tips #1–#2 and the start of #3 (one page lost in Ch 6).
- Not captured: per-octant trait vocabulary of the interpersonal circumplex; cells of the Cinderella transformation chart.
- The "Applying it to Zapatro" section and the *Decision rules* table are this project's application of the book, not text from it.
- Private study aid; do not publish.
