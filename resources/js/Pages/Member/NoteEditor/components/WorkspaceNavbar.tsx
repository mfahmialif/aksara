import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { NoteApp, NoteGroup, PageProps } from '@/types';
import {
    ArrowLeft, Users, Share2, FolderKanban, Bookmark, BookmarkCheck, Settings,
    Copy, RefreshCw, GitFork, MoreVertical, ChevronDown
} from 'lucide-react';
import { getCsrfToken } from '@/utils/csrf';

export interface WorkspaceNavbarProps {
    app: NoteApp;
    groups: NoteGroup[];
    activeGroupId: string | 'all';
    setActiveGroupId: (id: string | 'all') => void;
    totalNotesAll: number;
    canEdit: boolean;
    isOwner: boolean;
    isCollaborator?: boolean;
    isGroupSharedView?: boolean;
    sharedGroup?: NoteGroup | null;
    isSaved?: boolean;
    shareItemType?: 'app' | 'group' | 'note';
    shareItemId?: string;
    sharePublicToken?: string;
    isPublicView?: boolean;
    onOpenEditApp?: () => void;
    onOpenCollab: () => void;
    onOpenShare: () => void;
    onOpenShareGroup?: (group: NoteGroup) => void;
    onOpenAddGroup: () => void;
    onOpenEditGroup: (group: NoteGroup) => void;
    onDeleteGroup: (groupId: string) => void;
    onToggleTopicSidebar?: () => void;
    isTopicSidebarMinimized?: boolean;
    topicLabel?: string;
    onOpenDuplicate?: () => void;
    onOpenSync?: () => void;
    onOpenClones?: () => void;
}

export default function WorkspaceNavbar({
    app,
    groups,
    activeGroupId,
    setActiveGroupId,
    totalNotesAll,
    canEdit,
    isOwner,
    isCollaborator = false,
    isGroupSharedView = false,
    sharedGroup,
    isSaved = false,
    shareItemType,
    shareItemId,
    sharePublicToken,
    isPublicView = false,
    onOpenEditApp,
    onOpenCollab,
    onOpenShare,
    onOpenShareGroup,
    onOpenAddGroup,
    onOpenEditGroup,
    onDeleteGroup,
    onToggleTopicSidebar,
    isTopicSidebarMinimized = false,
    topicLabel = 'Topik',
    onOpenDuplicate,
    onOpenSync,
    onOpenClones,
}: WorkspaceNavbarProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;
    const backHref = canEdit ? '/app' : (user ? '/app' : '/');

    const isCollab = Boolean(
        isCollaborator ||
        (user && app.collaborators?.some((c) =>
            (c.user_id && c.user_id === user.id) ||
            (c.user && c.user.id === user.id) ||
            (c.invited_email && c.invited_email.toLowerCase() === user.email?.toLowerCase())
        ))
    );
    const canManageSettings = isOwner || isCollab;
    const collabCount = isGroupSharedView
        ? (sharedGroup?.collaborators?.length || 0)
        : (app.collaborators?.length || 0);

    const [savedState, setSavedState] = useState<boolean>(Boolean(isSaved));
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSavedState(Boolean(isSaved));
    }, [isSaved]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMobileMenuOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMobileMenuOpen(false);
            }
        };
        if (mobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [mobileMenuOpen]);

    const handleToggleSave = async () => {
        if (!user || isSaving) return;
        setIsSaving(true);
        const nextState = !savedState;
        setSavedState(nextState);

        try {
            const csrfToken = getCsrfToken();
            const targetType = shareItemType || (isGroupSharedView ? 'group' : 'app');
            const targetId = shareItemId || (isGroupSharedView ? sharedGroup?.id : app.id);
            const targetToken = sharePublicToken || app.public_token;

            if (nextState) {
                // Save link to workspace
                await fetch('/saved-links', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        item_type: targetType,
                        item_id: targetId,
                        public_token: targetToken,
                        share_url: typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined,
                    }),
                });
            } else {
                // Remove from saved links
                await fetch('/saved-links', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        item_type: targetType,
                        item_id: targetId,
                    }),
                });
            }
        } catch {
            // Revert state if error occurred
            setSavedState(!nextState);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex items-center justify-between gap-2 sm:gap-3 w-full min-w-0 select-none">
            {/* Left: Back Arrow + Workspace Title Pill + Quick Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
                {/* 1. Back Button */}
                <Link
                    href={backHref}
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0 cursor-pointer flex items-center justify-center"
                    title={canEdit ? 'Kembali ke Daftar Ruang Kerja' : (user ? 'Kembali ke Ruang Kerja' : 'Kembali ke Beranda')}
                >
                    <ArrowLeft className="w-4 h-4 text-black stroke-[2.5]" />
                </Link>

                {/* 2. Structured Neo-Brutalist Workspace / Group Title Pill */}
                {isGroupSharedView ? (
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-0 flex-1 sm:flex-initial max-w-[calc(100vw-165px)] sm:max-w-[300px] md:max-w-[380px]">
                        <span
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-black shrink-0"
                            style={{ backgroundColor: sharedGroup?.color || groups[0]?.color || '#FFDC58' }}
                        />
                        <span
                            className="font-heading font-black text-xs sm:text-sm uppercase tracking-tight text-black truncate min-w-0 flex-1"
                            title={`${topicLabel}: ${sharedGroup?.name || groups[0]?.name}`}
                        >
                            {sharedGroup?.name || groups[0]?.name}
                        </span>
                        <span className={`hidden sm:inline-block px-1.5 py-0.2 border border-black text-[9px] font-black uppercase tracking-wider shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                            canEdit ? 'bg-[#A8E6CF] text-emerald-950' : 'bg-neutral-100 text-neutral-800'
                        }`}>
                            {topicLabel}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-0 flex-1 sm:flex-initial max-w-[calc(100vw-165px)] sm:max-w-[320px] md:max-w-[420px]">
                        <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black shrink-0 hidden xs:block" />
                        <span
                            className="font-heading font-black text-xs sm:text-sm uppercase tracking-tight text-black truncate min-w-0 flex-1"
                            title={app.name}
                        >
                            {app.name}
                        </span>
                        <span className={`hidden sm:inline-block px-1.5 py-0.2 border border-black text-[9px] font-black uppercase tracking-wider shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                            app.is_public ? 'bg-[#A8E6CF] text-emerald-950' : 'bg-neutral-100 text-neutral-800'
                        }`}>
                            {app.is_public ? (canEdit ? 'Publik' : 'Read-Only') : 'Privat'}
                        </span>
                    </div>
                )}

                {/* 3. Action Buttons (Desktop Individual Buttons, Mobile Aksi Dropdown) */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {/* DESKTOP VIEW (>= md): Full action buttons */}
                    <div className="hidden md:flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {/* Save Shared Link Button for non-owners */}
                        {user && !isOwner && (
                            <button
                                type="button"
                                onClick={handleToggleSave}
                                disabled={isSaving}
                                className={`h-8 sm:h-9 px-2 sm:px-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer transition-all flex items-center gap-1.5 text-xs font-heading font-black uppercase ${
                                    savedState
                                        ? 'bg-[#7FBC8C] hover:bg-[#6fae7c]'
                                        : 'bg-white hover:bg-[#FFDC58]'
                                }`}
                                title={savedState ? 'Link tersimpan di Ruang Kerja Anda (Klik untuk menghapus)' : 'Simpan link ini ke Ruang Kerja Saya'}
                            >
                                {savedState ? (
                                    <>
                                        <BookmarkCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.5]" />
                                        <span className="hidden sm:inline">Tersimpan</span>
                                    </>
                                ) : (
                                    <>
                                        <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.5]" />
                                        <span className="hidden sm:inline">Simpan Link</span>
                                    </>
                                )}
                            </button>
                        )}

                        {!isGroupSharedView && canManageSettings && onOpenEditApp && (
                            <button
                                type="button"
                                onClick={onOpenEditApp}
                                className="h-8 sm:h-9 px-2 sm:px-2.5 bg-white hover:bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer transition-all flex items-center gap-1.5 text-xs font-heading font-black uppercase"
                                title="Pengaturan & Edit Ruang Kerja"
                            >
                                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                                <span className="hidden sm:inline">Pengaturan</span>
                            </button>
                        )}

                        {!isGroupSharedView && onOpenDuplicate && Boolean(app.is_duplicable) && (
                            <button
                                type="button"
                                onClick={onOpenDuplicate}
                                className="h-8 sm:h-9 px-2 sm:px-2.5 bg-white hover:bg-[#69D2E7] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer transition-all flex items-center gap-1.5 text-xs font-heading font-black uppercase"
                                title="Duplikat Ruang Kerja Ini"
                            >
                                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                                <span className="hidden lg:inline">Duplikat</span>
                            </button>
                        )}

                        {!isGroupSharedView && onOpenSync && Boolean(app.cloned_from_id) && (
                            <button
                                type="button"
                                onClick={onOpenSync}
                                className="h-8 sm:h-9 px-2 sm:px-2.5 bg-white hover:bg-[#A6E3A1] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer transition-all flex items-center gap-1.5 text-xs font-heading font-black uppercase"
                                title="Tarik Sinkronisasi dari Ruang Kerja Asal"
                            >
                                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                                <span className="hidden lg:inline">Sinkron</span>
                            </button>
                        )}

                        {!isGroupSharedView && isOwner && (app.clone_count || 0) > 0 && onOpenClones && (
                            <button
                                type="button"
                                onClick={onOpenClones}
                                className="h-8 sm:h-9 px-2 sm:px-2.5 bg-[#E0E7FF] hover:bg-[#c7d2fe] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer transition-all flex items-center gap-1.5 text-xs font-heading font-black uppercase"
                                title={`Total ${app.clone_count} kali diduplikat (${app.active_clones_count || 0} pengguna aktif)`}
                            >
                                <GitFork className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-700" />
                                <span className="hidden md:inline">{app.clone_count} Duplikat</span>
                            </button>
                        )}

                        {!isGroupSharedView && isOwner && (
                            <button
                                type="button"
                                onClick={onOpenCollab}
                                className="h-8 sm:h-9 px-2 sm:px-2.5 bg-white hover:bg-[#A388EE] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer transition-all flex items-center gap-1.5 text-xs font-heading font-black uppercase"
                                title={`Kolaborator (${app.collaborators?.length || 0})`}
                            >
                                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                                <span className="hidden xl:inline">Kolaborator</span>
                                {(app.collaborators?.length || 0) > 0 && (
                                    <span className="px-1.5 py-0.2 bg-black text-white text-[10px] font-black">
                                        {app.collaborators?.length}
                                    </span>
                                )}
                            </button>
                        )}

                        {isGroupSharedView && canEdit && (
                            <button
                                type="button"
                                onClick={onOpenCollab}
                                className="h-8 sm:h-9 px-2 sm:px-2.5 bg-white hover:bg-[#A388EE] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer transition-all flex items-center gap-1.5 text-xs font-heading font-black uppercase"
                                title={`Kolaborator Folder (${sharedGroup?.collaborators?.length || 0})`}
                            >
                                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                                <span className="hidden xl:inline">Kolaborator</span>
                                {(sharedGroup?.collaborators?.length || 0) > 0 && (
                                    <span className="px-1.5 py-0.2 bg-black text-white text-[10px] font-black">
                                        {sharedGroup?.collaborators?.length}
                                    </span>
                                )}
                            </button>
                        )}

                        {!isGroupSharedView ? (
                            <button
                                type="button"
                                onClick={onOpenShare}
                                className="h-8 sm:h-9 px-2 sm:px-2.5 bg-[#FFDC58] hover:bg-[#FFE57F] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer transition-all flex items-center gap-1.5 text-xs font-heading font-black uppercase"
                                title="Bagikan Ruang Kerja"
                            >
                                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                                <span className="hidden sm:inline">Bagikan</span>
                            </button>
                        ) : (
                            canEdit && (
                                <button
                                    type="button"
                                    onClick={onOpenShare}
                                    className="h-8 sm:h-9 px-2 sm:px-2.5 bg-[#FFDC58] hover:bg-[#FFE57F] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer transition-all flex items-center gap-1.5 text-xs font-heading font-black uppercase"
                                    title="Bagikan Folder"
                                >
                                    <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                                    <span className="hidden sm:inline">Bagikan</span>
                                </button>
                            )
                        )}
                    </div>

                    {/* MOBILE VIEW (< md): Neo-Brutalist "Aksi" Dropdown */}
                    <div className="relative md:hidden shrink-0" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={`h-8 sm:h-9 px-2 sm:px-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer transition-all flex items-center gap-1 text-xs font-heading font-black uppercase ${
                                mobileMenuOpen ? 'bg-[#FFDC58]' : 'bg-white hover:bg-[#FFDC58]'
                            }`}
                            title="Menu Aksi Ruang Kerja"
                            aria-label="Aksi Ruang Kerja"
                            aria-expanded={mobileMenuOpen}
                        >
                            <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.5]" />
                            <span className="text-[11px] font-black uppercase">Aksi</span>
                            <ChevronDown className={`w-3 h-3 text-black transition-transform duration-150 ${mobileMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {mobileMenuOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-40 bg-black/20"
                                    onClick={() => setMobileMenuOpen(false)}
                                />

                                {/* Menu Container */}
                                <div className="fixed inset-x-3 top-[58px] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-72 max-w-sm mx-auto sm:mx-0 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans divide-y divide-neutral-100">
                                    {/* Bagikan */}
                                    {(!isGroupSharedView || canEdit) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                onOpenShare();
                                            }}
                                            className="w-full px-3 py-2 text-left flex items-center justify-between gap-2.5 hover:bg-[#FFDC58] transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 bg-[#FFDC58] border border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                    <Share2 className="w-3.5 h-3.5 text-black" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-heading font-black text-xs uppercase text-black">
                                                        {isGroupSharedView ? 'Bagikan Folder' : 'Bagikan Ruang Kerja'}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-600 truncate">
                                                        {app.is_public ? 'Publik (Bisa diakses tautan)' : 'Privat'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`px-1.5 py-0.5 border border-black text-[9px] font-black uppercase shrink-0 ${
                                                app.is_public ? 'bg-[#A8E6CF] text-emerald-950' : 'bg-neutral-100 text-neutral-800'
                                            }`}>
                                                {app.is_public ? (canEdit ? 'Publik' : 'Read-Only') : 'Privat'}
                                            </span>
                                        </button>
                                    )}

                                    {/* Pengaturan Ruang Kerja */}
                                    {!isGroupSharedView && canManageSettings && onOpenEditApp && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                onOpenEditApp();
                                            }}
                                            className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-neutral-100 transition-colors"
                                        >
                                            <div className="w-7 h-7 bg-white border border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                <Settings className="w-3.5 h-3.5 text-black" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-heading font-black text-xs uppercase text-black">
                                                    Pengaturan Ruang Kerja
                                                </span>
                                                <span className="text-[10px] text-neutral-600">
                                                    Nama, tema, label & transfer
                                                </span>
                                            </div>
                                        </button>
                                    )}

                                    {/* Duplikat */}
                                    {!isGroupSharedView && onOpenDuplicate && Boolean(app.is_duplicable) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                onOpenDuplicate();
                                            }}
                                            className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-[#E0F7FA] transition-colors"
                                        >
                                            <div className="w-7 h-7 bg-[#69D2E7] border border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                <Copy className="w-3.5 h-3.5 text-black" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-heading font-black text-xs uppercase text-black">
                                                    Duplikat Ruang Kerja
                                                </span>
                                                <span className="text-[10px] text-neutral-600">
                                                    Kloning catatan & topik ke akun Anda
                                                </span>
                                            </div>
                                        </button>
                                    )}

                                    {/* Sinkronisasi */}
                                    {!isGroupSharedView && onOpenSync && Boolean(app.cloned_from_id) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                onOpenSync();
                                            }}
                                            className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-[#DCFCE7] transition-colors"
                                        >
                                            <div className="w-7 h-7 bg-[#A6E3A1] border border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                <RefreshCw className="w-3.5 h-3.5 text-black" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-heading font-black text-xs uppercase text-black">
                                                    Tarik Sinkronisasi
                                                </span>
                                                <span className="text-[10px] text-neutral-600">
                                                    Ambil pembaruan dari ruang kerja asal
                                                </span>
                                            </div>
                                        </button>
                                    )}

                                    {/* Daftar Duplikat */}
                                    {!isGroupSharedView && isOwner && (app.clone_count || 0) > 0 && onOpenClones && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                onOpenClones();
                                            }}
                                            className="w-full px-3 py-2 text-left flex items-center justify-between gap-2.5 hover:bg-[#EEF2FF] transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 bg-[#E0E7FF] border border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                    <GitFork className="w-3.5 h-3.5 text-indigo-700" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-heading font-black text-xs uppercase text-black">
                                                        Daftar Duplikat
                                                    </span>
                                                    <span className="text-[10px] text-neutral-600">
                                                        {app.clone_count} kali diduplikat
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="px-1.5 py-0.5 bg-[#E0E7FF] border border-black text-[10px] font-black text-indigo-900 shrink-0">
                                                {app.active_clones_count || 0} Aktif
                                            </span>
                                        </button>
                                    )}

                                    {/* Kolaborator */}
                                    {((!isGroupSharedView && isOwner) || (isGroupSharedView && canEdit)) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                onOpenCollab();
                                            }}
                                            className="w-full px-3 py-2 text-left flex items-center justify-between gap-2.5 hover:bg-[#F3E8FF] transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 bg-[#A388EE] border border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                    <Users className="w-3.5 h-3.5 text-black" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-heading font-black text-xs uppercase text-black">
                                                        Kolaborator
                                                    </span>
                                                    <span className="text-[10px] text-neutral-600">
                                                        Kelola akses tim & anggota
                                                    </span>
                                                </div>
                                            </div>
                                            {collabCount > 0 && (
                                                <span className="px-1.5 py-0.5 bg-black text-white text-[10px] font-black shrink-0">
                                                    {collabCount}
                                                </span>
                                            )}
                                        </button>
                                    )}

                                    {/* Simpan Link */}
                                    {user && !isOwner && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                handleToggleSave();
                                            }}
                                            disabled={isSaving}
                                            className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-neutral-100 transition-colors"
                                        >
                                            <div className={`w-7 h-7 border border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                                                savedState ? 'bg-[#7FBC8C]' : 'bg-white'
                                            }`}>
                                                {savedState ? (
                                                    <BookmarkCheck className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                                                ) : (
                                                    <Bookmark className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-heading font-black text-xs uppercase text-black">
                                                    {savedState ? 'Tersimpan di Ruang Kerja' : 'Simpan Link Ruang Kerja'}
                                                </span>
                                                <span className="text-[10px] text-neutral-600">
                                                    {savedState ? 'Klik untuk melepas simpanan' : 'Akses cepat dari dashboard Anda'}
                                                </span>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Kept for backwards compatibility if needed, but returns null as floating sidebar handles topics.
 */
export function WorkspaceMobileFolders() {
    return null;
}
