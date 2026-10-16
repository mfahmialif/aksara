import React, { useState } from 'react';
import { Note, NoteGroup } from '@/types';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import {
    Folder, Plus, Search, Clock, CheckSquare, PenTool,
    Paperclip, Share2, Trash2, Edit3, Check, X, BookOpen,
    ArrowRight, FileText
} from 'lucide-react';

interface WorkspaceExplorerProps {
    groups: NoteGroup[];
    activeGroupId: number | 'all';
    setActiveGroupId: (id: number | 'all') => void;
    filteredNotes: (Note & { group_name?: string })[];
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    categoryFilter: 'all' | 'regular' | 'task';
    setCategoryFilter: (c: 'all' | 'regular' | 'task') => void;
    canEdit: boolean;
    onSelectNote: (note: Note) => void;
    onCreateNote: (groupId: number, category: 'regular' | 'task') => void;
    onDeleteNote: (id: number) => void;
    onOpenNoteShare: (note: Note) => void;
    editingGroupId: number | null;
    setEditingGroupId: (id: number | null) => void;
    editingGroupName: string;
    setEditingGroupName: (name: string) => void;
    newGroupName: string;
    setNewGroupName: (name: string) => void;
    onSaveRenameGroup: (groupId: number) => void;
    onDeleteGroup: (groupId: number) => void;
    onAddGroup: (e: React.FormEvent) => void;
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
    editingGroupId,
    setEditingGroupId,
    editingGroupName,
    setEditingGroupName,
    newGroupName,
    setNewGroupName,
    onSaveRenameGroup,
    onDeleteGroup,
    onAddGroup,
}: WorkspaceExplorerProps) {
    const [isAddingGroup, setIsAddingGroup] = useState(false);

    // Active group object
    const activeGroup = groups.find((g) => g.id === activeGroupId);
    const activeGroupName = activeGroupId === 'all' ? 'Semua Grup' : activeGroup?.name || 'Grup';
    const fallbackGroupId = activeGroupId === 'all' ? (groups[0]?.id || 0) : activeGroupId;

    const totalNotesAll = groups.reduce((acc, g) => acc + (g.notes?.length || 0), 0);

    const handleFormSubmitAddGroup = (e: React.FormEvent) => {
        onAddGroup(e);
        setIsAddingGroup(false);
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

    return (
        <div className="space-y-6">
            {/* 1. FOLDER & GRUP NAVIGATION BAR */}
            <div className="p-4 sm:p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b-2 border-black">
                    <div className="flex items-center gap-2">
                        <Folder className="w-5 h-5 text-black" />
                        <h2 className="font-heading font-black text-sm uppercase tracking-wider text-black">
                            Folder / Grup ({groups.length})
                        </h2>
                    </div>

                    {canEdit && !isAddingGroup && (
                        <button
                            type="button"
                            onClick={() => setIsAddingGroup(true)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-[#FFDC58] border-2 border-black text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Tambah Grup
                        </button>
                    )}
                </div>

                {/* Inline Add Group Form */}
                {isAddingGroup && (
                    <form onSubmit={handleFormSubmitAddGroup} className="flex flex-wrap items-center gap-2 p-2 bg-[#F4F0EA] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <input
                            type="text"
                            placeholder="Ketik nama grup baru..."
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-white border-2 border-black font-medium focus:outline-none"
                            autoFocus
                            required
                        />
                        <NeoButton type="submit" variant="yellow" size="sm">
                            Simpan Grup
                        </NeoButton>
                        <NeoButton type="button" variant="white" size="sm" onClick={() => setIsAddingGroup(false)}>
                            Batal
                        </NeoButton>
                    </form>
                )}

                {/* Horizontal Group Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                    <button
                        type="button"
                        onClick={() => setActiveGroupId('all')}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 border-2 border-black text-xs font-heading font-bold uppercase whitespace-nowrap transition-all cursor-pointer ${
                            activeGroupId === 'all'
                                ? 'bg-[#FFDC58] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-0.5 translate-y-0.5'
                                : 'bg-[#FBF9F5] hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                    >
                        <span>Semua Catatan</span>
                        <span className="px-1.5 py-0.2 bg-black text-white text-[10px] font-black">
                            {totalNotesAll}
                        </span>
                    </button>

                    {groups.map((group) => {
                        const isActive = activeGroupId === group.id;
                        const isEditing = editingGroupId === group.id;
                        const noteCount = group.notes?.length || 0;

                        if (isEditing) {
                            return (
                                <div key={group.id} className="flex items-center gap-1 border-2 border-black bg-white p-1">
                                    <input
                                        type="text"
                                        value={editingGroupName}
                                        onChange={(e) => setEditingGroupName(e.target.value)}
                                        className="px-2 py-0.5 text-xs border border-black font-bold"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => onSaveRenameGroup(group.id)}
                                        className="p-1 bg-[#7FBC8C] border border-black text-xs cursor-pointer"
                                        title="Simpan Nama"
                                    >
                                        <Check className="w-3.5 h-3.5 text-black" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingGroupId(null)}
                                        className="p-1 bg-neutral-200 border border-black text-xs cursor-pointer"
                                        title="Batal"
                                    >
                                        <X className="w-3.5 h-3.5 text-black" />
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={group.id}
                                className={`group/item inline-flex items-center gap-1.5 border-2 border-black transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-[#A388EE] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black'
                                        : 'bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => setActiveGroupId(group.id)}
                                    className="px-3 py-1.5 text-xs font-heading font-bold uppercase whitespace-nowrap flex items-center gap-2 cursor-pointer"
                                >
                                    <span>📁 {group.name}</span>
                                    <span className="px-1.5 py-0.2 bg-black text-white text-[10px] font-black">
                                        {noteCount}
                                    </span>
                                </button>

                                {canEdit && (
                                    <div className="flex items-center pr-1.5 gap-0.5">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingGroupId(group.id);
                                                setEditingGroupName(group.name);
                                            }}
                                            className="p-1 hover:bg-black/10 rounded transition-colors"
                                            title="Ubah Nama Grup"
                                        >
                                            <Edit3 className="w-3 h-3 text-black" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteGroup(group.id);
                                            }}
                                            className="p-1 hover:bg-black/10 rounded transition-colors"
                                            title="Hapus Grup"
                                        >
                                            <Trash2 className="w-3 h-3 text-black hover:text-rose-600" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. SEARCH, CATEGORY FILTER & PRIMARY CTA */}
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
                <div className="flex border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                    <button
                        type="button"
                        onClick={() => setCategoryFilter('all')}
                        className={`px-3 py-2 cursor-pointer transition-colors ${
                            categoryFilter === 'all' ? 'bg-black text-white font-black' : 'bg-white hover:bg-neutral-100'
                        }`}
                    >
                        Semua
                    </button>
                    <button
                        type="button"
                        onClick={() => setCategoryFilter('regular')}
                        className={`px-3 py-2 border-l-2 border-black cursor-pointer transition-colors ${
                            categoryFilter === 'regular' ? 'bg-[#FFDC58] text-black font-black' : 'bg-white hover:bg-neutral-100'
                        }`}
                    >
                        Biasa
                    </button>
                    <button
                        type="button"
                        onClick={() => setCategoryFilter('task')}
                        className={`px-3 py-2 border-l-2 border-black cursor-pointer transition-colors ${
                            categoryFilter === 'task' ? 'bg-[#FF6B6B] text-black font-black' : 'bg-white hover:bg-neutral-100'
                        }`}
                    >
                        Tugas (Task)
                    </button>
                </div>

                {/* Primary Button: Create Note */}
                {canEdit && groups.length > 0 && (
                    <NeoButton
                        variant="yellow"
                        size="md"
                        onClick={() => onCreateNote(fallbackGroupId, categoryFilter === 'task' ? 'task' : 'regular')}
                        className="shrink-0"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Buat Catatan Baru
                    </NeoButton>
                )}
            </div>

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
                                : 'Grup ini masih kosong. Buat catatan materi biasa atau tugas dengan deadline dan pengingat sekarang.'}
                        </p>
                    </div>

                    {canEdit && groups.length > 0 && (
                        <div className="pt-2">
                            <NeoButton
                                variant="yellow"
                                size="lg"
                                onClick={() => onCreateNote(fallbackGroupId, 'regular')}
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Mulai Tulis Catatan Sekarang
                            </NeoButton>
                        </div>
                    )}
                </div>
            ) : (
                /* Grid of Notes */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredNotes.map((note) => {
                        const isTask = note.category === 'task';
                        const checklistInfo = getChecklistSummary(note.content_json);
                        const snippet = parseContentSnippet(note.content_json);
                        const attachmentsCount = note.attachments?.length || 0;

                        return (
                            <div
                                key={note.id}
                                onClick={() => onSelectNote(note)}
                                className="group bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-pointer p-5 flex flex-col justify-between min-h-[220px]"
                            >
                                <div>
                                    {/* Card Header: Category & Deadline */}
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <NeoBadge variant={isTask ? 'coral' : 'yellow'}>
                                                {isTask ? 'Tugas' : 'Biasa'}
                                            </NeoBadge>
                                            <span className="text-[11px] font-bold text-neutral-500 uppercase truncate max-w-[130px]">
                                                {note.group_name || note.group?.name}
                                            </span>
                                        </div>

                                        {isTask && note.deadline_at && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 border border-black px-1.5 py-0.5">
                                                <Clock className="w-3 h-3 text-rose-600" />
                                                {new Date(note.deadline_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </span>
                                        )}
                                    </div>

                                    {/* Note Title */}
                                    <h4 className="font-heading font-black text-lg text-black uppercase mb-2 group-hover:text-black line-clamp-2">
                                        {note.title || 'Catatan Tanpa Judul'}
                                    </h4>

                                    {/* Excerpt / Summary */}
                                    <p className="text-xs text-neutral-600 font-medium line-clamp-3 mb-4 leading-relaxed">
                                        {snippet}
                                    </p>
                                </div>

                                {/* Card Footer: Badges & Action */}
                                <div className="pt-3 border-t-2 border-black flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        {checklistInfo && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-neutral-100 border border-black">
                                                <CheckSquare className="w-3 h-3 text-emerald-700" />
                                                {checklistInfo.done}/{checklistInfo.total}
                                            </span>
                                        )}
                                        {note.drawing_data && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-neutral-100 border border-black" title="Memiliki Sketsa">
                                                <PenTool className="w-3 h-3 text-purple-700" />
                                                Sketsa
                                            </span>
                                        )}
                                        {attachmentsCount > 0 && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-neutral-100 border border-black" title="Berkas Lampiran">
                                                <Paperclip className="w-3 h-3 text-sky-700" />
                                                {attachmentsCount}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenNoteShare(note);
                                            }}
                                            className="p-1 hover:bg-[#A388EE] border border-black transition-colors"
                                            title="Bagikan Catatan"
                                        >
                                            <Share2 className="w-3.5 h-3.5 text-black" />
                                        </button>
                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteNote(note.id);
                                                }}
                                                className="p-1 hover:bg-[#FF6B6B] border border-black transition-colors"
                                                title="Hapus Catatan"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-black" />
                                            </button>
                                        )}
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#FFDC58] border border-black font-heading font-black text-xs uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                            Buka <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
