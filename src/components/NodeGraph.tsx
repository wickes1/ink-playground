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

function parseInkScript(script: string): InkNode[] {
  const lines = script.split('\n');
  const nodes: InkNode[] = [];
  const knotRegex = /^===\s*(\w+)\s*===?$/;
  const divertRegex = /->\s*(\w+)/g;

  let currentKnot: string | null = null;
  const knotDiverts: Map<string, Set<string>> = new Map();

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
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });

  const nodes = useMemo(() => parseInkScript(script), [script]);

  // Handle canvas resize with ResizeObserver
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

  // Draw canvas
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

    // Clear
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw grid
    const gridSize = 24 * transform.scale;
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

    // Apply transform
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // Draw connections
    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const target = nodes.find(n => n.id === targetId);
        if (!target) return;

        ctx.beginPath();
        ctx.moveTo(node.x + 70, node.y + 22);

        const midX = (node.x + target.x) / 2 + 70;
        ctx.bezierCurveTo(
          midX, node.y + 22,
          midX, target.y + 22,
          target.x, target.y + 22
        );

        ctx.strokeStyle = '#cbd5e1';
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
        ctx.strokeStyle = '#cbd5e1';
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
      const radius = 8;

      if (isActive) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(99, 102, 241, 0.3)';
      }

      ctx.fillStyle = isActive ? '#6366f1' : isStart ? '#f1f5f9' : '#ffffff';
      ctx.strokeStyle = isActive ? '#4f46e5' : '#e2e8f0';
      ctx.lineWidth = isActive ? 2 : 1;

      ctx.beginPath();
      ctx.roundRect(node.x, node.y, width, height, radius);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;

      ctx.fillStyle = isActive ? '#ffffff' : '#0f172a';
      ctx.font = '500 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name, node.x + width / 2, node.y + height / 2);

      // Connection dots
      ctx.fillStyle = isActive ? '#4f46e5' : '#cbd5e1';
      ctx.beginPath();
      ctx.arc(node.x + width, node.y + height / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y + height / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, [nodes, activeKnot, transform, canvasSize]);

  // Wheel zoom
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
