import React from 'react';
import { Link } from '@inertiajs/react';
import { NoteApp } from '@/types';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { ArrowLeft, Users, Share2 } from 'lucide-react';
import { MobileTab } from '../types';

interface WorkspaceHeaderProps {
    app: NoteApp;
    isOwner: boolean;
    groupsCount: number;
    notesCount: number;
    mobileTab: MobileTab;
    setMobileTab: (tab: MobileTab) => void;
    onOpenCollab: () => void;
    onOpenShare: () => void;
    themeBg: string;
}

export default function WorkspaceHeader({
    app,
    isOwner,
    groupsCount,
    notesCount,
    mobileTab,
    setMobileTab,
    onOpenCollab,
    onOpenShare,
    themeBg,
}: WorkspaceHeaderProps) {
    return (
        <>
            {/* Top Workspace Header Bar */}
            <div className={`${themeBg} border-b-2 border-black px-4 py-3 select-none`}>
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/app"
                            className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all"
                            title="Kembali ke Ruang Kerja"
                        >
                            <ArrowLeft className="w-4 h-4 text-black" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-heading font-black text-xl text-black truncate max-w-xs sm:max-w-md">
                                    {app.name}
                                </h1>
                                <NeoBadge variant={app.is_public ? 'mint' : 'yellow'}>
                                    {app.is_public ? 'Publik' : 'Privat'}
                                </NeoBadge>
                            </div>
                            <p className="text-[11px] text-neutral-800 font-bold">
                                Pemilik: {app.owner?.name} {isOwner && '(Anda)'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
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

            {/* Mobile Tab Navigation */}
            <div className="lg:hidden flex border-b-2 border-black bg-white select-none">
                <button
                    type="button"
                    onClick={() => setMobileTab('groups')}
                    className={`flex-1 py-2.5 text-center font-heading font-bold text-xs uppercase border-r-2 border-black ${
                        mobileTab === 'groups' ? 'bg-[#FFDC58]' : 'bg-white'
                    }`}
                >
                    Grup ({groupsCount})
                </button>
                <button
                    type="button"
                    onClick={() => setMobileTab('notes')}
                    className={`flex-1 py-2.5 text-center font-heading font-bold text-xs uppercase border-r-2 border-black ${
                        mobileTab === 'notes' ? 'bg-[#A388EE]' : 'bg-white'
                    }`}
                >
                    Catatan ({notesCount})
                </button>
                <button
                    type="button"
                    onClick={() => setMobileTab('editor')}
                    className={`flex-1 py-2.5 text-center font-heading font-bold text-xs uppercase ${
                        mobileTab === 'editor' ? 'bg-[#7FBC8C]' : 'bg-white'
                    }`}
                >
                    Editor
                </button>
            </div>
        </>
    );
}
