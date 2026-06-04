import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MarkerType, type Edge, type Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { parseMindMap, type MindMapNode } from '@/lib/parsers';

const LEVEL_COLORS = ['hsl(var(--accent))', 'hsl(var(--student))', 'hsl(var(--creator))', 'hsl(var(--professional))', 'hsl(var(--general))'];

function layout(root: MindMapNode) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  // count leaves per node for vertical spread
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
        source: n.id,
        target: c.id,
        type: 'smoothstep',
        animated: false,
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

export function MindMapView({ content }: { content: string }) {
  const tree = useMemo(() => parseMindMap(content), [content]);
  const { nodes, edges } = useMemo(() => (tree ? layout(tree) : { nodes: [], edges: [] }), [tree]);

  if (!tree) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Couldn't detect a mind map structure. Showing the markdown output instead.
      </div>
    );
  }

  return (
    <div className="h-[600px] rounded-2xl border border-border bg-card overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
      >
        <Background color="hsl(var(--border))" gap={20} />
        <Controls className="!bg-card !border-border" />
      </ReactFlow>
    </div>
  );
}
