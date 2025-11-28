import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

interface NodeGraphProps {
  script: string;
  activeKnot: string | null;
}

interface InkNode {
  id: string;
  name: string;
  x: number;
  y: number;
  connections: string[];
  type: 'knot' | 'stitch' | 'start';
}

// Parse Ink script to extract knots and their connections
function parseInkScript(script: string): InkNode[] {
  const lines = script.split('\n');
  const nodes: InkNode[] = [];
  const knotRegex = /^===\s*(\w+)\s*===?$/;
  const divertRegex = /->\s*(\w+)/g;

  let currentKnot: string | null = null;
  const knotDiverts: Map<string, Set<string>> = new Map();

  // First pass: find all knots and their diverts
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

  // Create nodes with positions
  const knotNames = Array.from(knotDiverts.keys());
  const cols = Math.ceil(Math.sqrt(knotNames.length));

  knotNames.forEach((name, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    nodes.push({
      id: name,
      name,
      x: 100 + col * 180,
      y: 80 + row * 100,
      connections: Array.from(knotDiverts.get(name) || []),
      type: index === 0 ? 'start' : 'knot'
    });
  });

  // If no knots found, show a placeholder
  if (nodes.length === 0) {
    nodes.push({
      id: 'start',
      name: 'Start',
      x: 150,
      y: 100,
      connections: [],
      type: 'start'
    });
  }

  return nodes;
}

export function NodeGraph({ script, activeKnot }: NodeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const nodes = useMemo(() => parseInkScript(script), [script]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 24 * transform.scale;
    const offsetX = transform.x % gridSize;
    const offsetY = transform.y % gridSize;

    ctx.beginPath();
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;

    for (let x = offsetX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    for (let y = offsetY; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }

    ctx.stroke();
  }, [transform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear with warm background
    ctx.fillStyle = '#faf9f7';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw grid
    drawGrid(ctx, rect.width, rect.height);

    // Apply transform
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // Draw connections first
    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const target = nodes.find(n => n.id === targetId);
        if (!target) return;

        ctx.beginPath();
        ctx.moveTo(node.x + 70, node.y + 22);

        // Bezier curve for smooth connection
        const midX = (node.x + target.x) / 2 + 70;
        ctx.bezierCurveTo(
          midX, node.y + 22,
          midX, target.y + 22,
          target.x, target.y + 22
        );

        ctx.strokeStyle = '#d4d4d4';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(target.y + 22 - node.y - 22, target.x - node.x - 70);
        ctx.save();
        ctx.translate(target.x, target.y + 22);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-8, -4);
        ctx.lineTo(0, 0);
        ctx.lineTo(-8, 4);
        ctx.strokeStyle = '#d4d4d4';
        ctx.stroke();
        ctx.restore();
      });
    });

    // Draw nodes
    nodes.forEach(node => {
      const isActive = activeKnot === node.id;
      const isStart = node.type === 'start';

      const width = 140;
      const height = 44;
      const radius = 6;

      // Node shadow
      if (isActive) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(139, 161, 132, 0.4)';
      }

      // Node background
      ctx.fillStyle = isActive ? '#8ba184' : isStart ? '#f5f0eb' : '#ffffff';
      ctx.strokeStyle = isActive ? '#6b8a63' : isStart ? '#d4ccc4' : '#e5e5e5';
      ctx.lineWidth = isActive ? 2 : 1;

      ctx.beginPath();
      ctx.roundRect(node.x, node.y, width, height, radius);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Node label
      ctx.fillStyle = isActive ? '#ffffff' : '#404040';
      ctx.font = `500 13px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name, node.x + width / 2, node.y + height / 2);

      // Connection dots
      ctx.fillStyle = isActive ? '#6b8a63' : '#d4d4d4';
      ctx.beginPath();
      ctx.arc(node.x + width, node.y + height / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y + height / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, [nodes, activeKnot, transform, drawGrid]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.25, transform.scale + delta), 3);
    setTransform(prev => ({ ...prev, scale: newScale }));
  }, [transform.scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  return (
    <div className="node-graph">
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="panel-title">Story Graph</span>
          <span className="zoom-level">{Math.round(transform.scale * 100)}%</span>
        </div>

        <div className="panel-header-right">
          {activeKnot && (
            <span className="active-knot">
              <span className="active-dot" />
              {activeKnot}
            </span>
          )}
          <div className="zoom-controls">
            <button onClick={() => setTransform(p => ({ ...p, scale: Math.max(0.25, p.scale - 0.1) }))} className="zoom-btn">
              <Minus size={12} />
            </button>
            <button onClick={resetView} className="zoom-btn">
              <RotateCcw size={12} />
            </button>
            <button onClick={() => setTransform(p => ({ ...p, scale: Math.min(3, p.scale + 0.1) }))} className="zoom-btn">
              <Plus size={12} />
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
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="graph-canvas" />

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
