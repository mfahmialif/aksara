import React from 'react';
import { Link } from '@inertiajs/react';
import { NoteApp } from '@/types';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { ArrowLeft, Users, Share2, LayoutGrid, PenLine } from 'lucide-react';
import { ViewMode } from '../types';

interface WorkspaceHeaderProps {
    app: NoteApp;
    isOwner: boolean;
    groupsCount: number;
    notesCount: number;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    hasSelectedNote: boolean;
    onOpenCollab: () => void;
    onOpenShare: () => void;
    themeBg: string;
}

export default function WorkspaceHeader({
    app,
    isOwner,
    groupsCount,
    notesCount,
    viewMode,
    setViewMode,
    hasSelectedNote,
    onOpenCollab,
    onOpenShare,
    themeBg,
}: WorkspaceHeaderProps) {
    return (
        <div className={`${themeBg} border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5 mb-6 select-none`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left: Back, Title, Status & Meta */}
                <div className="flex items-start sm:items-center gap-3.5">
                    <Link
                        href="/app"
                        className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all shrink-0 cursor-pointer"
                        title="Kembali ke Daftar Ruang Kerja"
                    >
                        <ArrowLeft className="w-5 h-5 text-black" />
                    </Link>

                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="font-heading font-black text-xl sm:text-2xl text-black truncate max-w-xs sm:max-w-md uppercase">
                                {app.name}
                            </h1>
                            <NeoBadge variant={app.is_public ? 'mint' : 'yellow'}>
                                {app.is_public ? 'Publik' : 'Privat'}
                            </NeoBadge>
                        </div>
                        <p className="text-xs text-neutral-800 font-bold">
                            Pemilik: {app.owner?.name} {isOwner && '(Anda)'} • {groupsCount} Folder / Grup • {notesCount} Catatan
                        </p>
                    </div>
                </div>

                {/* Right: View Switcher & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* View Switcher Pills */}
                    <div className="flex border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-bold font-heading uppercase">
                        <button
                            type="button"
                            onClick={() => setViewMode('explorer')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors cursor-pointer ${
                                viewMode === 'explorer'
                                    ? 'bg-[#FFDC58] text-black font-black'
                                    : 'bg-white hover:bg-neutral-100'
                            }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span>Jelajah Catatan</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (hasSelectedNote) {
                                    setViewMode('editor');
                                }
                            }}
                            disabled={!hasSelectedNote}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border-l-2 border-black transition-colors ${
                                viewMode === 'editor'
                                    ? 'bg-[#FFDC58] text-black font-black'
                                    : hasSelectedNote
                                    ? 'bg-white hover:bg-neutral-100 cursor-pointer'
                                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-70'
                            }`}
                        >
                            <PenLine className="w-3.5 h-3.5" />
                            <span>Editor Catatan</span>
                        </button>
                    </div>

                    {isOwner && (
                        <button
                            type="button"
                            onClick={onOpenCollab}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-heading font-bold text-xs uppercase hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                        >
                            <Users className="w-3.5 h-3.5" />
                            Kolaborator ({app.collaborators?.length || 0})
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onOpenShare}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-heading font-bold text-xs uppercase hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        Bagikan Aplikasi
                    </button>
                </div>
            </div>
        </div>
    );
}
