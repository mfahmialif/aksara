import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Note, NoteGroup } from '@/types';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import {
    Folder, Plus, Search, Clock, CheckSquare, PenTool,
    Paperclip, Share2, Trash2, Edit3, Check, X, BookOpen,
    ArrowRight, FileText, Pin, GripVertical, Loader2, Sparkles
} from 'lucide-react';

interface WorkspaceExplorerProps {
    groups: NoteGroup[];
    activeGroupId: string | 'all';
    setActiveGroupId: (id: string | 'all') => void;
    filteredNotes: (Note & { group_name?: string })[];
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    categoryFilter: 'all' | 'regular' | 'task';
    setCategoryFilter: (c: 'all' | 'regular' | 'task') => void;
    canEdit: boolean;
    onSelectNote: (note: Note) => void;
    onCreateNote: (groupId: string, category: 'regular' | 'task') => void;
    onDeleteNote: (id: string) => void;
    onOpenNoteShare: (note: Note) => void;
    onTogglePin?: (note: Note) => void;
    onReorderNotes?: (reorderedNotes: { id: string; sort_order: number; is_pinned?: boolean }[]) => void;
    editingGroupId?: string | null;
    setEditingGroupId?: (id: string | null) => void;
    editingGroupName?: string;
    setEditingGroupName?: (name: string) => void;
    newGroupName?: string;
    setNewGroupName?: (name: string) => void;
    onSaveRenameGroup?: (groupId: string) => void;
    onDeleteGroup?: (groupId: string) => void;
    onAddGroup?: (e: React.FormEvent) => void;
    defaultReminderDays?: number;
    onNoteCreated?: (note: Note) => void;
    onOpenCreateModal?: (format?: 'text' | 'checklist' | 'drawing') => void;
    topicLabel?: string;
}

export default function WorkspaceExplorer({
    groups,
    activeGroupId,
    setActiveGroupId,
    filteredNotes,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    canEdit,
    onSelectNote,
    onCreateNote,
    onDeleteNote,
    onOpenNoteShare,
    onTogglePin,
    onReorderNotes,
    editingGroupId,
    setEditingGroupId,
    editingGroupName,
    setEditingGroupName,
    newGroupName,
    setNewGroupName,
    onSaveRenameGroup,
    onDeleteGroup,
    onAddGroup,
    defaultReminderDays,
    onNoteCreated,
    onOpenCreateModal,
    topicLabel = 'Topik',
}: WorkspaceExplorerProps) {
    const [creatorFocusTrigger, setCreatorFocusTrigger] = useState(0);

    // Local notes state for live real-time drag reordering
    const [localNotes, setLocalNotes] = useState(filteredNotes);
    const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);

    // Refs for FLIP animation and tracking drag interactions
    const initialNotesRef = useRef(filteredNotes);
    const cardsRef = useRef<Map<string, HTMLDivElement>>(new Map());
    const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());
    const lastOverIdRef = useRef<string | null>(null);

    // Synchronize localNotes with props when not actively dragging
    useEffect(() => {
        if (!draggedNoteId) {
            setLocalNotes(filteredNotes);
        }
    }, [filteredNotes, draggedNoteId]);

    // Active group object
    const activeGroup = groups.find((g) => g.id === activeGroupId);
    const activeGroupName = activeGroupId === 'all' ? `Semua ${topicLabel}` : activeGroup?.name || topicLabel;

    // Separate notes into Pinned and Others from localNotes
    const pinnedNotes = localNotes.filter((n) => Boolean(n.is_pinned));
    const otherNotes = localNotes.filter((n) => !n.is_pinned);

    // Infinite Scroll for unpinned / general notes
    const INITIAL_BATCH = 18;
    const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Reset pagination when filter or search changes
    useEffect(() => {
        setVisibleCount(INITIAL_BATCH);
    }, [searchQuery, categoryFilter, activeGroupId]);

    const visibleOtherNotes = otherNotes.slice(0, visibleCount);
    const hasMore = visibleCount < otherNotes.length;

    // IntersectionObserver for Infinite Scroll
    useEffect(() => {
        if (!hasMore) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    setIsLoadingMore(true);
                    setTimeout(() => {
                        setVisibleCount((prev) => prev + 12);
                        setIsLoadingMore(false);
                    }, 250);
                }
            },
            { rootMargin: '250px' }
        );

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) {
            observer.observe(currentSentinel);
        }

        return () => {
            if (currentSentinel) observer.unobserve(currentSentinel);
            observer.disconnect();
        };
    }, [hasMore, visibleCount, isLoadingMore]);

    // Snapshot bounding client rects before updating DOM for smooth FLIP animation
    const snapshotCardPositions = () => {
        const map = new Map<string, DOMRect>();
        cardsRef.current.forEach((el, id) => {
            if (el) {
                map.set(id, el.getBoundingClientRect());
            }
        });
        prevRectsRef.current = map;
    };

    // FLIP Animation effect (First, Last, Invert, Play)
    const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
    useIsomorphicLayoutEffect(() => {
        if (prevRectsRef.current.size === 0) return;

        const animElements: HTMLDivElement[] = [];

        cardsRef.current.forEach((el, id) => {
            if (!el || id === draggedNoteId) return;
            const prevRect = prevRectsRef.current.get(id);
            if (!prevRect) return;

            const currentRect = el.getBoundingClientRect();
            const deltaX = prevRect.left - currentRect.left;
            const deltaY = prevRect.top - currentRect.top;

            if (deltaX !== 0 || deltaY !== 0) {
                el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                el.style.transition = 'none';
                animElements.push(el);
            }
        });

        prevRectsRef.current.clear();

        if (animElements.length > 0) {
            // Force browser reflow so the inverted position is acknowledged
            animElements[0]?.offsetHeight;

            const rafId = requestAnimationFrame(() => {
                animElements.forEach((el) => {
                    el.style.transition = 'transform 260ms cubic-bezier(0.2, 0, 0, 1)';
                    el.style.transform = '';
                });
            });

            return () => cancelAnimationFrame(rafId);
        }
    }, [localNotes, draggedNoteId]);

    // Google Keep-Style Drag & Drop Handlers
    const handleDragStart = (e: React.DragEvent, note: Note) => {
        if (!canEdit) return;
        initialNotesRef.current = [...localNotes];
        lastOverIdRef.current = note.id;
        e.dataTransfer.setData('text/plain', String(note.id));
        e.dataTransfer.effectAllowed = 'move';

        // Set dragged ID on next animation frame so the browser can capture the full card ghost image
        requestAnimationFrame(() => {
            setDraggedNoteId(note.id);
        });
    };

    // Live swapping when hovering over another card
    const handleDragOverCard = (e: React.DragEvent, targetNote: Note, targetSection: 'pinned' | 'other') => {
        if (!canEdit || !draggedNoteId || draggedNoteId === targetNote.id) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        if (lastOverIdRef.current === targetNote.id) return;
        lastOverIdRef.current = targetNote.id;

        // Snapshot existing card positions before mutating state
        snapshotCardPositions();

        setLocalNotes((prevNotes) => {
            const draggedIndex = prevNotes.findIndex((n) => n.id === draggedNoteId);
            const targetIndex = prevNotes.findIndex((n) => n.id === targetNote.id);
            if (draggedIndex < 0 || targetIndex < 0) return prevNotes;

            const updated = [...prevNotes];
            const [draggedItem] = updated.splice(draggedIndex, 1);

            const updatedItem = {
                ...draggedItem,
                is_pinned: targetSection === 'pinned',
            };

            updated.splice(targetIndex, 0, updatedItem);
            return updated;
        });
    };

    // Live section transfer when hovering over empty space or headers
    const handleDragOverSection = (e: React.DragEvent, targetSection: 'pinned' | 'other') => {
        if (!canEdit || !draggedNoteId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const currentNote = localNotes.find((n) => n.id === draggedNoteId);
        if (!currentNote) return;

        const targetIsPinned = targetSection === 'pinned';
        if (Boolean(currentNote.is_pinned) === targetIsPinned) return;

        const sectionKey = `section-${targetSection}`;
        if (lastOverIdRef.current === sectionKey) return;
        lastOverIdRef.current = sectionKey;

        snapshotCardPositions();

        setLocalNotes((prevNotes) => {
            const draggedIndex = prevNotes.findIndex((n) => n.id === draggedNoteId);
            if (draggedIndex < 0) return prevNotes;

            const updated = [...prevNotes];
            const [draggedItem] = updated.splice(draggedIndex, 1);

            const updatedItem = {
                ...draggedItem,
                is_pinned: targetIsPinned,
            };

            if (targetIsPinned) {
                let lastPinnedIndex = -1;
                for (let i = updated.length - 1; i >= 0; i--) {
                    if (updated[i].is_pinned) {
                        lastPinnedIndex = i;
                        break;
                    }
                }
                if (lastPinnedIndex >= 0) {
                    updated.splice(lastPinnedIndex + 1, 0, updatedItem);
                } else {
                    updated.unshift(updatedItem);
                }
            } else {
                const firstOtherIndex = updated.findIndex((n) => !n.is_pinned);
                if (firstOtherIndex >= 0) {
                    updated.splice(firstOtherIndex, 0, updatedItem);
                } else {
                    updated.push(updatedItem);
                }
            }

            return updated;
        });
    };

    // Commit final order and persist to server
    const handleDragEnd = () => {
        lastOverIdRef.current = null;
        const currentDraggedId = draggedNoteId;
        const finalOrder = localNotes;
        setDraggedNoteId(null);

        if (!currentDraggedId) return;

        const initial = initialNotesRef.current;
        const isDifferent =
            finalOrder.length !== initial.length ||
            finalOrder.some((note, index) => {
                const initNote = initial[index];
                return !initNote || initNote.id !== note.id || Boolean(initNote.is_pinned) !== Boolean(note.is_pinned);
            });

        if (isDifferent) {
            const payload = finalOrder.map((note, index) => ({
                id: note.id,
                sort_order: index,
                is_pinned: Boolean(note.is_pinned),
            }));

            onReorderNotes?.(payload);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleDragEnd();
    };

    const parseContentSnippet = (contentJson: string | null): string => {
        if (!contentJson) return 'Catatan kosong...';
        try {
            const parsed = JSON.parse(contentJson);
            if (parsed.html) {
                const text = parsed.html.replace(/<[^>]*>/g, '').trim();
                return text.slice(0, 100) || 'Catatan dokumen tanpa teks.';
            }
        } catch {
            return contentJson.replace(/<[^>]*>/g, '').slice(0, 100) || 'Catatan dokumen...';
        }
        return 'Catatan dokumen...';
    };

    const getChecklistSummary = (contentJson: string | null) => {
        if (!contentJson) return null;
        try {
            const parsed = JSON.parse(contentJson);
            if (Array.isArray(parsed.checklist) && parsed.checklist.length > 0) {
                const total = parsed.checklist.length;
                const done = parsed.checklist.filter((item: { completed?: boolean }) => item.completed).length;
                return { total, done };
            }
        } catch {
            return null;
        }
        return null;
    };

    const getNoteFormat = (note: Note): 'text' | 'checklist' | 'drawing' => {
        if (note.content_json) {
            try {
                const parsed = JSON.parse(note.content_json);
                if (parsed.type === 'text' || parsed.type === 'checklist' || parsed.type === 'drawing') {
                    return parsed.type;
                }
                if (note.drawing_data) return 'drawing';
                if (Array.isArray(parsed.checklist) && parsed.checklist.length > 0) return 'checklist';
            } catch {
                if (note.drawing_data) return 'drawing';
            }
        }
        if (note.drawing_data) return 'drawing';
        return 'text';
    };

    // Render an individual Note Card
    const renderCard = (note: Note & { group_name?: string }, section: 'pinned' | 'other' | 'all') => {
        const isTask = note.category === 'task';
        const hasDeadline = Boolean(note.deadline_at) || isTask;
        const checklistInfo = getChecklistSummary(note.content_json);
        const snippet = parseContentSnippet(note.content_json);
        const attachmentsCount = note.attachments?.length || 0;
        const noteFormat = getNoteFormat(note);
        const isDragging = draggedNoteId === note.id;
        const noteGroup = groups.find((g) => g.id === note.note_group_id) || note.group;
        const folderName = noteGroup?.name || note.group_name || note.group?.name || '';
        const folderColor = noteGroup?.color || '#FFDC58';

        return (
            <div
                key={note.id}
                ref={(el) => {
                    if (el) {
                        cardsRef.current.set(note.id, el);
                    } else {
                        cardsRef.current.delete(note.id);
                    }
                }}
                draggable={canEdit}
                onDragStart={(e) => handleDragStart(e, note)}
                onDragOver={(e) => handleDragOverCard(e, note, section === 'all' ? (note.is_pinned ? 'pinned' : 'other') : section)}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                onClick={() => onSelectNote(note)}
                className={`group bg-white border-2 border-black cursor-pointer p-5 flex flex-col justify-between min-h-[220px] select-none ${
                    isDragging
                        ? 'opacity-35 scale-95 border-dashed border-2 border-black bg-[#FFFBEA] shadow-none ring-2 ring-black/20'
                        : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1'
                }`}
            >
                <div>
                    {/* Row 1: Top Meta Bar (Category/Deadline on left, Pin & Drag Handle on right) */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            {/* Deadline with Date or Regular Catatan Badge */}
                            {hasDeadline ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-heading font-black uppercase bg-[#FF6B6B] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                    <Clock className="w-3 h-3 stroke-[2.5]" />
                                    <span>
                                        {note.deadline_at
                                            ? new Date(note.deadline_at).toLocaleDateString('id-ID', {
                                                  day: 'numeric',
                                                  month: 'short',
                                              })
                                            : 'Deadline'}
                                    </span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-heading font-black uppercase bg-[#FFDC58] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                    Catatan
                                </span>
                            )}

                            {/* Format Badge (Checklist or Drawing) */}
                            {noteFormat === 'checklist' && (
                                <span className="px-1.5 py-0.5 text-[9px] font-heading font-black uppercase bg-[#7FBC8C] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                    Checklist
                                </span>
                            )}
                            {noteFormat === 'drawing' && (
                                <span className="px-1.5 py-0.5 text-[9px] font-heading font-black uppercase bg-[#A388EE] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                    Sketsa
                                </span>
                            )}
                        </div>

                        {/* Top Right: Pin Toggle & Drag Handle */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={() => onTogglePin?.(note)}
                                    className={`w-7 h-7 border border-black transition-all cursor-pointer flex items-center justify-center ${
                                        note.is_pinned
                                            ? 'bg-[#FFDC58] text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                                            : 'bg-white hover:bg-[#FFDC58] text-neutral-400 hover:text-black opacity-70 group-hover:opacity-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                                    title={note.is_pinned ? 'Lepaskan Sematan (Unpin)' : 'Sematkan Catatan (Pin)'}
                                >
                                    <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? 'fill-black text-black' : ''}`} />
                                </button>
                            )}

                            {canEdit && (
                                <span
                                    className="w-5 h-7 flex items-center justify-center text-neutral-400 hover:text-black cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Tahan & geser untuk mengubah urutan posisi"
                                >
                                    <GripVertical className="w-3.5 h-3.5" />
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Dedicated Topic Folder Badge for uniform vertical alignment */}
                    {folderName && (
                        <div className="mb-2.5">
                            <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-heading font-black uppercase text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] max-w-full truncate"
                                style={{ backgroundColor: folderColor }}
                                title={`${topicLabel}: ${folderName}`}
                            >
                                <Folder className="w-3 h-3 shrink-0 text-black" />
                                <span className="truncate">{folderName}</span>
                            </span>
                        </div>
                    )}

                    {/* Row 3: Note Title */}
                    <h4 className="font-heading font-black text-base sm:text-lg text-black uppercase mb-1.5 group-hover:text-black line-clamp-2 leading-snug">
                        {note.title || 'Catatan Tanpa Judul'}
                    </h4>

                    {/* Row 4: Excerpt / Summary */}
                    <p className="text-xs text-neutral-600 font-medium line-clamp-3 mb-4 leading-relaxed">
                        {snippet}
                    </p>
                </div>

                {/* Row 5: Card Footer (Meta badges + Action buttons) */}
                <div className="pt-3 border-t-2 border-black flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        {checklistInfo && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 bg-[#E8F5E9] text-emerald-900 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                <CheckSquare className="w-3 h-3 text-emerald-700" />
                                {checklistInfo.done}/{checklistInfo.total}
                            </span>
                        )}
                        {note.drawing_data && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 bg-[#EDE7F6] text-purple-900 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Memiliki Sketsa">
                                <PenTool className="w-3 h-3 text-purple-700" />
                                Sketsa
                            </span>
                        )}
                        {attachmentsCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 bg-[#E0F2FE] text-sky-900 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Berkas Lampiran">
                                <Paperclip className="w-3 h-3 text-sky-700" />
                                {attachmentsCount}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => onOpenNoteShare(note)}
                            className="w-7 h-7 bg-white hover:bg-[#69D2E7] border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-all"
                            title="Bagikan Catatan"
                        >
                            <Share2 className="w-3.5 h-3.5 text-black" />
                        </button>
                        {canEdit && (
                            <button
                                type="button"
                                onClick={() => onDeleteNote(note.id)}
                                className="w-7 h-7 bg-white hover:bg-[#FF6B6B] border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-all"
                                title="Hapus Catatan"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-black" />
                            </button>
                        )}
                        <span
                            onClick={() => onSelectNote(note)}
                            className="h-7 px-2.5 bg-[#FFDC58] hover:bg-[#FFE57F] border border-black font-heading font-black text-xs uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1 cursor-pointer transition-all"
                        >
                            Buka <ArrowRight className="w-3 h-3" />
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* 1. SEARCH, CATEGORY FILTER & PRIMARY CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {/* Search Bar */}
                <div className="flex-1 relative min-w-[200px]">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <input
                        type="text"
                        placeholder={`Cari catatan dalam ${activeGroupName}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#FFFDF8] border-2 border-black font-medium focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                </div>

                {/* Category Filter Pills */}
                <div className="flex w-full sm:w-auto border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                    <button
                        type="button"
                        onClick={() => setCategoryFilter('all')}
                        className={`flex-1 sm:flex-initial text-center px-3 py-2 cursor-pointer transition-colors ${
                            categoryFilter === 'all' ? 'bg-black text-white font-black' : 'bg-white hover:bg-neutral-100'
                        }`}
                    >
                        Semua
                    </button>
                    <button
                        type="button"
                        onClick={() => setCategoryFilter('regular')}
                        className={`flex-1 sm:flex-initial text-center px-3 py-2 border-l-2 border-black cursor-pointer transition-colors ${
                            categoryFilter === 'regular' ? 'bg-[#FFDC58] text-black font-black' : 'bg-white hover:bg-neutral-100'
                        }`}
                    >
                        Catatan
                    </button>
                    <button
                        type="button"
                        onClick={() => setCategoryFilter('task')}
                        className={`flex-1 sm:flex-initial text-center px-3 py-2 border-l-2 border-black cursor-pointer transition-colors ${
                            categoryFilter === 'task' ? 'bg-[#FF6B6B] text-black font-black' : 'bg-white hover:bg-neutral-100'
                        }`}
                    >
                        Deadline
                    </button>
                </div>

                {/* Primary Button: Create Note */}
                {canEdit && groups.length > 0 && (
                    <NeoButton
                        variant="yellow"
                        size="md"
                        onClick={() => onOpenCreateModal ? onOpenCreateModal('text') : setCreatorFocusTrigger((prev) => prev + 1)}
                        className="shrink-0 w-full sm:w-auto justify-center"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Buat Catatan Baru
                    </NeoButton>
                )}
            </div>

            {/* 2. GOOGLE KEEP-STYLE QUICK BAR (CLICKS DIRECTLY OPEN MODAL) */}
            {canEdit && groups.length > 0 && (
                <div
                    onClick={() => onOpenCreateModal && onOpenCreateModal('text')}
                    className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer select-none"
                >
                    <div className="flex items-center gap-2.5 text-neutral-500 font-bold text-xs sm:text-sm">
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                        <span>Tulis catatan baru...</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => onOpenCreateModal && onOpenCreateModal('text')}
                            className="p-1.5 sm:p-2 border border-black bg-white hover:bg-[#FFDC58] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                            title="Catatan Teks Baru"
                        >
                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenCreateModal && onOpenCreateModal('checklist')}
                            className="p-1.5 sm:p-2 border border-black bg-white hover:bg-[#7FBC8C] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                            title="Checklist Baru"
                        >
                            <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenCreateModal && onOpenCreateModal('drawing')}
                            className="p-1.5 sm:p-2 border border-black bg-white hover:bg-[#A388EE] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                            title="Sketsa / Gambar Baru"
                        >
                            <PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                        </button>
                    </div>
                </div>
            )}

            {/* 3. RESPONSIVE GRID OF NOTE CARDS */}
            {filteredNotes.length === 0 ? (
                /* Empty State */
                <div className="border-[3px] border-black bg-white p-12 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                    <div className="w-16 h-16 bg-[#FFDC58] border-2 border-black flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <BookOpen className="w-8 h-8 text-black" />
                    </div>
                    <div>
                        <h3 className="font-heading font-black text-xl uppercase text-black mb-1">
                            Belum Ada Catatan di {activeGroupName}
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-600 font-medium max-w-md mx-auto">
                            {searchQuery
                                ? 'Tidak ada catatan yang cocok dengan kata kunci pencarian Anda.'
                                : `${topicLabel} ini masih kosong. Buat catatan materi biasa atau catatan dengan deadline dan pengingat sekarang.`}
                        </p>
                    </div>

                    {canEdit && groups.length > 0 && (
                        <div className="pt-2">
                            <NeoButton
                                variant="yellow"
                                size="lg"
                                onClick={() => onOpenCreateModal ? onOpenCreateModal('text') : setCreatorFocusTrigger((prev) => prev + 1)}
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Mulai Tulis Catatan Sekarang
                            </NeoButton>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* SECTION 1: DISEMATKAN / PINNED NOTES */}
                    {(pinnedNotes.length > 0 || (draggedNoteId !== null && otherNotes.length > 0)) && (
                        <div
                            className="space-y-3"
                            onDragOver={(e) => handleDragOverSection(e, 'pinned')}
                            onDrop={handleDrop}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-heading font-black uppercase text-black tracking-wider flex items-center gap-1.5 bg-[#FFDC58] border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <Pin className="w-3.5 h-3.5 fill-black text-black" />
                                    Disematkan ({pinnedNotes.length})
                                </span>
                                <div className="flex-1 h-[2px] bg-black" />
                            </div>

                            {pinnedNotes.length === 0 && draggedNoteId !== null ? (
                                <div className="p-6 border-2 border-dashed border-black bg-[#FFFBEA] text-center font-heading font-black text-xs uppercase text-neutral-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    📌 Tarik dan lepas kartu di sini untuk menyematkan ke bagian atas
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {pinnedNotes.map((note) => renderCard(note, 'pinned'))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECTION 2: LAINNYA / UNPINNED NOTES (WITH INFINITE SCROLL) */}
                    {(otherNotes.length > 0 || (draggedNoteId !== null && pinnedNotes.length > 0)) && (
                        <div
                            className="space-y-3"
                            onDragOver={(e) => handleDragOverSection(e, 'other')}
                            onDrop={handleDrop}
                        >
                            {pinnedNotes.length > 0 && (
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="text-xs font-heading font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5 bg-neutral-100 border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <FileText className="w-3.5 h-3.5 text-neutral-700" />
                                        Lainnya ({otherNotes.length})
                                    </span>
                                    <div className="flex-1 h-[2px] bg-neutral-300" />
                                </div>
                            )}

                            {otherNotes.length === 0 && draggedNoteId !== null && pinnedNotes.length > 0 ? (
                                <div className="p-6 border-2 border-dashed border-black bg-neutral-50 text-center font-heading font-black text-xs uppercase text-neutral-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    Tarik dan lepas kartu di sini untuk membatalkan sematan
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {visibleOtherNotes.map((note) => renderCard(note, 'other'))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* INFINITE SCROLL SENTINEL & LOAD MORE STATUS */}
                    {otherNotes.length > 0 && (
                        <div ref={sentinelRef} className="py-6 text-center select-none">
                            {hasMore ? (
                                <div className="flex flex-col items-center justify-center gap-3">
                                    {isLoadingMore ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-xs uppercase animate-pulse">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Memuat Catatan Lainnya...
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setVisibleCount((prev) => prev + 12)}
                                            className="px-4 py-2 bg-white hover:bg-[#FFDC58] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 font-heading font-black text-xs uppercase transition-all cursor-pointer"
                                        >
                                            Muat Lebih Banyak ({otherNotes.length - visibleCount} catatan tersisa)
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4F0EA] border-2 border-black text-[11px] font-heading font-bold uppercase text-neutral-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    Menampilkan seluruh {filteredNotes.length} catatan
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
