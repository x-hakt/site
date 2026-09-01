/* The voice-profile questionnaire (IDEA-11 / XH-19). Edit the questions here —
   the page renders the form and the VOICE.md output straight from this file.

   The two sections that carry the most weight for an AI trying to match a voice
   are "the tells" (what a bad imitation gets wrong) and the contrastive pairs
   at the end (a draft the AI wrote + your rewrite of it). */

export interface Question {
  id: string;
  label: string;
  hint?: string;
  rows?: number;
  placeholder?: string;
}

export interface Section {
  id: string;
  title: string;
  intro: string;
  questions: Question[];
}

export const sections: Section[] = [
  {
    id: 'tells',
    title: 'The tells',
    intro:
      'What a bad imitation of you gets wrong. This section does the most work — a model can apply a prohibition far more reliably than it can infer one.',
    questions: [
      {
        id: 'tells-aiish',
        label: 'Paste 2–3 sentences of AI writing that instantly read as “not you.” What exactly gives it away?',
        rows: 5,
      },
      {
        id: 'tells-neverwords',
        label: 'Words and phrases you never use.',
        hint: 'e.g. “delve”, “boasts”, “in today’s fast-paced world”, “it’s worth noting”.',
        rows: 3,
      },
      {
        id: 'tells-nevershapes',
        label: 'Sentence shapes you avoid.',
        hint: 'e.g. opening with “By doing X, you can Y”; “Here’s the thing:”; a rhetorical question as a heading; the rule-of-three triad.',
        rows: 3,
      },
      {
        id: 'tells-punctuation',
        label: 'Punctuation you never use, and punctuation you lean on.',
        hint: 'em dashes? semicolons? ellipses? exclamation marks — how often?',
        rows: 2,
      },
      {
        id: 'tells-overdo',
        label: 'When an AI tries to sound like you, what does it overdo?',
        rows: 3,
      },
    ],
  },
  {
    id: 'tone',
    title: 'Emphasis & tone',
    intro: 'How you land a point, push back, or show you care — without sounding like marketing.',
    questions: [
      {
        id: 'tone-emphasis',
        label: 'How do you emphasise a point?',
        hint: 'caps, italics, bold, repetition, a short sentence after a long one, a well-placed swear.',
        rows: 2,
      },
      { id: 'tone-hedge', label: 'How do you hedge when you’re not sure? Give a real phrase you’d use.', rows: 2 },
      { id: 'tone-disagree', label: 'How do you disagree or decline? Paste a real example if you can.', rows: 3 },
      { id: 'tone-enthusiasm', label: 'How do you show enthusiasm without sounding like a press release?', rows: 2 },
      { id: 'tone-swearing', label: 'Do you swear in writing? Which words, in which contexts, never where?', rows: 2 },
      { id: 'tone-humour', label: 'How does humour show up — dry aside, self-deprecation, none in this context?', rows: 2 },
    ],
  },
  {
    id: 'rhythm',
    title: 'Rhythm & structure',
    intro: 'The shape of the writing on the page.',
    questions: [
      {
        id: 'rhythm-sentence',
        label: 'Typical sentence length — short and punchy, long and winding, deliberately mixed?',
        rows: 2,
      },
      { id: 'rhythm-paragraph', label: 'Paragraph length — one-liners, three or four sentences, big blocks?', rows: 2 },
      { id: 'rhythm-structure', label: 'Headings and lists, or flowing prose?', rows: 2 },
      { id: 'rhythm-asides', label: 'Parentheticals and asides — lean on them, or avoid them?', rows: 2 },
      {
        id: 'rhythm-open',
        label: 'How do you open a piece?',
        hint: 'cold, with a story, with the conclusion first, with a provocation?',
        rows: 2,
      },
      {
        id: 'rhythm-close',
        label: 'How do you end one? Any ending you’d never use?',
        hint: 'callback, hard stop, trailing off, a call to action you’d never write.',
        rows: 2,
      },
    ],
  },
  {
    id: 'vocab',
    title: 'Vocabulary & register',
    intro: 'Word choice, formality, and the tics a friend would recognise.',
    questions: [
      { id: 'vocab-register', label: 'Formal ↔ casual — where do you sit, and does it move by channel?', rows: 2 },
      { id: 'vocab-jargon', label: 'Jargon — use it freely, define on first use, or avoid it?', rows: 2 },
      { id: 'vocab-analogy', label: 'Analogies and metaphors — how often, what kind? Any you reuse?', rows: 2 },
      { id: 'vocab-contractions', label: 'Contractions — always, never, depends?', rows: 1 },
      {
        id: 'vocab-person',
        label: 'First person (“I” / “we” / avoid) and second person (address the reader as “you” or not)?',
        rows: 2,
      },
      { id: 'vocab-tics', label: 'Signature words or verbal tics a friend would recognise as yours.', rows: 2 },
    ],
  },
  {
    id: 'channels',
    title: 'Per-channel intent',
    intro:
      'One core voice, with adjustments per place. Fill in only the channels you write for. One line each is fine.',
    questions: [
      { id: 'ch-blog', label: 'Blog / long-form: how should you sound, and what’s the goal?', rows: 2 },
      { id: 'ch-linkedin', label: 'LinkedIn / public posts: how should you sound? What would be embarrassing here?', rows: 2 },
      { id: 'ch-chat', label: 'Slack / DMs: how terse, how casual?', rows: 2 },
      { id: 'ch-email', label: 'Client / work email: how formal, how warm?', rows: 2 },
      { id: 'ch-commits', label: 'Commit messages / code review: house style?', rows: 2 },
    ],
  },
  {
    id: 'samples',
    title: 'Samples & pairs',
    intro:
      'Real writing beats self-report. The contrastive pairs — an AI draft next to your rewrite — are the single highest-signal thing you can give a model.',
    questions: [
      {
        id: 'samples-good',
        label: 'Paste 3–8 pieces you’d point to as “this sounds like me.”',
        hint: 'Tag each with the channel and how carefully it was edited (dashed off / normal / polished).',
        rows: 12,
      },
      {
        id: 'samples-pairs',
        label: 'Paste 2+ pairs: an AI draft, then your rewrite of it.',
        hint: 'Label them “DRAFT:” and “MINE:”. This is weighted highest.',
        rows: 12,
      },
      { id: 'samples-admire', label: 'One writer you admire, and why. (Helps triangulate.)', rows: 2 },
      { id: 'samples-missed', label: 'Anything the questions above missed about how you write?', rows: 3 },
    ],
  },
];

export const questionCount = sections.reduce((n, s) => n + s.questions.length, 0);
