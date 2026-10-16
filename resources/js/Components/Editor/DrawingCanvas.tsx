import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PenTool, Eraser, Hand, RotateCcw, RotateCw, Trash2, Download, Plus } from 'lucide-react';

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
    drawingData?: string | null;
    onChange: (value: string | null) => void;
    editable?: boolean;
}

export default function DrawingCanvas({
    value,
    drawingData,
    onChange,
    editable = true,
}: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [redoStack, setRedoStack] = useState<Stroke[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'pen' | 'eraser' | 'pan'>('pen');
    const [color, setColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [canvasWidth, setCanvasWidth] = useState<number>(1200);
    const [canvasHeight, setCanvasHeight] = useState<number>(800);

    // Pan state
    const isPanningRef = useRef(false);
    const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
        x: 0,
        y: 0,
        scrollLeft: 0,
        scrollTop: 0,
    });

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

    // Load initial data and calculate needed canvas dimensions dynamically (both X and Y)
    useEffect(() => {
        const dataToLoad = value !== undefined ? value : drawingData;
        if (dataToLoad) {
            try {
                const parsed = JSON.parse(dataToLoad);
                let loadedStrokes: Stroke[] = [];
                if (Array.isArray(parsed.strokes)) {
                    loadedStrokes = parsed.strokes;
                } else if (Array.isArray(parsed.lines)) {
                    loadedStrokes = parsed.lines;
                }
                setStrokes(loadedStrokes);

                // Check max X and Y to automatically scale canvas width & height
                let maxX = 0;
                let maxY = 0;
                loadedStrokes.forEach((s) => {
                    s.points.forEach((p) => {
                        if (p.x > maxX) maxX = p.x;
                        if (p.y > maxY) maxY = p.y;
                    });
                });
                const containerW = containerRef.current?.clientWidth || 800;
                setCanvasWidth(Math.max(1200, containerW, Math.ceil(maxX + 350)));
                setCanvasHeight(Math.max(800, Math.ceil(maxY + 350)));
            } catch {
                // ignore parse error
            }
        } else {
            setStrokes([]);
            const containerW = containerRef.current?.clientWidth || 800;
            setCanvasWidth(Math.max(1200, containerW));
            setCanvasHeight(800);
        }
    }, [value, drawingData]);

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

    // Sync canvas resolution whenever canvasWidth or canvasHeight changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            redrawCanvas();
        }
    }, [canvasWidth, canvasHeight, redrawCanvas]);

    useEffect(() => {
        redrawCanvas();
    }, [strokes, redrawCanvas]);

    const getCanvasPoint = (clientX: number, clientY: number): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
        const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
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

        // Auto-expand canvas width horizontally (rightwards)
        if (pt.x > canvasWidth - 100) {
            setCanvasWidth((prev) => prev + 400);
        }

        // Auto-expand canvas height downwards
        if (pt.y > canvasHeight - 100) {
            setCanvasHeight((prev) => prev + 400);
        }

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

    // Pan methods (supports both mouse and touch)
    const startPan = (clientX: number, clientY: number) => {
        isPanningRef.current = true;
        panStartRef.current = {
            x: clientX,
            y: clientY,
            scrollLeft: containerRef.current?.scrollLeft || 0,
            scrollTop: containerRef.current?.scrollTop || 0,
        };
    };

    const panMove = (clientX: number, clientY: number) => {
        if (!isPanningRef.current || !containerRef.current) return;
        const dx = clientX - panStartRef.current.x;
        const dy = clientY - panStartRef.current.y;
        containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
        containerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
    };

    const endPan = () => {
        isPanningRef.current = false;
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
        <div className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-full overflow-hidden">
            {/* Toolbar */}
            {editable && (
                <div className="p-2 bg-[#F4F0EA] border-b-2 border-black select-none space-y-2">
                    {/* Row 1: Tool, Palette, and Stroke Widths */}
                    <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                        <div className="flex items-center gap-1 shrink-0">
                            {/* Tool selection: Pen, Eraser, Pan */}
                            <button
                                type="button"
                                onClick={() => setTool('pen')}
                                className={`p-1.5 border border-black transition-all cursor-pointer ${
                                    tool === 'pen' ? 'bg-[#FFDC58] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] font-bold' : 'bg-white hover:bg-neutral-100'
                                }`}
                                title="Pena / Kuas"
                            >
                                <PenTool className="w-3.5 h-3.5 text-black" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setTool('eraser')}
                                className={`p-1.5 border border-black transition-all cursor-pointer ${
                                    tool === 'eraser' ? 'bg-[#FF6B6B] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] font-bold' : 'bg-white hover:bg-neutral-100'
                                }`}
                                title="Penghapus"
                            >
                                <Eraser className="w-3.5 h-3.5 text-black" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setTool('pan')}
                                className={`p-1.5 border border-black transition-all cursor-pointer ${
                                    tool === 'pan' ? 'bg-[#69D2E7] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] font-bold' : 'bg-white hover:bg-neutral-100'
                                }`}
                                title="Geser / Navigasi Bebas Kanvas (Pan)"
                            >
                                <Hand className="w-3.5 h-3.5 text-black" />
                            </button>
                        </div>

                        <div className="w-[1px] h-5 bg-black shrink-0" />

                        {/* Palette */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
                            {colors.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => {
                                        setColor(c);
                                        if (tool === 'pan') setTool('pen');
                                    }}
                                    className={`w-4 h-4 sm:w-5 sm:h-5 border border-black transition-transform shrink-0 ${
                                        color === c && tool === 'pen' ? 'scale-110 ring-2 ring-black' : 'hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                />
                            ))}
                        </div>

                        <div className="w-[1px] h-5 bg-black shrink-0" />

                        {/* Stroke widths */}
                        <div className="flex items-center gap-1 shrink-0">
                            {widths.map((w) => (
                                <button
                                    key={w}
                                    type="button"
                                    onClick={() => setStrokeWidth(w)}
                                    className={`px-1.5 py-0.5 border border-black text-[11px] font-bold transition-all shrink-0 ${
                                        strokeWidth === w ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                                    }`}
                                >
                                    {w}px
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Row 2: Action buttons (Undo, Redo, Clear, Download) */}
                    <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-neutral-300">
                        <span className="text-[10px] font-black uppercase text-neutral-600">
                            {tool === 'pan' ? 'Mode Geser Kanvas Aktif' : tool === 'eraser' ? 'Mode Penghapus' : 'Mode Gambar'}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleUndo}
                                disabled={strokes.length === 0}
                                className="p-1 sm:p-1.5 border border-black bg-white hover:bg-neutral-100 disabled:opacity-40 cursor-pointer"
                                title="Undo"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleRedo}
                                disabled={redoStack.length === 0}
                                className="p-1 sm:p-1.5 border border-black bg-white hover:bg-neutral-100 disabled:opacity-40 cursor-pointer"
                                title="Redo"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 sm:p-1.5 border border-black bg-white hover:bg-rose-100 text-rose-600 cursor-pointer"
                                title="Hapus Kanvas"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={downloadImage}
                                className="p-1 sm:p-1.5 border border-black bg-[#7FBC8C] hover:bg-[#92cca0] cursor-pointer"
                                title="Unduh PNG"
                            >
                                <Download className="w-3.5 h-3.5 text-black" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Canvas Container with dynamic 2D horizontal & vertical scrolling */}
            <div
                ref={containerRef}
                className="w-full relative overflow-auto max-h-[58vh] bg-[#FFFDF8] border-b-2 border-black overscroll-contain select-none"
                style={{ touchAction: tool === 'pan' ? 'pan-x pan-y' : 'none' }}
                onMouseDown={(e) => {
                    if (tool === 'pan') {
                        startPan(e.clientX, e.clientY);
                    }
                }}
                onMouseMove={(e) => {
                    if (tool === 'pan') {
                        panMove(e.clientX, e.clientY);
                    }
                }}
                onMouseUp={() => {
                    if (tool === 'pan') {
                        endPan();
                    }
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    style={{
                        width: `${canvasWidth}px`,
                        height: `${canvasHeight}px`,
                        minWidth: `${canvasWidth}px`,
                        minHeight: `${canvasHeight}px`,
                    }}
                    className={`block ${
                        tool === 'pan'
                            ? 'cursor-grab active:cursor-grabbing'
                            : editable
                            ? 'cursor-crosshair'
                            : 'cursor-default'
                    }`}
                    onMouseDown={(e) => {
                        if (tool === 'pan') {
                            startPan(e.clientX, e.clientY);
                        } else {
                            startDrawing(e.clientX, e.clientY);
                        }
                    }}
                    onMouseMove={(e) => {
                        if (tool === 'pan') {
                            panMove(e.clientX, e.clientY);
                        } else {
                            drawMove(e.clientX, e.clientY);
                        }
                    }}
                    onMouseUp={() => {
                        if (tool === 'pan') {
                            endPan();
                        } else {
                            endDrawing();
                        }
                    }}
                    onMouseLeave={() => {
                        if (tool === 'pan') {
                            endPan();
                        } else {
                            endDrawing();
                        }
                    }}
                    onTouchStart={(e) => {
                        if (tool === 'pan' || e.touches.length >= 2) {
                            startPan(e.touches[0].clientX, e.touches[0].clientY);
                        } else if (e.touches.length === 1 && tool !== 'pan') {
                            e.preventDefault();
                            startDrawing(e.touches[0].clientX, e.touches[0].clientY);
                        }
                    }}
                    onTouchMove={(e) => {
                        if (isPanningRef.current) {
                            panMove(e.touches[0].clientX, e.touches[0].clientY);
                        } else if (e.touches.length === 1 && tool !== 'pan') {
                            e.preventDefault();
                            drawMove(e.touches[0].clientX, e.touches[0].clientY);
                        }
                    }}
                    onTouchEnd={(e) => {
                        if (isPanningRef.current) {
                            endPan();
                        } else if (tool !== 'pan') {
                            e.preventDefault();
                            endDrawing();
                        }
                    }}
                />
            </div>

            {/* Dynamic 2D Canvas Expansion Bar (Free horizontal & vertical expansion) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#F4F0EA] select-none text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-neutral-600">
                        Ukuran Kanvas: <span className="font-black text-black">{canvasWidth}px × {canvasHeight}px</span>
                    </span>
                    <span className="text-[10px] text-neutral-500 hidden sm:inline">
                        (Bebas geser ke kanan, kiri, atas, bawah)
                    </span>
                </div>
                {editable && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setCanvasWidth((prev) => prev + 400)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#FFDC58] border border-black font-black uppercase text-[10px] sm:text-[11px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                            title="Tambah ruang kanvas 400px ke kanan"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            +Kanan (400px)
                        </button>
                        <button
                            type="button"
                            onClick={() => setCanvasHeight((prev) => prev + 400)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#A388EE] border border-black font-black uppercase text-[10px] sm:text-[11px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                            title="Tambah ruang kanvas 400px ke bawah"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            +Bawah (400px)
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (containerRef.current) {
                                    containerRef.current.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
                                }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-neutral-100 border border-black font-bold uppercase text-[10px] sm:text-[11px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                            title="Kembali ke pojok kiri atas"
                        >
                            Ke Awal
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
