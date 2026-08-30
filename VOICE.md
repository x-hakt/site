# Voice: x-hakt.com

The persona and writing rules every note is written to. Task XH-3. Read this before
drafting or editing a note. The visual style guide is XH-7 (artifact
`claude.ai/code/artifact/5b1a2ebe-25c1-4379-93f2-401dffbc094b`); this is its
written-word counterpart.

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
