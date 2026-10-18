import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChecklistItem, Note, NoteGroup } from '@/types';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import RichTextEditor from '@/Components/Editor/RichTextEditor';
import ChecklistEditor from '@/Components/Editor/ChecklistEditor';
import DrawingCanvas from '@/Components/Editor/DrawingCanvas';
import {
    PenLine, CheckSquare, Clock, PenTool, Check,
    FileText, X, Folder, AlertCircle, ChevronDown
} from 'lucide-react';

interface KeepNoteCreatorProps {
    groups: NoteGroup[];
    activeGroupId: number | 'all';
    canEdit: boolean;
    defaultReminderDays?: number;
    topicLabel?: string;
    onNoteCreated: (note: Note) => void;
    autoFocusTrigger?: number;
}

function getCsrfToken(): string {
    return (
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
        document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] ||
        ''
    );
}

export default function KeepNoteCreator({
    groups,
    activeGroupId,
    canEdit,
    defaultReminderDays = 1,
    topicLabel = 'Topik',
    onNoteCreated,
    autoFocusTrigger,
}: KeepNoteCreatorProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Selected target group
    const initialGroupId = activeGroupId === 'all' ? (groups[0]?.id || 0) : activeGroupId;
    const [targetGroupId, setTargetGroupId] = useState<number>(initialGroupId);

    // Update target group when activeGroupId changes if not yet dirty
    useEffect(() => {
        if (activeGroupId !== 'all') {
            setTargetGroupId(activeGroupId);
        } else if (groups.length > 0 && !targetGroupId) {
            setTargetGroupId(groups[0].id);
        }
    }, [activeGroupId, groups]);

    // Focus trigger from external button ("Buat Catatan Baru")
    useEffect(() => {
        if (autoFocusTrigger && autoFocusTrigger > 0) {
            setIsExpanded(true);
            setTimeout(() => {
                titleInputRef.current?.focus();
            }, 50);
        }
    }, [autoFocusTrigger]);

    // Note state
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<'regular' | 'task'>('regular');
    const [deadline, setDeadline] = useState('');
    const [reminderDays, setReminderDays] = useState(defaultReminderDays);
    const [activeTab, setActiveTab] = useState<'text' | 'checklist' | 'drawing'>('text');

    const [htmlContent, setHtmlContent] = useState('');
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [drawingData, setDrawingData] = useState<string | null>(null);

    // Server syncing & auto-save
    const [draftNoteId, setDraftNoteId] = useState<number | null>(null);
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isSavingRef = useRef(false);

    // Check if form has any meaningful content
    const hasContent = Boolean(
        title.trim() ||
        (htmlContent && htmlContent !== '<p></p>' && htmlContent !== '<p><br></p>') ||
        checklist.length > 0 ||
        drawingData
    );

    const hasText = Boolean(
        htmlContent &&
        htmlContent.replace(/<p><br\s*\/?>\s*<\/p>|<p>\s*<\/p>|<br\s*\/?>|<[^>]*>/gi, '').trim().length > 0
    );

    const checklistCount = checklist.length;

    let drawingStrokesCount = 0;
    if (drawingData) {
        try {
            const parsed = JSON.parse(drawingData);
            if (Array.isArray(parsed.strokes)) {
                drawingStrokesCount = parsed.strokes.length;
            } else if (Array.isArray(parsed.lines)) {
                drawingStrokesCount = parsed.lines.length;
            }
        } catch {
            if (drawingData.includes('"points"')) {
                drawingStrokesCount = 1;
            }
        }
    }
    const hasDrawing = drawingStrokesCount > 0;

    // Form ref to eliminate stale closures during debounce
    const formRef = useRef({
        title,
        category,
        deadline,
        reminderDays,
        activeTab,
        htmlContent,
        checklist,
        drawingData,
        targetGroupId,
        draftNoteId,
    });

    useEffect(() => {
        formRef.current = {
            title,
            category,
            deadline,
            reminderDays,
            activeTab,
            htmlContent,
            checklist,
            drawingData,
            targetGroupId,
            draftNoteId,
        };
    }, [title, category, deadline, reminderDays, activeTab, htmlContent, checklist, drawingData, targetGroupId, draftNoteId]);

    // Save or update note to backend
    const persistNote = async (isClosing = false) => {
        if (!canEdit) return;
        const currentVals = formRef.current;
        if (!currentVals.targetGroupId) return;

        const effectiveTitle =
            currentVals.title.trim() ||
            (currentVals.category === 'task' ? 'Tugas Baru' : 'Catatan Baru');
        const contentJson = JSON.stringify({
            type: currentVals.activeTab,
            html: currentVals.htmlContent,
            checklist: currentVals.checklist,
        });

        const payload: Record<string, any> = {
            title: effectiveTitle,
            category: currentVals.category,
            content_json: contentJson,
            drawing_data: currentVals.drawingData,
            deadline_at:
                currentVals.category === 'task' && currentVals.deadline ? currentVals.deadline : null,
            reminder_days_before: currentVals.category === 'task' ? currentVals.reminderDays : 0,
        };

        setAutoSaveStatus('saving');
        isSavingRef.current = true;

        try {
            const csrfToken = getCsrfToken();

            if (currentVals.draftNoteId) {
                // Update existing draft
                const res = await fetch(`/notes/${currentVals.draftNoteId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    const data = await res.json();
                    setAutoSaveStatus('saved');
                    setLastSavedTime(
                        new Date().toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        })
                    );
                    if (data.note) {
                        onNoteCreated(data.note);
                    }
                } else {
                    setAutoSaveStatus('error');
                }
            } else {
                // Create new note
                const res = await fetch(`/groups/${currentVals.targetGroupId}/notes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.note) {
                        setDraftNoteId(data.note.id);
                        formRef.current.draftNoteId = data.note.id;
                        onNoteCreated(data.note);
                    }
                    setAutoSaveStatus('saved');
                    setLastSavedTime(
                        new Date().toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        })
                    );
                } else {
                    setAutoSaveStatus('error');
                }
            }
        } catch {
            setAutoSaveStatus('error');
        } finally {
            isSavingRef.current = false;
        }
    };

    // Debounced trigger for auto-save
    const triggerDebouncedSave = (overrides: Partial<typeof formRef.current> = {}) => {
        const merged = { ...formRef.current, ...overrides };
        const hasAnyContent = Boolean(
            merged.title.trim() ||
            (merged.htmlContent &&
                merged.htmlContent !== '<p></p>' &&
                merged.htmlContent !== '<p><br></p>') ||
            merged.checklist.length > 0 ||
            merged.drawingData
        );

        if (!hasAnyContent) return;

        setAutoSaveStatus('saving');
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            persistNote();
        }, 800);
    };

    // Handle Deadline toggle
    const handleDeadlineToggle = (checked: boolean) => {
        if (checked) {
            setCategory('task');
            let dl = deadline;
            if (!dl) {
                const defaultDate = new Date();
                defaultDate.setDate(defaultDate.getDate() + 3);
                defaultDate.setHours(23, 59, 0, 0);
                dl = defaultDate.toISOString().slice(0, 16);
                setDeadline(dl);
            }
            triggerDebouncedSave({ category: 'task', deadline: dl });
        } else {
            setCategory('regular');
            setDeadline('');
            triggerDebouncedSave({ category: 'regular', deadline: '' });
        }
    };

    // Close and reset creator
    const handleClose = async () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        // If there is content and it hasn't saved yet or changed, flush save immediately
        if (hasContent) {
            await persistNote(true);
        }

        // Reset state
        setTitle('');
        setCategory('regular');
        setDeadline('');
        setReminderDays(defaultReminderDays);
        setActiveTab('text');
        setHtmlContent('');
        setChecklist([]);
        setDrawingData(null);
        setDraftNoteId(null);
        setAutoSaveStatus('idle');
        setLastSavedTime(null);
        setIsExpanded(false);
    };

    // Click outside to auto-close & save
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                isExpanded &&
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded, hasContent, persistNote]);

    if (!canEdit || groups.length === 0) {
        return null;
    }

    return (
        <div ref={containerRef} className="w-full transition-all select-none">
            {!isExpanded ? (
                /* 1. COLLAPSED GOOGLE KEEP-STYLE BAR */
                <div
                    onClick={() => {
                        setIsExpanded(true);
                        setTimeout(() => titleInputRef.current?.focus(), 50);
                    }}
                    className="w-full bg-white border-2 border-black p-3.5 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-text flex items-center justify-between gap-3"
                >
                    <div className="flex items-center gap-3 text-neutral-500 font-bold text-sm">
                        <PenLine className="w-4 h-4 text-black" />
                        <span className="font-heading uppercase tracking-wide text-xs sm:text-sm">
                            Tulis catatan baru...
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsExpanded(true);
                                setActiveTab('checklist');
                                setTimeout(() => titleInputRef.current?.focus(), 50);
                            }}
                            className="p-2 border border-black bg-white hover:bg-[#7FBC8C] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                            title="Buat Daftar Checklist"
                        >
                            <CheckSquare className="w-4 h-4 text-black" />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsExpanded(true);
                                handleDeadlineToggle(true);
                                setTimeout(() => titleInputRef.current?.focus(), 50);
                            }}
                            className="p-2 border border-black bg-white hover:bg-[#FF6B6B] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                            title="Catatan dengan Deadline"
                        >
                            <Clock className="w-4 h-4 text-black" />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsExpanded(true);
                                setActiveTab('drawing');
                                setTimeout(() => titleInputRef.current?.focus(), 50);
                            }}
                            className="p-2 border border-black bg-white hover:bg-[#A388EE] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                            title="Gambar / Sketsa Baru"
                        >
                            <PenTool className="w-4 h-4 text-black" />
                        </button>
                    </div>
                </div>
            ) : (
                /* 2. EXPANDED IN-PLACE GOOGLE KEEP-STYLE FORM */
                <div className="w-full bg-white border-[3px] border-black p-5 sm:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                    {/* Top Controls: Folder Picker & Deadline Toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
                        {/* Topic Picker */}
                        <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-black" />
                            <span className="text-xs font-black uppercase font-heading">{topicLabel || 'Topik'}:</span>
                            <select
                                value={targetGroupId}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setTargetGroupId(val);
                                    triggerDebouncedSave({ targetGroupId: val });
                                }}
                                className="px-2.5 py-1 text-xs font-bold bg-[#F4F0EA] border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer outline-none"
                            >
                                {groups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Deadline Checkbox Toggle */}
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 transition-colors">
                            <input
                                type="checkbox"
                                checked={category === 'task'}
                                onChange={(e) => handleDeadlineToggle(e.target.checked)}
                                className="w-4 h-4 accent-black cursor-pointer rounded-none border-2 border-black"
                            />
                            <span className="text-xs font-heading font-black uppercase text-black flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-black" />
                                Aktifkan Deadline
                            </span>
                        </label>
                    </div>

                    {/* 1. Format Tabs: Teks / Checklist / Sketsa (Pilih Tipe Dulu) */}
                    <div className="flex border-2 border-black bg-white select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('text')}
                            className={`flex-1 py-1.5 font-heading font-black text-xs uppercase flex items-center justify-center gap-1.5 border-r-2 border-black cursor-pointer transition-colors ${
                                activeTab === 'text' ? 'bg-[#FFDC58]' : 'bg-white hover:bg-neutral-50'
                            }`}
                            title={hasText ? 'Ada isi teks' : 'Teks catatan'}
                        >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>Teks</span>
                            {hasText && (
                                <span className="px-1.5 py-0.5 text-[9px] font-mono font-black bg-black text-white rounded-full shrink-0 leading-none shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                                    Ada
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('checklist')}
                            className={`flex-1 py-1.5 font-heading font-black text-xs uppercase flex items-center justify-center gap-1.5 border-r-2 border-black cursor-pointer transition-colors ${
                                activeTab === 'checklist' ? 'bg-[#7FBC8C]' : 'bg-white hover:bg-neutral-50'
                            }`}
                            title={checklistCount > 0 ? `${checklistCount} item checklist` : 'Checklist'}
                        >
                            <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                            <span>Checklist</span>
                            {checklistCount > 0 && (
                                <span className="px-1.5 py-0.5 text-[9px] font-mono font-black bg-black text-white rounded-full shrink-0 leading-none shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                                    {checklistCount}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('drawing')}
                            className={`flex-1 py-1.5 font-heading font-black text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                                activeTab === 'drawing' ? 'bg-[#A388EE]' : 'bg-white hover:bg-neutral-50'
                            }`}
                            title={hasDrawing ? 'Ada sketsa coretan' : 'Sketsa'}
                        >
                            <PenTool className="w-3.5 h-3.5 shrink-0" />
                            <span>Sketsa</span>
                            {hasDrawing && (
                                <span className="px-1.5 py-0.5 text-[9px] font-mono font-black bg-black text-white rounded-full shrink-0 leading-none shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                                    Ada
                                </span>
                            )}
                        </button>
                    </div>

                    {/* 2. Title Input (Baru Isi Judul) */}
                    <div>
                        <input
                            ref={titleInputRef}
                            type="text"
                            placeholder="Judul Catatan..."
                            value={title}
                            onChange={(e) => {
                                const val = e.target.value;
                                setTitle(val);
                                triggerDebouncedSave({ title: val });
                            }}
                            className="w-full text-xl sm:text-2xl font-black font-heading tracking-tight border-b-2 border-black pb-1 outline-none uppercase bg-transparent placeholder-neutral-400"
                        />
                    </div>

                    {/* 3. Deadline Settings (if Deadline Activated) */}
                    {category === 'task' && (
                        <div className="p-3 bg-[#F4F0EA] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                            <div>
                                <label className="block text-[11px] font-bold uppercase mb-1">
                                    Tanggal & Jam Batas Waktu (Deadline)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setDeadline(val);
                                        triggerDebouncedSave({ deadline: val });
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-medium outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase mb-1">
                                    Ingatkan Sebelum Deadline
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="number"
                                        min={0}
                                        max={30}
                                        value={reminderDays}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            setReminderDays(val);
                                            triggerDebouncedSave({ reminderDays: val });
                                        }}
                                        className="w-20 px-2.5 py-1.5 text-xs bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold text-center outline-none"
                                    />
                                    <span className="text-xs font-bold text-neutral-600">
                                        Hari Sebelum Deadline
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Tab Content Area */}
                    <div className="min-h-[160px]">
                        {activeTab === 'text' && (
                            <RichTextEditor
                                value={htmlContent}
                                onChange={(val) => {
                                    setHtmlContent(val);
                                    triggerDebouncedSave({ htmlContent: val });
                                }}
                            />
                        )}

                        {activeTab === 'checklist' && (
                            <ChecklistEditor
                                items={checklist}
                                onChange={(newItems) => {
                                    setChecklist(newItems);
                                    triggerDebouncedSave({ checklist: newItems });
                                }}
                            />
                        )}

                        {activeTab === 'drawing' && (
                            <DrawingCanvas
                                value={drawingData}
                                onChange={(val) => {
                                    setDrawingData(val);
                                    triggerDebouncedSave({ drawingData: val });
                                }}
                            />
                        )}
                    </div>

                    {/* Bottom Action & Auto-Save Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-black">
                        {/* Auto-Save Status Indicator */}
                        <div className="flex items-center gap-2">
                            {autoSaveStatus === 'saving' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase bg-amber-100 text-amber-900 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                    Menyimpan otomatis...
                                </span>
                            )}

                            {autoSaveStatus === 'saved' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase bg-[#D4FF32] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    <Check className="w-3.5 h-3.5 text-black" />
                                    Tersimpan Otomatis {lastSavedTime ? `(${lastSavedTime})` : ''}
                                </span>
                            )}

                            {autoSaveStatus === 'error' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase bg-rose-100 text-rose-900 border border-black">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                    Gagal auto-save
                                </span>
                            )}

                            {autoSaveStatus === 'idle' && (
                                <span className="text-[11px] font-bold text-neutral-400 uppercase">
                                    Auto-Save Pro Aktif
                                </span>
                            )}
                        </div>

                        {/* Action Buttons: Simpan & Tutup */}
                        <div className="flex items-center gap-2">
                            <NeoButton
                                type="button"
                                variant="yellow"
                                size="sm"
                                onClick={() => persistNote(false)}
                                disabled={!hasContent || autoSaveStatus === 'saving'}
                            >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Simpan
                            </NeoButton>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-1.5 bg-white hover:bg-neutral-100 border-2 border-black font-heading font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
