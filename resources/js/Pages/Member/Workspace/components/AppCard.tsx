import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { NoteApp, PageProps } from '@/types';
import NeoCard from '@/Components/UI/NeoCard';
import DebouncedPrefetchLink from '@/Components/DebouncedPrefetchLink';
import {
    BookOpen, Globe, Lock, ArrowRight, Users, BookmarkCheck, Trash2,
    User as UserIcon, Settings, Copy, RefreshCw, GitFork
} from 'lucide-react';
import { getCsrfToken } from '@/utils/csrf';

interface AppCardProps {
    app: NoteApp;
    themeBg: string;
    onEdit?: (app: NoteApp) => void;
    onDuplicate?: (app: NoteApp) => void;
    onSync?: (app: NoteApp) => void;
    onViewClones?: (app: NoteApp) => void;
    onDelete?: (app: NoteApp) => void;
}

export default function AppCard({
    app,
    themeBg,
    onEdit,
    onDuplicate,
    onSync,
    onViewClones,
    onDelete,
}: AppCardProps) {
    const { auth } = usePage<PageProps>().props;
    const isOwner = Boolean(auth?.user?.id && app.owner_id === auth.user.id);
    const isSaved = Boolean(app.is_saved && !isOwner);
    const isShared = Boolean(auth?.user?.id && app.owner_id && !isOwner && !isSaved);
    const totalNotes = app.groups?.reduce((acc, g) => acc + (g.notes?.length || 0), 0) || 0;

    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemoveSaved = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isRemoving) return;

        if (!confirm(`Hapus ruang kerja "${app.name}" dari daftar link tersimpan Anda?`)) {
            return;
        }

        setIsRemoving(true);
        try {
            const csrfToken = getCsrfToken();
            await fetch('/saved-links', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    item_type: 'app',
                    item_id: app.id,
                }),
            });

            router.reload({ only: ['apps', 'counts'] });
        } catch {
            setIsRemoving(false);
        }
    };

    return (
        <NeoCard
            color="bg-white"
            shadowSize="md"
            hoverEffect
            className="flex flex-col justify-between overflow-hidden"
        >
            <div>
                {/* Colored Top Header */}
                <div className={`${themeBg} p-4 border-b-2 border-black flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                            <BookOpen className="w-5 h-5 text-black" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-heading font-black text-lg text-black truncate max-w-[180px]">
                                {app.name}
                            </h3>
                            {!isOwner && (
                                <p className="text-[10px] text-neutral-800 font-bold truncate max-w-[180px]">
                                    Pemilik: {app.owner?.name || 'Pengguna Lain'}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {isSaved && (
                            <button
                                type="button"
                                onClick={handleRemoveSaved}
                                disabled={isRemoving}
                                title="Hapus dari daftar tersimpan"
                                className="p-1 bg-[#7FBC8C] hover:bg-rose-400 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors group cursor-pointer"
                            >
                                <BookmarkCheck className="w-3.5 h-3.5 text-black group-hover:hidden" />
                                <Trash2 className="w-3.5 h-3.5 text-black hidden group-hover:block" />
                            </button>
                        )}
                        {isShared && (
                            <span title="Ruang Kolaborasi" className="p-1 bg-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                <Users className="w-3.5 h-3.5 text-black" />
                            </span>
                        )}
                        {onDuplicate && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDuplicate(app);
                                }}
                                title="Duplikat Ruang Kerja Ini"
                                className="p-1 bg-white hover:bg-[#69D2E7] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
                            >
                                <Copy className="w-3.5 h-3.5 text-black" />
                            </button>
                        )}
                        {onSync && (Boolean(app.cloned_from_id) || (app.active_clones_count || 0) > 0) && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSync(app);
                                }}
                                title="Sinkronisasi Perubahan dengan Duplikat / Induk"
                                className="p-1 bg-white hover:bg-[#A6E3A1] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5 text-black" />
                            </button>
                        )}
                        {(isOwner || isShared) && onEdit && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEdit(app);
                                }}
                                title="Pengaturan & Edit Ruang Kerja"
                                className="p-1 bg-white hover:bg-[#FFDC58] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
                            >
                                <Settings className="w-3.5 h-3.5 text-black" />
                            </button>
                        )}
                        {isOwner && onDelete && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDelete(app);
                                }}
                                title="Hapus Ruang Kerja"
                                className="p-1 bg-white hover:bg-[#FF6B6B] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-black" />
                            </button>
                        )}
                        <span title={app.is_public ? (app.public_permission === 'edit' ? 'Publik (Bisa Diedit)' : 'Publik (Hanya Baca)') : 'Privat'}>
                            {app.is_public ? (
                                <Globe className={`w-4 h-4 ${app.public_permission === 'edit' ? 'text-emerald-700' : 'text-black'}`} />
                            ) : (
                                <Lock className="w-4 h-4 text-black/60" />
                            )}
                        </span>
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    <p className="text-xs text-neutral-600 line-clamp-2 font-medium min-h-[32px]">
                        {app.description || (isSaved ? 'Tautan ruang kerja publik yang Anda simpan.' : (isShared ? 'Ruang kerja bersama dengan kolaborator.' : 'Tidak ada deskripsi ruang kerja.'))}
                    </p>

                    {(isShared || isSaved) && app.owner && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-800">
                            {app.owner.avatar ? (
                                <img
                                    src={app.owner.avatar}
                                    alt={app.owner.name}
                                    className="w-4 h-4 rounded-full border border-black object-cover shrink-0"
                                />
                            ) : (
                                <UserIcon className="w-3.5 h-3.5 text-black shrink-0" />
                            )}
                            <span className="truncate">
                                <span className="font-bold text-black">Pemilik:</span> {app.owner.name}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 flex-wrap">
                        {isSaved && (
                            <span className="px-2 py-0.5 bg-[#7FBC8C] text-black border border-black text-[10px] uppercase font-black">
                                Link Tersimpan
                            </span>
                        )}
                        {Boolean(app.cloned_from_id) && (
                            <span
                                className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-black text-[10px] uppercase font-black flex items-center gap-1"
                                title={`Hasil duplikasi dari: ${app.cloned_from?.name || 'Ruang Kerja Induk'}`}
                            >
                                <GitFork className="w-3 h-3 text-amber-800" />
                                <span>Hasil Duplikat</span>
                            </span>
                        )}
                        {isOwner && (app.clone_count || 0) > 0 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onViewClones?.(app);
                                }}
                                className="px-2 py-0.5 bg-[#E0E7FF] hover:bg-[#c7d2fe] border border-black text-[10px] uppercase font-black flex items-center gap-1 cursor-pointer transition-colors"
                                title={`Total ${app.clone_count} kali diduplikat (${app.active_clones_count || 0} pengguna aktif saat ini). Klik untuk melihat daftar.`}
                            >
                                <GitFork className="w-3 h-3 text-indigo-700" />
                                <span>{app.clone_count} Duplikat</span>
                            </button>
                        )}
                        <span className="px-2 py-0.5 bg-[#F4F0EA] border border-black">
                            {app.groups?.length || 0} {app.topic_label || 'Topik'}
                        </span>
                        <span className="px-2 py-0.5 bg-[#F4F0EA] border border-black">
                            {totalNotes} Catatan
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-4 pt-0">
                <DebouncedPrefetchLink
                    href={`/app/${app.id}`}
                    prefetch="hover"
                    cacheFor="1m"
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-heading font-bold text-xs uppercase transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                        isSaved
                            ? 'bg-[#7FBC8C] hover:bg-[#6fae7c] text-black'
                            : (isShared ? 'bg-[#A388EE] hover:bg-[#9172e9] text-black' : 'bg-white hover:bg-neutral-100 text-black')
                    }`}
                >
                    {isSaved ? 'Buka Link Tersimpan' : (isShared ? 'Buka Kolaborasi' : 'Buka Workspace')}
                    <ArrowRight className="w-4 h-4" />
                </DebouncedPrefetchLink>
            </div>
        </NeoCard>
    );
}
