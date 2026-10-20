import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Note, PageProps, NoteGroup, NoteApp } from '@/types';
import MemberLayout from '@/Layouts/MemberLayout';
import CollaboratorsModal from '@/Components/Modals/CollaboratorsModal';
import ShareModal from '@/Components/Modals/ShareModal';
import EditAppModal from '@/Components/Modals/EditAppModal';
import DuplicateAppModal from '@/Components/Modals/DuplicateAppModal';
import SyncWorkspaceModal from '@/Components/Modals/SyncWorkspaceModal';
import ClonesModal from '@/Components/Modals/ClonesModal';
import { NoteEditorProps } from './types';
import WorkspaceNavbar from './components/WorkspaceNavbar';
import FloatingTopicSidebar from './components/FloatingTopicSidebar';
import WorkspaceExplorer from './components/WorkspaceExplorer';
import KeepNoteModal from './components/KeepNoteModal';
import FolderModal from './components/FolderModal';
import { getCsrfToken } from '@/utils/csrf';

export default function NoteEditor({
    app,
    groups = [],
    selected_note,
    selected_group = null,
    is_owner,
    can_edit,
    is_collaborator = false,
    is_public_view = false,
    is_group_shared_view = false,
    is_single_note_view = false,
    is_saved = false,
    share_item_type = 'app',
    share_item_id,
    share_public_token,
}: NoteEditorProps) {
    const { auth, system_settings } = usePage<PageProps>().props;
    const user = auth.user;

    // Local reactive app and groups state for instant optimistic updates without page reloads
    const [localApp, setLocalApp] = useState<NoteApp>(app);
    const [localGroups, setLocalGroups] = useState<NoteGroup[]>(groups);
    const topicLabel = localApp.topic_label || 'Topik';

    const isCollaborator = Boolean(
        is_collaborator ||
        (user && localApp.collaborators?.some((c) =>
            (c.user_id && c.user_id === user.id) ||
            (c.user && c.user.id === user.id) ||
            (c.invited_email && c.invited_email.toLowerCase() === user.email?.toLowerCase())
        ))
    );
    const canManageSettings = is_owner || isCollaborator;

    const handleUpdateTopicLabel = async (newLabel: string) => {
        const trimmed = newLabel.trim() || 'Topik';
        // Optimistic update
        setLocalApp((prev) => ({
            ...prev,
            topic_label: trimmed,
        }));

        try {
            const csrfToken = getCsrfToken();
            await fetch(`/app/${localApp.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    name: localApp.name,
                    description: localApp.description || '',
                    topic_label: trimmed,
                }),
            });
        } catch {
            // Revert on error
            setLocalApp((prev) => ({
                ...prev,
                topic_label: app.topic_label || 'Topik',
            }));
        }
    };

    useEffect(() => {
        setLocalApp(app);
        setLocalGroups(groups);
        if (keepModalNote && keepModalNote.id && keepModalNote.id !== '0') {
            const all = groups.flatMap((g) => g.notes || []);
            const updated = all.find((n) => n.id === keepModalNote.id);
            if (updated) {
                setKeepModalNote(updated);
            }
        }
    }, [app, groups]);

    // Google Keep-Style In-Place Modal Note
    const [keepModalNote, setKeepModalNote] = useState<Note | null>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.has('note_id') && selected_note) {
                return selected_note;
            }
            if (is_single_note_view && selected_note) {
                return selected_note;
            }
        }
        return null;
    });

    // Selected group for filtering notes
    const [activeGroupId, setActiveGroupId] = useState<string | 'all'>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const gParam = params.get('group_id');
            if (gParam && groups.some((g) => g.id === gParam)) {
                return gParam;
            }
        }
        if (is_group_shared_view && selected_group) {
            return selected_group.id;
        }
        return 'all';
    });

    const handleSetActiveGroupId = (id: string | 'all') => {
        setActiveGroupId(id);
        if (typeof window !== 'undefined' && is_public_view && !is_group_shared_view) {
            const url = new URL(window.location.href);
            if (id === 'all') {
                url.searchParams.delete('group_id');
            } else {
                url.searchParams.set('group_id', id);
            }
            window.history.replaceState({}, '', url.pathname + (url.search || ''));
        }
    };

    // Floating Topic Sidebar minimized/expanded state with localStorage persistence
    const [isTopicSidebarMinimized, setIsTopicSidebarMinimized] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('aksara_topic_sidebar_minimized');
            if (saved !== null) return saved === 'true';
            return window.innerWidth < 1280;
        }
        return false;
    });
    const [mobileTopicDrawerOpen, setMobileTopicDrawerOpen] = useState(false);

    // Helper to push history state for modals (so mobile back button closes modal instead of leaving page)
    const pushModalState = (modalName: string, url?: string) => {
        if (typeof window === 'undefined') return;
        const currentState = window.history.state || {};
        window.history.pushState({ ...currentState, aksaraModal: modalName }, '', url || window.location.href);
    };

    const popModalStateIfActive = (modalName: string, fallbackUrl?: string) => {
        if (typeof window === 'undefined') return;
        if (window.history.state?.aksaraModal === modalName) {
            window.history.back();
        } else if (fallbackUrl) {
            const currentState = window.history.state || {};
            window.history.replaceState({ ...currentState, aksaraModal: undefined }, '', fallbackUrl);
        }
    };

    const handleToggleTopicSidebar = (minimized?: boolean) => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setMobileTopicDrawerOpen((prev) => {
                const next = !prev;
                if (next) {
                    pushModalState('mobile-drawer');
                } else {
                    popModalStateIfActive('mobile-drawer');
                }
                return next;
            });
            return;
        }
        setIsTopicSidebarMinimized((prev) => {
            const next = typeof minimized === 'boolean' ? minimized : !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('aksara_topic_sidebar_minimized', String(next));
            }
            return next;
        });
    };

    // Search query & category filter for notes
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'regular' | 'task'>('all');

    // Modals
    const [editAppModalOpen, setEditAppModalOpen] = useState(false);
    const [appCollabOpen, setAppCollabOpen] = useState(false);
    const [appShareOpen, setAppShareOpen] = useState(false);
    const [noteCollabOpen, setNoteCollabOpen] = useState(false);
    const [noteShareOpen, setNoteShareOpen] = useState(false);
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const [clonesModalOpen, setClonesModalOpen] = useState(false);
    const [folderModalState, setFolderModalState] = useState<{
        isOpen: boolean;
        mode: 'create' | 'edit';
        group?: NoteGroup | null;
    }>({
        isOpen: false,
        mode: 'create',
        group: null,
    });
    const [groupShareModalState, setGroupShareModalState] = useState<{
        isOpen: boolean;
        group: NoteGroup | null;
    }>({
        isOpen: false,
        group: null,
    });
    const [groupCollabModalState, setGroupCollabModalState] = useState<{
        isOpen: boolean;
        group: NoteGroup | null;
    }>({
        isOpen: false,
        group: null,
    });

    const noteShareOpenRef = useRef(noteShareOpen);
    useEffect(() => { noteShareOpenRef.current = noteShareOpen; }, [noteShareOpen]);

    const noteCollabOpenRef = useRef(noteCollabOpen);
    useEffect(() => { noteCollabOpenRef.current = noteCollabOpen; }, [noteCollabOpen]);

    const groupShareModalStateRef = useRef(groupShareModalState);
    useEffect(() => { groupShareModalStateRef.current = groupShareModalState; }, [groupShareModalState]);

    const groupCollabModalStateRef = useRef(groupCollabModalState);
    useEffect(() => { groupCollabModalStateRef.current = groupCollabModalState; }, [groupCollabModalState]);

    const folderModalStateRef = useRef(folderModalState);
    useEffect(() => { folderModalStateRef.current = folderModalState; }, [folderModalState]);

    const editAppModalOpenRef = useRef(editAppModalOpen);
    useEffect(() => { editAppModalOpenRef.current = editAppModalOpen; }, [editAppModalOpen]);

    const appCollabOpenRef = useRef(appCollabOpen);
    useEffect(() => { appCollabOpenRef.current = appCollabOpen; }, [appCollabOpen]);

    const appShareOpenRef = useRef(appShareOpen);
    useEffect(() => { appShareOpenRef.current = appShareOpen; }, [appShareOpen]);

    const clonesModalOpenRef = useRef(clonesModalOpen);
    useEffect(() => { clonesModalOpenRef.current = clonesModalOpen; }, [clonesModalOpen]);

    const duplicateModalOpenRef = useRef(duplicateModalOpen);
    useEffect(() => { duplicateModalOpenRef.current = duplicateModalOpen; }, [duplicateModalOpen]);

    const syncModalOpenRef = useRef(syncModalOpen);
    useEffect(() => { syncModalOpenRef.current = syncModalOpen; }, [syncModalOpen]);

    const mobileTopicDrawerOpenRef = useRef(mobileTopicDrawerOpen);
    useEffect(() => { mobileTopicDrawerOpenRef.current = mobileTopicDrawerOpen; }, [mobileTopicDrawerOpen]);

    const keepModalNoteRef = useRef(keepModalNote);
    useEffect(() => { keepModalNoteRef.current = keepModalNote; }, [keepModalNote]);

    // Initial note_id handling: push state so Back closes note rather than exiting
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.has('note_id')) {
                const noteId = params.get('note_id');
                const baseUrl = is_public_view ? window.location.pathname : `/app/${app.id}`;
                const currentState = window.history.state || {};
                window.history.replaceState({ ...currentState, base: true }, '', baseUrl);
                const modalUrl = is_public_view
                    ? `${window.location.pathname}?note_id=${noteId}`
                    : `/app/${app.id}?note_id=${noteId}`;
                window.history.pushState({ ...currentState, aksaraModal: 'keep-note', noteId }, '', modalUrl);
            }
        }
    }, []);

    // Intercept hardware/mobile back button to close any active modal
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (noteShareOpenRef.current) {
                e.stopImmediatePropagation();
                setNoteShareOpen(false);
                return;
            }
            if (noteCollabOpenRef.current) {
                e.stopImmediatePropagation();
                setNoteCollabOpen(false);
                return;
            }
            if (groupShareModalStateRef.current.isOpen) {
                e.stopImmediatePropagation();
                setGroupShareModalState({ isOpen: false, group: null });
                return;
            }
            if (groupCollabModalStateRef.current.isOpen) {
                e.stopImmediatePropagation();
                setGroupCollabModalState({ isOpen: false, group: null });
                return;
            }
            if (folderModalStateRef.current.isOpen) {
                e.stopImmediatePropagation();
                setFolderModalState((prev) => ({ ...prev, isOpen: false }));
                return;
            }
            if (editAppModalOpenRef.current) {
                e.stopImmediatePropagation();
                setEditAppModalOpen(false);
                return;
            }
            if (appCollabOpenRef.current) {
                e.stopImmediatePropagation();
                setAppCollabOpen(false);
                return;
            }
            if (appShareOpenRef.current) {
                e.stopImmediatePropagation();
                setAppShareOpen(false);
                return;
            }
            if (clonesModalOpenRef.current) {
                e.stopImmediatePropagation();
                setClonesModalOpen(false);
                return;
            }
            if (duplicateModalOpenRef.current) {
                e.stopImmediatePropagation();
                setDuplicateModalOpen(false);
                return;
            }
            if (syncModalOpenRef.current) {
                e.stopImmediatePropagation();
                setSyncModalOpen(false);
                return;
            }
            if (mobileTopicDrawerOpenRef.current) {
                e.stopImmediatePropagation();
                setMobileTopicDrawerOpen(false);
                return;
            }
            if (keepModalNoteRef.current) {
                setKeepModalNote(null);
                const baseUrl = is_public_view ? window.location.pathname : `/app/${app.id}`;
                window.history.replaceState({ ...window.history.state, aksaraModal: undefined }, '', baseUrl);
                return;
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const handleOpenShareGroup = (group: NoteGroup) => {
        setGroupShareModalState({
            isOpen: true,
            group,
        });
        pushModalState('group-share');
    };

    const handleOpenCollabGroup = (group: NoteGroup) => {
        setGroupCollabModalState({
            isOpen: true,
            group,
        });
        pushModalState('group-collab');
    };


    // Flat list of all notes with group names
    const allNotes = localGroups.flatMap((g) =>
        (g.notes || []).map((n) => ({ ...n, group_name: g.name }))
    );

    // Filtered notes by group, search query, and category/deadline, sorted by pinned & sort_order
    const filteredNotes = allNotes
        .filter((note) => {
            const matchesGroup = activeGroupId === 'all' || note.note_group_id === activeGroupId;
            const matchesSearch =
                !searchQuery || (note.title || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory =
                categoryFilter === 'all' ||
                (categoryFilter === 'task'
                    ? Boolean(note.deadline_at) || note.category === 'task'
                    : note.category === 'regular');
            return matchesGroup && matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            // Pinned first
            if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) {
                return a.is_pinned ? -1 : 1;
            }
            // Sort order ascending
            const orderA = a.sort_order ?? 0;
            const orderB = b.sort_order ?? 0;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            // Fallback by created_at descending or ID
            return (b.created_at || '').localeCompare(a.created_at || '') || b.id.localeCompare(a.id);
        });

    const handleSelectNote = (note: Note) => {
        setKeepModalNote(note);
        if (typeof window !== 'undefined') {
            const targetUrl = is_public_view
                ? `${window.location.pathname}?note_id=${note.id}`
                : `/app/${app.id}?note_id=${note.id}`;
            pushModalState('keep-note', targetUrl);
        }
    };

    const handleCloseKeepModal = () => {
        setKeepModalNote(null);
        if (typeof window !== 'undefined') {
            const baseUrl = is_public_view ? window.location.pathname : `/app/${app.id}`;
            popModalStateIfActive('keep-note', baseUrl);
        }
    };

    const handleNoteCreated = (newNote: Note) => {
        setLocalGroups((prevGroups) =>
            prevGroups.map((g) => {
                if (g.id === newNote.note_group_id) {
                    const existingIndex = (g.notes || []).findIndex((n) => n.id === newNote.id);
                    if (existingIndex >= 0) {
                        const updatedNotes = [...(g.notes || [])];
                        updatedNotes[existingIndex] = { ...updatedNotes[existingIndex], ...newNote };
                        return { ...g, notes: updatedNotes };
                    }
                    return { ...g, notes: [newNote, ...(g.notes || [])] };
                }
                return g;
            })
        );
        setKeepModalNote(newNote);
    };

    const handleNoteUpdated = (updatedNote: Note) => {
        setLocalGroups((prevGroups) =>
            prevGroups.map((g) => {
                const hasNote = (g.notes || []).some((n) => n.id === updatedNote.id);
                if (g.id === updatedNote.note_group_id) {
                    if (hasNote) {
                        return {
                            ...g,
                            notes: (g.notes || []).map((n) =>
                                n.id === updatedNote.id ? { ...n, ...updatedNote } : n
                            ),
                        };
                    } else {
                        // Note was moved into this group! Add it to the top
                        return {
                            ...g,
                            notes: [updatedNote, ...(g.notes || [])],
                        };
                    }
                } else if (hasNote) {
                    // Note was moved out of this group! Remove it
                    return {
                        ...g,
                        notes: (g.notes || []).filter((n) => n.id !== updatedNote.id),
                    };
                }
                return g;
            })
        );
        if (keepModalNote?.id === updatedNote.id) {
            setKeepModalNote((prev) => (prev ? { ...prev, ...updatedNote } : updatedNote));
        }
    };

    const handleTogglePin = async (note: Note) => {
        const nextPinned = !note.is_pinned;
        // Optimistic update
        setLocalGroups((prevGroups) =>
            prevGroups.map((g) => ({
                ...g,
                notes: (g.notes || []).map((n) =>
                    n.id === note.id ? { ...n, is_pinned: nextPinned } : n
                ),
            }))
        );
        if (keepModalNote?.id === note.id) {
            setKeepModalNote((prev) => (prev ? { ...prev, is_pinned: nextPinned } : null));
        }

        try {
            const csrfToken = getCsrfToken();
            await fetch(`/notes/${note.id}/pin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
        } catch {
            // Revert on error
            setLocalGroups((prevGroups) =>
                prevGroups.map((g) => ({
                    ...g,
                    notes: (g.notes || []).map((n) =>
                        n.id === note.id ? { ...n, is_pinned: note.is_pinned } : n
                    ),
                }))
            );
        }
    };

    const handleReorderNotes = async (
        reorderedNotes: { id: string; sort_order: number; is_pinned?: boolean }[]
    ) => {
        const orderMap = new Map<string, { sort_order: number; is_pinned?: boolean }>();
        reorderedNotes.forEach((item) => {
            orderMap.set(item.id, { sort_order: item.sort_order, is_pinned: item.is_pinned });
        });

        // Optimistically update local groups
        setLocalGroups((prevGroups) =>
            prevGroups.map((g) => ({
                ...g,
                notes: (g.notes || []).map((n) => {
                    const update = orderMap.get(n.id);
                    if (update) {
                        return {
                            ...n,
                            sort_order: update.sort_order,
                            is_pinned: update.is_pinned !== undefined ? update.is_pinned : n.is_pinned,
                        };
                    }
                    return n;
                }),
            }))
        );

        try {
            const csrfToken = getCsrfToken();
            await fetch('/notes/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ notes: reorderedNotes }),
            });
        } catch {
            // ignore network error
        }
    };

    const handleReorderGroups = async (
        reorderedGroups: { id: string; sort_order: number }[]
    ) => {
        const orderMap = new Map<string, number>();
        reorderedGroups.forEach((item) => {
            orderMap.set(item.id, item.sort_order);
        });

        // Optimistically update local groups sorted by new sort_order
        setLocalGroups((prevGroups) => {
            const updated = prevGroups.map((g) => {
                const newOrder = orderMap.get(g.id);
                return newOrder !== undefined ? { ...g, sort_order: newOrder } : g;
            });
            return updated.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        });

        try {
            const csrfToken = getCsrfToken();
            await fetch('/groups/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ groups: reorderedGroups }),
            });
        } catch {
            // ignore network error
        }
    };

    const handleOpenCreateModal = (format: 'text' | 'checklist' | 'drawing' = 'text') => {
        const targetGroupId = activeGroupId === 'all' ? (localGroups[0]?.id || '') : activeGroupId;
        const newDraft: Note = {
            id: '',
            note_group_id: targetGroupId,
            title: '',
            category: 'regular',
            content_json: JSON.stringify({ type: format, html: '', checklist: [] }),
            drawing_data: null,
            is_public: false,
            public_token: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            attachments: [],
            collaborators: [],
        };
        setKeepModalNote(newDraft);
        if (typeof window !== 'undefined') {
            const targetUrl = is_public_view
                ? `${window.location.pathname}?draft=new`
                : `/app/${app.id}?draft=new`;
            pushModalState('keep-note', targetUrl);
        }
    };

    const handleCreateNote = (groupId: string, category: 'regular' | 'task' = 'regular') => {
        router.post(
            `/groups/${groupId}/notes`,
            {
                category,
                title: category === 'task' ? 'Tugas Baru' : 'Catatan Baru',
            },
            {
                preserveScroll: true,
            }
        );
    };

    const handleDeleteNote = (noteId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) return;
        setLocalGroups((prevGroups) =>
            prevGroups.map((g) => ({
                ...g,
                notes: (g.notes || []).filter((n) => n.id !== noteId),
            }))
        );
        if (keepModalNote?.id === noteId) {
            handleCloseKeepModal();
        }
        router.delete(`/notes/${noteId}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleOpenAddGroup = () => {
        setFolderModalState({
            isOpen: true,
            mode: 'create',
            group: null,
        });
        pushModalState('folder-modal');
    };

    const handleOpenEditGroup = (group: NoteGroup) => {
        setFolderModalState({
            isOpen: true,
            mode: 'edit',
            group,
        });
        pushModalState('folder-modal');
    };

    const handleSaveGroupModal = async (name: string, color: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        if (folderModalState.mode === 'create') {
            try {
                const csrfToken = getCsrfToken();
                const response = await fetch(`/app/${app.id}/groups`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        name: trimmedName,
                        color: color || '#FFDC58',
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.group) {
                        const newGroup: NoteGroup = {
                            ...data.group,
                            notes: data.group.notes || [],
                        };
                        setLocalGroups((prev) => [...prev, newGroup]);
                        setActiveGroupId(newGroup.id);
                    }
                } else {
                    router.post(
                        `/app/${app.id}/groups`,
                        { name: trimmedName, color: color || '#FFDC58' },
                        { preserveScroll: true, preserveState: true }
                    );
                }
            } catch {
                router.post(
                    `/app/${app.id}/groups`,
                    { name: trimmedName, color: color || '#FFDC58' },
                    { preserveScroll: true, preserveState: true }
                );
            }
        } else if (folderModalState.mode === 'edit' && folderModalState.group) {
            const groupId = folderModalState.group.id;
            const updatedColor = color || '#FFDC58';

            setLocalGroups((prev) =>
                prev.map((g) =>
                    g.id === groupId
                        ? { ...g, name: trimmedName, color: updatedColor }
                        : g
                )
            );

            try {
                const csrfToken = getCsrfToken();
                await fetch(`/groups/${groupId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        name: trimmedName,
                        color: updatedColor,
                    }),
                });
            } catch {
                router.put(
                    `/groups/${groupId}`,
                    { name: trimmedName, color: updatedColor },
                    { preserveScroll: true, preserveState: true }
                );
            }
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (
            !confirm(
                `Hapus ${topicLabel.toLowerCase()} ini? Semua catatan di dalamnya juga akan terhapus secara permanen!`
            )
        )
            return;

        // Optimistically remove group and update activeGroupId if necessary
        setLocalGroups((prev) => prev.filter((g) => g.id !== groupId));
        if (activeGroupId === groupId) {
            setActiveGroupId('all');
        }

        try {
            const csrfToken = getCsrfToken();
            await fetch(`/groups/${groupId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
        } catch {
            router.delete(`/groups/${groupId}`, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    const workspaceNav = (
        <WorkspaceNavbar
            app={localApp}
            groups={localGroups}
            activeGroupId={activeGroupId}
            setActiveGroupId={handleSetActiveGroupId}
            totalNotesAll={allNotes.length}
            canEdit={can_edit}
            isOwner={is_owner}
            isCollaborator={isCollaborator}
            isGroupSharedView={is_group_shared_view}
            sharedGroup={selected_group}
            isSaved={is_saved}
            shareItemType={share_item_type}
            shareItemId={share_item_id || (is_group_shared_view && selected_group ? selected_group.id : (is_single_note_view && selected_note ? selected_note.id : localApp.id))}
            sharePublicToken={share_public_token || (is_group_shared_view && selected_group ? selected_group.public_token || undefined : (is_single_note_view && selected_note ? selected_note.public_token || undefined : localApp.public_token))}
            isPublicView={is_public_view}
            onOpenEditApp={canManageSettings ? () => {
                setEditAppModalOpen(true);
                pushModalState('edit-app');
            } : undefined}
            onOpenCollab={() => {
                if (is_group_shared_view && selected_group) {
                    handleOpenCollabGroup(selected_group);
                } else {
                    setAppCollabOpen(true);
                    pushModalState('app-collab');
                }
            }}
            onOpenShare={() => {
                if (is_group_shared_view && selected_group) {
                    handleOpenShareGroup(selected_group);
                } else {
                    setAppShareOpen(true);
                    pushModalState('app-share');
                }
            }}
            onOpenDuplicate={() => {
                setDuplicateModalOpen(true);
                pushModalState('duplicate-modal');
            }}
            onOpenSync={() => {
                setSyncModalOpen(true);
                pushModalState('sync-modal');
            }}
            onOpenClones={() => {
                setClonesModalOpen(true);
                pushModalState('clones-modal');
            }}
            onOpenShareGroup={handleOpenShareGroup}
            onOpenAddGroup={handleOpenAddGroup}
            onOpenEditGroup={handleOpenEditGroup}
            onDeleteGroup={handleDeleteGroup}
            onToggleTopicSidebar={() => handleToggleTopicSidebar()}
            isTopicSidebarMinimized={isTopicSidebarMinimized}
            topicLabel={topicLabel}
        />
    );

    return (
        <MemberLayout
            title={`${app.name} - Aksara Workspace`}
            workspaceNav={workspaceNav}
        >
            <div className="md:flex md:items-start md:gap-5 lg:gap-6 relative w-full">
                {/* FLOATING & COLLAPSIBLE TOPIC SIDEBAR */}
                <FloatingTopicSidebar
                    groups={localGroups}
                    activeGroupId={activeGroupId}
                    setActiveGroupId={handleSetActiveGroupId}
                    totalNotesAll={allNotes.length}
                    canEdit={can_edit}
                    isOwner={is_owner}
                    isGroupSharedView={is_group_shared_view}
                    sharedGroup={selected_group}
                    isPublicView={is_public_view}
                    topicLabel={topicLabel}
                    onUpdateTopicLabel={handleUpdateTopicLabel}
                    onOpenAddGroup={handleOpenAddGroup}
                    onOpenEditGroup={handleOpenEditGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onOpenShareGroup={handleOpenShareGroup}
                    onOpenCollabGroup={handleOpenCollabGroup}
                    onReorderGroups={handleReorderGroups}
                    isMinimized={isTopicSidebarMinimized}
                    setIsMinimized={(val) => handleToggleTopicSidebar(val)}
                    mobileDrawerOpen={mobileTopicDrawerOpen}
                    setMobileDrawerOpen={(open) => {
                        setMobileTopicDrawerOpen(open);
                        if (!open) {
                            popModalStateIfActive('mobile-drawer');
                        }
                    }}
                />

                {/* PRIMARY GOOGLE KEEP-STYLE WORKSPACE (In-Place Creation, Filter & Cards Grid) */}
                <div className="w-full flex-1 min-w-0">
                    <WorkspaceExplorer
                        groups={localGroups}
                        activeGroupId={activeGroupId}
                        setActiveGroupId={handleSetActiveGroupId}
                        filteredNotes={filteredNotes}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        categoryFilter={categoryFilter}
                        setCategoryFilter={setCategoryFilter}
                        canEdit={can_edit}
                        onSelectNote={handleSelectNote}
                        onCreateNote={handleCreateNote}
                        onDeleteNote={handleDeleteNote}
                        onOpenNoteShare={(note) => {
                            setKeepModalNote(note);
                            setNoteShareOpen(true);
                            pushModalState('note-share');
                        }}
                        defaultReminderDays={user?.default_reminder_days || 1}
                        onNoteCreated={handleNoteCreated}
                        onOpenCreateModal={handleOpenCreateModal}
                        onTogglePin={handleTogglePin}
                        onReorderNotes={handleReorderNotes}
                        topicLabel={topicLabel}
                    />
                </div>
            </div>

            {/* Google Keep-Style In-Place Modal with True Fullscreen Toggle */}
            {keepModalNote && (
                <KeepNoteModal
                    note={keepModalNote}
                    isOpen={Boolean(keepModalNote)}
                    onClose={handleCloseKeepModal}
                    groups={localGroups}
                    canEdit={can_edit}
                    user={user}
                    systemSettings={system_settings}
                    topicLabel={topicLabel}
                    onNoteUpdated={handleNoteUpdated}
                    onNoteCreated={handleNoteCreated}
                    onDeleteNote={handleDeleteNote}
                    onOpenCollab={(n) => {
                        setKeepModalNote(n);
                        setNoteCollabOpen(true);
                        pushModalState('note-collab');
                    }}
                    onOpenShare={(n) => {
                        setKeepModalNote(n);
                        setNoteShareOpen(true);
                        pushModalState('note-share');
                    }}
                />
            )}

            {/* App Level Edit & Settings Modal */}
            {canManageSettings && (
                <EditAppModal
                    isOpen={editAppModalOpen}
                    onClose={() => {
                        setEditAppModalOpen(false);
                        popModalStateIfActive('edit-app');
                    }}
                    app={localApp}
                    isOwner={is_owner}
                    onUpdated={(updated) => {
                        setLocalApp(updated);
                    }}
                    onDeleted={() => {
                        setEditAppModalOpen(false);
                        popModalStateIfActive('edit-app');
                    }}
                />
            )}

            {/* App Level Collaborators Modal */}
            <CollaboratorsModal
                isOpen={appCollabOpen}
                onClose={() => {
                    setAppCollabOpen(false);
                    popModalStateIfActive('app-collab');
                }}
                level="app"
                targetId={app.id}
                title={app.name}
                collaborators={app.collaborators || []}
            />

            {/* App Level Share Modal */}
            <ShareModal
                isOpen={appShareOpen}
                onClose={() => {
                    setAppShareOpen(false);
                    popModalStateIfActive('app-share');
                }}
                level="app"
                targetId={localApp.id}
                title={localApp.name}
                isPublic={localApp.is_public}
                publicToken={localApp.public_token}
                publicPermission={localApp.public_permission}
                canEdit={can_edit}
                isOwner={is_owner}
                isPublicView={is_public_view}
                onSharingUpdated={(updated) => {
                    setLocalApp((prev) => ({
                        ...prev,
                        is_public: updated.is_public,
                        public_token: updated.public_token,
                        public_permission: updated.public_permission,
                    }));
                }}
            />

            {/* Note Level Collaborators Modal */}
            {keepModalNote && (
                <CollaboratorsModal
                    isOpen={noteCollabOpen}
                    onClose={() => {
                        setNoteCollabOpen(false);
                        popModalStateIfActive('note-collab');
                    }}
                    level="note"
                    targetId={keepModalNote.id}
                    title={keepModalNote.title}
                    collaborators={keepModalNote.collaborators || []}
                />
            )}

            {/* Note Level Share Modal */}
            {keepModalNote && (
                <ShareModal
                    isOpen={noteShareOpen}
                    onClose={() => {
                        setNoteShareOpen(false);
                        popModalStateIfActive('note-share');
                    }}
                    level="note"
                    targetId={keepModalNote.id}
                    title={keepModalNote.title}
                    isPublic={keepModalNote.is_public}
                    publicToken={keepModalNote.public_token}
                    publicPermission={keepModalNote.public_permission}
                    canEdit={can_edit}
                    isOwner={is_owner}
                    isPublicView={is_public_view}
                    contextInherited={Boolean(is_public_view && !is_single_note_view)}
                    rootName={is_group_shared_view && selected_group ? `${topicLabel} '${selected_group.name}'` : `Ruang Kerja '${localApp.name}'`}
                    contextPermission={is_group_shared_view && selected_group ? selected_group.public_permission : localApp.public_permission}
                    contextShareUrl={
                        typeof window !== 'undefined'
                            ? (is_group_shared_view && selected_group
                                  ? `${window.location.origin}/s/${selected_group.public_token}?note_id=${keepModalNote.id}`
                                  : (localApp.public_token ? `${window.location.origin}/s/${localApp.public_token}?note_id=${keepModalNote.id}` : undefined))
                            : undefined
                    }
                    onSharingUpdated={(updated) => {
                        setKeepModalNote((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      is_public: updated.is_public,
                                      public_token: updated.public_token,
                                      public_permission: updated.public_permission,
                                  }
                                : null
                        );
                        setLocalGroups((prevGroups) =>
                            prevGroups.map((g) => ({
                                ...g,
                                notes: (g.notes || []).map((n) =>
                                    n.id === keepModalNote.id
                                        ? {
                                              ...n,
                                              is_public: updated.is_public,
                                              public_token: updated.public_token,
                                              public_permission: updated.public_permission,
                                          }
                                        : n
                                ),
                            }))
                        );
                    }}
                />
            )}

            {/* Group Level Share Modal */}
            {groupShareModalState.group && (
                <ShareModal
                    isOpen={groupShareModalState.isOpen}
                    onClose={() => {
                        setGroupShareModalState((prev) => ({ ...prev, isOpen: false }));
                        popModalStateIfActive('group-share');
                    }}
                    level="group"
                    targetId={groupShareModalState.group.id}
                    title={groupShareModalState.group.name}
                    isPublic={groupShareModalState.group.is_public}
                    publicToken={groupShareModalState.group.public_token}
                    publicPermission={groupShareModalState.group.public_permission}
                    canEdit={can_edit}
                    isOwner={is_owner}
                    isPublicView={is_public_view}
                    contextInherited={Boolean(is_public_view && !is_group_shared_view)}
                    rootName={`Ruang Kerja '${localApp.name}'`}
                    contextPermission={localApp.public_permission}
                    contextShareUrl={
                        typeof window !== 'undefined'
                            ? (localApp.public_token ? `${window.location.origin}/s/${localApp.public_token}?group_id=${groupShareModalState.group.id}` : undefined)
                            : undefined
                    }
                    onSharingUpdated={(updated) => {
                        setGroupShareModalState((prev) =>
                            prev.group
                                ? {
                                      ...prev,
                                      group: {
                                          ...prev.group,
                                          is_public: updated.is_public,
                                          public_token: updated.public_token,
                                          public_permission: updated.public_permission,
                                      },
                                  }
                                : prev
                        );
                        setLocalGroups((prevGroups) =>
                            prevGroups.map((g) =>
                                g.id === groupShareModalState.group?.id
                                    ? {
                                          ...g,
                                          is_public: updated.is_public,
                                          public_token: updated.public_token,
                                          public_permission: updated.public_permission,
                                      }
                                    : g
                            )
                        );
                    }}
                />
            )}

            {/* Folder Add / Edit Modal */}
            <FolderModal
                isOpen={folderModalState.isOpen}
                onClose={() => {
                    setFolderModalState((prev) => ({ ...prev, isOpen: false }));
                    popModalStateIfActive('folder-modal');
                }}
                mode={folderModalState.mode}
                initialGroup={folderModalState.group}
                onSubmit={handleSaveGroupModal}
                onDelete={handleDeleteGroup}
                topicLabel={topicLabel}
            />

            {/* Group Level Collaborators Modal */}
            {groupCollabModalState.group && (
                <CollaboratorsModal
                    isOpen={groupCollabModalState.isOpen}
                    onClose={() => {
                        setGroupCollabModalState({ isOpen: false, group: null });
                        popModalStateIfActive('group-collab');
                    }}
                    level="group"
                    targetId={groupCollabModalState.group.id}
                    title={groupCollabModalState.group.name}
                    collaborators={groupCollabModalState.group.collaborators || []}
                />
            )}

            {/* Duplicate App Modal */}
            <DuplicateAppModal
                isOpen={duplicateModalOpen}
                onClose={() => {
                    setDuplicateModalOpen(false);
                    popModalStateIfActive('duplicate-modal');
                }}
                app={localApp}
            />

            {/* Sync Workspace Modal */}
            <SyncWorkspaceModal
                isOpen={syncModalOpen}
                onClose={() => {
                    setSyncModalOpen(false);
                    popModalStateIfActive('sync-modal');
                }}
                currentApp={localApp}
                onSuccess={() => {
                    router.reload();
                }}
            />

            {/* Clones / Duplicates List Modal */}
            {is_owner && (
                <ClonesModal
                    isOpen={clonesModalOpen}
                    onClose={() => {
                        setClonesModalOpen(false);
                        popModalStateIfActive('clones-modal');
                    }}
                    app={localApp}
                />
            )}
        </MemberLayout>
    );
}
