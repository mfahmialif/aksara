import React, { useState, useEffect } from 'react';
import { NoteGroup } from '@/types';
import NeoModal from '@/Components/UI/NeoModal';
import { NeoInput } from '@/Components/UI/NeoInput';
import NeoButton from '@/Components/UI/NeoButton';
import {
    FolderKanban, Plus, Search, ChevronLeft, ChevronRight,
    Edit3, Trash2, Share2, BookOpen, X, Layers, Settings2, Check,
    GripVertical
} from 'lucide-react';

export interface FloatingTopicSidebarProps {
    groups: NoteGroup[];
    activeGroupId: string | 'all';
    setActiveGroupId: (id: string | 'all') => void;
    totalNotesAll: number;
    canEdit: boolean;
    isOwner: boolean;
    isGroupSharedView?: boolean;
    sharedGroup?: NoteGroup | null;
    isPublicView?: boolean;
    topicLabel?: string;
    onUpdateTopicLabel?: (newLabel: string) => void;
    onOpenAddGroup: () => void;
    onOpenEditGroup: (group: NoteGroup) => void;
    onDeleteGroup: (groupId: string) => void;
    onOpenShareGroup?: (group: NoteGroup) => void;
    onReorderGroups?: (reorderedGroups: { id: string; sort_order: number }[]) => void;
    isMinimized: boolean;
    setIsMinimized: (val: boolean) => void;
    mobileDrawerOpen?: boolean;
    setMobileDrawerOpen?: (val: boolean) => void;
}

const POPULAR_TOPIC_PRESETS = [
    'Topik',
    'Mata Kuliah',
    'Kategori',
    'Proyek',
    'Modul',
    'Bab',
    'Seksi',
    'Folder',
];

export default function FloatingTopicSidebar({
    groups,
    activeGroupId,
    setActiveGroupId,
    totalNotesAll,
    canEdit,
    isOwner,
    isGroupSharedView = false,
    sharedGroup,
    isPublicView = false,
    topicLabel = 'Topik',
    onUpdateTopicLabel,
    onOpenAddGroup,
    onOpenEditGroup,
    onDeleteGroup,
    onOpenShareGroup,
    onReorderGroups,
    isMinimized,
    setIsMinimized,
    mobileDrawerOpen: controlledMobileDrawerOpen,
    setMobileDrawerOpen: controlledSetMobileDrawerOpen,
}: FloatingTopicSidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [internalMobileDrawerOpen, setInternalMobileDrawerOpen] = useState(false);
    const mobileDrawerOpen = typeof controlledMobileDrawerOpen === 'boolean' ? controlledMobileDrawerOpen : internalMobileDrawerOpen;
    const setMobileDrawerOpen = (val: boolean) => {
        if (controlledSetMobileDrawerOpen) {
            controlledSetMobileDrawerOpen(val);
        } else {
            setInternalMobileDrawerOpen(val);
        }
    };

    // Local reactive groups state for live drag reordering
    const [localGroupsList, setLocalGroupsList] = useState<NoteGroup[]>(groups);
    const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);

    useEffect(() => {
        setLocalGroupsList(groups);
    }, [groups]);

    const canDrag = canEdit && !isGroupSharedView && !searchQuery.trim();

    const handleDragStart = (e: React.DragEvent, group: NoteGroup) => {
        if (!canDrag) return;
        setDraggedGroupId(group.id);
        e.dataTransfer.setData('text/plain', group.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetGroup: NoteGroup) => {
        if (!canDrag || !draggedGroupId || draggedGroupId === targetGroup.id) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        setLocalGroupsList((prev) => {
            const fromIndex = prev.findIndex((g) => g.id === draggedGroupId);
            const toIndex = prev.findIndex((g) => g.id === targetGroup.id);
            if (fromIndex < 0 || toIndex < 0) return prev;

            const updated = [...prev];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            return updated;
        });
    };

    const handleDragEnd = () => {
        const currentId = draggedGroupId;
        setDraggedGroupId(null);
        if (!currentId || !onReorderGroups) return;

        const payload = localGroupsList.map((g, idx) => ({
            id: g.id,
            sort_order: idx + 1,
        }));
        onReorderGroups(payload);
    };

    // Modal state for owner to rename topic label
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [tempTopicLabel, setTempTopicLabel] = useState(topicLabel);
    const [savingTopicLabel, setSavingTopicLabel] = useState(false);

    useEffect(() => {
        setTempTopicLabel(topicLabel);
    }, [topicLabel]);

    // Filter topics by quick search
    const filteredGroups = localGroupsList.filter((g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    // Find active group metadata
    const activeGroup = localGroupsList.find((g) => g.id === activeGroupId);
    const activeGroupName =
        activeGroupId === 'all'
            ? `Semua ${topicLabel}`
            : activeGroup?.name || (isGroupSharedView && sharedGroup ? sharedGroup.name : topicLabel);
    const activeGroupColor =
        activeGroupId === 'all'
            ? '#FFDC58'
            : activeGroup?.color || (isGroupSharedView && sharedGroup?.color) || '#FFDC58';

    const handleSelectTopic = (id: string | 'all') => {
        setActiveGroupId(id);
        setMobileDrawerOpen(false);
    };

    const handleSaveTopicLabel = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = tempTopicLabel.trim() || 'Topik';
        setSavingTopicLabel(true);
        if (onUpdateTopicLabel) {
            await onUpdateTopicLabel(trimmed);
        }
        setSavingTopicLabel(false);
        setRenameModalOpen(false);
    };

    return (
        <>
            {/* ========================================================= */}
            {/* 1. DESKTOP FLOATING / STICKY SIDEBAR (>= md)              */}
            {/* ========================================================= */}
            <div className="hidden md:block shrink-0 sticky top-20 self-start z-20">
                {isMinimized ? (
                    /* MINIMIZED FLOATING PILL TRIGGER */
                    <button
                        type="button"
                        onClick={() => setIsMinimized(false)}
                        className="bg-[#FFFDF8] hover:bg-[#FFDC58] border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 px-3 py-2 flex items-center gap-2 cursor-pointer transition-all select-none group shrink-0"
                        title={`Buka Sidebar ${topicLabel}`}
                    >
                        <div className="w-6 h-6 bg-black border border-black flex items-center justify-center shrink-0">
                            <Layers className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-heading font-black uppercase text-black">
                            <span>{topicLabel}:</span>
                            {activeGroupId === 'all' ? (
                                <span className="bg-[#FFDC58] px-1.5 py-0.5 border border-black text-[10px]">
                                    Semua ({totalNotesAll})
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 max-w-[110px] truncate bg-white px-1.5 py-0.5 border border-black text-[10px]">
                                    <span
                                        className="w-2 h-2 border border-black shrink-0"
                                        style={{ backgroundColor: activeGroupColor }}
                                    />
                                    <span className="truncate">{activeGroupName}</span>
                                </span>
                            )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform" />
                    </button>
                ) : (
                    /* EXPANDED FLOATING SIDEBAR PANEL */
                    <div className="w-64 lg:w-72 bg-[#FFFDF8] border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[calc(100vh-6.5rem)] select-none transition-all duration-150 animate-in fade-in slide-in-from-left-2">
                        {/* Header Bar */}
                        <div className="p-3 bg-[#FFDC58] border-b-2 border-black flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-6 h-6 bg-black border border-black flex items-center justify-center shrink-0">
                                    <Layers className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="font-heading font-black text-xs sm:text-sm uppercase tracking-tight text-black truncate">
                                    Daftar {topicLabel}
                                </span>
                                <span className="px-1.5 py-0.2 bg-white border border-black text-[10px] font-black shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    {groups.length}
                                </span>

                                {/* Owner Topic Term Settings Button */}
                                {isOwner && canEdit && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTempTopicLabel(topicLabel);
                                            setRenameModalOpen(true);
                                        }}
                                        className="p-1 hover:bg-black/10 rounded cursor-pointer transition-colors ml-0.5"
                                        title={`Ubah Istilah '${topicLabel}' (misal: Mata Kuliah, Kategori, Proyek...)`}
                                    >
                                        <Settings2 className="w-3.5 h-3.5 text-black" />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsMinimized(true)}
                                className="w-7 h-7 bg-white hover:bg-[#FF6B6B] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-all shrink-0 ml-1"
                                title={`Sembunyikan / Minimize ${topicLabel}`}
                                aria-label={`Minimize ${topicLabel}`}
                            >
                                <ChevronLeft className="w-4 h-4 text-black" />
                            </button>
                        </div>

                        {/* Search Filter (shown if multiple topics) */}
                        {groups.length > 3 && (
                            <div className="p-2 border-b-2 border-black bg-white shrink-0">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                                    <input
                                        type="text"
                                        placeholder={`Cari ${topicLabel.toLowerCase()}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#FFFDF8] border border-black font-medium focus:outline-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2 top-2 text-neutral-400 hover:text-black"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Scrollable Topics List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
                            {/* 1. "Semua {topicLabel}" Option (hidden in single group view) */}
                            {!isGroupSharedView && (
                                <button
                                    type="button"
                                    onClick={() => handleSelectTopic('all')}
                                    className={`w-full p-2 border-2 border-black text-left flex items-center justify-between transition-all cursor-pointer ${
                                        activeGroupId === 'all'
                                            ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black'
                                            : 'bg-white hover:bg-neutral-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <BookOpen className="w-3.5 h-3.5 text-black shrink-0" />
                                        <span className="text-xs font-heading uppercase truncate">
                                            Semua {topicLabel}
                                        </span>
                                    </div>
                                    <span className="px-1.5 py-0.2 bg-black text-white text-[10px] font-black shrink-0">
                                        {totalNotesAll}
                                    </span>
                                </button>
                            )}

                            {/* 2. Topics List */}
                            {filteredGroups.length === 0 ? (
                                <div className="p-4 text-center text-xs text-neutral-500 font-medium">
                                    {searchQuery ? `${topicLabel} tidak ditemukan` : `Belum ada ${topicLabel.toLowerCase()}`}
                                </div>
                            ) : (
                                filteredGroups.map((group) => {
                                    const isActive = activeGroupId === group.id;
                                    const isDragging = draggedGroupId === group.id;
                                    const noteCount = group.notes?.length || 0;
                                    const topicColor = group.color || '#FFDC58';

                                    return (
                                        <div
                                            key={group.id}
                                            draggable={canDrag}
                                            onDragStart={(e) => handleDragStart(e, group)}
                                            onDragOver={(e) => handleDragOver(e, group)}
                                            onDragEnd={handleDragEnd}
                                            className={`group/item border-2 border-black transition-all flex items-start justify-between p-2 gap-2 select-none ${
                                                isDragging
                                                    ? 'opacity-40 border-dashed bg-neutral-200'
                                                    : isActive
                                                    ? 'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black ring-1 ring-black'
                                                    : 'bg-white hover:bg-neutral-50 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                                            }`}
                                            style={{
                                                backgroundColor: isActive ? topicColor : '#FFFFFF',
                                            }}
                                        >
                                            <div
                                                onClick={() => handleSelectTopic(group.id)}
                                                className="flex-1 min-w-0 text-left flex items-start gap-1.5 cursor-pointer"
                                                title={`${topicLabel}: ${group.name} (${noteCount} catatan)`}
                                            >
                                                {canDrag && (
                                                    <div
                                                        className="cursor-grab active:cursor-grabbing text-neutral-400 group-hover/item:text-black shrink-0 mt-0.5 -ml-0.5"
                                                        title="Tarik untuk memindahkan urutan folder"
                                                    >
                                                        <GripVertical className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                                <span
                                                    className="w-3.5 h-3.5 border border-black shrink-0 mt-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                                    style={{ backgroundColor: topicColor }}
                                                />
                                                <span className="text-xs font-heading font-bold uppercase break-words whitespace-normal min-w-0 text-black leading-tight">
                                                    {group.name}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                                {/* Action Buttons: Share, Edit, Delete (hidden unless hovered so badge is perfectly aligned with Semua Mata Kuliah) */}
                                                <div className="hidden group-hover/item:flex items-center gap-0.5 animate-in fade-in duration-100">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onOpenShareGroup?.(group);
                                                        }}
                                                        className="p-1 bg-white hover:bg-[#69D2E7] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer transition-colors"
                                                        title={`Bagikan ${topicLabel}`}
                                                    >
                                                        <Share2 className="w-3 h-3 text-black" />
                                                    </button>

                                                    {canEdit && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onOpenEditGroup(group);
                                                                }}
                                                                className="p-1 bg-white hover:bg-[#FFDC58] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer transition-colors"
                                                                title={`Ubah Nama & Warna ${topicLabel}`}
                                                            >
                                                                <Edit3 className="w-3 h-3 text-black" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDeleteGroup(group.id);
                                                                }}
                                                                className="p-1 bg-white hover:bg-[#FF6B6B] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer transition-colors"
                                                                title={`Hapus ${topicLabel}`}
                                                            >
                                                                <Trash2 className="w-3 h-3 text-black hover:text-rose-700" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Note Count Badge (ALWAYS at the far right, matching SEMUA MATA KULIAH) */}
                                                <span className="px-1.5 py-0.2 bg-black text-white text-[10px] font-black shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                    {noteCount}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer: Add Topic Button */}
                        {canEdit && !isGroupSharedView && (
                            <div className="p-2 border-t-2 border-black bg-[#FAF7EE] shrink-0">
                                <button
                                    type="button"
                                    onClick={onOpenAddGroup}
                                    className="w-full py-2 px-3 bg-white hover:bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-xs font-heading font-black uppercase text-black flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                >
                                    <Plus className="w-4 h-4 text-black" />
                                    <span>Tambah {topicLabel} Baru</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* 2. MOBILE FLOATING TRIGGER & DRAWER (< md)                */}
            {/* ========================================================= */}
            <div className="md:hidden">
                {/* Floating Mobile Trigger Button (bottom-left) */}
                <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(true)}
                    className="fixed left-4 bottom-20 z-40 bg-[#FFDC58] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 px-3 py-2 flex items-center gap-2 cursor-pointer select-none"
                    title={`Pilih ${topicLabel}`}
                >
                    <Layers className="w-4 h-4 text-black shrink-0" />
                    <span className="font-heading font-black text-xs uppercase text-black truncate max-w-[130px]">
                        {activeGroupId === 'all' ? `Semua ${topicLabel}` : activeGroupName}
                    </span>
                    <span className="px-1.5 py-0.2 bg-black text-white text-[10px] font-black">
                        {activeGroupId === 'all'
                            ? totalNotesAll
                            : activeGroup?.notes?.length || 0}
                    </span>
                </button>

                {/* Mobile Drawer Overlay */}
                {mobileDrawerOpen && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-in fade-in"
                            onClick={() => setMobileDrawerOpen(false)}
                        />
                        <div className="fixed inset-x-4 top-16 bottom-20 z-50 bg-[#FFFDF8] border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
                            {/* Drawer Header */}
                            <div className="p-3 bg-[#FFDC58] border-b-2 border-black flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Layers className="w-4 h-4 text-black" />
                                    <span className="font-heading font-black text-sm uppercase text-black">
                                        Pilih {topicLabel}
                                    </span>
                                    {isOwner && canEdit && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileDrawerOpen(false);
                                                setTempTopicLabel(topicLabel);
                                                setRenameModalOpen(true);
                                            }}
                                            className="p-1 hover:bg-black/10 rounded cursor-pointer"
                                            title="Ubah Istilah"
                                        >
                                            <Settings2 className="w-3.5 h-3.5 text-black" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMobileDrawerOpen(false)}
                                    className="w-7 h-7 bg-white hover:bg-[#FF6B6B] border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center cursor-pointer"
                                >
                                    <X className="w-4 h-4 text-black" />
                                </button>
                            </div>

                            {/* Topics List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {!isGroupSharedView && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelectTopic('all')}
                                        className={`w-full p-2.5 border-2 border-black text-left flex items-center justify-between cursor-pointer ${
                                            activeGroupId === 'all'
                                                ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black'
                                                : 'bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-black" />
                                            <span className="text-xs font-heading uppercase">
                                                Semua {topicLabel}
                                            </span>
                                        </div>
                                        <span className="px-2 py-0.5 bg-black text-white text-xs font-black">
                                            {totalNotesAll}
                                        </span>
                                    </button>
                                )}

                                {localGroupsList.map((group) => {
                                    const isActive = activeGroupId === group.id;
                                    const noteCount = group.notes?.length || 0;
                                    const topicColor = group.color || '#FFDC58';

                                    return (
                                        <div
                                            key={group.id}
                                            className={`p-2 border-2 border-black flex items-start justify-between gap-2 ${
                                                isActive
                                                    ? 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black'
                                                    : 'bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                            }`}
                                            style={{
                                                backgroundColor: isActive ? topicColor : '#FFFFFF',
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleSelectTopic(group.id)}
                                                className="flex-1 text-left flex items-start gap-2 min-w-0 cursor-pointer"
                                            >
                                                <span
                                                    className="w-3 h-3 border border-black shrink-0 mt-0.5"
                                                    style={{ backgroundColor: topicColor }}
                                                />
                                                <span className="text-xs font-heading uppercase break-words whitespace-normal text-black leading-tight min-w-0">
                                                    {group.name}
                                                </span>
                                            </button>

                                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMobileDrawerOpen(false);
                                                        onOpenShareGroup?.(group);
                                                    }}
                                                    className="p-1 bg-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                                    title={`Bagikan ${topicLabel}`}
                                                >
                                                    <Share2 className="w-3.5 h-3.5 text-black" />
                                                </button>

                                                {canEdit && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMobileDrawerOpen(false);
                                                                onOpenEditGroup(group);
                                                            }}
                                                            className="p-1 bg-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                                            title={`Edit ${topicLabel}`}
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5 text-black" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMobileDrawerOpen(false);
                                                                onDeleteGroup(group.id);
                                                            }}
                                                            className="p-1 bg-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                                            title={`Hapus ${topicLabel}`}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                                        </button>
                                                    </>
                                                )}

                                                <span className="px-1.5 py-0.5 bg-black text-white text-[10px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                    {noteCount}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Mobile Drawer Footer: Add Topic */}
                            {canEdit && !isGroupSharedView && (
                                <div className="p-3 border-t-2 border-black bg-[#FAF7EE] shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMobileDrawerOpen(false);
                                            onOpenAddGroup();
                                        }}
                                        className="w-full py-2.5 px-3 bg-[#FFDC58] hover:bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-heading font-black text-xs uppercase text-black flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4 text-black" />
                                        <span>Tambah {topicLabel} Baru</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ========================================================= */}
            {/* 3. OWNER MODAL: RENAME TOPIC TERMINOLOGY                  */}
            {/* ========================================================= */}
            {isOwner && (
                <NeoModal
                    isOpen={renameModalOpen}
                    onClose={() => setRenameModalOpen(false)}
                    title="Ubah Istilah Topik"
                    maxWidth="sm"
                >
                    <form onSubmit={handleSaveTopicLabel} className="space-y-4">
                        <p className="text-xs text-neutral-700 font-medium leading-relaxed">
                            Sesuaikan istilah pengelompokan catatan untuk ruang kerja ini sesuai kebutuhan Anda. Contoh: <strong>Mata Kuliah</strong>, <strong>Topik</strong>, <strong>Kategori</strong>, <strong>Proyek</strong>, <strong>Bab</strong>, atau <strong>Modul</strong>.
                        </p>

                        <div>
                            <NeoInput
                                label="Nama Istilah (Tunggal)"
                                placeholder="Contoh: Mata Kuliah, Topik, Proyek..."
                                value={tempTopicLabel}
                                onChange={(e) => setTempTopicLabel(e.target.value)}
                                maxLength={50}
                                required
                                autoFocus
                            />

                            <div className="mt-3">
                                <span className="text-[11px] font-heading font-black uppercase text-neutral-600 block mb-1.5">
                                    Pilihan Populer:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {POPULAR_TOPIC_PRESETS.map((preset) => {
                                        const isSelected = tempTopicLabel.trim().toLowerCase() === preset.toLowerCase();
                                        return (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setTempTopicLabel(preset)}
                                                className={`text-[11px] font-heading font-black px-2.5 py-1 border-2 border-black transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                                                        : 'bg-white hover:bg-neutral-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                                }`}
                                            >
                                                {preset}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2 border-t-2 border-black">
                            <NeoButton
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setRenameModalOpen(false)}
                            >
                                Batal
                            </NeoButton>
                            <NeoButton
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={savingTopicLabel || !tempTopicLabel.trim()}
                            >
                                {savingTopicLabel ? 'Menyimpan...' : 'Simpan Istilah'}
                            </NeoButton>
                        </div>
                    </form>
                </NeoModal>
            )}
        </>
    );
}
