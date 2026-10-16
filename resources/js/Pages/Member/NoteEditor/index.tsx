import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ChecklistItem, Note, PageProps } from '@/types';
import MemberLayout from '@/Layouts/MemberLayout';
import CollaboratorsModal from '@/Components/Modals/CollaboratorsModal';
import ShareModal from '@/Components/Modals/ShareModal';
import { NoteEditorProps, MobileTab } from './types';
import WorkspaceHeader from './components/WorkspaceHeader';
import GroupSidebar from './components/GroupSidebar';
import NoteListSidebar from './components/NoteListSidebar';
import EditorArea from './components/EditorArea';

export default function NoteEditor({
    app,
    groups = [],
    selected_note,
    is_owner,
    can_edit,
}: NoteEditorProps) {
    const { auth, system_settings } = usePage<PageProps>().props;
    const user = auth.user;

    // View state on mobile
    const [mobileTab, setMobileTab] = useState<MobileTab>('editor');

    // Selected group for filtering notes
    const [activeGroupId, setActiveGroupId] = useState<number | 'all'>('all');

    // Search query for notes
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'regular' | 'task'>('all');

    // Modals
    const [appCollabOpen, setAppCollabOpen] = useState(false);
    const [appShareOpen, setAppShareOpen] = useState(false);
    const [noteCollabOpen, setNoteCollabOpen] = useState(false);
    const [noteShareOpen, setNoteShareOpen] = useState(false);

    // Group management
    const [newGroupName, setNewGroupName] = useState('');
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [editingGroupName, setEditingGroupName] = useState('');

    // Editor local state
    const [editorTitle, setEditorTitle] = useState('');
    const [editorCategory, setEditorCategory] = useState<'regular' | 'task'>('regular');
    const [editorDeadline, setEditorDeadline] = useState('');
    const [editorReminderDays, setEditorReminderDays] = useState(user?.default_reminder_days || 1);
    const [editorTab, setEditorTab] = useState<'text' | 'checklist' | 'drawing' | 'attachments'>('text');

    const [editorHtml, setEditorHtml] = useState('');
    const [editorChecklist, setEditorChecklist] = useState<ChecklistItem[]>([]);
    const [editorDrawing, setEditorDrawing] = useState<string | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Synchronize editor state when selected_note changes
    useEffect(() => {
        if (selected_note) {
            setEditorTitle(selected_note.title || 'Catatan Baru');
            setEditorCategory(selected_note.category);
            setEditorDeadline(
                selected_note.deadline_at
                    ? new Date(selected_note.deadline_at).toISOString().slice(0, 16)
                    : ''
            );
            setEditorReminderDays(
                selected_note.reminder_days_before ?? (user?.default_reminder_days || 1)
            );
            setEditorDrawing(selected_note.drawing_data || null);

            // Parse json content
            try {
                if (selected_note.content_json) {
                    const parsed = JSON.parse(selected_note.content_json);
                    setEditorHtml(parsed.html || '');
                    setEditorChecklist(Array.isArray(parsed.checklist) ? parsed.checklist : []);
                } else {
                    setEditorHtml('');
                    setEditorChecklist([]);
                }
            } catch {
                setEditorHtml(selected_note.content_json || '');
                setEditorChecklist([]);
            }
        }
    }, [selected_note?.id]);

    // Flat list of all notes
    const allNotes = groups.flatMap((g) =>
        (g.notes || []).map((n) => ({ ...n, group_name: g.name }))
    );

    // Filtered notes by group and search query
    const filteredNotes = allNotes.filter((note) => {
        const matchesGroup = activeGroupId === 'all' || note.group_id === activeGroupId;
        const matchesSearch =
            !searchQuery || note.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            categoryFilter === 'all' || note.category === categoryFilter;
        return matchesGroup && matchesSearch && matchesCategory;
    });

    const handleSaveNote = () => {
        if (!selected_note || !can_edit) return;

        setIsSaving(true);
        setSaveSuccess(false);

        const contentJson = JSON.stringify({
            html: editorHtml,
            checklist: editorChecklist,
        });

        router.put(
            `/notes/${selected_note.id}`,
            {
                title: editorTitle.trim() || 'Catatan Tanpa Judul',
                category: editorCategory,
                content_json: contentJson,
                drawing_data: editorDrawing,
                deadline_at: editorCategory === 'task' && editorDeadline ? editorDeadline : null,
                reminder_days_before: editorCategory === 'task' ? editorReminderDays : 0,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2000);
                },
                onError: () => setIsSaving(false),
            }
        );
    };

    const handleCreateNote = (groupId: number, category: 'regular' | 'task' = 'regular') => {
        router.post(
            `/groups/${groupId}/notes`,
            {
                title: category === 'task' ? 'Tugas Baru' : 'Catatan Baru',
                category,
                content_json: JSON.stringify({ html: '', checklist: [] }),
            },
            {
                onSuccess: () => setMobileTab('editor'),
            }
        );
    };

    const handleCategoryChange = (category: 'regular' | 'task') => {
        setEditorCategory(category);
        if (category === 'task' && !editorDeadline) {
            const inThreeDays = new Date();
            inThreeDays.setDate(inThreeDays.getDate() + 3);
            inThreeDays.setHours(23, 59, 0, 0);
            setEditorDeadline(inThreeDays.toISOString().slice(0, 16));
        }
    };

    const handleAddGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        router.post(
            `/app/${app.id}/groups`,
            { name: newGroupName.trim() },
            {
                onSuccess: () => setNewGroupName(''),
            }
        );
    };

    const handleDeleteGroup = (groupId: number) => {
        if (!confirm('Hapus grup ini dan seluruh catatan di dalamnya?')) return;
        router.delete(`/groups/${groupId}`);
    };

    const handleDeleteNote = (noteId: number) => {
        if (!confirm('Hapus catatan ini?')) return;
        router.delete(`/notes/${noteId}`, {
            onSuccess: () => {
                if (allNotes.length > 1) {
                    const remaining = allNotes.filter((n) => n.id !== noteId);
                    if (remaining.length > 0) {
                        router.visit(`/app/${app.id}?note_id=${remaining[0].id}`);
                    }
                }
            },
        });
    };

    const handleSaveGroupRename = (groupId: number) => {
        if (!editingGroupName.trim()) return;
        router.put(
            `/groups/${groupId}`,
            { name: editingGroupName.trim() },
            {
                onSuccess: () => {
                    setEditingGroupId(null);
                    setEditingGroupName('');
                },
            }
        );
    };

    const themeColors: Record<string, string> = {
        yellow: 'bg-[#FFDC58]',
        purple: 'bg-[#A388EE]',
        mint: 'bg-[#7FBC8C]',
        coral: 'bg-[#FF6B6B]',
        sky: 'bg-[#69D2E7]',
        pink: 'bg-[#FF8FAB]',
        orange: 'bg-[#FFA94D]',
    };

    return (
        <MemberLayout
            title={`${app.name} - Workspace`}
            noPadding
            header={
                <WorkspaceHeader
                    app={app}
                    isOwner={is_owner}
                    groupsCount={groups.length}
                    notesCount={filteredNotes.length}
                    mobileTab={mobileTab}
                    setMobileTab={setMobileTab}
                    onOpenCollab={() => setAppCollabOpen(true)}
                    onOpenShare={() => setAppShareOpen(true)}
                    themeBg={themeColors[app.color_theme] || 'bg-[#FFDC58]'}
                />
            }
        >
            {/* Main 3-Column Layout */}
            <main className="max-w-7xl mx-auto w-full p-4 pb-28 md:pb-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* COLUMN 1: GROUPS */}
                <GroupSidebar
                    groups={groups}
                    activeGroupId={activeGroupId}
                    setActiveGroupId={setActiveGroupId}
                    editingGroupId={editingGroupId}
                    setEditingGroupId={setEditingGroupId}
                    editingGroupName={editingGroupName}
                    setEditingGroupName={setEditingGroupName}
                    newGroupName={newGroupName}
                    setNewGroupName={setNewGroupName}
                    canEdit={can_edit}
                    mobileTab={mobileTab}
                    setMobileTab={setMobileTab}
                    onSaveRename={handleSaveGroupRename}
                    onDeleteGroup={handleDeleteGroup}
                    onAddGroup={handleAddGroup}
                />

                {/* COLUMN 2: NOTES LIST */}
                <NoteListSidebar
                    appId={app.id}
                    groups={groups}
                    filteredNotes={filteredNotes}
                    selectedNote={selected_note}
                    activeGroupId={activeGroupId}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    canEdit={can_edit}
                    mobileTab={mobileTab}
                    setMobileTab={setMobileTab}
                    onCreateNote={handleCreateNote}
                />

                {/* COLUMN 3: MULTI-COMPONENT EDITOR */}
                <EditorArea
                    selectedNote={selected_note}
                    groups={groups}
                    canEdit={can_edit}
                    user={user}
                    systemSettings={system_settings}
                    mobileTab={mobileTab}
                    editorTitle={editorTitle}
                    setEditorTitle={setEditorTitle}
                    editorCategory={editorCategory}
                    onCategoryChange={handleCategoryChange}
                    editorDeadline={editorDeadline}
                    setEditorDeadline={setEditorDeadline}
                    editorReminderDays={editorReminderDays}
                    setEditorReminderDays={setEditorReminderDays}
                    editorTab={editorTab}
                    setEditorTab={setEditorTab}
                    editorHtml={editorHtml}
                    setEditorHtml={setEditorHtml}
                    editorChecklist={editorChecklist}
                    setEditorChecklist={setEditorChecklist}
                    editorDrawing={editorDrawing}
                    setEditorDrawing={setEditorDrawing}
                    isSaving={isSaving}
                    saveSuccess={saveSuccess}
                    onSaveNote={handleSaveNote}
                    onDeleteNote={handleDeleteNote}
                    onOpenNoteCollab={() => setNoteCollabOpen(true)}
                    onOpenNoteShare={() => setNoteShareOpen(true)}
                    onCreateNote={handleCreateNote}
                />
            </main>

            {/* App Level Collaborators Modal */}
            <CollaboratorsModal
                isOpen={appCollabOpen}
                onClose={() => setAppCollabOpen(false)}
                level="app"
                targetId={app.id}
                title={app.name}
                collaborators={app.collaborators || []}
            />

            {/* App Level Share Modal */}
            <ShareModal
                isOpen={appShareOpen}
                onClose={() => setAppShareOpen(false)}
                level="app"
                targetId={app.id}
                title={app.name}
                isPublic={app.is_public}
                publicToken={app.public_token}
            />

            {/* Note Level Collaborators Modal */}
            {selected_note && (
                <CollaboratorsModal
                    isOpen={noteCollabOpen}
                    onClose={() => setNoteCollabOpen(false)}
                    level="note"
                    targetId={selected_note.id}
                    title={selected_note.title}
                    collaborators={selected_note.collaborators || []}
                />
            )}

            {/* Note Level Share Modal */}
            {selected_note && (
                <ShareModal
                    isOpen={noteShareOpen}
                    onClose={() => setNoteShareOpen(false)}
                    level="note"
                    targetId={selected_note.id}
                    title={selected_note.title}
                    isPublic={selected_note.is_public}
                    publicToken={selected_note.public_token}
                />
            )}
        </MemberLayout>
    );
}
