import { useMemo, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Info, AlertTriangle, Lightbulb } from 'lucide-react';

interface DocumentRendererProps {
  content: string;
  isStreaming?: boolean;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split('\n');
  const items: TocItem[] = [];
  let inCode = false;
  for (const line of lines) {
    if (line.trim().startsWith('```')) { inCode = !inCode; continue; }
    if (inCode) continue;
    const m = line.match(/^(#{1,3})\s+(.+?)\s*$/);
    if (m) {
      const level = m[1].length;
      const text = m[2].replace(/[*_`]/g, '').trim();
      items.push({ id: slugify(text), text, level });
    }
  }
  return items;
}

function Callout({ kind, children }: { kind: 'note' | 'warning' | 'tip'; children: React.ReactNode }) {
  const Icon = kind === 'warning' ? AlertTriangle : kind === 'tip' ? Lightbulb : Info;
  const cls = kind === 'warning' ? 'callout callout-warning' : kind === 'tip' ? 'callout callout-tip' : 'callout callout-note';
  return (
    <div className={cls}>
      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function DocumentRenderer({ content, isStreaming }: DocumentRendererProps) {
  const components = useMemo(() => ({
    blockquote({ children, ...props }: any) {
      const text = String(
        (Array.isArray(children) ? children : [children])
          .map((c: any) => (typeof c === 'string' ? c : c?.props?.children ?? ''))
          .join('')
      );
      const m = text.match(/^\s*\[!(NOTE|WARNING|TIP)\]\s*/i);
      if (m) {
        const kind = m[1].toLowerCase() as 'note' | 'warning' | 'tip';
        const stripped = (Array.isArray(children) ? children : [children]).map((c: any) => {
          if (c?.props?.children && typeof c.props.children === 'string') {
            return { ...c, props: { ...c.props, children: c.props.children.replace(/^\s*\[!(NOTE|WARNING|TIP)\]\s*/i, '') } };
          }
          return c;
        });
        return <Callout kind={kind}>{stripped}</Callout>;
      }
      return <blockquote {...props}>{children}</blockquote>;
    },
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      if (!inline && match) {
        return (
          <SyntaxHighlighter
            language={match[1]}
            style={oneDark}
            PreTag="div"
            customStyle={{ borderRadius: '0.75rem', margin: 0 }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        );
      }
      return <code className={className} {...props}>{children}</code>;
    },
    table({ children }: any) {
      return (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table>{children}</table>
        </div>
      );
    },
  }), []);

  return (
    <article className="doc-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-5 bg-accent animate-pulse ml-1 align-middle" />
      )}
    </article>
  );
}

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );
    items.forEach(i => {
      const el = document.getElementById(i.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav className="text-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">On this page</p>
      <ul className="space-y-1.5 border-l border-border">
        {items.map((item, i) => (
          <li key={`${item.id}-${i}`} style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}>
            <a
              href={`#${item.id}`}
              className={`block py-0.5 -ml-px border-l-2 pl-3 transition-colors ${
                active === item.id
                  ? 'border-accent text-accent font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
