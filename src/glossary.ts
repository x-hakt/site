/*
  A small glossary of the terms that turn up in the notes. Rendered inline by
  <Term k="...">, which shows the definition on hover / tap / focus. Kept plain:
  the audience is someone who has decided to try this and keeps hitting words
  they don't know. One or two sentences, no jargon inside the jargon.

  Later this can back a /glossary page and cross-note linking. For now it just
  feeds the component.
*/
export interface GlossaryEntry {
  /** canonical display term (used when <Term> has no child text) */
  term: string;
  /** the hover definition — plain, 1–3 sentences */
  short: string;
}

export const glossary: Record<string, GlossaryEntry> = {
  agent: {
    term: 'coding agent',
    short:
      'An AI you give a task and some tools, and it edits files, runs commands and iterates on its own until the task is done. Claude Code and Codex are the two I use.',
  },
  terminal: {
    term: 'terminal',
    short:
      'The black window where you type commands instead of clicking. Also called a shell or a command line. Almost everything here happens in one.',
  },
  shell: {
    term: 'shell',
    short:
      'The program inside the terminal that reads your commands and runs them. bash and zsh are the common ones; you rarely think about which.',
  },
  distro: {
    term: 'Linux distro',
    short:
      'A packaged-up version of Linux — the kernel plus a set of default tools and a way to install more. Ubuntu, Arch, Debian, Fedora are all distros. Pick one and move on.',
  },
  wsl: {
    term: 'WSL',
    short:
      'Windows Subsystem for Linux. It runs a real Linux distro inside Windows, so you get a proper Linux terminal without leaving your Windows machine or dual-booting.',
  },
  omarchy: {
    term: 'Omarchy',
    short:
      'A pre-configured Arch Linux setup (the Hyprland tiling desktop, sensible defaults) so you get a working keyboard-driven Linux without assembling it yourself. What I run on my laptop.',
  },
  ssh: {
    term: 'SSH',
    short:
      'The standard way to log into another machine over the network and run commands on it as if you were sitting there. "ssh caspar" opens a shell on the machine called caspar.',
  },
  'ssh-key': {
    term: 'SSH key',
    short:
      'A pair of files — one secret, one public — that let you log in over SSH without a password. You put the public half on the machine you want to reach; the secret half stays on your laptop.',
  },
  docker: {
    term: 'Docker',
    short:
      'A tool that packages an app together with everything it needs to run into a "container", so it runs the same on any machine and does not collide with anything else installed.',
  },
  container: {
    term: 'container',
    short:
      'One running, sealed-off copy of an app and its dependencies. You can start, stop and throw them away without touching the machine underneath.',
  },
  compose: {
    term: 'Docker Compose',
    short:
      'A file (docker-compose.yml) that describes all the containers a project needs — the web app, its database, a cache — and one command to start or stop the lot together.',
  },
  image: {
    term: 'image',
    short:
      'The frozen template a container is started from. Build an image once; run as many containers from it as you like.',
  },
  postgres: {
    term: 'Postgres',
    short:
      'PostgreSQL — a widely used database. If a project stores accounts, orders, posts, anything structured, it is probably in a Postgres container.',
  },
  redis: {
    term: 'Redis',
    short:
      'A fast in-memory store apps use for caching, sessions and queues. Small, common, and gone if the container restarts unless you tell it otherwise.',
  },
  'reverse-proxy': {
    term: 'reverse proxy',
    short:
      'The doorman in front of your containers. One program takes every incoming web request, terminates HTTPS, and routes each domain to the right container. Traefik and Caddy are the usual picks.',
  },
  vps: {
    term: 'VPS',
    short:
      'Virtual Private Server — a slice of a machine you rent in a data centre, with its own public IP address. A few dollars a month gets you enough to run a small production app.',
  },
  nas: {
    term: 'NAS',
    short:
      'Network-Attached Storage — a box of hard drives on your home network that other machines can write to. Or, honestly, any spare drive you copy backups onto.',
  },
  git: {
    term: 'git',
    short:
      'The tool that tracks every change to your code and lets you go back to any earlier version. The history lives in a hidden .git folder inside the project.',
  },
  'git-remote': {
    term: 'git remote',
    short:
      'A copy of your repository on another machine — GitHub, GitLab, or your own server — that you push changes to. It is what makes a dead laptop an inconvenience rather than a disaster.',
  },
  cron: {
    term: 'cron',
    short:
      'The Linux stopwatch. It runs a command on a schedule — every night at 3am, every ten minutes — without you being there.',
  },
  systemd: {
    term: 'systemd',
    short:
      'The part of Linux that starts, stops and supervises long-running programs (services) and brings them back up after a reboot or a crash.',
  },
  logind: {
    term: 'logind',
    short:
      'The systemd piece that decides what happens when you close a laptop lid. Tell it to do nothing and an old laptop becomes an always-on server.',
  },
  port: {
    term: 'port',
    short:
      'A numbered door on a machine that a program listens on. A web server is usually on port 80 and 443; two programs cannot use the same port at once, which is why running lots of things locally gets fiddly.',
  },
  nat: {
    term: 'NAT',
    short:
      'The thing your home router does that lets many devices share one public IP address. Handy, except it means machines outside your network cannot start a connection to a machine inside it.',
  },
  overlay: {
    term: 'overlay network',
    short:
      'A private network laid on top of the real internet. Every machine you enrol gets an address on it and can reach every other one directly and encrypted, wherever they physically are.',
  },
  nebula: {
    term: 'Nebula',
    short:
      'An open-source overlay network you host yourself: one small "lighthouse" server for introductions, a certificate per machine, and every node talks directly after that. What I run.',
  },
  tailscale: {
    term: 'Tailscale',
    short:
      'A managed overlay network built on WireGuard. It does the introduction service for you, so setup is a login and a client install on each machine. The no-config option.',
  },
  wireguard: {
    term: 'WireGuard',
    short:
      'A modern, fast, small VPN protocol built into the Linux kernel. Nebula and Tailscale are both ways of managing WireGuard-style tunnels across many machines.',
  },
  env: {
    term: '.env file',
    short:
      'A plain text file of secrets and settings a project reads at startup — database passwords, API keys. Never committed to git; easy to lose because it only exists on the running machine.',
  },
  yaml: {
    term: 'YAML',
    short:
      'A plain-text format for structured settings, readable by people and machines. Docker Compose files, bosun-x records and most config you will touch are YAML.',
  },
  markdown: {
    term: 'Markdown',
    short:
      'Plain text with a light sprinkle of punctuation for headings, lists and links. This note is Markdown. So is every spec and handoff log bosun-x keeps.',
  },
  mcp: {
    term: 'MCP',
    short:
      'Model Context Protocol — a standard way to hand an AI agent a set of tools it can call. bosun-x ships an MCP server so an agent can read and update project state through tools instead of poking files.',
  },
  'self-hosted': {
    term: 'self-hosted',
    short:
      'You run the software on your own machine instead of paying someone to run it for you. More control and no monthly bill; you are the one who fixes it at midnight.',
  },
  uptime: {
    term: 'uptime',
    short:
      'The share of time a service is actually up and answering. Nobody notices 100%; everybody notices the outage. Production needs it, experiments do not.',
  },
  handoff: {
    term: 'handoff',
    short:
      'A short written record of what was just done, what state things are in, and the next concrete step — so the next work session (a fresh agent, or you next week) picks up without re-deriving everything.',
  },
  'bind-mount': {
    term: 'bind mount',
    short:
      'Telling a container "this folder on the host is that folder inside you". It is how a container keeps data that outlives it, and how the dashboard reads project files without a copy.',
  },
};
