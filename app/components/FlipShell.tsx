'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface OutputLine {
  text: string;
  color?: string;
  instant?: boolean;
}

interface FlipShellProps {
  isOpen: boolean;
  onClose: () => void;
}

const BOOT_LINES: OutputLine[] = [
  { text: '', color: '#00ffaa', instant: true },
  { text: '████████████████████████████████████████████████', color: '#00ffaa', instant: true },
  { text: '  FLIPOS v2.0.4 [Build 20260410]', color: '#00ffaa', instant: true },
  { text: '  (c) 2026 Lobster Command Division', color: '#00ffaa', instant: true },
  { text: '████████████████████████████████████████████████', color: '#00ffaa', instant: true },
  { text: '' },
  { text: '          ,     ,' },
  { text: '         (\\____/)' },
  { text: '          (_oo_)' },
  { text: '            (O)' },
  { text: '          __||__    \\)' },
  { text: '       []/______\\[] /' },
  { text: '       / \\______/ \\/' },
  { text: '      /    /__\\' },
  { text: '     (\\   /____\\', color: '#ff3333' },
  { text: '      *         THE LOBSTER SEES ALL', color: '#00ffaa' },
  { text: '' },
  { text: 'Loading kernel modules... [OK]' },
  { text: 'Mounting /dev/claw0... [OK]' },
  { text: 'Initializing LOBSTER_PROTOCOL... [OK]' },
  { text: 'Calibrating deal-score matrix... [OK]' },
  { text: 'Verifying security clearance... [PENDING]', color: '#ffaa00' },
  { text: '' },
  { text: 'WARNING: You have accessed a classified terminal.', color: '#ff3333' },
  { text: 'All activity is monitored and logged.', color: '#ff3333' },
  { text: '' },
  { text: "Type 'help' to begin. Type 'exit' to disconnect.", color: '#888888' },
  { text: '' },
];

const FILE_SYSTEM: Record<string, Record<string, string | ((level: number) => string)>> = {
  'C:\\FLIPLY\\CLASSIFIED': {
    'README.txt': `\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  THE LOBSTER PROTOCOL v2.0
  CLASSIFIED \u2014 EYES ONLY
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

Seven firewalls. Seven passphrases. One lobster.

You've found something you weren't supposed to find.
Each file in INTEL\\ contains an encoded clue.
Each clue maps to a security clearance level.
Submit the decoded passphrase to advance.

The first one is easy. What does flip-ly do?
We find deals. We flip them. Think about it.

The deeper levels use increasingly obscure
encoding. Hex, Base64, Morse, ROT13, and
combinations thereof.

Level 7? Nobody's cracked it. Not even us.

Good luck, Agent.

  \u2014 The Lobster Council`,
  },
  'C:\\FLIPLY\\CLASSIFIED\\INTEL': {
    'memo_001.txt': `CLASSIFIED MEMO #001
FROM: Lobster Command
DATE: 2026-03-15
RE: Level 2 Access Code

The following sequence was intercepted from
a compromised relay:

  6c 30 62 73 74 33 72

Standard hexadecimal encoding.
Decode and submit.

  \u2014 LC`,
    'memo_002.txt': `CLASSIFIED MEMO #002
FROM: Deep Sea Division
DATE: 2026-03-22
RE: Level 3 Cipher

Encrypted transmission intercepted at 0342 UTC:

  Y2w0d2dyNGI=

Base64. You know what to do.

  \u2014 DSD`,
    'signal_03.dat': `SIGNAL INTERCEPT #03
Received: 2026-04-01 03:42:17 UTC
Source: Submarine CLAW-7

-.. ...-- ...-- .--. ... ...-- ....-

International Morse Code.
Each group is one character.

  \u2014 Signal Intelligence Division`,
    'intercept_04.bin': `BINARY INTERCEPT #04
Source: Encrypted radio burst
Classification: ULTRA

The following was decoded from a ROT13
cipher captured from enemy communications:

  fu3yyt4z3

Apply ROT13 to alphabetic characters.
Numbers remain unchanged.

  \u2014 Cryptanalysis Unit`,
    'classified.enc': (level: number) =>
      level < 5
        ? 'ACCESS DENIED \u2014 INSUFFICIENT CLEARANCE\nRequired: Level 5\nYour Level: ' + level
        : `TOP SECRET \u2014 LEVEL 5+ CLEARANCE VERIFIED

CLASSIFIED ENCRYPTION KEY
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
The Level 6 passphrase is the leet-speak
version of "cracked code".

Replace vowels and certain consonants with
numbers in the standard way:
  a -> 4, e -> 3, o -> 0

Think: cr4ck3dc0d3

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
LEVEL 7 \u2014 THE FINAL FIREWALL
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Level 7 is not in this terminal.
The fragments are on the SURFACE.

Hint 1: Look where machines describe
         the page. The first fragment
         hides in the page metadata.
         (View Source. Check the <head>.)

Hint 2: Look where styles whisper.
         The second fragment hides in
         the design tokens.
         (Inspect the CSS variables.)

Combine them. No spaces. No tricks.
The deep claw opens the final door.

  \u2014 Supreme Lobster Command`,
  },
  'C:\\FLIPLY\\CLASSIFIED\\SYSTEM': {
    'config.ini': `[LOBSTER_PROTOCOL]
version=2.0.4
build=20260410
security_level=MAXIMUM
fragment_gamma=3dc
maintenance_window=0300-0400UTC
auto_scrape=ENABLED
deal_score_engine=HAIKU_4.5
source_count=825`,
    'kernel.sys': (level: number) =>
      level < 4
        ? 'ACCESS DENIED \u2014 CLEARANCE LEVEL 4 REQUIRED\nYour Level: ' + level
        : `KERNEL MODULE: lobster_core.sys
Version: 2.0.4-classified
Fragment loaded: 0d3
Integrity: VERIFIED
Checksum: 0xDEADCLAW
Source Matrix: 20+ active feeds
AI Backbone: claude-haiku-4-5-20251001
Enrichment Rate: 5 listings/batch`,
  },
  'C:\\FLIPLY\\CLASSIFIED\\LOGS': {},
  'C:\\FLIPLY\\CLASSIFIED\\AGENTS': {},
};

const DIRECTORIES: Record<string, string[]> = {
  'C:\\FLIPLY\\CLASSIFIED': ['INTEL', 'SYSTEM', 'LOGS', 'AGENTS', 'README.txt'],
  'C:\\FLIPLY\\CLASSIFIED\\INTEL': [
    'memo_001.txt',
    'memo_002.txt',
    'signal_03.dat',
    'intercept_04.bin',
    'classified.enc',
  ],
  'C:\\FLIPLY\\CLASSIFIED\\SYSTEM': ['config.ini', 'kernel.sys'],
  'C:\\FLIPLY\\CLASSIFIED\\LOGS': ['attempts.log'],
  'C:\\FLIPLY\\CLASSIFIED\\AGENTS': ['active.log'],
};

const SCAN_HINTS = [
  'Hint: Level 1 requires no decoding. It is a compound word.',
  'Hint: Hexadecimal encodes each byte as two hex characters. 0x6c = "l".',
  'Hint: Base64 uses A-Z, a-z, 0-9, +, / and = for padding.',
  'Hint: Morse code uses dots (.) and dashes (-). Space separates characters.',
  'Hint: ROT13 shifts each letter 13 positions in the alphabet. a->n, b->o, etc.',
  'Hint: Leet speak replaces letters with similar-looking numbers. a=4, e=3, o=0.',
  'Hint: Level 7 has no file clue. The answer is something only the worthy know.',
  'Hint: Some files require a minimum clearance level to read.',
  'Hint: The file system has four directories: INTEL, SYSTEM, LOGS, AGENTS.',
  'Hint: "cat" and "type" both work for reading files.',
];

const HELP_TEXT = `
\u2550\u2550\u2550 LOBSTER PROTOCOL \u2014 COMMAND REFERENCE \u2550\u2550\u2550

  help            Show this command reference
  login           Register your agent designation
  status          View clearance level and progress
  whoami          Display current agent identity

  ls / dir        List files in current directory
  cd <dir>        Navigate to directory (.. to go up)
  cat <file>      Read a file (alias: type)

  submit <pass>   Attempt a passphrase for next level
  scan            Receive a random encoding hint
  claim           Register email after clearing a level

  agents          View live agent activity feed
  leaderboard     View protocol-wide statistics (alias: lb)

  clear / cls     Clear terminal output
  exit            Disconnect from terminal (also: Esc)
  ping            Test relay connection

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
`;

export default function FlipShell({ isOpen, onClose }: FlipShellProps) {
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [agentName, setAgentName] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentDir, setCurrentDir] = useState('C:\\FLIPLY\\CLASSIFIED');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isBooting, setIsBooting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attemptsPerLevel, setAttemptsPerLevel] = useState<Record<number, number>>({});
  const [partialReveals, setPartialReveals] = useState<Record<number, string>>({});
  const [hasClaimed, setHasClaimed] = useState(false);
  const [awaitingInput, setAwaitingInput] = useState<string | null>(null);
  const [claimStep, setClaimStep] = useState<'email' | 'password' | null>(null);
  const [claimEmail, setClaimEmail] = useState('');
  const [attemptLog, setAttemptLog] = useState<string[]>([]);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hasBooted, setHasBooted] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef(false);
  const outputRef = useRef<OutputLine[]>([]);

  // Keep outputRef in sync
  useEffect(() => {
    outputRef.current = outputLines;
  }, [outputLines]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    });
  }, []);

  const addLines = useCallback(
    (lines: OutputLine[]) => {
      setOutputLines((prev) => [...prev, ...lines]);
      scrollToBottom();
    },
    [scrollToBottom]
  );

  const typeLines = useCallback(
    async (lines: OutputLine[]) => {
      if (typingRef.current) return;
      typingRef.current = true;
      setIsTyping(true);

      for (const line of lines) {
        if (!typingRef.current) break;
        if (line.instant) {
          setOutputLines((prev) => [...prev, line]);
          scrollToBottom();
          await new Promise((r) => setTimeout(r, 30));
          continue;
        }
        // Type character by character
        const chars = line.text;
        if (chars.length === 0) {
          setOutputLines((prev) => [...prev, { text: '', color: line.color }]);
          scrollToBottom();
          await new Promise((r) => setTimeout(r, 50));
          continue;
        }
        for (let i = 0; i <= chars.length; i++) {
          const partial = chars.substring(0, i);
          setOutputLines((prev) => {
            const newLines = [...prev];
            // If we're typing the first character, add a new line
            if (i === 0) {
              newLines.push({ text: '', color: line.color });
            } else {
              // Update the last line
              newLines[newLines.length - 1] = { text: partial, color: line.color };
            }
            return newLines;
          });
          scrollToBottom();
          await new Promise((r) => setTimeout(r, 15));
        }
        await new Promise((r) => setTimeout(r, 40));
      }

      typingRef.current = false;
      setIsTyping(false);
    },
    [scrollToBottom]
  );

  // Boot sequence
  useEffect(() => {
    if (isOpen && !hasBooted) {
      setIsBooting(true);
      setOutputLines([]);
      setHasBooted(true);

      const runBoot = async () => {
        await new Promise((r) => setTimeout(r, 300));
        await typeLines(BOOT_LINES);
        setIsBooting(false);
        inputRef.current?.focus();
      };
      runBoot();
    }
  }, [isOpen, hasBooted, typeLines]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      // Delay reset so fade-out completes
      const t = setTimeout(() => {
        setOutputLines([]);
        setAgentName(null);
        setCurrentLevel(0);
        setCurrentDir('C:\\FLIPLY\\CLASSIFIED');
        setCommandHistory([]);
        setHistoryIndex(-1);
        setAttemptsPerLevel({});
        setPartialReveals({});
        setHasClaimed(false);
        setAwaitingInput(null);
        setClaimStep(null);
        setClaimEmail('');
        setAttemptLog([]);
        setIsFadingOut(false);
        setHasBooted(false);
        typingRef.current = false;
        setIsTyping(false);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [outputLines, scrollToBottom]);

  // Focus input on click
  const handleTerminalClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const getPrompt = useCallback(() => {
    if (!agentName) return 'C:\\FLIPLY> ';
    const shortDir = currentDir.replace('C:\\FLIPLY\\CLASSIFIED', 'C:\\FLIPLY\\CLASSIFIED');
    return `${shortDir}> `;
  }, [agentName, currentDir]);

  // --- Command handlers ---

  const handleExit = useCallback(async () => {
    await typeLines([
      { text: '' },
      { text: 'Disconnecting from LOBSTER_PROTOCOL...', color: '#888888' },
      { text: 'Wiping session data... [OK]', color: '#888888' },
      { text: 'Terminal closed.', color: '#888888' },
      { text: '' },
      { text: '    The lobster remembers.', color: '#00ffaa' },
      { text: '' },
    ]);
    await new Promise((r) => setTimeout(r, 800));
    setIsFadingOut(true);
    await new Promise((r) => setTimeout(r, 500));
    onClose();
  }, [typeLines, onClose]);

  const processCommand = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      // Add to history
      setCommandHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);

      // Show the command in output
      addLines([{ text: `${getPrompt()}${trimmed}`, color: '#33ff33' }]);

      // Handle awaiting input states
      if (awaitingInput === 'login') {
        const name = trimmed;
        setAgentName(name);
        setAwaitingInput(null);
        await typeLines([
          { text: '' },
          { text: `Agent ${name.toUpperCase()} registered.`, color: '#33ff33' },
          { text: `Clearance: LEVEL 0`, color: '#888888' },
          { text: `Security clearances earned: 0/7`, color: '#888888' },
          { text: '' },
          { text: "Begin by reading README.txt — type: cat README.txt", color: '#888888' },
          { text: '' },
        ]);
        return;
      }

      if (claimStep === 'email') {
        setClaimEmail(trimmed);
        setClaimStep('password');
        await typeLines([
          { text: 'Choose a password (min 6 chars): ', color: '#888888' },
        ]);
        return;
      }

      if (claimStep === 'password') {
        if (trimmed.length < 6) {
          await typeLines([
            { text: 'Password must be at least 6 characters. Try again: ', color: '#ff3333' },
          ]);
          return;
        }
        setClaimStep(null);
        // Call register API
        await typeLines([
          { text: 'Registering with Lobster Command...', color: '#888888' },
        ]);
        try {
          const res = await fetch('/api/shell/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agent_name: agentName,
              email: claimEmail,
              password: trimmed,
              level_cleared: currentLevel,
            }),
          });
          const data = await res.json();
          if (data.success) {
            setHasClaimed(true);
            await typeLines([
              { text: '' },
              {
                text: `Account created. Welcome to flip-ly, Agent ${agentName?.toUpperCase()}.`,
                color: '#33ff33',
              },
              { text: 'Your prize has been logged.', color: '#33ff33' },
              { text: "Type 'exit' to return to the surface.", color: '#888888' },
              { text: '' },
            ]);
          } else if (data.error?.includes('exist')) {
            setHasClaimed(true);
            await typeLines([
              { text: '' },
              {
                text: 'That email is already registered. Your achievement has been linked to your existing account.',
                color: '#ffaa00',
              },
              { text: '' },
            ]);
          } else {
            await typeLines([
              { text: 'Connection to Lobster Command lost. Try again.', color: '#ff3333' },
            ]);
          }
        } catch {
          await typeLines([
            { text: 'Connection to Lobster Command lost. Try again.', color: '#ff3333' },
          ]);
        }
        return;
      }

      // Require login for most commands
      const cmd = trimmed.toLowerCase();
      const args = trimmed.split(/\s+/).slice(1).join(' ');

      if (!agentName && cmd !== 'login' && cmd !== 'exit' && cmd !== 'help' && cmd !== 'clear' && cmd !== 'cls') {
        await typeLines([
          { text: '' },
          { text: 'You must identify yourself first. Type: login', color: '#ffaa00' },
          { text: '' },
        ]);
        return;
      }

      // Parse command
      switch (cmd.split(' ')[0]) {
        case 'help': {
          addLines(
            HELP_TEXT.split('\n').map((line) => ({
              text: line,
              color: line.startsWith('\u2550') ? '#00ffaa' : '#33ff33',
            }))
          );
          break;
        }

        case 'login': {
          if (agentName) {
            await typeLines([
              { text: `Already logged in as Agent ${agentName.toUpperCase()}.`, color: '#888888' },
            ]);
            break;
          }
          setAwaitingInput('login');
          await typeLines([{ text: 'Enter agent designation: ', color: '#888888' }]);
          break;
        }

        case 'status': {
          const levelBar = '\u2588'.repeat(currentLevel) + '\u2591'.repeat(7 - currentLevel);
          await typeLines([
            { text: '' },
            { text: '\u2550\u2550\u2550 AGENT STATUS \u2550\u2550\u2550', color: '#00ffaa' },
            { text: `Agent: ${agentName?.toUpperCase()}`, color: '#33ff33' },
            { text: `Clearance: LEVEL ${currentLevel}`, color: currentLevel >= 5 ? '#33ff33' : '#ffaa00' },
            { text: `Progress: [${levelBar}] ${currentLevel}/7`, color: '#33ff33' },
            { text: `Claimed: ${hasClaimed ? 'YES' : 'NO'}`, color: '#888888' },
            { text: '' },
            ...(Object.keys(attemptsPerLevel).length > 0
              ? [
                  { text: 'Attempts by level:', color: '#888888' },
                  ...Object.entries(attemptsPerLevel).map(([lvl, count]) => ({
                    text: `  Level ${lvl}: ${count} attempt${count > 1 ? 's' : ''}${partialReveals[Number(lvl)] ? ` (partial: ${partialReveals[Number(lvl)]})` : ''}`,
                    color: '#888888',
                  })),
                  { text: '' },
                ]
              : []),
          ]);
          break;
        }

        case 'whoami': {
          await typeLines([
            { text: '' },
            { text: `Agent: ${agentName?.toUpperCase()}`, color: '#33ff33' },
            { text: `Clearance: Level ${currentLevel}`, color: '#888888' },
            { text: `Session: Active`, color: '#888888' },
            { text: '' },
          ]);
          break;
        }

        case 'ls':
        case 'dir': {
          const entries = DIRECTORIES[currentDir];
          if (!entries) {
            await typeLines([{ text: 'Directory not found.', color: '#ff3333' }]);
            break;
          }
          const dirLines: OutputLine[] = [
            { text: '' },
            { text: ` Directory of ${currentDir}`, color: '#888888' },
            { text: '' },
          ];
          for (const entry of entries) {
            const isDir = !entry.includes('.');
            dirLines.push({
              text: `  ${isDir ? '<DIR>' : '     '} ${entry}`,
              color: isDir ? '#00ffaa' : '#33ff33',
            });
          }
          dirLines.push({ text: '' });
          dirLines.push({
            text: `  ${entries.filter((e) => !e.includes('.')).length} Dir(s)  ${entries.filter((e) => e.includes('.')).length} File(s)`,
            color: '#888888',
          });
          dirLines.push({ text: '' });
          addLines(dirLines);
          break;
        }

        case 'cd': {
          const target = args.trim();
          if (!target) {
            await typeLines([{ text: currentDir, color: '#33ff33' }]);
            break;
          }
          if (target === '..' || target === '..\\') {
            if (currentDir === 'C:\\FLIPLY\\CLASSIFIED') {
              await typeLines([
                { text: 'Access denied. You cannot leave the classified directory.', color: '#ff3333' },
              ]);
            } else {
              const parent = currentDir.substring(0, currentDir.lastIndexOf('\\'));
              setCurrentDir(parent || 'C:\\FLIPLY\\CLASSIFIED');
            }
            break;
          }
          // Try to navigate
          const upperTarget = target.toUpperCase();
          const candidates = [
            `${currentDir}\\${upperTarget}`,
            `${currentDir}\\${target}`,
          ];
          const match = candidates.find((c) => DIRECTORIES[c]);
          if (match) {
            setCurrentDir(match);
          } else {
            await typeLines([
              { text: `Directory '${target}' not found. Use 'ls' to see available directories.`, color: '#ff3333' },
            ]);
          }
          break;
        }

        case 'cat':
        case 'type': {
          const filename = args.trim();
          if (!filename) {
            await typeLines([{ text: 'Usage: cat <filename>', color: '#ff3333' }]);
            break;
          }

          // Special files
          if (filename === 'attempts.log' || filename === 'LOGS\\attempts.log') {
            if (attemptLog.length === 0) {
              await typeLines([
                { text: '' },
                { text: '--- attempts.log ---', color: '#888888' },
                { text: 'No attempts recorded yet.', color: '#888888' },
                { text: '' },
              ]);
            } else {
              const logLines: OutputLine[] = [
                { text: '' },
                { text: '--- attempts.log ---', color: '#888888' },
                ...attemptLog.map((l) => ({ text: l, color: '#888888' })),
                { text: '' },
              ];
              addLines(logLines);
            }
            break;
          }

          if (filename === 'active.log' || filename === 'AGENTS\\active.log') {
            // Fetch live feed
            await typeLines([{ text: 'Fetching live agent feed...', color: '#888888' }]);
            try {
              const res = await fetch('/api/shell/feed');
              const data = await res.json();
              if (data.feed && data.feed.length > 0) {
                const feedLines: OutputLine[] = [
                  { text: '' },
                  { text: '\u2550\u2550\u2550\u2550\u2550\u2550 LIVE AGENT FEED \u2550\u2550\u2550\u2550\u2550\u2550', color: '#00ffaa' },
                  ...data.feed.map((f: { timestamp: string; message: string }) => ({
                    text: `[${f.timestamp}] ${f.message}`,
                    color: '#888888',
                  })),
                  { text: '\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550', color: '#00ffaa' },
                  { text: '' },
                ];
                addLines(feedLines);
              } else {
                await typeLines([
                  { text: 'No recent agent activity.', color: '#888888' },
                ]);
              }
            } catch {
              await typeLines([
                { text: 'Connection to Lobster Command lost. Try again.', color: '#ff3333' },
              ]);
            }
            break;
          }

          // Look up file
          const filesInDir = FILE_SYSTEM[currentDir];
          if (!filesInDir || !filesInDir[filename]) {
            // Try searching in subdirectories
            const parts = filename.split(/[/\\]/);
            let resolved: string | ((level: number) => string) | undefined;
            if (parts.length === 2) {
              const subDir = `${currentDir}\\${parts[0].toUpperCase()}`;
              const subFiles = FILE_SYSTEM[subDir];
              if (subFiles) resolved = subFiles[parts[1]];
            }
            if (!resolved) {
              await typeLines([
                { text: `File '${filename}' not found. Use 'ls' to list files.`, color: '#ff3333' },
              ]);
              break;
            }
            const content = typeof resolved === 'function' ? resolved(currentLevel) : resolved;
            addLines([
              { text: '' },
              ...content.split('\n').map((line) => ({
                text: line,
                color: line.startsWith('ACCESS DENIED') ? '#ff3333' : '#33ff33',
              })),
              { text: '' },
            ]);
            break;
          }

          const fileContent = filesInDir[filename];
          const content = typeof fileContent === 'function' ? fileContent(currentLevel) : fileContent;
          addLines([
            { text: '' },
            ...content.split('\n').map((line) => ({
              text: line,
              color: line.startsWith('ACCESS DENIED') ? '#ff3333' : '#33ff33',
            })),
            { text: '' },
          ]);
          break;
        }

        case 'submit': {
          const password = args.trim();
          if (!password) {
            await typeLines([{ text: 'Usage: submit <passphrase>', color: '#ff3333' }]);
            break;
          }

          const targetLevel = currentLevel + 1;
          if (targetLevel > 7) {
            await typeLines([
              { text: '' },
              { text: 'You have already cleared all 7 levels.', color: '#33ff33' },
              { text: 'The Lobster Council salutes you.', color: '#00ffaa' },
              { text: '' },
            ]);
            break;
          }

          // Track attempts
          setAttemptsPerLevel((prev) => ({
            ...prev,
            [targetLevel]: (prev[targetLevel] || 0) + 1,
          }));

          const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
          setAttemptLog((prev) => [
            ...prev,
            `[${timestamp}] Level ${targetLevel}: "${password}" - PENDING`,
          ]);

          await typeLines([
            { text: '' },
            { text: 'Verifying against security matrix...', color: '#888888' },
          ]);

          // Simulated loading dots
          for (let i = 0; i < 3; i++) {
            await new Promise((r) => setTimeout(r, 400));
            setOutputLines((prev) => {
              const newLines = [...prev];
              const lastIdx = newLines.length - 1;
              newLines[lastIdx] = {
                text: 'Verifying against security matrix' + '.'.repeat(i + 2),
                color: '#888888',
              };
              return newLines;
            });
          }

          try {
            const res = await fetch('/api/shell/attempt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agent_name: agentName,
                password: password,
                level: targetLevel,
              }),
            });
            const data = await res.json();

            if (data.result === 'capped') {
              // Level 7 correct but all prize slots taken
              setCurrentLevel(targetLevel);
              setAttemptLog((prev) => {
                const newLog = [...prev];
                newLog[newLog.length - 1] = `[${timestamp}] Level ${targetLevel}: CLEARED (capped)`;
                return newLog;
              });
              await typeLines([
                { text: '' },
                { text: '\u2588\u2588\u2588 PASSWORD CORRECT \u2014 LEVEL 7 \u2588\u2588\u2588', color: '#ffaa00' },
                { text: '' },
                { text: 'You cracked the code. The password was correct.', color: '#33ff33' },
                { text: `But all ${data.max_winners} physical prize slots have been claimed.`, color: '#ff3333' },
                { text: '' },
                { text: `Prize: ${data.prize}`, color: '#00ffaa' },
                { text: '' },
                { text: 'The Lobster Council acknowledges your skill.', color: '#888888' },
                { text: "Type 'claim' to register and receive your consolation prize.", color: '#888888' },
                { text: '' },
              ]);
            } else if (data.result === 'cleared') {
              setCurrentLevel(targetLevel);
              setAttemptLog((prev) => {
                const newLog = [...prev];
                newLog[newLog.length - 1] = `[${timestamp}] Level ${targetLevel}: CLEARED`;
                return newLog;
              });
              const prizeDescs: Record<number, string> = {
                1: 'Free Flip-ly account',
                2: '3 days Pro trial',
                3: '1 week Pro trial',
                4: '2 weeks Pro access',
                5: '1 month Pro access',
                6: '3 months Power tier',
                7: '3 months Power tier + mystery physical prize (1 of 5)',
              };
              const prizeDesc = prizeDescs[targetLevel] || data.prize;

              const successLines: OutputLine[] = [
                { text: '' },
                { text: `\u2588\u2588\u2588 CLEARANCE GRANTED \u2014 LEVEL ${targetLevel} \u2588\u2588\u2588`, color: '#33ff33' },
                { text: '' },
                { text: `Prize: ${prizeDesc}`, color: '#00ffaa' },
                { text: '' },
                {
                  text: "Type 'claim' to register your email and lock in your prize.",
                  color: '#888888',
                },
              ];
              if (targetLevel === 6) {
                successLines.push({ text: '' });
                successLines.push({
                  text: '\u2550\u2550\u2550 LEVEL 7 \u2014 THE FINAL FIREWALL \u2550\u2550\u2550',
                  color: '#00ffaa',
                });
                successLines.push({
                  text: 'Level 7 is unlike anything before.',
                  color: '#ffaa00',
                });
                successLines.push({
                  text: 'No file contains this answer.',
                  color: '#ffaa00',
                });
                successLines.push({
                  text: 'Only 5 agents will ever claim this prize.',
                  color: '#ffaa00',
                });
                successLines.push({
                  text: 'The fragments are on the surface. Look carefully.',
                  color: '#ffaa00',
                });
              }
              if (targetLevel === 7) {
                successLines.push({ text: '' });
                successLines.push({
                  text: 'A physical prize will be shipped to you.',
                  color: '#33ff33',
                });
                successLines.push({
                  text: 'The Lobster Council is in shambles.',
                  color: '#ff3333',
                });
              }
              successLines.push({ text: '' });
              await typeLines(successLines);
            } else {
              // Denied
              setAttemptLog((prev) => {
                const newLog = [...prev];
                newLog[newLog.length - 1] = `[${timestamp}] Level ${targetLevel}: "${password}" - DENIED`;
                return newLog;
              });

              if (data.partial_reveal) {
                setPartialReveals((prev) => ({ ...prev, [targetLevel]: data.partial_reveal }));
              }

              const attempts = (attemptsPerLevel[targetLevel] || 0) + 1;
              await typeLines([
                { text: '' },
                { text: 'ACCESS DENIED', color: '#ff3333' },
                ...(data.partial_reveal
                  ? [
                      {
                        text: `Partial reveal for Level ${targetLevel}: ${data.partial_reveal}`,
                        color: '#ffaa00',
                      },
                    ]
                  : []),
                { text: `Attempt #${attempts} at Level ${targetLevel}`, color: '#888888' },
                { text: '' },
              ]);
            }
          } catch {
            await typeLines([
              { text: 'Connection to Lobster Command lost. Try again.', color: '#ff3333' },
            ]);
          }
          break;
        }

        case 'scan': {
          const hint = SCAN_HINTS[Math.floor(Math.random() * SCAN_HINTS.length)];
          await typeLines([
            { text: '' },
            { text: 'Scanning encrypted channels...', color: '#888888' },
          ]);
          await new Promise((r) => setTimeout(r, 800));
          await typeLines([
            { text: hint, color: '#ffaa00' },
            { text: '' },
          ]);
          break;
        }

        case 'claim': {
          if (currentLevel === 0) {
            await typeLines([
              { text: '' },
              { text: 'You must clear at least one level before claiming a prize.', color: '#ff3333' },
              { text: "Type 'submit <passphrase>' to attempt Level 1.", color: '#888888' },
              { text: '' },
            ]);
            break;
          }
          if (hasClaimed) {
            await typeLines([
              { text: 'You have already claimed your prize.', color: '#888888' },
            ]);
            break;
          }
          setClaimStep('email');
          await typeLines([
            { text: '' },
            {
              text: 'Enter email to create your flip-ly account and claim your prize: ',
              color: '#888888',
            },
          ]);
          break;
        }

        case 'agents': {
          await typeLines([{ text: 'Fetching live agent feed...', color: '#888888' }]);
          try {
            const res = await fetch('/api/shell/feed');
            const data = await res.json();
            const feedEntries = data.feed || [];
            const lines: OutputLine[] = [
              { text: '' },
              { text: '\u2550\u2550\u2550\u2550\u2550\u2550 LIVE AGENT FEED \u2550\u2550\u2550\u2550\u2550\u2550', color: '#00ffaa' },
            ];
            if (feedEntries.length > 0) {
              for (const f of feedEntries) {
                lines.push({
                  text: `[${f.timestamp}] ${f.message}`,
                  color: f.message?.includes('cleared') ? '#33ff33' : '#888888',
                });
              }
            } else {
              lines.push({ text: 'No recent agent activity.', color: '#888888' });
            }
            lines.push({
              text: `\u2014 ${data.active_count || 0} agents active in last hour \u2014`,
              color: '#888888',
            });
            lines.push({ text: '\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550', color: '#00ffaa' });
            lines.push({ text: '' });
            addLines(lines);
          } catch {
            await typeLines([
              { text: 'Connection to Lobster Command lost. Try again.', color: '#ff3333' },
            ]);
          }
          break;
        }

        case 'leaderboard':
        case 'lb': {
          await typeLines([{ text: 'Fetching protocol statistics...', color: '#888888' }]);
          try {
            const res = await fetch('/api/shell/stats');
            const data = await res.json();
            const s = data.stats || {};
            const lines: OutputLine[] = [
              { text: '' },
              { text: '\u2550\u2550\u2550 LOBSTER PROTOCOL STATS \u2550\u2550\u2550', color: '#00ffaa' },
              {
                text: `Total Agents:     ${(s.total_agents || 0).toLocaleString()}`,
                color: '#33ff33',
              },
              {
                text: `Total Attempts:   ${(s.total_attempts || 0).toLocaleString()}`,
                color: '#33ff33',
              },
              { text: '\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550', color: '#00ffaa' },
            ];
            const levels = s.levels || {};
            for (let i = 1; i <= 7; i++) {
              const cleared = levels[i] || 0;
              const suffix = i === 7 ? ` / 5 slots` : '';
              lines.push({
                text: `Level ${i} Cleared:  ${cleared.toLocaleString()}${suffix}`,
                color: i === 7 && cleared >= 5 ? '#ff3333' : '#33ff33',
              });
            }
            const l7Remaining = Math.max(0, 5 - (levels[7] || 0));
            lines.push({ text: '\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550', color: '#00ffaa' });
            lines.push({
              text: l7Remaining > 0
                ? `Level 7 prize slots remaining: ${l7Remaining}`
                : 'Level 7 prize slots: ALL CLAIMED',
              color: l7Remaining > 0 ? '#ffaa00' : '#ff3333',
            });
            if (s.recent_clears && s.recent_clears.length > 0) {
              lines.push({ text: 'Most Recent Clears:', color: '#888888' });
              for (const rc of s.recent_clears) {
                lines.push({
                  text: `  ${rc.agent} \u2014 Level ${rc.level} \u2014 ${rc.time_ago}`,
                  color: '#888888',
                });
              }
            }
            lines.push({ text: '\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550', color: '#00ffaa' });
            lines.push({ text: '' });
            addLines(lines);
          } catch {
            await typeLines([
              { text: 'Connection to Lobster Command lost. Try again.', color: '#ff3333' },
            ]);
          }
          break;
        }

        case 'ping': {
          await typeLines([
            { text: 'PONG \u2014 lobster_relay at 0.013ms', color: '#33ff33' },
          ]);
          break;
        }

        case 'clear':
        case 'cls': {
          setOutputLines([]);
          break;
        }

        case 'exit': {
          await handleExit();
          break;
        }

        default: {
          await typeLines([
            { text: '' },
            {
              text: "Command not recognized. The Lobster Council is watching. Type 'help'.",
              color: '#ff3333',
            },
            { text: '' },
          ]);
        }
      }
    },
    [
      agentName,
      currentDir,
      currentLevel,
      attemptsPerLevel,
      partialReveals,
      hasClaimed,
      awaitingInput,
      claimStep,
      claimEmail,
      attemptLog,
      addLines,
      typeLines,
      getPrompt,
      handleExit,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isTyping || isBooting) return;
        const val = inputValue;
        setInputValue('');
        processCommand(val);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length === 0) return;
        const newIdx =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIdx);
        setInputValue(commandHistory[newIdx]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex === -1) return;
        const newIdx = historyIndex + 1;
        if (newIdx >= commandHistory.length) {
          setHistoryIndex(-1);
          setInputValue('');
        } else {
          setHistoryIndex(newIdx);
          setInputValue(commandHistory[newIdx]);
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        addLines([
          {
            text: "Tab completion disabled. You're on your own, Agent.",
            color: '#ffaa00',
          },
        ]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleExit();
      } else if (e.key === 'c' && e.ctrlKey) {
        e.preventDefault();
        addLines([
          {
            text: "Nice try. This terminal doesn't respond to SIGINT.",
            color: '#ff3333',
          },
        ]);
      }
    },
    [
      inputValue,
      isTyping,
      isBooting,
      commandHistory,
      historyIndex,
      processCommand,
      addLines,
      handleExit,
    ]
  );

  if (!isOpen) return null;

  const scanlineStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
    pointerEvents: 'none',
    zIndex: 2,
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100000,
    background: '#0a0a0a',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#33ff33',
    overflow: 'hidden',
    opacity: isFadingOut ? 0 : 1,
    transition: 'opacity 0.5s ease-out',
    animation: 'flipshell-flicker 8s infinite',
  };

  const terminalAreaStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflowY: 'auto',
    padding: '16px',
    paddingBottom: '60px',
    zIndex: 1,
    cursor: 'text',
    WebkitOverflowScrolling: 'touch',
  };

  const inputLineStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 16px',
    background: '#0a0a0a',
    borderTop: '1px solid #1a3a1a',
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
  };

  const promptStyle: React.CSSProperties = {
    color: '#33ff33',
    textShadow: '0 0 8px rgba(51,255,51,0.5)',
    whiteSpace: 'pre',
    flexShrink: 0,
  };

  const hiddenInputStyle: React.CSSProperties = {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
    overflow: 'hidden',
  };

  const visibleInputStyle: React.CSSProperties = {
    color: '#33ff33',
    textShadow: '0 0 8px rgba(51,255,51,0.5)',
    flex: 1,
    minWidth: 0,
  };

  const cursorStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '8px',
    height: '16px',
    background: '#33ff33',
    animation: 'flipshell-blink 1s step-end infinite',
    verticalAlign: 'text-bottom',
    marginLeft: '1px',
    boxShadow: '0 0 6px rgba(51,255,51,0.6)',
  };

  return (
    <>
      <style>{`
        @keyframes flipshell-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes flipshell-flicker {
          0%, 97%, 100% { opacity: 1; }
          97.5% { opacity: 0.95; }
          98% { opacity: 1; }
          98.5% { opacity: 0.97; }
          99% { opacity: 1; }
        }
        .flipshell-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .flipshell-scrollbar::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        .flipshell-scrollbar::-webkit-scrollbar-thumb {
          background: #1a3a1a;
          border-radius: 3px;
        }
        .flipshell-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2a5a2a;
        }
      `}</style>
      <div style={containerStyle} onClick={handleTerminalClick}>
        {/* CRT scanline overlay */}
        <div style={scanlineStyle} />

        {/* Terminal output area */}
        <div
          ref={terminalRef}
          className="flipshell-scrollbar"
          style={terminalAreaStyle}
        >
          {outputLines.map((line, idx) => (
            <div
              key={idx}
              style={{
                color: line.color || '#33ff33',
                textShadow: `0 0 6px ${(line.color || '#33ff33')}44`,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                minHeight: '1.5em',
              }}
            >
              {line.text || '\u00A0'}
            </div>
          ))}
        </div>

        {/* Input line at bottom */}
        {!isBooting && (
          <div style={inputLineStyle}>
            <span style={promptStyle}>
              {claimStep === 'email'
                ? 'Email: '
                : claimStep === 'password'
                ? 'Password: '
                : awaitingInput === 'login'
                ? 'Agent: '
                : getPrompt()}
            </span>
            <input
              ref={inputRef}
              type={claimStep === 'password' ? 'password' : 'text'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={hiddenInputStyle}
              aria-label="Terminal input"
              data-shell-input="true"
            />
            <span style={visibleInputStyle}>
              {claimStep === 'password'
                ? '\u2022'.repeat(inputValue.length)
                : inputValue}
              <span style={cursorStyle} />
            </span>
          </div>
        )}
      </div>
    </>
  );
}
