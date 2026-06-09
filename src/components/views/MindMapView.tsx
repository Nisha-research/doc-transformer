import { useMemo, useRef } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap, MarkerType, type Edge, type Node, Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Download, FileImage, FileText, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { parseMindMap, type MindMapNode } from '@/lib/parsers';
import { exportElementAsPdf, exportElementAsPng } from '@/lib/visual-exporters';
import { toast } from 'sonner';

const PALETTE = [
  { ring: '#6366f1', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fg: '#ffffff' }, // root
  { ring: '#06b6d4', bg: '#0f172a', fg: '#e0f2fe' },
  { ring: '#f59e0b', bg: '#1e293b', fg: '#fde68a' },
  { ring: '#10b981', bg: '#0b1220', fg: '#a7f3d0' },
  { ring: '#ec4899', bg: '#1f0d18', fg: '#fbcfe8' },
];

const NODE_W = 220;
const NODE_H = 56;

function layout(root: MindMapNode) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 28, ranksep: 80, marginx: 20, marginy: 20 });

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const walk = (n: MindMapNode, depth: number) => {
    g.setNode(n.id, { width: NODE_W, height: NODE_H });
    const p = PALETTE[Math.min(depth, PALETTE.length - 1)];
    nodes.push({
      id: n.id,
      position: { x: 0, y: 0 },
      data: { label: n.text },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        width: NODE_W,
        padding: '10px 14px',
        borderRadius: 14,
        border: `1.5px solid ${p.ring}`,
        background: p.bg,
        color: p.fg,
        fontSize: depth === 0 ? 14 : 12,
        fontWeight: depth === 0 ? 700 : 500,
        boxShadow: depth === 0 ? `0 12px 36px ${p.ring}55` : `0 4px 14px rgba(0,0,0,0.35)`,
        textAlign: 'left' as const,
        lineHeight: 1.25,
      },
    });
    for (const c of n.children) {
      g.setEdge(n.id, c.id);
      edges.push({
        id: `${n.id}-${c.id}`,
        source: n.id,
        target: c.id,
        type: 'smoothstep',
        animated: depth === 0,
        style: { stroke: p.ring, strokeWidth: 1.75 },
        markerEnd: { type: MarkerType.ArrowClosed, color: p.ring, width: 16, height: 16 },
      });
      walk(c, depth + 1);
    }
  };

  walk(root, 0);
  dagre.layout(g);

  for (const n of nodes) {
    const p = g.node(n.id);
    if (p) n.position = { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 };
  }
  return { nodes, edges };
}

function escapeHtml(s: string) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  .l0 { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; font-weight:700; font-size:18px; border:none; }
  .l1 { border-color:#06b6d4; } .l2 { border-color:#f59e0b; } .l3 { border-color:#10b981; }
</style></head>
<body><h1>${escapeHtml(title)}</h1><ul>${renderNode(root)}</ul></body></html>`;
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

      <div ref={stageRef} className="h-[640px] rounded-2xl border border-border bg-card overflow-hidden">
        <ReactFlow
          nodes={nodes} edges={edges}
          fitView fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable nodesConnectable={false} elementsSelectable
          minZoom={0.2} maxZoom={2}
        >
          <Background color="hsl(var(--border))" gap={22} />
          <MiniMap pannable zoomable className="!bg-card !border !border-border" maskColor="hsl(var(--background) / 0.7)" />
          <Controls className="!bg-card !border-border" />
        </ReactFlow>
      </div>
    </div>
  );
}
