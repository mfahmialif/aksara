import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { NoteApp, NoteGroup, PageProps } from '@/types';
import {
    ArrowLeft, Users, Share2, FolderKanban, Bookmark, BookmarkCheck, Settings
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

    const [savedState, setSavedState] = useState<boolean>(Boolean(isSaved));
    const [isSaving, setIsSaving] = useState<boolean>(false);

    useEffect(() => {
        setSavedState(Boolean(isSaved));
    }, [isSaved]);

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
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-0 max-w-[200px] sm:max-w-[300px] md:max-w-[380px]">
                        <span
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-black shrink-0"
                            style={{ backgroundColor: sharedGroup?.color || groups[0]?.color || '#FFDC58' }}
                        />
                        <span
                            className="font-heading font-black text-xs sm:text-sm uppercase tracking-tight text-black truncate min-w-0"
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
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-0 max-w-[200px] sm:max-w-[320px] md:max-w-[420px]">
                        <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black shrink-0 hidden xs:block" />
                        <span
                            className="font-heading font-black text-xs sm:text-sm uppercase tracking-tight text-black truncate min-w-0"
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

                {/* 3. Action Buttons (Save Link, Collab & Share) */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
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
