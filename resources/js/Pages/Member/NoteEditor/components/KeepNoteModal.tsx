import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChecklistItem, Note, NoteGroup, SystemSettings, User } from '@/types';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import RichTextEditor from '@/Components/Editor/RichTextEditor';
import ChecklistEditor from '@/Components/Editor/ChecklistEditor';
import DrawingCanvas from '@/Components/Editor/DrawingCanvas';
import AttachmentsManager from '@/Components/Editor/AttachmentsManager';
import PersonalNoteReminder from '@/Components/PersonalNoteReminder';
import {
    X, Check, AlertCircle, Users, Share2, Trash2,
    FileText, CheckSquare, PenTool, Paperclip, Clock,
    Folder, Maximize2, Minimize2, Pin
} from 'lucide-react';
import { lockBodyScroll, unlockBodyScroll } from '@/utils/modalScrollLock';

interface KeepNoteModalProps {
    note: Note | null;
    isOpen: boolean;
    onClose: () => void;
    groups: NoteGroup[];
    canEdit: boolean;
    user: User | null;
    systemSettings?: SystemSettings;
    onNoteUpdated: (note: Note) => void;
    onNoteCreated?: (note: Note) => void;
    onDeleteNote: (noteId: string) => void;
    onOpenCollab: (note: Note) => void;
    onOpenShare: (note: Note) => void;
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

export default function KeepNoteModal({
    note,
    isOpen,
    onClose,
    groups,
    canEdit,
    user,
    systemSettings,
    onNoteUpdated,
    onNoteCreated,
    onDeleteNote,
    onOpenCollab,
    onOpenShare,
}: KeepNoteModalProps) {
    const [activeNote, setActiveNote] = useState<Note | null>(note);
    const isNewNote = !activeNote?.id || activeNote.id === '0' || activeNote.id === '';

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [title, setTitle] = useState(note?.title || '');
    const [category, setCategory] = useState<'regular' | 'task'>(note?.category || 'regular');
    const [isPinned, setIsPinned] = useState(note?.is_pinned || false);
    const [deadline, setDeadline] = useState(
        note?.deadline_at ? new Date(note.deadline_at).toISOString().slice(0, 16) : ''
    );
    const [reminderDays, setReminderDays] = useState(
        note?.reminder_days_before ?? (user?.default_reminder_days || 1)
    );

    const [noteType, setNoteType] = useState<'text' | 'checklist' | 'drawing'>('text');
    const [showAttachments, setShowAttachments] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [drawingData, setDrawingData] = useState<string | null>(note?.drawing_data || null);

    // Auto-Save State
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isDirtyRef = useRef(false);

    // Parse note content on mount / when note changes or modal opens
    useEffect(() => {
        if (!isOpen || !note) return;

        setActiveNote(note);
        setTitle(note.title || '');
        setCategory(note.category || 'regular');
        setIsPinned(note.is_pinned || false);
        setDeadline(note.deadline_at ? new Date(note.deadline_at).toISOString().slice(0, 16) : '');
        setReminderDays(note.reminder_days_before ?? (user?.default_reminder_days || 1));
        setDrawingData(note.drawing_data || null);

        let initialFormat: 'text' | 'checklist' | 'drawing' = 'text';

        try {
            if (note.content_json) {
                const parsed = JSON.parse(note.content_json);
                setHtmlContent(parsed.html || '');
                const list = Array.isArray(parsed.checklist) ? parsed.checklist : [];
                setChecklist(list);

                if (parsed.type === 'text' || parsed.type === 'checklist' || parsed.type === 'drawing') {
                    initialFormat = parsed.type;
                } else if (note.drawing_data) {
                    initialFormat = 'drawing';
                } else if (list.length > 0) {
                    initialFormat = 'checklist';
                }
            } else {
                setHtmlContent('');
                setChecklist([]);
                if (note.drawing_data) {
                    initialFormat = 'drawing';
                }
            }
        } catch {
            setHtmlContent(note.content_json || '');
            setChecklist([]);
            if (note.drawing_data) {
                initialFormat = 'drawing';
            }
        }

        setNoteType(initialFormat);
        setShowAttachments(false);
        setAutoSaveStatus('idle');
        isDirtyRef.current = false;
    }, [note?.id, isOpen]);

    // Keep active note attachments in sync when prop updates
    useEffect(() => {
        if (note?.attachments) {
            setActiveNote((prev) =>
                prev
                    ? {
                          ...prev,
                          attachments: note.attachments,
                      }
                    : null
            );
        }
    }, [note?.attachments]);

    // Form ref to eliminate stale closures
    const formRef = useRef({
        title,
        category,
        isPinned,
        deadline,
        reminderDays,
        noteType,
        htmlContent,
        checklist,
        drawingData,
    });

    useEffect(() => {
        formRef.current = {
            title,
            category,
            isPinned,
            deadline,
            reminderDays,
            noteType,
            htmlContent,
            checklist,
            drawingData,
        };
    }, [title, category, isPinned, deadline, reminderDays, noteType, htmlContent, checklist, drawingData]);

    // Persist changes to server (supports both update and initial create)
    const persistChanges = async (isImmediate = false, overrides: Partial<typeof formRef.current> = {}) => {
        if (!canEdit || !activeNote) return;
        const currentVals = { ...formRef.current, ...overrides };

        // For brand new draft note, don't auto-save if everything is completely empty
        const isCurrentNew = !activeNote.id || activeNote.id === '0' || activeNote.id === '';
        const hasContent =
            currentVals.title.trim().length > 0 ||
            currentVals.htmlContent.trim().length > 0 ||
            currentVals.checklist.length > 0 ||
            Boolean(currentVals.drawingData);

        if (isCurrentNew && !isImmediate && !hasContent) {
            return;
        }

        const contentJson = JSON.stringify({
            type: currentVals.noteType,
            html: currentVals.htmlContent,
            checklist: currentVals.checklist,
        });

        const payload = {
            title: currentVals.title.trim() || 'Catatan Tanpa Judul',
            category: currentVals.category,
            is_pinned: currentVals.isPinned,
            content_json: contentJson,
            drawing_data: currentVals.drawingData,
            deadline_at: currentVals.category === 'task' && currentVals.deadline ? currentVals.deadline : null,
            reminder_days_before: currentVals.category === 'task' ? currentVals.reminderDays : 0,
        };

        setAutoSaveStatus('saving');

        try {
            const csrfToken = getCsrfToken();
            const targetGroupId = activeNote.note_group_id || groups[0]?.id;
            const url = isCurrentNew ? `/groups/${targetGroupId}/notes` : `/notes/${activeNote.id}`;
            const method = isCurrentNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
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
                isDirtyRef.current = false;
                if (data.note) {
                    if (isCurrentNew) {
                        setActiveNote(data.note);
                        if (onNoteCreated) onNoteCreated(data.note);
                    } else {
                        onNoteUpdated(data.note);
                    }
                }
            } else {
                setAutoSaveStatus('error');
            }
        } catch {
            setAutoSaveStatus('error');
        }
    };

    // Debounced trigger for auto-save
    const triggerAutoSave = (overrides: Partial<typeof formRef.current> = {}) => {
        isDirtyRef.current = true;
        setAutoSaveStatus('saving');

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            persistChanges(false, overrides);
        }, 800);
    };

    // Close handler
    const handleCloseModal = async () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        if (isDirtyRef.current) {
            await persistChanges(true);
        }

        onClose();
    };

    const handleCloseModalRef = useRef(handleCloseModal);
    useEffect(() => {
        handleCloseModalRef.current = handleCloseModal;
    });

    // Close on Escape & Lock body scroll
    useEffect(() => {
        if (!isOpen) return;

        lockBodyScroll();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCloseModalRef.current();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            unlockBodyScroll();
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    if (!isOpen || !note || !activeNote) return null;

    // Group name lookup
    const groupName =
        activeNote.group?.name ||
        groups.find((g) => g.id === activeNote.note_group_id)?.name ||
        'Grup';

    const attachmentsCount = activeNote.attachments?.length || 0;

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

    return (
        <div
            className={`fixed inset-0 z-50 flex overscroll-contain animate-in fade-in duration-150 ${
                isFullscreen
                    ? 'p-0 bg-white items-stretch justify-stretch'
                    : 'items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/60'
            }`}
            onClick={handleCloseModal}
        >
            {/* Modal Dialog Container */}
            <div
                className={`w-full bg-white flex flex-col ${
                    isFullscreen
                        ? 'h-full max-w-none max-h-none border-none shadow-none rounded-none'
                        : 'max-w-4xl rounded-t-[24px] sm:rounded-none border-t-[3px] border-x-[3px] sm:border-[3px] border-black border-b-0 sm:border-b-[3px] shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] sm:max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile Drag Handle Indicator */}
                {!isFullscreen && (
                    <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />
                )}

                {/* Header Bar: Group Info, Actions, Aktifkan Deadline, Simpan */}
                <div className="p-2.5 sm:p-4 border-b-2 border-black bg-[#FFFDF8] shrink-0 space-y-2 select-none">
                    {/* Row 1: Group Name/Select (Left) & Actions + Close (Right) */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <Folder className="w-3.5 h-3.5 text-black shrink-0" />
                            <span className="text-[11px] sm:text-xs font-bold text-neutral-600 uppercase shrink-0">Topik:</span>
                            {isNewNote ? (
                                <select
                                    value={activeNote.note_group_id}
                                    onChange={(e) =>
                                        setActiveNote((prev) => ({
                                            ...prev,
                                            note_group_id: Number(e.target.value),
                                        }))
                                    }
                                    className="text-[11px] sm:text-xs font-heading font-black uppercase bg-white border border-black px-1.5 py-0.5 focus:outline-none cursor-pointer max-w-[130px] sm:max-w-none truncate"
                                >
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <span className="text-black font-black text-xs uppercase truncate max-w-[120px] sm:max-w-none">
                                    {groupName}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            {/* Auto-Save Indicator */}
                            {autoSaveStatus === 'saving' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    <span className="hidden xs:inline">Menyimpan...</span>
                                </span>
                            )}

                            {autoSaveStatus === 'saved' && (
                                <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase bg-[#D4FF32] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                    title={lastSavedTime ? `Tersimpan ${lastSavedTime}` : ''}
                                >
                                    <Check className="w-3 h-3 text-black" />
                                    <span className="hidden xs:inline">Tersimpan</span>
                                </span>
                            )}

                            {canEdit && !isNewNote && (
                                <div className="flex items-center gap-1 border-l border-neutral-300 pl-1">
                                    <button
                                        type="button"
                                        onClick={() => onOpenCollab(activeNote)}
                                        className="p-1 sm:p-1.5 border border-black bg-white hover:bg-[#A388EE] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                        title="Kolaborator Catatan"
                                    >
                                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onOpenShare(activeNote)}
                                        className="p-1 sm:p-1.5 border border-black bg-white hover:bg-[#69D2E7] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                        title="Bagikan Catatan"
                                    >
                                        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
                                                onDeleteNote(activeNote.id);
                                                onClose();
                                            }
                                        }}
                                        className="p-1 sm:p-1.5 border border-black bg-white hover:bg-rose-100 text-rose-600 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                        title="Hapus Catatan"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Pin / Unpin Toggle (Only if canEdit) */}
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextPin = !isPinned;
                                        setIsPinned(nextPin);
                                        triggerAutoSave({ isPinned: nextPin });
                                    }}
                                    className={`p-1 sm:p-1.5 border border-black transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
                                        isPinned ? 'bg-[#FFDC58] text-black font-bold' : 'bg-white hover:bg-neutral-100 text-neutral-600'
                                    }`}
                                    title={isPinned ? 'Lepaskan Sematan (Unpin)' : 'Sematkan Catatan (Pin)'}
                                >
                                    <Pin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPinned ? 'fill-black' : ''}`} />
                                </button>
                            )}

                            {/* Fullscreen Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="p-1 sm:p-1.5 border border-black bg-white hover:bg-[#FFDC58] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                                ) : (
                                    <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                                )}
                            </button>

                            {/* Close button [X] */}
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="p-1 sm:p-1.5 border-2 border-black bg-white hover:bg-rose-100 hover:text-rose-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ml-0.5"
                                title="Tutup (Esc)"
                            >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                            </button>
                        </div>
                    </div>

                    {/* Row 2: Aktifkan Deadline (Left) & Simpan (Right) */}
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-neutral-200">
                        {canEdit ? (
                            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none bg-white border-2 border-black px-2 sm:px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 transition-colors shrink-0">
                                <input
                                    type="checkbox"
                                    checked={category === 'task'}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
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
                                            triggerAutoSave({ category: 'task', deadline: dl });
                                        } else {
                                            setCategory('regular');
                                            setDeadline('');
                                            triggerAutoSave({ category: 'regular', deadline: null });
                                        }
                                    }}
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-black cursor-pointer rounded-none border-2 border-black"
                                />
                                <span className="text-[11px] sm:text-xs font-heading font-black uppercase text-black flex items-center gap-1">
                                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black" />
                                    Aktifkan Deadline
                                </span>
                            </label>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-neutral-100 border border-black text-[10px] font-black uppercase text-neutral-800 tracking-wider">
                                    Read-Only (Hanya Baca)
                                </span>
                                {(category === 'task' || Boolean(deadline)) && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 border border-black px-2 py-0.5">
                                        <Clock className="w-3 h-3 text-rose-600" />
                                        Deadline
                                    </span>
                                )}
                            </div>
                        )}

                        {canEdit && (
                            <NeoButton
                                type="button"
                                variant="yellow"
                                size="sm"
                                onClick={() => persistChanges(true)}
                                disabled={autoSaveStatus === 'saving'}
                                className="shrink-0"
                            >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                {autoSaveStatus === 'saving' ? 'Menyimpan...' : 'Simpan'}
                            </NeoButton>
                        )}
                    </div>
                </div>

                {/* Modal Body - Generous Height without Footer */}
                <div
                    className={`flex-1 ${
                        isFullscreen
                            ? 'p-3 sm:p-6 flex flex-col min-h-0 w-full space-y-3 overflow-hidden'
                            : 'p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4'
                    }`}
                >
                    {/* 1. Pilih Tipe Format Dulu: Teks, Checklist, or Sketsa (+ Lampiran) - 4 Equal Grid Columns */}
                    <div className="shrink-0 grid grid-cols-4 border-2 border-black bg-white select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] divide-x-2 divide-black">
                        <button
                            type="button"
                            onClick={() => {
                                setNoteType('text');
                                setShowAttachments(false);
                                triggerAutoSave({ noteType: 'text' });
                            }}
                            className={`py-1.5 px-1 font-heading font-black text-[11px] sm:text-xs uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                                noteType === 'text' && !showAttachments ? 'bg-[#FFDC58]' : 'bg-white hover:bg-neutral-50'
                            }`}
                            title={hasText ? 'Ada isi teks' : 'Teks catatan'}
                        >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Teks</span>
                            {hasText && (
                                <span className="px-1.5 py-0.5 text-[9px] font-mono font-black bg-black text-white rounded-full shrink-0 leading-none shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                                    Ada
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setNoteType('checklist');
                                setShowAttachments(false);
                                triggerAutoSave({ noteType: 'checklist' });
                            }}
                            className={`py-1.5 px-1 font-heading font-black text-[11px] sm:text-xs uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                                noteType === 'checklist' && !showAttachments ? 'bg-[#7FBC8C]' : 'bg-white hover:bg-neutral-50'
                            }`}
                            title={checklistCount > 0 ? `${checklistCount} item checklist` : 'Checklist'}
                        >
                            <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Checklist</span>
                            {checklistCount > 0 && (
                                <span className="px-1.5 py-0.5 text-[9px] font-mono font-black bg-black text-white rounded-full shrink-0 leading-none shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                                    {checklistCount}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setNoteType('drawing');
                                setShowAttachments(false);
                                triggerAutoSave({ noteType: 'drawing' });
                            }}
                            className={`py-1.5 px-1 font-heading font-black text-[11px] sm:text-xs uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                                noteType === 'drawing' && !showAttachments ? 'bg-[#A388EE]' : 'bg-white hover:bg-neutral-50'
                            }`}
                            title={hasDrawing ? 'Ada sketsa coretan' : 'Sketsa'}
                        >
                            <PenTool className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Sketsa</span>
                            {hasDrawing && (
                                <span className="px-1.5 py-0.5 text-[9px] font-mono font-black bg-black text-white rounded-full shrink-0 leading-none shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                                    Ada
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAttachments(!showAttachments)}
                            className={`py-1.5 px-1 font-heading font-black text-[11px] sm:text-xs uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                                showAttachments ? 'bg-[#69D2E7]' : 'bg-[#F4F0EA] hover:bg-neutral-100'
                            }`}
                            title={attachmentsCount > 0 ? `${attachmentsCount} berkas lampiran` : 'Buka / Tutup Lampiran Berkas'}
                        >
                            <Paperclip className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Berkas</span>
                            {attachmentsCount > 0 && (
                                <span className="px-1.5 py-0.5 text-[9px] font-mono font-black bg-black text-white rounded-full shrink-0 leading-none shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                                    {attachmentsCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* 2. Baru Isi Judul */}
                    <div className="shrink-0">
                        <input
                            type="text"
                            value={title}
                            readOnly={!canEdit}
                            onChange={(e) => {
                                if (!canEdit) return;
                                setTitle(e.target.value);
                                triggerAutoSave({ title: e.target.value });
                            }}
                            placeholder="Judul catatan..."
                            className={`w-full text-base sm:text-xl font-heading font-black border-2 border-black p-2 sm:p-2.5 bg-[#FFFDF8] focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-tight box-border ${
                                !canEdit ? 'cursor-default select-text' : ''
                            }`}
                        />
                    </div>

                    {/* 3. Panel Deadline (Hanya jika Aktifkan Deadline dicentang atau memiliki deadline) */}
                    {(category === 'task' || Boolean(deadline)) && (
                        <div className="shrink-0 p-2 sm:p-2.5 bg-[#FFF3D6] border-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-w-full overflow-hidden">
                            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                                <span className="text-[11px] sm:text-xs font-black uppercase text-black flex items-center gap-1 shrink-0">
                                    <Clock className="w-3.5 h-3.5" />
                                    Tenggat:
                                </span>
                                <input
                                    type="datetime-local"
                                    value={deadline}
                                    readOnly={!canEdit}
                                    disabled={!canEdit}
                                    onChange={(e) => {
                                        if (!canEdit) return;
                                        setDeadline(e.target.value);
                                        triggerAutoSave({ deadline: e.target.value });
                                    }}
                                    className={`text-xs bg-white border border-black px-1.5 py-1 font-bold focus:outline-none max-w-full flex-1 sm:flex-initial ${
                                        !canEdit ? 'cursor-default opacity-90' : ''
                                    }`}
                                />
                            </div>

                            {canEdit && (
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                                    <span className="text-[11px] sm:text-xs font-bold text-neutral-700 shrink-0">Pengingat:</span>
                                    <select
                                        value={reminderDays}
                                        onChange={(e) => {
                                            const days = Number(e.target.value);
                                            setReminderDays(days);
                                            triggerAutoSave({ reminderDays: days });
                                        }}
                                        className="text-xs bg-white border border-black px-1.5 py-1 font-bold focus:outline-none flex-1 sm:flex-initial"
                                    >
                                        <option value={1}>1 hari sebelumnya</option>
                                        <option value={2}>2 hari sebelumnya</option>
                                        <option value={3}>3 hari sebelumnya</option>
                                        <option value={7}>7 hari sebelumnya</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. Ruang Kerja Editor Berdasarkan Tipe Terpilih atau Lampiran */}
                    {showAttachments ? (
                        <div className="border-2 border-black p-3 sm:p-4 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {Boolean(activeNote.id && activeNote.id !== '0') ? (
                                <AttachmentsManager
                                    noteId={activeNote.id}
                                    attachments={activeNote.attachments || []}
                                    canEdit={canEdit}
                                    settings={systemSettings}
                                />
                            ) : (
                                <div className="p-6 text-center space-y-3 bg-[#FFFDF8] border-2 border-dashed border-black">
                                    <Paperclip className="w-8 h-8 text-neutral-400 mx-auto" />
                                    <p className="text-xs sm:text-sm font-bold text-neutral-700">
                                        Simpan catatan terlebih dahulu untuk mengunggah berkas lampiran.
                                    </p>
                                    {canEdit && (
                                        <NeoButton
                                            type="button"
                                            variant="yellow"
                                            size="sm"
                                            onClick={async () => {
                                                await persistChanges(true);
                                            }}
                                        >
                                            Simpan Catatan Sekarang
                                        </NeoButton>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`w-full ${isFullscreen ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
                            {noteType === 'text' && (
                                <div className={isFullscreen ? 'flex-1 min-h-0 flex flex-col' : ''}>
                                    <RichTextEditor
                                        value={htmlContent}
                                        content={htmlContent}
                                        onChange={(newHtml) => {
                                            setHtmlContent(newHtml);
                                            triggerAutoSave({ htmlContent: newHtml });
                                        }}
                                        editable={canEdit}
                                        placeholder="Ketik teks catatan Anda di sini..."
                                        className={isFullscreen ? 'flex-1 min-h-0' : 'min-h-[260px]'}
                                    />
                                </div>
                            )}

                            {noteType === 'checklist' && (
                                <ChecklistEditor
                                    items={checklist}
                                    onChange={(newChecklist) => {
                                        setChecklist(newChecklist);
                                        triggerAutoSave({ checklist: newChecklist });
                                    }}
                                    editable={canEdit}
                                    className="min-h-[220px]"
                                />
                            )}

                            {noteType === 'drawing' && (
                                <DrawingCanvas
                                    value={drawingData}
                                    drawingData={drawingData}
                                    onChange={(newData) => {
                                        setDrawingData(newData);
                                        triggerAutoSave({ drawingData: newData });
                                    }}
                                    editable={canEdit}
                                />
                            )}
                        </div>
                    )}

                    {/* Personal Reminder for Viewers when Read-Only */}
                    {!canEdit && Boolean(activeNote.id && activeNote.id !== '0') && (
                        <div className="pt-2">
                            <PersonalNoteReminder note={activeNote} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
