import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Minus, Plus, RotateCcw, Workflow } from 'lucide-react';
import { NODE_GRAPH } from '../constants';
import type { CanvasThemeColors } from '../lib/themes';

interface NodeGraphProps {
  script: string;
  onNodeClick?: (knotName: string) => void;
  onNodePositionChange?: (knotName: string, x: number, y: number) => void;
  onAutoLayout?: (positions: Map<string, { x: number; y: number }>) => void;
  activeKnot?: string | null;
  canvasTheme?: CanvasThemeColors | null;
}

interface InkNode {
  id: string;
  name: string;
  x: number;
  y: number;
  connections: string[];
  isStart: boolean;
}

interface KnotData {
  connections: Set<string>;
  position: { x: number; y: number } | null;
}

// Default light theme colors as fallback
const defaultCanvasTheme: CanvasThemeColors = {
  background: '#f8fafc',
  grid: '#e2e8f0',
  nodeDefault: '#ffffff',
  nodeStart: '#f1f5f9',
  nodeActive: { fill: '#f0fdf4', stroke: '#22c55e' },
  nodeHover: { fill: '#eef2ff', stroke: '#6366f1' },
  nodeConnected: { fill: '#f5f3ff', stroke: '#a5b4fc' },
  nodeBorder: '#e2e8f0',
  textDefault: '#0f172a',
  textActive: '#166534',
  textHover: '#4338ca',
  connectionDefault: '#cbd5e1',
  connectionHighlight: '#6366f1',
  dotDefault: '#cbd5e1',
  dotActive: '#22c55e',
  dotHover: '#6366f1'
};

function computeHierarchicalLayout(nodes: InkNode[]): Map<string, { x: number; y: number }> {
  if (nodes.length === 0) return new Map();

  const positions = new Map<string, { x: number; y: number }>();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const { startX, startY, spacingX, spacingY } = NODE_GRAPH;

  const occupied = new Set<string>();
  const gridKey = (col: number, row: number) => `${col},${row}`;

  const placeNode = (id: string, col: number, row: number) => {
    while (occupied.has(gridKey(col, row))) {
      row++;
    }
    occupied.add(gridKey(col, row));
    positions.set(id, {
      x: startX + col * spacingX,
      y: startY + row * spacingY,
    });
    return { col, row };
  };

  const mainPath = new Set<string>();
  const mainPathOrder: string[] = [];
  let current: string | null = nodes[0]?.id ?? null;

  while (current && !mainPath.has(current)) {
    mainPath.add(current);
    mainPathOrder.push(current);
    const node = nodeMap.get(current);
    current = node?.connections[0] ?? null;
  }

  mainPathOrder.forEach((id, col) => {
    placeNode(id, col, 0);
  });

  const placed = new Set(mainPath);
  const nodeGridPos = new Map<string, { col: number; row: number }>();
  mainPathOrder.forEach((id, col) => nodeGridPos.set(id, { col, row: 0 }));

  const processQueue = [...mainPathOrder];

  while (processQueue.length > 0) {
    const parentId = processQueue.shift()!;
    const parent = nodeMap.get(parentId);
    const parentGrid = nodeGridPos.get(parentId);
    if (!parent || !parentGrid) continue;

    const branches = mainPath.has(parentId)
      ? parent.connections.slice(1)
      : parent.connections;

    branches.forEach((childId, branchIndex) => {
      if (placed.has(childId)) return;
      placed.add(childId);

      const col = parentGrid.col + 1;
      const row = parentGrid.row + branchIndex + 1;
      const actualPos = placeNode(childId, col, row);
      nodeGridPos.set(childId, actualPos);
      processQueue.push(childId);
    });
  }

  let disconnectedCol = 0;
  for (const node of nodes) {
    if (!placed.has(node.id)) {
      const row = 0;
      while (occupied.has(gridKey(disconnectedCol, row))) {
        disconnectedCol++;
      }
      placeNode(node.id, disconnectedCol, 3);
      disconnectedCol++;
    }
  }

  return positions;
}

function parseInkScript(script: string): InkNode[] {
  const lines = script.split('\n');
  const knotRegex = /^===\s*(\w+)\s*===?$/;
  const positionTagRegex = /^#\s*position:\s*(-?\d+)\s*,\s*(-?\d+)/;
  const divertRegex = /->\s*(\w+)/g;

  let currentKnot: string | null = null;
  const knotData = new Map<string, KnotData>();

  for (const line of lines) {
    const knotMatch = line.match(knotRegex);
    if (knotMatch) {
      currentKnot = knotMatch[1];
      if (!knotData.has(currentKnot)) {
        knotData.set(currentKnot, { connections: new Set(), position: null });
      }
      continue;
    }

    if (currentKnot) {
      const posMatch = line.match(positionTagRegex);
      if (posMatch) {
        const data = knotData.get(currentKnot)!;
        data.position = { x: parseInt(posMatch[1], 10), y: parseInt(posMatch[2], 10) };
        continue;
      }

      let divertMatch;
      while ((divertMatch = divertRegex.exec(line)) !== null) {
        const target = divertMatch[1];
        if (target !== 'END' && target !== 'DONE') {
          knotData.get(currentKnot)?.connections.add(target);
        }
      }
    }
  }

  const knotNames = Array.from(knotData.keys());
  if (knotNames.length === 0) {
    return [];
  }

  const cols = Math.ceil(Math.sqrt(knotNames.length));
  return knotNames.map((name, index) => {
    const data = knotData.get(name)!;
    const autoX = NODE_GRAPH.startX + (index % cols) * NODE_GRAPH.spacingX;
    const autoY = NODE_GRAPH.startY + Math.floor(index / cols) * NODE_GRAPH.spacingY;

    return {
      id: name,
      name,
      x: data.position?.x ?? autoX,
      y: data.position?.y ?? autoY,
      connections: Array.from(data.connections),
      isStart: index === 0,
    };
  });
}

export function NodeGraph({ script, onNodeClick, onNodePositionChange, onAutoLayout, activeKnot, canvasTheme }: NodeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const dragRef = useRef<{
    type: 'none' | 'canvas' | 'node';
    nodeId: string | null;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    hasMoved: boolean;
  }>({ type: 'none', nodeId: null, startX: 0, startY: 0, lastX: 0, lastY: 0, hasMoved: false });

  // Use provided theme or fallback to default
  const theme = canvasTheme || defaultCanvasTheme;

  const parsedNodes = useMemo(() => parseInkScript(script), [script]);

  const nodes = useMemo(() => {
    return parsedNodes.map(node => ({
      ...node,
      x: nodePositions.get(node.id)?.x ?? node.x,
      y: nodePositions.get(node.id)?.y ?? node.y,
    }));
  }, [parsedNodes, nodePositions]);

  useEffect(() => {
    setNodePositions(new Map());
  }, [script]);

  useEffect(() => {
    if (parsedNodes.length === 0 || canvasSize.width === 0 || canvasSize.height === 0) return;

    const { nodeWidth, nodeHeight } = NODE_GRAPH;
    const padding = 40;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of parsedNodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + nodeWidth);
      maxY = Math.max(maxY, node.y + nodeHeight);
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const centerX = minX + contentWidth / 2;
    const centerY = minY + contentHeight / 2;

    const scaleX = (canvasSize.width - padding * 2) / contentWidth;
    const scaleY = (canvasSize.height - padding * 2) / contentHeight;
    const scale = Math.min(Math.max(0.5, Math.min(scaleX, scaleY)), 1.5);

    const x = canvasSize.width / 2 - centerX * scale;
    const y = canvasSize.height / 2 - centerY * scale;

    setTransform({ x, y, scale });
  }, [parsedNodes, canvasSize.width, canvasSize.height]);

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

    // Background
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Grid
    const gridSize = NODE_GRAPH.gridSize * transform.scale;
    const offsetX = transform.x % gridSize;
    const offsetY = transform.y % gridSize;

    ctx.beginPath();
    ctx.strokeStyle = theme.grid;
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

    const hoveredNode = hoveredNodeId ? nodes.find(n => n.id === hoveredNodeId) : null;
    const highlightedConnections = new Set(hoveredNode?.connections || []);

    // Draw connections
    const drawConnection = (node: InkNode, targetId: string, highlighted: boolean) => {
      const target = nodes.find(n => n.id === targetId);
      if (!target) return;

      ctx.beginPath();
      ctx.moveTo(node.x + nodeWidth, node.y + nodeHeight / 2);

      const midX = (node.x + target.x) / 2 + nodeWidth / 2;
      ctx.bezierCurveTo(
        midX, node.y + nodeHeight / 2,
        midX, target.y + nodeHeight / 2,
        target.x, target.y + nodeHeight / 2
      );

      ctx.strokeStyle = highlighted ? theme.connectionHighlight : theme.connectionDefault;
      ctx.lineWidth = highlighted ? 3 : 2;
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
      ctx.strokeStyle = highlighted ? theme.connectionHighlight : theme.connectionDefault;
      ctx.lineWidth = highlighted ? 2 : 1;
      ctx.stroke();
      ctx.restore();
    };

    // Draw non-highlighted connections first
    for (const node of nodes) {
      for (const targetId of node.connections) {
        const isHighlighted = node.id === hoveredNodeId;
        if (!isHighlighted) {
          drawConnection(node, targetId, false);
        }
      }
    }

    // Draw highlighted connections on top
    if (hoveredNode) {
      for (const targetId of hoveredNode.connections) {
        drawConnection(hoveredNode, targetId, true);
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const isActive = activeKnot === node.id;
      const isHovered = node.id === hoveredNodeId;
      const isConnectedToHovered = highlightedConnections.has(node.id);

      if (isActive) {
        ctx.fillStyle = theme.nodeActive.fill;
        ctx.strokeStyle = theme.nodeActive.stroke;
        ctx.lineWidth = 2;
      } else if (isHovered) {
        ctx.fillStyle = theme.nodeHover.fill;
        ctx.strokeStyle = theme.nodeHover.stroke;
        ctx.lineWidth = 2;
      } else if (isConnectedToHovered) {
        ctx.fillStyle = theme.nodeConnected.fill;
        ctx.strokeStyle = theme.nodeConnected.stroke;
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = node.isStart ? theme.nodeStart : theme.nodeDefault;
        ctx.strokeStyle = theme.nodeBorder;
        ctx.lineWidth = 1;
      }

      ctx.beginPath();
      ctx.roundRect(node.x, node.y, nodeWidth, nodeHeight, nodeRadius);
      ctx.fill();
      ctx.stroke();

      // Node text
      ctx.fillStyle = isActive ? theme.textActive : isHovered ? theme.textHover : theme.textDefault;
      ctx.font = (isActive || isHovered) ? '600 13px Inter, system-ui, sans-serif' : '500 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name, node.x + nodeWidth / 2, node.y + nodeHeight / 2);

      // Connection dots
      ctx.fillStyle = isActive ? theme.dotActive : isHovered || isConnectedToHovered ? theme.dotHover : theme.dotDefault;
      ctx.beginPath();
      ctx.arc(node.x + nodeWidth, node.y + nodeHeight / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y + nodeHeight / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [nodes, transform, canvasSize, activeKnot, hoveredNodeId, theme]);

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

  const getNodeAtPosition = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - transform.x) / transform.scale;
    const y = (clientY - rect.top - transform.y) / transform.scale;
    const { nodeWidth, nodeHeight } = NODE_GRAPH;

    for (const node of nodes) {
      if (x >= node.x && x <= node.x + nodeWidth && y >= node.y && y <= node.y + nodeHeight) {
        return node;
      }
    }
    return null;
  }, [nodes, transform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);

    if (node) {
      dragRef.current = {
        type: 'node',
        nodeId: node.id,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        hasMoved: false,
      };
    } else {
      dragRef.current = {
        type: 'canvas',
        nodeId: null,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        hasMoved: false,
      };
    }
  }, [getNodeAtPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const nodeUnderMouse = getNodeAtPosition(e.clientX, e.clientY);
    setHoveredNodeId(nodeUnderMouse?.id ?? null);

    const container = containerRef.current;
    if (container) {
      container.style.cursor = nodeUnderMouse ? 'pointer' : 'grab';
    }

    if (dragRef.current.type === 'none') return;

    if (container) {
      container.style.cursor = dragRef.current.type === 'node' ? 'grabbing' : 'grabbing';
    }

    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;

    if (Math.abs(e.clientX - dragRef.current.startX) > 3 || Math.abs(e.clientY - dragRef.current.startY) > 3) {
      dragRef.current.hasMoved = true;
    }

    if (dragRef.current.type === 'canvas') {
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    } else if (dragRef.current.type === 'node' && dragRef.current.nodeId) {
      const nodeId = dragRef.current.nodeId;
      const scaledDx = dx / transform.scale;
      const scaledDy = dy / transform.scale;

      setNodePositions(prev => {
        const newMap = new Map(prev);
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          const currentX = prev.get(nodeId)?.x ?? node.x;
          const currentY = prev.get(nodeId)?.y ?? node.y;
          newMap.set(nodeId, { x: currentX + scaledDx, y: currentY + scaledDy });
        }
        return newMap;
      });
    }
  }, [transform.scale, nodes, getNodeAtPosition]);

  const handleMouseUp = useCallback(() => {
    const drag = dragRef.current;

    if (drag.type === 'node' && drag.nodeId && drag.hasMoved && onNodePositionChange) {
      const pos = nodePositions.get(drag.nodeId);
      const node = nodes.find(n => n.id === drag.nodeId);
      if (pos || node) {
        const x = Math.round(pos?.x ?? node!.x);
        const y = Math.round(pos?.y ?? node!.y);
        onNodePositionChange(drag.nodeId, x, y);
      }
    } else if (drag.type === 'node' && drag.nodeId && !drag.hasMoved && onNodeClick) {
      onNodeClick(drag.nodeId);
    }

    dragRef.current = { type: 'none', nodeId: null, startX: 0, startY: 0, lastX: 0, lastY: 0, hasMoved: false };
  }, [nodes, nodePositions, onNodeClick, onNodePositionChange]);

  const handleMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
    dragRef.current = { type: 'none', nodeId: null, startX: 0, startY: 0, lastX: 0, lastY: 0, hasMoved: false };
  }, []);

  const centerOnContent = useCallback(() => {
    if (nodes.length === 0 || canvasSize.width === 0 || canvasSize.height === 0) return;

    const { nodeWidth, nodeHeight } = NODE_GRAPH;
    const padding = 40;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of nodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + nodeWidth);
      maxY = Math.max(maxY, node.y + nodeHeight);
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const centerX = minX + contentWidth / 2;
    const centerY = minY + contentHeight / 2;

    const scaleX = (canvasSize.width - padding * 2) / contentWidth;
    const scaleY = (canvasSize.height - padding * 2) / contentHeight;
    const scale = Math.min(Math.max(0.5, Math.min(scaleX, scaleY)), 1.5);

    const x = canvasSize.width / 2 - centerX * scale;
    const y = canvasSize.height / 2 - centerY * scale;

    setTransform({ x, y, scale });
  }, [nodes, canvasSize.width, canvasSize.height]);

  const zoomOut = () => setTransform(p => ({ ...p, scale: Math.max(0.25, p.scale - 0.1) }));
  const zoomIn = () => setTransform(p => ({ ...p, scale: Math.min(3, p.scale + 0.1) }));

  const handleAutoLayout = useCallback(() => {
    if (!onAutoLayout || parsedNodes.length <= 1) return;
    const positions = computeHierarchicalLayout(parsedNodes);
    onAutoLayout(positions);
  }, [parsedNodes, onAutoLayout]);

  return (
    <div className="node-graph">
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="panel-title">Story Graph</span>
          <span className="zoom-level">{Math.round(transform.scale * 100)}%</span>
        </div>

        <div className="panel-header-right">
          {onAutoLayout && parsedNodes.length > 1 && (
            <button onClick={handleAutoLayout} className="btn btn-sm" title="Auto layout">
              <Workflow size={14} />
              <span>Auto Layout</span>
            </button>
          )}
          <div className="zoom-controls">
            <button onClick={zoomOut} className="zoom-btn" title="Zoom out">
              <Minus size={14} />
            </button>
            <button onClick={centerOnContent} className="zoom-btn" title="Center on content">
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
        onMouseLeave={handleMouseLeave}
      >
        <canvas ref={canvasRef} />

        {nodes.length === 0 && (
          <div className="graph-placeholder">
            <p>Write an Ink script with knots to visualize the story structure</p>
            <code>=== knot_name ===</code>
          </div>
        )}
      </div>
    </div>
  );
}
