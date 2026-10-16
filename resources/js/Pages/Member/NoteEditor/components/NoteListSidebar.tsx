import React from 'react';
import { Note, NoteGroup } from '@/types';
import DebouncedPrefetchLink from '@/Components/DebouncedPrefetchLink';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { Plus, Search, Clock, CheckSquare } from 'lucide-react';
import { MobileTab } from '../types';

interface NoteListSidebarProps {
    appId: number;
    groups: NoteGroup[];
    filteredNotes: (Note & { group_name?: string })[];
    selectedNote: Note | null;
    activeGroupId: number | 'all';
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    categoryFilter: 'all' | 'regular' | 'task';
    setCategoryFilter: (c: 'all' | 'regular' | 'task') => void;
    canEdit: boolean;
    mobileTab: MobileTab;
    setMobileTab: (tab: MobileTab) => void;
    onCreateNote: (groupId: number, category: 'regular' | 'task') => void;
}

export default function NoteListSidebar({
    appId,
    groups,
    filteredNotes,
    selectedNote,
    activeGroupId,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    canEdit,
    mobileTab,
    setMobileTab,
    onCreateNote,
}: NoteListSidebarProps) {
    return (
        <div className={`lg:col-span-3 space-y-4 ${mobileTab !== 'notes' ? 'hidden lg:block' : 'block'}`}>
            <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black">
                    <h3 className="font-heading font-black text-xs uppercase tracking-wider text-black">
                        Catatan ({filteredNotes.length})
                    </h3>

                    {canEdit && groups.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onCreateNote(activeGroupId === 'all' ? groups[0].id : activeGroupId, 'regular')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFDC58] border-2 border-black font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Buat
                        </button>
                    )}
                </div>

                {/* Search & Filter Tabs */}
                <div className="space-y-2 mb-3">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                        <input
                            type="text"
                            placeholder="Cari judul catatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border-2 border-black font-medium focus:outline-none"
                        />
                    </div>

                    <div className="flex border-2 border-black text-xs">
                        <button
                            type="button"
                            onClick={() => setCategoryFilter('all')}
                            className={`flex-1 py-1 font-bold cursor-pointer ${
                                categoryFilter === 'all' ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100'
                            }`}
                        >
                            Semua
                        </button>
                        <button
                            type="button"
                            onClick={() => setCategoryFilter('regular')}
                            className={`flex-1 py-1 font-bold border-l-2 border-black cursor-pointer ${
                                categoryFilter === 'regular' ? 'bg-[#FFDC58] text-black' : 'bg-white hover:bg-neutral-100'
                            }`}
                        >
                            Biasa
                        </button>
                        <button
                            type="button"
                            onClick={() => setCategoryFilter('task')}
                            className={`flex-1 py-1 font-bold border-l-2 border-black cursor-pointer ${
                                categoryFilter === 'task' ? 'bg-[#FF6B6B] text-black' : 'bg-white hover:bg-neutral-100'
                            }`}
                        >
                            Tugas
                        </button>
                    </div>
                </div>

                {/* Notes list items */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {filteredNotes.length === 0 ? (
                        <p className="text-xs text-neutral-400 italic py-4 text-center">
                            Tidak ada catatan yang sesuai.
                        </p>
                    ) : (
                        filteredNotes.map((n) => {
                            const isSelected = selectedNote?.id === n.id;
                            let checklistCount = 0;
                            let checklistCompleted = 0;
                            try {
                                if (n.content_json) {
                                    const parsed = JSON.parse(n.content_json);
                                    if (Array.isArray(parsed.checklist)) {
                                        checklistCount = parsed.checklist.length;
                                        checklistCompleted = parsed.checklist.filter((i: any) => i.completed).length;
                                    }
                                }
                            } catch {
                                // ignore
                            }

                            return (
                                <DebouncedPrefetchLink
                                    key={n.id}
                                    href={`/app/${appId}?note_id=${n.id}`}
                                    onClick={() => setMobileTab('editor')}
                                    className={`block p-3 border-2 border-black transition-all ${
                                        isSelected
                                            ? 'bg-[#FFDC58] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5'
                                            : 'bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                        <NeoBadge
                                            variant={n.category === 'task' ? 'coral' : 'yellow'}
                                            className="text-[9px] px-1.5 py-0"
                                        >
                                            {n.category === 'task' ? 'Tugas' : 'Biasa'}
                                        </NeoBadge>
                                        <span className="text-[10px] text-neutral-500 font-bold truncate">
                                            {n.group_name}
                                        </span>
                                    </div>

                                    <h4 className="font-heading font-black text-sm text-black mb-1 truncate">
                                        {n.title}
                                    </h4>

                                    {n.category === 'task' && n.deadline_at && (
                                        <p className="text-[10px] font-bold text-rose-700 flex items-center gap-1 mb-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(n.deadline_at).toLocaleDateString('id-ID')}
                                        </p>
                                    )}

                                    {checklistCount > 0 && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-600 mt-1">
                                            <CheckSquare className="w-3 h-3" />
                                            <span>
                                                {checklistCompleted}/{checklistCount} Selesai
                                            </span>
                                        </div>
                                    )}
                                </DebouncedPrefetchLink>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
