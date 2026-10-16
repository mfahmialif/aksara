import React, { useState } from 'react';
import DebouncedPrefetchLink from '@/Components/DebouncedPrefetchLink';
import { Note, NoteGroup } from '@/types';
import { FileText, ChevronDown, FolderKanban } from 'lucide-react';

interface PublicAppSidebarProps {
    appToken: string;
    groups: NoteGroup[];
    selectedNote?: Note | null;
}

export default function PublicAppSidebar({
    appToken,
    groups = [],
    selectedNote,
}: PublicAppSidebarProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const totalNotes = groups.reduce((acc, g) => acc + (g.notes?.length || 0), 0);

    return (
        <div className="lg:col-span-4 space-y-3">
            {/* Mobile Expand/Collapse Header (< lg) */}
            <div className="lg:hidden border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <button
                    type="button"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="w-full flex items-center justify-between text-left gap-2 font-heading font-black text-xs uppercase"
                    aria-expanded={isMobileOpen}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <FolderKanban className="w-4 h-4 shrink-0 text-black" />
                        <span className="truncate">Daftar Catatan ({totalNotes})</span>
                        {selectedNote && (
                            <span className="hidden xs:inline-block px-1.5 py-0.5 bg-[#FFDC58] border border-black text-[10px] font-bold truncate max-w-[120px]">
                                {selectedNote.title}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="text-[11px] font-bold text-neutral-500">
                            {isMobileOpen ? 'Tutup' : 'Ganti Catatan'}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>
            </div>

            {/* List: Toggled on mobile, always visible on desktop */}
            <div className={`${isMobileOpen ? 'block' : 'hidden lg:block'} border-2 border-black bg-white p-3.5 sm:p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                <h3 className="hidden lg:block font-heading font-black text-sm uppercase tracking-wide mb-3 pb-2 border-b-2 border-black">
                    Daftar Grup & Catatan
                </h3>

                <div className="space-y-4 max-h-[360px] lg:max-h-[600px] overflow-y-auto pr-1">
                    {groups.map((group) => (
                        <div key={group.id} className="space-y-1.5">
                            <span className="text-xs font-black uppercase text-neutral-600 font-heading block">
                                {group.name} ({group.notes?.length || 0})
                            </span>

                            <div className="space-y-1 pl-1">
                                {(!group.notes || group.notes.length === 0) ? (
                                    <p className="text-xs text-neutral-400 italic pl-2">Belum ada catatan di grup ini.</p>
                                ) : (
                                    group.notes.map((note) => {
                                        const isSelected = selectedNote?.id === note.id;
                                        return (
                                            <DebouncedPrefetchLink
                                                key={note.id}
                                                href={`/s/app/${appToken}?note_id=${note.id}`}
                                                onClick={() => setIsMobileOpen(false)}
                                                className={`w-full text-left p-2.5 sm:p-2 border-2 border-black block transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                                                    isSelected
                                                        ? 'bg-[#FFDC58] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                        : 'bg-white hover:bg-neutral-50 font-bold'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1.5 text-xs truncate">
                                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">{note.title}</span>
                                                </div>
                                            </DebouncedPrefetchLink>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
