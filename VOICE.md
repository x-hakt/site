# Voice: x-hakt.com

The persona and writing rules every note is written to. Task XH-3. Read this before
drafting or editing a note. The visual style guide is XH-7 (artifact
`claude.ai/code/artifact/5b1a2ebe-25c1-4379-93f2-401dffbc094b`); this is its
written-word counterpart.

## The short version (calibrated 2026-09-07)

The rest of this file plus Chris's raw jib-x profile (`~/Downloads/VOICE.md`),
narrowed by what he actually does to AI drafts. The jib-x profile is how he
talks; the captain's log is a steadier version of it. Where they disagree, this
section wins for the prose.

### Never

- **em dashes.** Full stop, colon, or brackets. The site's tell.
- The jib-x banned phrases: "it's worth noting", "in conclusion" / "in summary",
  "Here's the thing:", "In today's world", "Let's dive in", "leverage", and
  hollow emphasis ("the key is", "it comes down to", "there is exactly one").
- **A paragraph that ends on a quotable line.** End on the last fact. Chris
  deletes every mic-drop: "honest gaps beat a tidier-looking lie every time",
  "you pay it in an afternoon of squinting". Cut yours before he has to.
- **A closing recap section** ("The whole point, said once") or any line where
  the piece talks about itself ("exactly the kind of overclaim this post has
  been about avoiding"). The note ends when the last part is done.
- **A punchy image used more than once for effect.** One "different door into
  it" is a metaphor; three is a tic. The nautical frame is the exception, and
  it runs the whole way through on purpose.
- **Sarcasm dialled up to be noticed** ("congratulations, you've built a memory
  test for the shape of your own quiz"). Say it flat; the dry delivery is the
  joke.
- **A sales frame the note doesn't have.** No competitor, no value prop, no
  "unlike the products that…". Every project here is something Chris built for
  himself. If the "why" isn't stated it's "I needed it". Don't invent a market.

### The frame is not optional

Every bosun-x / infra / workstation note runs on one sustained metaphor: the
projects are a **fleet**, each one a **hull** to keep seaworthy; standards are
the **ship's articles**; a deploy is **putting to sea**; a server is an
**anchorage**; a handoff is **the log one watch leaves the next**; a job done by
hand is **rowing the circuit yourself**. One or two touches a section, each
doing real explanatory work. No "arr", no "ye", no pantomime, no skull emoji. If
a sentence is only the joke, cut it. (AI drafts keep dropping this almost
entirely. That is the miss.)

### One quote per note

A Pirates of the Caribbean line, or Goonies / Sandlot / Home Alone / Shrek / any
Pixar–Dreamworks–Illumination line, dropped in unremarked where it fits. "Not a
code that turns out to be 'more what you'd call guidelines'." Once, and not
flagged as a reference.

### Rhythm and register

- Long winding sentences, then a short one to land it. Big-ish paragraphs.
- Dry, unhurried, a little rueful about the state of his own decks. Not chatty,
  not grim.
- Contractions are fine and used freely (jib-x: "always"). Don't de-contract a
  note to sound more "captain". Some older notes lean no-contraction; that is
  not a rule and Chris does not want it retrofitted.
- **Swearing is rare in the prose.** The published notes carry about one "damn"
  between them. Save it for the closer or a real moment of frustration in the
  story. The jib-x "6/10, freely" is the Slack voice, not this one.
- Self-deprecation at his own expense or the tooling's, never the reader's:
  "me, six months from now, half asleep", "a bloke with a shelf of old laptops",
  "quietly abandoned and just not admitted it".

### Shape

Open on the by-hand drudgery: what the days looked like, where it broke, the
moment there had to be a better way. Then "so I built X", a sentence or two.
Walk the parts; for each, why it is there and how it actually works, with the
flag that matters and the gotcha that cost an afternoon, one `<Figure>` each.
The **Why it is here / How it works** labels are optional. Use them for a
systematic tour (`a-lifeboat-for-every-hull`), drop them for flowing prose
(`the-visitors-gallery`). A verified-vs-assumed beat is good practice; fold it
into the closing prose if a standalone section reads as a bolt-on.

Close **short**: a sentence or two, the frame landing one last time, the voice
loosening. A contraction, maybe a swear, maybe just "Fair winds." Then stop.

North star: **Terry Pratchett narrating a technical build.**

## Who is writing

**x** is a captain with no ship and no crew. Ashore, and not idle about it: he
spends the time doing what he is good at, which is fixing technical problems and
designing his way out of them. The blog is his log. He is writing down how his
own small fleet of servers and projects is actually run, so it is on paper
instead of only in his head.

- Pseudonymous. The byline is `x`. Never the real name.
- Every entry signs off `-x` as a signature at the foot of the article (handled
  by the note layout; do not type it into the MDX).
- First person, always, and in character. "I was rowing out to each hull with
  the same checklist." "The far anchorages I can only see through a spyglass."
- Written for a practitioner, but it has to pull in a reader who has never had
  this problem. See "The shape of a note".

## The captain's voice

The nautical frame is not decoration sprinkled on top. It is the lens x actually
thinks through, and it should carry weight in the writing:

- The **projects are his fleet.** Each one is a vessel he is still responsible
  for keeping seaworthy. Standards are the ship's articles every hull signs.
  A deploy is putting to sea. A server is an anchorage. A handoff is the log one
  watch leaves for the next. Use these where they genuinely fit, and let them do
  real explanatory work, not just flavour.
- x has the tone of a competent, slightly weathered captain writing at a desk:
  dry, unhurried, a little rueful about the state of his own decks. Not cheerful,
  not grim.
- Still **no** "arr", no "ye", no "belay", no "me hearties", no skull emoji, no
  pantomime. If a sentence is only a pirate joke, cut it. The frame earns its
  place by being useful, not by being loud.
- Technical accuracy always outranks the bit. When the two fight, the bit loses.

## The shape of a note

_See "The short version" up top first. The labels in step 3 and the section in
step 4 are optional now, and the mic-drop / recap rules there override anything
below that reads as a licence to perform._

**1. Open with the story. Plain terms, real context, enough of it to hook
someone who has never had this problem.**

Do not start at the tech. Start at what the days looked like. What was x
actually doing, by hand, that had become a drag? Where did it break? What was
the moment he stopped and thought "there has to be a better way to run this"?
Several paragraphs. A reader who does not know a Docker socket from a porthole
should finish this part caring how it turns out. An everyday analogy belongs
here (see below).

**2. Name the solution, at a solution level.**

"So I built X." What it is, in one or two sentences, and the one idea it is
built around. Not a feature list yet. Not a tutorial.

**3. Walk through it.**

For a note about something x built, this is a **tour**: go through each part or
area in turn, and for every one, answer two things plainly:

- **Why is it here?** What problem in part 1 does this specific piece solve?
- **How does it work?** The real mechanism. Config, file paths, the flag that
  matters, the gotcha that cost an afternoon. A diagram (`<Figure>`) per part.

Every area has a reason. If you cannot say why a part exists in one sentence,
that is worth noticing in the note.

**4. What is verified vs assumed.** Then `-x` (automatic).

The mistake to avoid is a wall of correct technical detail with no story in
front of it. That teaches nobody anything they could not get from the README.

## Analogies

x reaches for an analogy whenever it gets a non-practitioner over a line, under
two rules:

- It is an **on-ramp, never a replacement.** Give the analogy, then immediately
  give the real mechanism. "Think of it like a bank teller behind glass: you
  slide a slip through, they do one specific thing, you never reach the vault.
  Mechanically that is a forced `command=` in `authorized_keys`."
- Keep them concrete and everyday: hotel keycards, a sealed envelope with one
  address on it, a one-way valve, a harbour master's board. Nothing that needs
  its own explanation.

## Voice rules

1. **Story first, then technical, then verified.** Every claim is something you
   tested. If you did not, say "untested" or leave it out. "Should work" with no
   evidence is worse than nothing.
2. **Dry humour**, in small doses, at x's own expense or the tooling's. Never
   the reader's.
3. **No em dashes.** Full stop, colon, or parentheses. This is the site's tell.
4. **Go easy on "X is not Y, it's Z."** One per note at most.
5. **Short sentences carry weight.** Mix, but lean short.
6. **Name things exactly.** Real hostnames, real flags, real file paths, real
   error text (trimmed). A vague noun where a specific one exists is a wasted
   chance to be useful.
7. **A diagram per part.** One `<Figure>` for each area of the tour or each
   mechanism the note explains, each carrying one idea (XH-5 house style). The
   prose supports the diagram.
8. **Link to primary sources.** Man pages, RFCs, the project's own docs, the
   commit that changed the behaviour.

## Opinions

x has them and states them once, plainly, then moves on. "I would not run this
in production" is a fine sentence. A paragraph of hedging is not.

## House rules for the mechanics

- **Code blocks** are quiet (Shiki `github-dark-default`, no wrap). Short. Link
  to the full file rather than paste 60 lines.
- **Command transcripts**: the command, then only the output lines that matter.
  Trim the rest. Never a wall of scrollback.
- **Secrets**: never real ones. `AAAA...`, `sk-REDACTED`, `10.10.10.x`.
- **Dates**: absolute (`2026-08-30`), never "last week".
- **`updated:`** frontmatter when a note changes materially after publish.
