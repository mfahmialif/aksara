import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PenTool, Eraser, RotateCcw, RotateCw, Trash2, Download } from 'lucide-react';

interface Point {
    x: number;
    y: number;
}

interface Stroke {
    points: Point[];
    color: string;
    width: number;
    isEraser?: boolean;
}

interface DrawingCanvasProps {
    value?: string | null; // JSON string of { strokes: Stroke[], preview: string }
    onChange: (value: string | null) => void;
    editable?: boolean;
}

export default function DrawingCanvas({
    value,
    onChange,
    editable = true,
}: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [redoStack, setRedoStack] = useState<Stroke[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [color, setColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(4);

    const colors = [
        '#000000', // Black
        '#FF6B6B', // Coral
        '#A388EE', // Purple
        '#7FBC8C', // Mint
        '#FFDC58', // Yellow
        '#69D2E7', // Sky Blue
        '#FFFFFF', // White
    ];

    const widths = [2, 4, 8, 14];

    // Load initial data
    useEffect(() => {
        if (value) {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed.strokes)) {
                    setStrokes(parsed.strokes);
                } else if (Array.isArray(parsed.lines)) {
                    setStrokes(parsed.lines);
                }
            } catch {
                // ignore parse error
            }
        }
    }, [value]);

    // Redraw canvas whenever strokes change
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid background
        ctx.save();
        ctx.strokeStyle = '#f0ebe1';
        ctx.lineWidth = 1;
        const gridSize = 24;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        ctx.restore();

        // Draw strokes
        strokes.forEach((stroke) => {
            if (stroke.points.length < 2) return;

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = stroke.width;

            if (stroke.isEraser) {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = stroke.color;
            }

            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
            ctx.restore();
        });
    }, [strokes]);

    // Adjust canvas resolution to parent width
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            const rect = container.getBoundingClientRect();
            if (rect.width > 0 && (canvas.width !== rect.width || canvas.height !== 380)) {
                canvas.width = rect.width;
                canvas.height = 380;
                redrawCanvas();
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [redrawCanvas]);

    useEffect(() => {
        redrawCanvas();
    }, [strokes, redrawCanvas]);

    const getCanvasPoint = (clientX: number, clientY: number): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const startDrawing = (clientX: number, clientY: number) => {
        if (!editable) return;
        setIsDrawing(true);
        const pt = getCanvasPoint(clientX, clientY);
        const newStroke: Stroke = {
            points: [pt],
            color: color,
            width: strokeWidth,
            isEraser: tool === 'eraser',
        };
        setStrokes((prev) => [...prev, newStroke]);
        setRedoStack([]);
    };

    const drawMove = (clientX: number, clientY: number) => {
        if (!isDrawing || !editable) return;
        const pt = getCanvasPoint(clientX, clientY);

        setStrokes((prev) => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            const updatedLast: Stroke = {
                ...last,
                points: [...last.points, pt],
            };
            return [...prev.slice(0, -1), updatedLast];
        });
    };

    const endDrawing = () => {
        if (!isDrawing || !editable) return;
        setIsDrawing(false);

        // Serialize and emit onChange
        setTimeout(() => {
            const canvas = canvasRef.current;
            if (canvas) {
                const dataUrl = canvas.toDataURL('image/png');
                onChange(JSON.stringify({ strokes, preview: dataUrl }));
            }
        }, 50);
    };

    const handleUndo = () => {
        if (strokes.length === 0 || !editable) return;
        const last = strokes[strokes.length - 1];
        const nextStrokes = strokes.slice(0, -1);
        setStrokes(nextStrokes);
        setRedoStack((prev) => [...prev, last]);

        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            onChange(JSON.stringify({ strokes: nextStrokes, preview: dataUrl }));
        }
    };

    const handleRedo = () => {
        if (redoStack.length === 0 || !editable) return;
        const last = redoStack[redoStack.length - 1];
        const nextRedo = redoStack.slice(0, -1);
        const nextStrokes = [...strokes, last];
        setStrokes(nextStrokes);
        setRedoStack(nextRedo);

        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            onChange(JSON.stringify({ strokes: nextStrokes, preview: dataUrl }));
        }
    };

    const handleClear = () => {
        if (!editable) return;
        if (confirm('Hapus seluruh sketsa/coretan?')) {
            setStrokes([]);
            setRedoStack([]);
            onChange(null);
        }
    };

    const downloadImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `sketsa-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {/* Toolbar */}
            {editable && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#F4F0EA] border-b-2 border-black select-none">
                    <div className="flex items-center gap-1.5">
                        {/* Tool selection */}
                        <button
                            type="button"
                            onClick={() => setTool('pen')}
                            className={`p-1.5 border border-black transition-all ${
                                tool === 'pen' ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-neutral-100'
                            }`}
                            title="Pena / Kuas"
                        >
                            <PenTool className="w-4 h-4 text-black" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setTool('eraser')}
                            className={`p-1.5 border border-black transition-all ${
                                tool === 'eraser' ? 'bg-[#FF6B6B] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-neutral-100'
                            }`}
                            title="Penghapus"
                        >
                            <Eraser className="w-4 h-4 text-black" />
                        </button>

                        <div className="w-[1px] h-6 bg-black mx-1" />

                        {/* Palette */}
                        <div className="flex items-center gap-1">
                            {colors.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => {
                                        setColor(c);
                                        setTool('pen');
                                    }}
                                    className={`w-5 h-5 border border-black transition-transform ${
                                        color === c && tool === 'pen' ? 'scale-125 ring-2 ring-black' : 'hover:scale-110'
                                    }`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                />
                            ))}
                        </div>

                        <div className="w-[1px] h-6 bg-black mx-1" />

                        {/* Stroke widths */}
                        <div className="flex items-center gap-1">
                            {widths.map((w) => (
                                <button
                                    key={w}
                                    type="button"
                                    onClick={() => setStrokeWidth(w)}
                                    className={`px-2 py-0.5 border border-black text-xs font-bold transition-all ${
                                        strokeWidth === w ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                                    }`}
                                >
                                    {w}px
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleUndo}
                            disabled={strokes.length === 0}
                            className="p-1.5 border border-black bg-white hover:bg-neutral-100 disabled:opacity-40"
                            title="Undo"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleRedo}
                            disabled={redoStack.length === 0}
                            className="p-1.5 border border-black bg-white hover:bg-neutral-100 disabled:opacity-40"
                            title="Redo"
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1.5 border border-black bg-white hover:bg-rose-100 text-rose-600"
                            title="Hapus Kanvas"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={downloadImage}
                            className="p-1.5 border border-black bg-[#7FBC8C] hover:bg-[#92cca0]"
                            title="Unduh PNG"
                        >
                            <Download className="w-4 h-4 text-black" />
                        </button>
                    </div>
                </div>
            )}

            {/* Canvas Container with touch lock */}
            <div
                ref={containerRef}
                className="w-full relative overflow-hidden bg-white"
                style={{ touchAction: 'none' }} // Prevents mobile browser scrolling while drawing!
            >
                <canvas
                    ref={canvasRef}
                    height={380}
                    className={`w-full block ${editable ? 'cursor-crosshair' : 'cursor-default'}`}
                    onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
                    onMouseMove={(e) => drawMove(e.clientX, e.clientY)}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={(e) => {
                        if (e.touches.length === 1) {
                            e.preventDefault();
                            startDrawing(e.touches[0].clientX, e.touches[0].clientY);
                        }
                    }}
                    onTouchMove={(e) => {
                        if (e.touches.length === 1) {
                            e.preventDefault();
                            drawMove(e.touches[0].clientX, e.touches[0].clientY);
                        }
                    }}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        endDrawing();
                    }}
                />
            </div>
        </div>
    );
}
