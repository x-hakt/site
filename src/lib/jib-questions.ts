/* The jib-x questionnaire (IDEA-11 / XH-19). "I like the cut of your jib" — the
   idiom for recognising someone's characteristic style from a distance.

   Most of it is one tap or a slider. The two highest-signal parts are the
   rewrite cards (an AI sentence you fix) and the samples at the end.
   Edit the questions here; the page renders the form and the output from this. */

export type Question =
  | {
      kind: 'rewrite';
      id: string;
      label: string;
      /** the AI-ish sentence shown; the answerer rewrites it in their voice */
      given: string;
    }
  | {
      kind: 'choice';
      id: string;
      label: string;
      options: string[];
      /** allow more than one */
      multi?: boolean;
      /** show a free-text "something else" field */
      other?: boolean;
    }
  | {
      kind: 'scale';
      id: string;
      label: string;
      /** label under the low end (0) and the high end (10) */
      low: string;
      high: string;
    }
  | {
      kind: 'tags';
      id: string;
      label: string;
      /** chips the answerer taps to select */
      options: string[];
    }
  | {
      kind: 'text';
      id: string;
      label: string;
      hint?: string;
      rows?: number;
      placeholder?: string;
    };

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
      'What a bad imitation gets wrong. A model can follow a "never do this" far more reliably than it can guess one, so this section does the most work.',
    questions: [
      {
        kind: 'tags',
        id: 'never',
        label: 'Tap anything you would never write.',
        options: [
          'em dashes —',
          'semicolons',
          '“it’s worth noting”',
          '“in conclusion” / “in summary”',
          'rule-of-three lists',
          'a rhetorical question as a heading',
          '“not X, but Y”',
          '“Here’s the thing:”',
          'exclamation marks',
          'emoji',
          '“delve” / “leverage” / “utilise”',
          'opening with “Having done X, …”',
          '“In today’s world…”',
          '“Let’s dive in”',
        ],
      },
      {
        kind: 'rewrite',
        id: 'rw-corporate',
        label: 'Rewrite this the way you’d actually say it.',
        given:
          'In today’s fast-paced digital landscape, leveraging the right tools is essential for driving success.',
      },
      {
        kind: 'rewrite',
        id: 'rw-chirpy',
        label: 'And this one.',
        given: 'Let’s dive into how this works! 🚀 Trust me, it’s a game-changer.',
      },
      {
        kind: 'rewrite',
        id: 'rw-hedged',
        label: 'One more — this is over-hedged. Fix it.',
        given:
          'It could perhaps be argued that this might, in certain situations, represent a potential issue worth considering.',
      },
      {
        kind: 'text',
        id: 'overdo',
        label: 'When an AI tries to sound like you, what does it overdo?',
        rows: 2,
      },
    ],
  },
  {
    id: 'tone',
    title: 'Emphasis & tone',
    intro: 'How you land a point, push back, or show you care.',
    questions: [
      {
        kind: 'choice',
        id: 'emphasis',
        label: 'How do you emphasise a point?',
        multi: true,
        other: true,
        options: [
          'a short sentence on its own',
          'ALL CAPS on one word',
          '*italics*',
          '**bold**',
          'repeating the key word',
          'an aside in parentheses',
          'a well-placed swear',
        ],
      },
      {
        kind: 'choice',
        id: 'hedge',
        label: 'When you’re not sure, you write…',
        other: true,
        options: [
          '“I think…”',
          '“probably”',
          '“my guess is”',
          '“I might be wrong, but”',
          'nothing — I state it plainly and correct later',
        ],
      },
      {
        kind: 'choice',
        id: 'disagree',
        label: 'Pushing back on someone, you’d say…',
        other: true,
        options: [
          '“I don’t think that’s right.”',
          '“Hard disagree.”',
          '“Hmm — I’d go the other way.”',
          'the reason first, then the disagreement',
          '“Not sure about that one.”',
        ],
      },
      { kind: 'scale', id: 'swearing', label: 'Swearing in writing', low: 'never', high: 'freely, it’s how I talk' },
      {
        kind: 'choice',
        id: 'humour',
        label: 'Humour shows up as…',
        multi: true,
        other: true,
        options: ['dry one-liners', 'self-deprecation', 'absurd overstatement', 'none in work writing'],
      },
    ],
  },
  {
    id: 'rhythm',
    title: 'Rhythm & structure',
    intro: 'The shape of the writing on the page.',
    questions: [
      { kind: 'scale', id: 'sentence-len', label: 'Your sentences run…', low: 'short and clipped', high: 'long and winding' },
      {
        kind: 'choice',
        id: 'variety',
        label: 'Sentence variety',
        options: [
          'deliberately mixed — long, then a short one to land it',
          'mostly one length',
          'short throughout',
        ],
      },
      { kind: 'scale', id: 'para-len', label: 'Your paragraphs are…', low: 'one or two lines', high: 'big blocks' },
      {
        kind: 'choice',
        id: 'structure',
        label: 'You reach for…',
        options: ['headings and lists', 'flowing prose', 'prose with the occasional list'],
      },
      {
        kind: 'choice',
        id: 'open',
        label: 'You open a piece with…',
        other: true,
        options: [
          'the conclusion first',
          'a short scene or story',
          'the problem, stated plainly',
          'a provocation or hot take',
          'context and background',
        ],
      },
      {
        kind: 'choice',
        id: 'close',
        label: 'You end with…',
        other: true,
        options: [
          'a callback to the opening',
          'a hard stop, mid-thought',
          'a short summary',
          'a wry aside',
          'what you’d do next',
        ],
      },
      {
        kind: 'rewrite',
        id: 'rw-open',
        label: 'Rewrite this opener as you’d actually start.',
        given:
          'Have you ever wondered how X works? In this post, we’ll explore everything you need to know.',
      },
    ],
  },
  {
    id: 'vocab',
    title: 'Vocabulary & register',
    intro: 'Word choice, formality, and the tics a friend would recognise.',
    questions: [
      { kind: 'scale', id: 'register', label: 'Default register', low: 'texting a friend', high: 'a legal document' },
      {
        kind: 'choice',
        id: 'register-shift',
        label: 'Where do you get more formal than that?',
        multi: true,
        options: ['client / work email', 'LinkedIn or public posts', 'long-form writing', 'it doesn’t really shift'],
      },
      {
        kind: 'choice',
        id: 'jargon',
        label: 'Technical jargon',
        options: ['use it freely', 'define it on first use', 'avoid it where I can'],
      },
      { kind: 'scale', id: 'analogy', label: 'Analogies and metaphors', low: 'never, just say it', high: 'constantly' },
      { kind: 'choice', id: 'contractions', label: 'Contractions (isn’t, we’ll)', options: ['always', 'never', 'depends on the channel'] },
      {
        kind: 'choice',
        id: 'person',
        label: 'Person',
        multi: true,
        options: ['“I”', '“we”', 'address the reader as “you”', 'avoid first person', 'avoid “you”'],
      },
      {
        kind: 'text',
        id: 'tics',
        label: 'Words or phrases a friend would recognise as yours.',
        rows: 2,
      },
    ],
  },
  {
    id: 'channels',
    title: 'By channel',
    intro: 'One core voice, with a few adjustments.',
    questions: [
      {
        kind: 'text',
        id: 'channel-diffs',
        label: 'Any channel where you sound noticeably different, and how?',
        hint: 'e.g. “Slack: no capitals, no full stops. Client email: warmer, more hedged.”',
        rows: 3,
      },
    ],
  },
  {
    id: 'samples',
    title: 'Samples',
    intro:
      'Real writing beats every answer above. The pair — an AI draft next to your rewrite — is the single most useful thing you can give a model.',
    questions: [
      {
        kind: 'text',
        id: 'samples-good',
        label: 'Paste 2–4 short things you’ve written that sound like you.',
        hint: 'A Slack message, a paragraph from something you’re proud of, a blunt email. Note the channel for each.',
        rows: 10,
      },
      {
        kind: 'text',
        id: 'samples-pairs',
        label: 'Optional but gold: an AI draft, then your rewrite of it.',
        hint: 'Label them DRAFT: and MINE:',
        rows: 10,
      },
      { kind: 'text', id: 'admire', label: 'A writer whose style you’d nod along to.', rows: 1 },
      { kind: 'text', id: 'missed', label: 'Anything the questions missed?', rows: 2 },
    ],
  },
];

export const questionCount = sections.reduce((n, s) => n + s.questions.length, 0);
