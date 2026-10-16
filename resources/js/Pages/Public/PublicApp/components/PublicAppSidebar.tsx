import React from 'react';
import { Link } from '@inertiajs/react';
import { Note, NoteGroup } from '@/types';
import { FileText } from 'lucide-react';

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
    return (
        <div className="lg:col-span-4 space-y-4">
            <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-heading font-black text-sm uppercase tracking-wide mb-3 pb-2 border-b-2 border-black">
                    Daftar Grup & Catatan
                </h3>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
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
                                            <Link
                                                key={note.id}
                                                href={`/share/app/${appToken}?note_id=${note.id}`}
                                                className={`w-full text-left p-2 border-2 border-black block transition-all ${
                                                    isSelected
                                                        ? 'bg-[#FFDC58] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                        : 'bg-white hover:bg-neutral-50 font-bold'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1.5 text-xs truncate">
                                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">{note.title}</span>
                                                </div>
                                            </Link>
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
