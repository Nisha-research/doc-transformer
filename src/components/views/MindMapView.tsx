import { useMemo, useRef } from 'react';
import ReactFlow, { Background, Controls, MarkerType, type Edge, type Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { Download, FileImage, FileText, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { parseMindMap, type MindMapNode } from '@/lib/parsers';
import { exportElementAsPdf, exportElementAsPng } from '@/lib/visual-exporters';
import { toast } from 'sonner';

const LEVEL_COLORS = ['hsl(var(--accent))', 'hsl(var(--student))', 'hsl(var(--creator))', 'hsl(var(--professional))', 'hsl(var(--general))'];

function layout(root: MindMapNode) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const leafCount = (n: MindMapNode): number =>
    n.children.length ? n.children.reduce((s, c) => s + leafCount(c), 0) : 1;

  const xStep = 260;
  const yStep = 60;

  const place = (n: MindMapNode, depth: number, yStart: number): number => {
    const leaves = leafCount(n);
    const y = yStart + (leaves * yStep) / 2 - yStep / 2;
    const color = LEVEL_COLORS[Math.min(depth, LEVEL_COLORS.length - 1)];
    nodes.push({
      id: n.id,
      position: { x: depth * xStep, y },
      data: { label: n.text },
      style: {
        border: `1.5px solid ${color}`,
        background: 'hsl(var(--card))',
        color: 'hsl(var(--foreground))',
        borderRadius: 12,
        padding: '8px 12px',
        fontSize: depth === 0 ? 14 : 12,
        fontWeight: depth === 0 ? 600 : 500,
        maxWidth: 220,
        boxShadow: '0 4px 12px hsl(var(--background) / 0.4)',
      },
      sourcePosition: 'right' as any,
      targetPosition: 'left' as any,
    });
    let cursor = yStart;
    for (const c of n.children) {
      const childLeaves = leafCount(c);
      edges.push({
        id: `${n.id}-${c.id}`,
        source: n.id, target: c.id,
        type: 'smoothstep', animated: false,
        style: { stroke: color, strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color },
      });
      place(c, depth + 1, cursor);
      cursor += childLeaves * yStep;
    }
    return y;
  };

  place(root, 0, 0);
  return { nodes, edges };
}

function toMindmapHtml(root: MindMapNode, title: string): string {
  const renderNode = (n: MindMapNode): string => `
    <li>
      <span class="node l${n.level}">${escapeHtml(n.text)}</span>
      ${n.children.length ? `<ul>${n.children.map(renderNode).join('')}</ul>` : ''}
    </li>`;
  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: 'Inter', system-ui, sans-serif; background:#0f172a; color:#f1f5f9; padding:40px; }
  h1 { font-size:32px; margin:0 0 24px; }
  ul { list-style:none; padding-left: 24px; border-left: 2px solid #334155; }
  li { margin: 8px 0; }
  .node { display:inline-block; padding:6px 14px; border-radius:10px; background:#1e293b; border:1.5px solid #6366f1; font-weight:500; }
  .l0 { background:#6366f1; color:#fff; font-weight:700; font-size:18px; }
  .l1 { border-color:#a855f7; }
  .l2 { border-color:#06b6d4; }
  .l3 { border-color:#f59e0b; }
</style></head>
<body><h1>${escapeHtml(title)}</h1><ul>${renderNode(root)}</ul></body></html>`;
}
function escapeHtml(s: string) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function MindMapView({ content }: { content: string }) {
  const tree = useMemo(() => parseMindMap(content), [content]);
  const { nodes, edges } = useMemo(() => (tree ? layout(tree) : { nodes: [], edges: [] }), [tree]);
  const stageRef = useRef<HTMLDivElement>(null);

  if (!tree) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Couldn't detect a mind map structure. Showing the markdown output instead.
      </div>
    );
  }

  const title = tree.text || 'Mind Map';

  const handleExport = async (kind: 'png' | 'pdf' | 'html') => {
    try {
      if (kind === 'html') {
        const html = toMindmapHtml(tree, title);
        const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '-').toLowerCase() || 'mindmap'}.html`;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
      } else if (stageRef.current) {
        if (kind === 'png') await exportElementAsPng(stageRef.current, `${title}-mindmap`);
        else await exportElementAsPdf(stageRef.current, `${title}-mindmap`);
      }
      toast.success(`Exported as .${kind}`);
    } catch (e) { console.error(e); toast.error('Export failed'); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Interactive Mind Map</p>
          <h2 className="text-xl font-display font-bold">{title}</h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5"><Download className="w-3.5 h-3.5" />Export</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('pdf')}><FileText className="w-4 h-4 mr-2" />PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('png')}><FileImage className="w-4 h-4 mr-2" />PNG image</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('html')}><Code2 className="w-4 h-4 mr-2" />Interactive HTML</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div ref={stageRef} className="h-[600px] rounded-2xl border border-border bg-card overflow-hidden">
        <ReactFlow
          nodes={nodes} edges={edges}
          fitView fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable nodesConnectable={false} elementsSelectable
        >
          <Background color="hsl(var(--border))" gap={20} />
          <Controls className="!bg-card !border-border" />
        </ReactFlow>
      </div>
    </div>
  );
}
