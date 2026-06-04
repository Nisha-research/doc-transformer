// Best-effort parsers that turn AI markdown into structured data for interactive views.

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: { text: string; correct: boolean }[];
  explanation?: string;
  topic?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  event: string;
  significance?: string;
}

export interface MindMapNode {
  id: string;
  text: string;
  level: number;
  children: MindMapNode[];
}

const stripMd = (s: string) => s.replace(/[*_`]/g, '').trim();

export function parseFlashcards(md: string): Flashcard[] {
  const cards: Flashcard[] = [];
  const lines = md.split('\n');
  let topic = '';
  let i = 0;
  let idx = 0;
  while (i < lines.length) {
    const line = lines[i];
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      topic = stripMd(h2[1]);
      i++;
      continue;
    }
    const q = line.match(/^\s*\**\s*Q\s*[:\.\-]\s*\**\s*(.+)/i);
    if (q) {
      // find answer in next lines
      let answer = '';
      let j = i + 1;
      while (j < lines.length) {
        const a = lines[j].match(/^\s*\**\s*A\s*[:\.\-]\s*\**\s*(.+)/i);
        if (a) {
          answer = a[1].trim();
          // continue collecting until blank or next Q
          let k = j + 1;
          while (k < lines.length && !/^\s*\**\s*Q\s*[:\.\-]/i.test(lines[k]) && !/^##\s+/.test(lines[k])) {
            if (lines[k].trim()) answer += ' ' + lines[k].trim();
            k++;
          }
          i = k;
          break;
        }
        if (/^\s*\**\s*Q\s*[:\.\-]/i.test(lines[j]) || /^##\s+/.test(lines[j])) break;
        j++;
      }
      if (answer) {
        cards.push({
          id: `fc-${idx++}`,
          question: stripMd(q[1]),
          answer: stripMd(answer),
          topic: topic || undefined,
        });
      } else {
        i++;
      }
      continue;
    }
    i++;
  }
  return cards;
}

export function parseQuiz(md: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const lines = md.split('\n');
  let topic = '';
  let current: QuizQuestion | null = null;
  let idx = 0;

  const pushCurrent = () => {
    if (current && current.options.length >= 2) questions.push(current);
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      pushCurrent();
      topic = stripMd(h2[1]);
      continue;
    }
    // Question: numbered "1." or "1)" or "**Q1:**" or "Q:" or "### Q..."
    const qMatch =
      line.match(/^\s*(?:\*\*)?\s*(?:Q\d*[:\.\)]|#{2,4}\s*Q\d*[:\.\)]?|(\d+)[\.\)])\s*(?:\*\*)?\s*(.+?)(?:\*\*)?\s*$/i);
    const looksLikeOption = /^\s*(?:[-*]|[A-Da-d][\.\)])\s+/.test(line);
    if (qMatch && !looksLikeOption && (qMatch[2] || '').length > 4) {
      pushCurrent();
      current = {
        id: `q-${idx++}`,
        question: stripMd(qMatch[2]),
        options: [],
        topic: topic || undefined,
      };
      continue;
    }
    // Option line: "- A) text" / "* text ✅"
    const optMatch = line.match(/^\s*(?:[-*]|[A-Da-d][\.\)])\s+(.+)/);
    if (optMatch && current) {
      let text = optMatch[1];
      const correct = /✅|✔️|\(correct\)|\*\*correct\*\*/i.test(text);
      text = text.replace(/✅|✔️|\(correct\)|\*\*correct\*\*/gi, '').trim();
      text = stripMd(text);
      if (text) current.options.push({ text, correct });
      continue;
    }
    // Explanation
    const exp = line.match(/^\s*(?:\*\*)?(?:Explanation|Why)\s*[:\.\-]\s*(?:\*\*)?\s*(.+)/i);
    if (exp && current) {
      current.explanation = stripMd(exp[1]);
      continue;
    }
  }
  pushCurrent();
  // ensure at least one correct option per question; if none, mark first
  return questions
    .filter((q) => q.options.length >= 2)
    .map((q) => {
      if (!q.options.some((o) => o.correct)) q.options[0].correct = true;
      return q;
    });
}

export function parseTimeline(md: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const lines = md.split('\n');
  let idx = 0;
  for (const line of lines) {
    // table row: | date | event | significance |
    const m = line.match(/^\s*\|(.+)\|\s*$/);
    if (!m) continue;
    const cells = m[1].split('|').map((c) => stripMd(c));
    if (cells.length < 2) continue;
    // skip header & separator rows
    if (/^[-:\s]+$/.test(cells.join(''))) continue;
    if (/^date$/i.test(cells[0])) continue;
    events.push({
      id: `t-${idx++}`,
      date: cells[0],
      event: cells[1] || '',
      significance: cells[2] || undefined,
    });
  }
  return events;
}

export function parseMindMap(md: string): MindMapNode | null {
  const lines = md.split('\n');
  let title = '';
  for (const line of lines) {
    const h = line.match(/^#\s+(.+)/);
    if (h) {
      title = stripMd(h[1]);
      break;
    }
  }
  const root: MindMapNode = { id: 'root', text: title || 'Mind Map', level: 0, children: [] };
  const stack: MindMapNode[] = [root];
  let idx = 0;

  for (const line of lines) {
    const m = line.match(/^(\s*)[-*+]\s+(.+)/);
    if (!m) continue;
    const indent = m[1].replace(/\t/g, '  ').length;
    const level = Math.floor(indent / 2) + 1;
    const node: MindMapNode = { id: `n-${idx++}`, text: stripMd(m[2]), level, children: [] };
    while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }
  return root.children.length ? root : null;
}
