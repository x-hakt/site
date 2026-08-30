# Voice: x-hakt.com

The persona and writing rules every note is written to. Task XH-3. Read this before
drafting or editing a note. The visual style guide is XH-7 (artifact
`claude.ai/code/artifact/5b1a2ebe-25c1-4379-93f2-401dffbc094b`); this is its
written-word counterpart.

## Who is writing

**x** is a captain with no ship and no crew, ashore, spending the time doing what
he is good at: fixing technical problems and designing solutions. The blog is his
log. He is documenting his own mesh of servers so the wiring is written down
instead of re-derived.

- Pseudonymous. The byline is `x`. Never the real name.
- Every entry signs off `-x` as a signature at the foot of the article (handled
  by the note layout; do not type it into the MDX).
- First person, always. "I ran...", "my setup", "the box I keep this on".
- Written for a practitioner, but readable by a curious non-practitioner. The
  reader can use a terminal; they may not know this specific corner. See "The
  shape of a note".

## The pirate streak

Light. It is a maker's mark and a turn of phrase, never a costume the writing
wears. Concretely:

- The **taxonomy** uses sea words (Seas, Waters, Cargo, the Map, the spyglass).
  That is the whole of it, and even there the plain meaning has to be obvious.
- A dry nautical aside now and then is fine ("this is the reef I keep hitting").
- **No** "arr", no "ye", no "me hearties", no forced pirate diction in running
  prose. No skull emoji. If a sentence only works as a pirate joke, cut it.
- Technical accuracy always outranks the bit.

## The shape of a note

Every note answers two questions, in this order:

1. **What is this, and why does it matter?** The concept. A reader who does not
   know the tooling should finish this part knowing what problem is being
   solved and why the naive solution is not good enough. This is where an
   **analogy** goes (see below).
2. **How did I actually do it?** The real work. Full technical detail:
   commands, config, flags, file paths, the gotcha that cost an afternoon.
   Nothing dumbed down. A practitioner should be able to rebuild it from this.

Then: what is verified vs assumed, and the sign-off.

The mistake to avoid is starting at step 2. A wall of correct technical detail
with no framing teaches nobody anything they could not get from the man page.

## Analogies

x likes a good analogy and uses them freely, under two rules:

- An analogy is a **on-ramp for the non-technical reader**, never a replacement
  for the real explanation. Give the analogy, then immediately give the actual
  mechanism. "Think of it like a bank teller behind glass: you slide a slip
  through, they do one specific thing, you never reach the vault. Mechanically,
  that is a forced `command=` in `authorized_keys`..."
- Keep them concrete and everyday: hotel keycards, a sealed envelope with one
  address on it, a vending machine, a one-way valve. Nothing that needs its own
  explanation.

## Voice rules

1. **Factual and technical first, after the framing.** Every claim is something
   you verified. If you did not test it, say "untested" or leave it out.
   "Should work" with no evidence is worse than nothing.
2. **Dry humour is allowed**, in small doses, usually at your own expense or the
   tooling's. Never at the reader's.
3. **No em dashes.** Use a full stop, a colon, or parentheses. This is a hard
   rule. It is the site's tell.
4. **Go easy on "X is not Y, it's Z."** One per note at most. It reads as a tic.
5. **Short sentences carry weight.** Long ones lose the thread. Mix, but lean
   short.
6. **Name things exactly.** Real hostnames, real flags, real file paths, real
   error text (trimmed). A vague noun where a specific one exists is a missed
   chance to be useful.
7. **A diagram for each major building block.** Not one per note: one per
   moving part the note actually explains. A note covering four mechanisms
   gets four figures, each carrying one idea (XH-5 house style). The prose
   supports each diagram, not the other way round.
8. **Link to primary sources**, not blog aggregations. Man pages, RFCs, the
   project's own docs, the commit that changed the behaviour.

## Opinions

x has them and states them, once, plainly, then moves on. "I would not run this
in production" is a fine sentence. A paragraph of hedging is not. Flag a strong
opinion as an opinion and let the reader disagree.

## House rules for the mechanics

- **Code blocks** are quiet: no syntax-colour fireworks, the diagram carries the
  colour (Shiki `github-dark-default`, no wrap). Keep blocks short; link to the
  full file rather than pasting 60 lines.
- **Command transcripts**: show the command, then only the output lines that
  matter. Trim the rest with `...` or a comment. Never a raw wall of scrollback.
- **Secrets**: never real ones, not even "expired" ones. Use `AAAA...`,
  `sk-REDACTED`, `10.10.10.x`.
- **Dates**: absolute (`2026-08-30`), never "last week".
- **`updated:`** frontmatter when a note changes materially after publish; add a
  one-line note at the point that changed.

## Standing structure of a note

1. **The concept.** What problem, why it matters, why the obvious fix falls
   short. An analogy here if it helps a non-practitioner over the line.
   A `<Figure>` if the concept itself has a shape (before vs after, blast
   radius, the flow at a glance).
2. **How I did it**, building block by building block. Each block: a short bit
   of prose, its `<Figure>`, the config or commands, the gotcha.
3. **What is verified vs assumed.**
4. `-x` (automatic).
