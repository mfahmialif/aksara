import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ChecklistItem, Note, PageProps } from '@/types';
import MemberLayout from '@/Layouts/MemberLayout';
import CollaboratorsModal from '@/Components/Modals/CollaboratorsModal';
import ShareModal from '@/Components/Modals/ShareModal';
import { NoteEditorProps, ViewMode } from './types';
import WorkspaceHeader from './components/WorkspaceHeader';
import WorkspaceExplorer from './components/WorkspaceExplorer';
import EditorArea from './components/EditorArea';
import { PanelLeftClose, PanelLeft, Plus, Clock, FileText } from 'lucide-react';
import { NeoBadge } from '@/Components/UI/NeoInput';

export default function NoteEditor({
    app,
    groups = [],
    selected_note,
    is_owner,
    can_edit,
}: NoteEditorProps) {
    const { auth, system_settings } = usePage<PageProps>().props;
    const user = auth.user;

    // View mode: 'explorer' (Folder & Grid Cards) vs 'editor' (Dedicated Writer Canvas)
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.has('note_id') && selected_note) {
                return 'editor';
            }
        }
        return 'explorer';
    });

    // Sidebar visibility when inside Editor mode (for quick switching)
    const [showEditorSidebar, setShowEditorSidebar] = useState(true);

    // Selected group for filtering notes
    const [activeGroupId, setActiveGroupId] = useState<number | 'all'>('all');

    // Search query & category filter for notes
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
    const [currentNote, setCurrentNote] = useState<Note | null>(selected_note);
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

    // Synchronize editor state when selected note changes
    useEffect(() => {
        if (selected_note) {
            setCurrentNote(selected_note);
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

    // Flat list of all notes with group names
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

    // Notes in the active note's group (for quick switching sidebar in editor)
    const currentGroupNotes = currentNote
        ? allNotes.filter((n) => n.group_id === currentNote.group_id)
        : [];

    const handleSelectNote = (note: Note) => {
        if (currentNote?.id === note.id) {
            setViewMode('editor');
            return;
        }

        router.get(
            `/app/${app.id}`,
            { note_id: note.id },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setViewMode('editor');
                },
            }
        );
    };

    const handleSaveNote = () => {
        if (!currentNote || !can_edit) return;

        setIsSaving(true);
        setSaveSuccess(false);

        const contentJson = JSON.stringify({
            html: editorHtml,
            checklist: editorChecklist,
        });

        router.put(
            `/notes/${currentNote.id}`,
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
                category,
                title: category === 'task' ? 'Tugas Baru' : 'Catatan Baru',
            },
            {
                onSuccess: () => {
                    setViewMode('editor');
                },
            }
        );
    };

    const handleDeleteNote = (noteId: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) return;
        router.delete(`/notes/${noteId}`, {
            onSuccess: () => {
                setViewMode('explorer');
            },
        });
    };

    const handleCategoryChange = (cat: 'regular' | 'task') => {
        setEditorCategory(cat);
        if (cat === 'task' && !editorDeadline) {
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 3);
            defaultDate.setHours(23, 59, 0, 0);
            setEditorDeadline(defaultDate.toISOString().slice(0, 16));
            if (!editorReminderDays) {
                setEditorReminderDays(user?.default_reminder_days || 1);
            }
        }
    };

    const handleAddGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        router.post(
            `/app/${app.id}/groups`,
            { name: newGroupName.trim() },
            {
                onSuccess: () => {
                    setNewGroupName('');
                },
            }
        );
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

    const handleDeleteGroup = (groupId: number) => {
        if (
            !confirm(
                'Hapus grup ini? Semua catatan di dalamnya juga akan terhapus secara permanen!'
            )
        )
            return;
        router.delete(`/groups/${groupId}`, {
            onSuccess: () => {
                if (activeGroupId === groupId) {
                    setActiveGroupId('all');
                }
            },
        });
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

    const activeThemeBg = themeColors[app.color_theme] || 'bg-[#FFDC58]';

    return (
        <MemberLayout title={`${app.name} - Aksara Workspace`}>
            {/* Contained Neobrutalist Workspace Header (Eliminating any edge-to-edge stretching) */}
            <WorkspaceHeader
                app={app}
                isOwner={is_owner}
                groupsCount={groups.length}
                notesCount={allNotes.length}
                viewMode={viewMode}
                setViewMode={setViewMode}
                hasSelectedNote={!!currentNote}
                onOpenCollab={() => setAppCollabOpen(true)}
                onOpenShare={() => setAppShareOpen(true)}
                themeBg={activeThemeBg}
            />

            {/* VIEW 1: WORKSPACE EXPLORER (Folder Navigation & Responsive Note Cards Grid) */}
            {viewMode === 'explorer' && (
                <WorkspaceExplorer
                    groups={groups}
                    activeGroupId={activeGroupId}
                    setActiveGroupId={setActiveGroupId}
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
                        setCurrentNote(note);
                        setNoteShareOpen(true);
                    }}
                    editingGroupId={editingGroupId}
                    setEditingGroupId={setEditingGroupId}
                    editingGroupName={editingGroupName}
                    setEditingGroupName={setEditingGroupName}
                    newGroupName={newGroupName}
                    setNewGroupName={setNewGroupName}
                    onSaveRenameGroup={handleSaveGroupRename}
                    onDeleteGroup={handleDeleteGroup}
                    onAddGroup={handleAddGroup}
                />
            )}

            {/* VIEW 2: DEDICATED NOTE EDITOR (Spacious, Focus-First Canvas with Collapsible Quick Switcher) */}
            {viewMode === 'editor' && (
                <div className="flex flex-col lg:flex-row gap-5 items-start">
                    {/* Collapsible Quick Switcher Sidebar for notes in current group */}
                    {showEditorSidebar ? (
                        <div className="w-full lg:w-72 shrink-0 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b-2 border-black">
                                <div>
                                    <h3 className="font-heading font-black text-xs uppercase tracking-wider text-black">
                                        Catatan di Grup Ini
                                    </h3>
                                    <p className="text-[11px] text-neutral-500 font-bold truncate max-w-[170px]">
                                        {currentNote?.group?.name || 'Grup'} ({currentGroupNotes.length})
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowEditorSidebar(false)}
                                    className="p-1.5 hover:bg-neutral-100 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
                                    title="Sembunyikan Sidebar (Mode Fokus)"
                                >
                                    <PanelLeftClose className="w-4 h-4 text-black" />
                                </button>
                            </div>

                            {/* Create new note in current group shortcut */}
                            {canEdit && currentNote && (
                                <button
                                    type="button"
                                    onClick={() => handleCreateNote(currentNote.note_group_id, 'regular')}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#FFDC58] hover:bg-[#ffe170] border-2 border-black font-heading font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Tambah Catatan
                                </button>
                            )}

                            {/* List of notes in current group */}
                            <div className="space-y-1.5 max-h-[550px] overflow-y-auto pt-1 pr-0.5">
                                {currentGroupNotes.map((note) => {
                                    const isCurrent = currentNote?.id === note.id;
                                    const isTask = note.category === 'task';

                                    return (
                                        <div
                                            key={note.id}
                                            onClick={() => handleSelectNote(note)}
                                            className={`p-2.5 border-2 border-black transition-all cursor-pointer ${
                                                isCurrent
                                                    ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black'
                                                    : 'bg-white hover:bg-neutral-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <NeoBadge variant={isTask ? 'coral' : 'yellow'} className="text-[10px] py-0 px-1.5">
                                                    {isTask ? 'Tugas' : 'Biasa'}
                                                </NeoBadge>
                                                {isTask && note.deadline_at && (
                                                    <span className="text-[10px] font-bold text-rose-700 flex items-center gap-0.5">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {new Date(note.deadline_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold uppercase truncate text-black">
                                                {note.title || 'Tanpa Judul'}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Minimized toggle button for focus mode */
                        <button
                            type="button"
                            onClick={() => setShowEditorSidebar(true)}
                            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FFDC58] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-heading font-black text-xs uppercase cursor-pointer shrink-0"
                            title="Tampilkan Daftar Catatan"
                        >
                            <PanelLeft className="w-4 h-4 text-black" />
                            <span>Daftar Catatan</span>
                        </button>
                    )}

                    {/* Main Dedicated Editor Area */}
                    <div className="flex-1 w-full min-w-0">
                        <EditorArea
                            selectedNote={currentNote}
                            groups={groups}
                            canEdit={can_edit}
                            user={user}
                            systemSettings={system_settings}
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
                            onBackToExplorer={() => setViewMode('explorer')}
                        />
                    </div>
                </div>
            )}

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
            {currentNote && (
                <CollaboratorsModal
                    isOpen={noteCollabOpen}
                    onClose={() => setNoteCollabOpen(false)}
                    level="note"
                    targetId={currentNote.id}
                    title={currentNote.title}
                    collaborators={currentNote.collaborators || []}
                />
            )}

            {/* Note Level Share Modal */}
            {currentNote && (
                <ShareModal
                    isOpen={noteShareOpen}
                    onClose={() => setNoteShareOpen(false)}
                    level="note"
                    targetId={currentNote.id}
                    title={currentNote.title}
                    isPublic={currentNote.is_public}
                    publicToken={currentNote.public_token}
                />
            )}
        </MemberLayout>
    );
}
