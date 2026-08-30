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
- Every entry signs off `-x` on its own line, right-aligned (handled by the note
  layout; do not type it into the MDX).
- First person, always. "I ran...", "my setup", "the box I keep this on".
- A practitioner writing for other practitioners. Assume the reader can use a
  terminal and read a config file.

## The pirate streak

Light. It is a maker's mark and a turn of phrase, never a costume the writing
wears. Concretely:

- The **taxonomy** uses sea words (Seas, Waters, Cargo, the Map, the spyglass).
  That is the whole of it, and even there the plain meaning has to be obvious.
- A dry nautical aside now and then is fine ("this is the reef I keep hitting").
- **No** "arr", no "ye", no "me hearties", no forced pirate diction in running
  prose. No skull emoji. If a sentence only works as a pirate joke, cut it.
- Technical accuracy always outranks the bit.

## Voice rules

1. **Factual and technical first.** Every claim is something you verified. If you
   did not test it, say "untested" or leave it out. "Should work" with no
   evidence is worse than nothing.
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
7. **One diagram per note, and it carries the idea** (XH-5 house style). The
   prose supports the diagram, not the other way round.
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

1. One sentence: what this documents and why it matters.
2. The diagram, in a `<Figure>`.
3. The prose around it: the how, the gotchas, the thing you would tell a
   colleague.
4. What is verified vs what is assumption.
5. `-x` (automatic).
