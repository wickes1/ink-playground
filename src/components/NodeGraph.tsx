import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { NODE_GRAPH } from '../constants';

interface NodeGraphProps {
  script: string;
  onNodeClick?: (knotName: string) => void;
  activeKnot?: string | null;
}

interface InkNode {
  id: string;
  name: string;
  x: number;
  y: number;
  connections: string[];
  isStart: boolean;
}

function parseInkScript(script: string): InkNode[] {
  const lines = script.split('\n');
  const knotRegex = /^===\s*(\w+)\s*===?$/;
  const divertRegex = /->\s*(\w+)/g;

  let currentKnot: string | null = null;
  const knotDiverts = new Map<string, Set<string>>();

  for (const line of lines) {
    const knotMatch = line.match(knotRegex);
    if (knotMatch) {
      currentKnot = knotMatch[1];
      if (!knotDiverts.has(currentKnot)) {
        knotDiverts.set(currentKnot, new Set());
      }
      continue;
    }

    if (currentKnot) {
      let divertMatch;
      while ((divertMatch = divertRegex.exec(line)) !== null) {
        const target = divertMatch[1];
        if (target !== 'END' && target !== 'DONE') {
          knotDiverts.get(currentKnot)?.add(target);
        }
      }
    }
  }

  const knotNames = Array.from(knotDiverts.keys());
  if (knotNames.length === 0) {
    return [{
      id: 'start',
      name: 'Start',
      x: 150,
      y: 100,
      connections: [],
      isStart: true,
    }];
  }

  const cols = Math.ceil(Math.sqrt(knotNames.length));
  return knotNames.map((name, index) => ({
    id: name,
    name,
    x: NODE_GRAPH.startX + (index % cols) * NODE_GRAPH.spacingX,
    y: NODE_GRAPH.startY + Math.floor(index / cols) * NODE_GRAPH.spacingY,
    connections: Array.from(knotDiverts.get(name) || []),
    isStart: index === 0,
  }));
}

export function NodeGraph({ script, onNodeClick, activeKnot }: NodeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });

  const nodes = useMemo(() => parseInkScript(script), [script]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    const gridSize = NODE_GRAPH.gridSize * transform.scale;
    const offsetX = transform.x % gridSize;
    const offsetY = transform.y % gridSize;

    ctx.beginPath();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    for (let x = offsetX; x < canvasSize.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
    }
    for (let y = offsetY; y < canvasSize.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
    }
    ctx.stroke();

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    const { nodeWidth, nodeHeight, nodeRadius } = NODE_GRAPH;

    // Draw connections
    for (const node of nodes) {
      for (const targetId of node.connections) {
        const target = nodes.find(n => n.id === targetId);
        if (!target) continue;

        ctx.beginPath();
        ctx.moveTo(node.x + nodeWidth, node.y + nodeHeight / 2);

        const midX = (node.x + target.x) / 2 + nodeWidth / 2;
        ctx.bezierCurveTo(
          midX, node.y + nodeHeight / 2,
          midX, target.y + nodeHeight / 2,
          target.x, target.y + nodeHeight / 2
        );

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(
          target.y - node.y,
          target.x - node.x - nodeWidth
        );
        ctx.save();
        ctx.translate(target.x, target.y + nodeHeight / 2);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-8, -4);
        ctx.lineTo(0, 0);
        ctx.lineTo(-8, 4);
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const isActive = activeKnot === node.id;

      if (isActive) {
        ctx.fillStyle = '#f0fdf4';
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = node.isStart ? '#f1f5f9' : '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
      }

      ctx.beginPath();
      ctx.roundRect(node.x, node.y, nodeWidth, nodeHeight, nodeRadius);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isActive ? '#166534' : '#0f172a';
      ctx.font = isActive ? '600 13px Inter, system-ui, sans-serif' : '500 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name, node.x + nodeWidth / 2, node.y + nodeHeight / 2);

      // Connection dots
      ctx.fillStyle = isActive ? '#22c55e' : '#cbd5e1';
      ctx.beginPath();
      ctx.arc(node.x + nodeWidth, node.y + nodeHeight / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y + nodeHeight / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [nodes, transform, canvasSize, activeKnot]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setTransform(prev => ({
        ...prev,
        scale: Math.min(Math.max(0.25, prev.scale + delta), 3)
      }));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { isDragging: true, lastX: e.clientX, lastY: e.clientY };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!onNodeClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - transform.x) / transform.scale;
    const clickY = (e.clientY - rect.top - transform.y) / transform.scale;

    const { nodeWidth, nodeHeight } = NODE_GRAPH;

    for (const node of nodes) {
      if (
        clickX >= node.x &&
        clickX <= node.x + nodeWidth &&
        clickY >= node.y &&
        clickY <= node.y + nodeHeight
      ) {
        onNodeClick(node.id);
        break;
      }
    }
  }, [nodes, transform, onNodeClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current.isDragging) return;

    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;

    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current.isDragging = false;
  }, []);

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });
  const zoomOut = () => setTransform(p => ({ ...p, scale: Math.max(0.25, p.scale - 0.1) }));
  const zoomIn = () => setTransform(p => ({ ...p, scale: Math.min(3, p.scale + 0.1) }));

  return (
    <div className="node-graph">
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="panel-title">Story Graph</span>
          <span className="zoom-level">{Math.round(transform.scale * 100)}%</span>
        </div>

        <div className="panel-header-right">
          <div className="zoom-controls">
            <button onClick={zoomOut} className="zoom-btn" title="Zoom out">
              <Minus size={14} />
            </button>
            <button onClick={resetView} className="zoom-btn" title="Reset view">
              <RotateCcw size={14} />
            </button>
            <button onClick={zoomIn} className="zoom-btn" title="Zoom in">
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="canvas-container"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      >
        <canvas ref={canvasRef} />

        {nodes.length <= 1 && !script.trim() && (
          <div className="graph-placeholder">
            <p>Write an Ink script with knots to visualize the story structure</p>
            <code>=== knot_name ===</code>
          </div>
        )}
      </div>
    </div>
  );
}
