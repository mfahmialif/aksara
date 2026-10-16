import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChecklistItem, Note, NoteApp, NoteGroup, PageProps } from '@/types';
import Navbar from '@/Components/Navbar';
import NeoButton from '@/Components/UI/NeoButton';
import NeoCard from '@/Components/UI/NeoCard';
import { NeoBadge, NeoInput } from '@/Components/UI/NeoInput';
import NeoModal from '@/Components/UI/NeoModal';
import DebouncedPrefetchLink from '@/Components/DebouncedPrefetchLink';
import RichTextEditor from '@/Components/Editor/RichTextEditor';
import ChecklistEditor from '@/Components/Editor/ChecklistEditor';
import DrawingCanvas from '@/Components/Editor/DrawingCanvas';
import AttachmentsManager from '@/Components/Editor/AttachmentsManager';
import CollaboratorsModal from '@/Components/Modals/CollaboratorsModal';
import ShareModal from '@/Components/Modals/ShareModal';
import {
    Plus, Trash2, Edit3, Share2, Users, Calendar, CheckSquare,
    PenTool, FileUp, Save, Search, ChevronRight, Menu, ArrowLeft,
    FileText, Check, Clock, Settings, FolderPlus
} from 'lucide-react';

interface AppShowProps {
    app: NoteApp;
    groups: NoteGroup[];
    selected_note: Note | null;
    is_owner: boolean;
    can_edit: boolean;
}

export default function AppShow({
    app,
    groups = [],
    selected_note,
    is_owner,
    can_edit,
}: AppShowProps) {
    const { auth, system_settings } = usePage<PageProps>().props;
    const user = auth.user;

    // View state on mobile
    const [mobileTab, setMobileTab] = useState<'groups' | 'notes' | 'editor'>('editor');

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
    const [editorHtml, setEditorHtml] = useState('');
    const [editorChecklist, setEditorChecklist] = useState<ChecklistItem[]>([]);
    const [editorDrawing, setEditorDrawing] = useState<string | null>(null);
    const [editorDeadline, setEditorDeadline] = useState('');
    const [editorReminderDays, setEditorReminderDays] = useState<number>(1);
    const [editorTab, setEditorTab] = useState<'text' | 'checklist' | 'drawing' | 'attachments'>('text');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Initialize editor state when selected_note changes
    useEffect(() => {
        if (selected_note) {
            setEditorTitle(selected_note.title || 'Catatan Baru');
            setEditorCategory(selected_note.category || 'regular');

            let parsedContent = { html: '', checklist: [] };
            try {
                if (selected_note.content_json) {
                    parsedContent = JSON.parse(selected_note.content_json);
                }
            } catch {
                parsedContent = { html: selected_note.content_json || '', checklist: [] };
            }

            setEditorHtml(parsedContent.html || '');
            setEditorChecklist(Array.isArray(parsedContent.checklist) ? parsedContent.checklist : []);
            setEditorDrawing(selected_note.drawing_data || null);

            if (selected_note.deadline_at) {
                // format for datetime-local input YYYY-MM-DDTHH:MM
                const d = new Date(selected_note.deadline_at);
                const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                setEditorDeadline(iso);
            } else {
                setEditorDeadline('');
            }

            setEditorReminderDays(
                selected_note.reminder_days_before !== null && selected_note.reminder_days_before !== undefined
                    ? selected_note.reminder_days_before
                    : user?.default_reminder_days || 1
            );
        }
    }, [selected_note, user]);

    // Handle switching category: automatically fills reminder days from user preference if switched to 'task'
    const handleCategoryChange = (newCategory: 'regular' | 'task') => {
        setEditorCategory(newCategory);
        if (newCategory === 'task' && !editorReminderDays) {
            setEditorReminderDays(user?.default_reminder_days || 1);
        }
    };

    // Save note
    const handleSaveNote = () => {
        if (!selected_note) return;
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
                deadline_at: editorCategory === 'task' ? editorDeadline || null : null,
                reminder_days_before: editorCategory === 'task' ? editorReminderDays : null,
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

    // Create Note
    const handleCreateNote = (groupId: number, category: 'regular' | 'task' = 'regular') => {
        router.post(`/groups/${groupId}/notes`, {
            category,
            title: category === 'task' ? 'Tugas Baru' : 'Catatan Baru',
        });
    };

    // Group operations
    const handleAddGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        router.post(`/app/${app.id}/groups`, { name: newGroupName.trim() }, {
            onSuccess: () => setNewGroupName(''),
        });
    };

    const handleSaveGroupRename = (groupId: number) => {
        if (!editingGroupName.trim()) return;

        router.put(`/groups/${groupId}`, { name: editingGroupName.trim() }, {
            onSuccess: () => setEditingGroupId(null),
        });
    };

    const handleDeleteGroup = (groupId: number) => {
        if (!confirm('Hapus grup ini dan seluruh catatan di dalamnya?')) return;
        router.delete(`/groups/${groupId}`);
    };

    const handleDeleteNote = (noteId: number) => {
        if (!confirm('Hapus catatan ini?')) return;
        router.delete(`/notes/${noteId}`);
    };

    // Filter notes list
    const filteredNotes = groups
        .filter((g) => (activeGroupId === 'all' ? true : g.id === activeGroupId))
        .flatMap((g) => (g.notes || []).map((n) => ({ ...n, group_name: g.name })))
        .filter((n) => {
            const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = categoryFilter === 'all' || n.category === categoryFilter;
            return matchesSearch && matchesCat;
        });

    const themeColors: Record<string, string> = {
        yellow: 'bg-[#FFDC58]',
        purple: 'bg-[#A388EE]',
        mint: 'bg-[#7FBC8C]',
        coral: 'bg-[#FF6B6B]',
        sky: 'bg-[#69D2E7]',
        orange: 'bg-[#FFA94D]',
    };

    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            <Head title={`${app.name} - Workspace`} />
            <Navbar />

            {/* Top Workspace Header Bar */}
            <div className={`${themeColors[app.color_theme] || 'bg-[#FFDC58]'} border-b-2 border-black px-4 py-3 select-none`}>
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
                                Pemilik: {app.owner?.name} {is_owner && '(Anda)'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {is_owner && (
                            <button
                                type="button"
                                onClick={() => setAppCollabOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-heading font-bold text-xs uppercase hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                            >
                                <Users className="w-3.5 h-3.5" />
                                Kolaborator ({app.collaborators?.length || 0})
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => setAppShareOpen(true)}
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
                    Grup ({groups.length})
                </button>
                <button
                    type="button"
                    onClick={() => setMobileTab('notes')}
                    className={`flex-1 py-2.5 text-center font-heading font-bold text-xs uppercase border-r-2 border-black ${
                        mobileTab === 'notes' ? 'bg-[#A388EE]' : 'bg-white'
                    }`}
                >
                    Catatan ({filteredNotes.length})
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

            {/* Main 3-Column Layout */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-4 pb-28 md:pb-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* ================= COLUMN 1: GROUPS (Level 2) ================= */}
                <div className={`lg:col-span-3 space-y-4 ${mobileTab !== 'groups' ? 'hidden lg:block' : 'block'}`}>
                    <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black">
                            <h3 className="font-heading font-black text-xs uppercase tracking-wider text-black">
                                Folder / Grup ({groups.length})
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveGroupId('all')}
                                className={`text-[11px] font-bold px-2 py-0.5 border border-black ${
                                    activeGroupId === 'all' ? 'bg-[#FFDC58]' : 'bg-white hover:bg-neutral-100'
                                }`}
                            >
                                Semua
                            </button>
                        </div>

                        {/* Groups List */}
                        <div className="space-y-1.5 mb-4">
                            {groups.map((group) => {
                                const isActive = activeGroupId === group.id;
                                const isEditing = editingGroupId === group.id;

                                return (
                                    <div
                                        key={group.id}
                                        className={`p-2 border-2 border-black transition-all ${
                                            isActive
                                                ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold'
                                                : 'bg-white hover:bg-neutral-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                        }`}
                                    >
                                        {isEditing ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={editingGroupName}
                                                    onChange={(e) => setEditingGroupName(e.target.value)}
                                                    className="w-full px-2 py-1 text-xs border border-black font-medium"
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveGroupRename(group.id)}
                                                    className="p-1 bg-[#7FBC8C] border border-black text-xs"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveGroupId(group.id);
                                                        setMobileTab('notes');
                                                    }}
                                                    className="flex-1 text-left text-xs font-bold truncate flex items-center justify-between pr-2 cursor-pointer"
                                                >
                                                    <span>{group.name}</span>
                                                    <span className="text-[10px] px-1.5 py-0.2 bg-black text-white font-mono rounded-none">
                                                        {group.notes?.length || 0}
                                                    </span>
                                                </button>

                                                {can_edit && (
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingGroupId(group.id);
                                                                setEditingGroupName(group.name);
                                                            }}
                                                            className="p-1 text-neutral-500 hover:text-black"
                                                            title="Ubah Nama"
                                                        >
                                                            <Edit3 className="w-3 h-3" />
                                                        </button>
                                                        {groups.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteGroup(group.id)}
                                                                className="p-1 text-neutral-400 hover:text-rose-600"
                                                                title="Hapus Grup"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Group Form */}
                        {can_edit && (
                            <form onSubmit={handleAddGroup} className="flex gap-1.5 pt-2 border-t-2 border-black">
                                <input
                                    type="text"
                                    placeholder="+ Nama grup baru..."
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="flex-1 px-2.5 py-1.5 text-xs border-2 border-black bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    className="px-2.5 py-1.5 bg-[#A388EE] border-2 border-black font-bold text-xs uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1"
                                >
                                    Tambah
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* ================= COLUMN 2: NOTES LIST (Level 3) ================= */}
                <div className={`lg:col-span-3 space-y-4 ${mobileTab !== 'notes' ? 'hidden lg:block' : 'block'}`}>
                    <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black">
                            <h3 className="font-heading font-black text-xs uppercase tracking-wider text-black">
                                Catatan ({filteredNotes.length})
                            </h3>

                            {can_edit && groups.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => handleCreateNote(activeGroupId === 'all' ? groups[0].id : activeGroupId, 'regular')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFDC58] border-2 border-black font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Buat
                                </button>
                            )}
                        </div>

                        {/* Search & Filter Tabs */}
                        <div className="space-y-2 mb-3">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                                <input
                                    type="text"
                                    placeholder="Cari judul catatan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border-2 border-black font-medium focus:outline-none"
                                />
                            </div>

                            <div className="flex border-2 border-black text-xs">
                                <button
                                    type="button"
                                    onClick={() => setCategoryFilter('all')}
                                    className={`flex-1 py-1 font-bold ${
                                        categoryFilter === 'all' ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100'
                                    }`}
                                >
                                    Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCategoryFilter('regular')}
                                    className={`flex-1 py-1 font-bold border-l-2 border-black ${
                                        categoryFilter === 'regular' ? 'bg-[#FFDC58] text-black' : 'bg-white hover:bg-neutral-100'
                                    }`}
                                >
                                    Biasa
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCategoryFilter('task')}
                                    className={`flex-1 py-1 font-bold border-l-2 border-black ${
                                        categoryFilter === 'task' ? 'bg-[#FF6B6B] text-black' : 'bg-white hover:bg-neutral-100'
                                    }`}
                                >
                                    Tugas
                                </button>
                            </div>
                        </div>

                        {/* Notes list items using DebouncedPrefetchLink */}
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                            {filteredNotes.length === 0 ? (
                                <p className="text-xs text-neutral-400 italic py-4 text-center">
                                    Tidak ada catatan yang sesuai.
                                </p>
                            ) : (
                                filteredNotes.map((n) => {
                                    const isSelected = selected_note?.id === n.id;
                                    let checklistCount = 0;
                                    let checklistCompleted = 0;
                                    try {
                                        if (n.content_json) {
                                            const parsed = JSON.parse(n.content_json);
                                            if (Array.isArray(parsed.checklist)) {
                                                checklistCount = parsed.checklist.length;
                                                checklistCompleted = parsed.checklist.filter((i: any) => i.completed).length;
                                            }
                                        }
                                    } catch {
                                        // ignore
                                    }

                                    return (
                                        <DebouncedPrefetchLink
                                            key={n.id}
                                            href={`/app/${app.id}?note_id=${n.id}`}
                                            onClick={() => setMobileTab('editor')}
                                            className={`block p-3 border-2 border-black transition-all ${
                                                isSelected
                                                    ? 'bg-[#FFDC58] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5'
                                                    : 'bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <NeoBadge
                                                    variant={n.category === 'task' ? 'coral' : 'yellow'}
                                                    className="text-[9px] px-1.5 py-0"
                                                >
                                                    {n.category === 'task' ? 'Tugas' : 'Biasa'}
                                                </NeoBadge>
                                                <span className="text-[10px] text-neutral-500 font-bold truncate">
                                                    {n.group_name}
                                                </span>
                                            </div>

                                            <h4 className="font-heading font-black text-sm text-black mb-1 truncate">
                                                {n.title}
                                            </h4>

                                            {/* Task Deadline */}
                                            {n.category === 'task' && n.deadline_at && (
                                                <p className="text-[10px] font-bold text-rose-700 flex items-center gap-1 mb-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(n.deadline_at).toLocaleDateString('id-ID')}
                                                </p>
                                            )}

                                            {/* Checklist mini indicator */}
                                            {checklistCount > 0 && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-600 mt-1">
                                                    <CheckSquare className="w-3 h-3" />
                                                    <span>
                                                        {checklistCompleted}/{checklistCount} Selesai
                                                    </span>
                                                </div>
                                            )}
                                        </DebouncedPrefetchLink>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* ================= COLUMN 3: MULTI-COMPONENT EDITOR ================= */}
                <div className={`lg:col-span-6 space-y-4 ${mobileTab !== 'editor' ? 'hidden lg:block' : 'block'}`}>
                    {selected_note ? (
                        <div className="border-[3px] border-black bg-white p-5 sm:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
                            {/* Editor Top Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-neutral-500 uppercase">
                                        Grup: {selected_note.group?.name}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {can_edit && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setNoteCollabOpen(true)}
                                                className="p-1.5 border-2 border-black bg-white hover:bg-[#A388EE] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                title="Kolaborator Khusus Catatan"
                                            >
                                                <Users className="w-4 h-4 text-black" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setNoteShareOpen(true)}
                                                className="p-1.5 border-2 border-black bg-white hover:bg-[#69D2E7] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                title="Bagikan Tautan Catatan"
                                            >
                                                <Share2 className="w-4 h-4 text-black" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteNote(selected_note.id)}
                                                className="p-1.5 border-2 border-black bg-white hover:bg-rose-100 text-rose-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                title="Hapus Catatan"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <NeoButton
                                                variant="yellow"
                                                size="sm"
                                                onClick={handleSaveNote}
                                                disabled={isSaving}
                                            >
                                                <Save className="w-4 h-4" />
                                                {isSaving ? 'Menyimpan...' : saveSuccess ? 'Tersimpan!' : 'Simpan'}
                                            </NeoButton>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Title & Category Selector */}
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={editorTitle}
                                    onChange={(e) => setEditorTitle(e.target.value)}
                                    placeholder="Judul Catatan..."
                                    disabled={!can_edit}
                                    className="w-full text-2xl sm:text-3xl font-black font-heading tracking-tight border-b-2 border-black pb-1 outline-none uppercase bg-transparent"
                                />

                                {/* Category Switcher & Task Attributes */}
                                <div className="p-3 bg-[#F4F0EA] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black uppercase tracking-wider font-heading">
                                            Kategori:
                                        </span>
                                        <div className="flex border-2 border-black text-xs font-bold">
                                            <button
                                                type="button"
                                                disabled={!can_edit}
                                                onClick={() => handleCategoryChange('regular')}
                                                className={`px-3 py-1 cursor-pointer transition-colors ${
                                                    editorCategory === 'regular'
                                                        ? 'bg-[#FFDC58] text-black font-black'
                                                        : 'bg-white hover:bg-neutral-100'
                                                }`}
                                            >
                                                Catatan Biasa
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!can_edit}
                                                onClick={() => handleCategoryChange('task')}
                                                className={`px-3 py-1 border-l-2 border-black cursor-pointer transition-colors ${
                                                    editorCategory === 'task'
                                                        ? 'bg-[#FF6B6B] text-black font-black'
                                                        : 'bg-white hover:bg-neutral-100'
                                                }`}
                                            >
                                                Tugas (Task)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Task Deadline and Auto Reminder Options */}
                                    {editorCategory === 'task' && (
                                        <div className="pt-2 border-t border-black grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold uppercase mb-1">
                                                    Tanggal & Jam Deadline
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    disabled={!can_edit}
                                                    value={editorDeadline}
                                                    onChange={(e) => setEditorDeadline(e.target.value)}
                                                    className="w-full px-2.5 py-1.5 text-xs bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-medium"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold uppercase mb-1">
                                                    Ingatkan X hari sebelum deadline
                                                </label>
                                                <div className="flex items-center gap-1.5">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={30}
                                                        disabled={!can_edit}
                                                        value={editorReminderDays}
                                                        onChange={(e) => setEditorReminderDays(parseInt(e.target.value) || 0)}
                                                        className="w-20 px-2.5 py-1.5 text-xs bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-center"
                                                    />
                                                    <span className="text-xs font-bold text-neutral-600">
                                                        Hari (Default profil: {user?.default_reminder_days})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Multi-Component Tabs */}
                            <div className="flex border-2 border-black bg-white select-none">
                                <button
                                    type="button"
                                    onClick={() => setEditorTab('text')}
                                    className={`flex-1 py-2 font-heading font-black text-xs uppercase flex items-center justify-center gap-1.5 border-r-2 border-black ${
                                        editorTab === 'text' ? 'bg-[#FFDC58]' : 'bg-white hover:bg-neutral-50'
                                    }`}
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    Rich Text
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditorTab('checklist')}
                                    className={`flex-1 py-2 font-heading font-black text-xs uppercase flex items-center justify-center gap-1.5 border-r-2 border-black ${
                                        editorTab === 'checklist' ? 'bg-[#7FBC8C]' : 'bg-white hover:bg-neutral-50'
                                    }`}
                                >
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    Checklist ({editorChecklist.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditorTab('drawing')}
                                    className={`flex-1 py-2 font-heading font-black text-xs uppercase flex items-center justify-center gap-1.5 border-r-2 border-black ${
                                        editorTab === 'drawing' ? 'bg-[#A388EE]' : 'bg-white hover:bg-neutral-50'
                                    }`}
                                >
                                    <PenTool className="w-3.5 h-3.5" />
                                    Sketsa
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditorTab('attachments')}
                                    className={`flex-1 py-2 font-heading font-black text-xs uppercase flex items-center justify-center gap-1.5 ${
                                        editorTab === 'attachments' ? 'bg-[#69D2E7]' : 'bg-white hover:bg-neutral-50'
                                    }`}
                                >
                                    <FileUp className="w-3.5 h-3.5" />
                                    Lampiran ({selected_note.attachments?.length || 0})
                                </button>
                            </div>

                            {/* Component Panels */}
                            <div>
                                {editorTab === 'text' && (
                                    <RichTextEditor
                                        value={editorHtml}
                                        onChange={setEditorHtml}
                                        editable={can_edit}
                                    />
                                )}

                                {editorTab === 'checklist' && (
                                    <ChecklistEditor
                                        items={editorChecklist}
                                        onChange={setEditorChecklist}
                                        editable={can_edit}
                                    />
                                )}

                                {editorTab === 'drawing' && (
                                    <DrawingCanvas
                                        value={editorDrawing}
                                        onChange={setEditorDrawing}
                                        editable={can_edit}
                                    />
                                )}

                                {editorTab === 'attachments' && (
                                    <AttachmentsManager
                                        noteId={selected_note.id}
                                        attachments={selected_note.attachments || []}
                                        settings={system_settings}
                                        editable={can_edit}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="border-[3px] border-black bg-white p-12 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                            <h3 className="font-heading font-black text-lg uppercase mb-2">Belum Ada Catatan Dipilih</h3>
                            <p className="text-xs text-neutral-600 font-medium max-w-sm mx-auto mb-4">
                                Pilih catatan dari kolom tengah, atau buat catatan baru di dalam grup yang tersedia.
                            </p>
                            {can_edit && groups.length > 0 && (
                                <NeoButton
                                    variant="yellow"
                                    size="sm"
                                    onClick={() => handleCreateNote(groups[0].id, 'regular')}
                                >
                                    <Plus className="w-4 h-4" />
                                    Buat Catatan Sekarang
                                </NeoButton>
                            )}
                        </div>
                    )}
                </div>
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
        </div>
    );
}
