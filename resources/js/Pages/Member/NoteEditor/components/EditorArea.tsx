import React from 'react';
import { ChecklistItem, Note, NoteGroup, SystemSettings, User } from '@/types';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import RichTextEditor from '@/Components/Editor/RichTextEditor';
import ChecklistEditor from '@/Components/Editor/ChecklistEditor';
import DrawingCanvas from '@/Components/Editor/DrawingCanvas';
import AttachmentsManager from '@/Components/Editor/AttachmentsManager';
import {
    Users, Share2, Trash2, Save, FileText, CheckSquare,
    PenTool, FileUp, Plus, ArrowLeft
} from 'lucide-react';
import { MobileTab } from '../types';

interface EditorAreaProps {
    selectedNote: Note | null;
    groups: NoteGroup[];
    canEdit: boolean;
    user: User | null;
    systemSettings?: SystemSettings;
    mobileTab?: MobileTab;
    editorTitle: string;
    setEditorTitle: (t: string) => void;
    editorCategory: 'regular' | 'task';
    onCategoryChange: (cat: 'regular' | 'task') => void;
    editorDeadline: string;
    setEditorDeadline: (d: string) => void;
    editorReminderDays: number;
    setEditorReminderDays: (r: number) => void;
    editorTab: 'text' | 'checklist' | 'drawing' | 'attachments';
    setEditorTab: (tab: 'text' | 'checklist' | 'drawing' | 'attachments') => void;
    editorHtml: string;
    setEditorHtml: (html: string) => void;
    editorChecklist: ChecklistItem[];
    setEditorChecklist: (c: ChecklistItem[]) => void;
    editorDrawing: string | null;
    setEditorDrawing: (d: string | null) => void;
    isSaving: boolean;
    saveSuccess: boolean;
    onSaveNote: () => void;
    onDeleteNote: (id: number) => void;
    onOpenNoteCollab: () => void;
    onOpenNoteShare: () => void;
    onCreateNote: (groupId: number, category: 'regular' | 'task') => void;
    onBackToExplorer?: () => void;
}

export default function EditorArea({
    selectedNote,
    groups,
    canEdit,
    user,
    systemSettings,
    mobileTab,
    editorTitle,
    setEditorTitle,
    editorCategory,
    onCategoryChange,
    editorDeadline,
    setEditorDeadline,
    editorReminderDays,
    setEditorReminderDays,
    editorTab,
    setEditorTab,
    editorHtml,
    setEditorHtml,
    editorChecklist,
    setEditorChecklist,
    editorDrawing,
    setEditorDrawing,
    isSaving,
    saveSuccess,
    onSaveNote,
    onDeleteNote,
    onOpenNoteCollab,
    onOpenNoteShare,
    onCreateNote,
    onBackToExplorer,
}: EditorAreaProps) {
    return (
        <div className="w-full space-y-4">
            {selectedNote ? (
                <div className="border-[3px] border-black bg-white p-5 sm:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
                    {/* Editor Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
                        <div className="flex items-center gap-2">
                            {onBackToExplorer && (
                                <button
                                    type="button"
                                    onClick={onBackToExplorer}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFDC58] hover:bg-[#ffe066] border-2 border-black font-heading font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all cursor-pointer mr-1"
                                    title="Kembali ke Jelajah Catatan"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Jelajah Catatan</span>
                                </button>
                            )}
                            <span className="text-xs font-bold text-neutral-500 uppercase">
                                Grup: {selectedNote.group?.name || groups.find((g) => g.id === selectedNote.note_group_id)?.name || 'Grup'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {canEdit && (
                                <>
                                    <button
                                        type="button"
                                        onClick={onOpenNoteCollab}
                                        className="p-1.5 border-2 border-black bg-white hover:bg-[#A388EE] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                        title="Kolaborator Khusus Catatan"
                                    >
                                        <Users className="w-4 h-4 text-black" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onOpenNoteShare}
                                        className="p-1.5 border-2 border-black bg-white hover:bg-[#69D2E7] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                        title="Bagikan Tautan Catatan"
                                    >
                                        <Share2 className="w-4 h-4 text-black" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onDeleteNote(selectedNote.id)}
                                        className="p-1.5 border-2 border-black bg-white hover:bg-rose-100 text-rose-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                        title="Hapus Catatan"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <NeoButton
                                        variant="yellow"
                                        size="sm"
                                        onClick={onSaveNote}
                                        disabled={isSaving}
                                    >
                                        <Save className="w-4 h-4 mr-1" />
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
                            disabled={!canEdit}
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
                                        disabled={!canEdit}
                                        onClick={() => onCategoryChange('regular')}
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
                                        disabled={!canEdit}
                                        onClick={() => onCategoryChange('task')}
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
                                            disabled={!canEdit}
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
                                                disabled={!canEdit}
                                                value={editorReminderDays}
                                                onChange={(e) => setEditorReminderDays(parseInt(e.target.value) || 0)}
                                                className="w-20 px-2.5 py-1.5 text-xs bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-center"
                                            />
                                            <span className="text-xs font-bold text-neutral-600">
                                                Hari (Default: {user?.default_reminder_days})
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
                            className={`flex-1 py-2 font-heading font-black text-xs uppercase flex items-center justify-center gap-1.5 border-r-2 border-black cursor-pointer ${
                                editorTab === 'text' ? 'bg-[#FFDC58]' : 'bg-white hover:bg-neutral-50'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Rich Text
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditorTab('checklist')}
                            className={`flex-1 py-2 font-heading font-black text-xs uppercase flex items-center justify-center gap-1.5 border-r-2 border-black cursor-pointer ${
                                editorTab === 'checklist' ? 'bg-[#7FBC8C]' : 'bg-white hover:bg-neutral-50'
                            }`}
                        >
                            <CheckSquare className="w-3.5 h-3.5" />
                            Checklist ({editorChecklist.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditorTab('drawing')}
                            className={`flex-1 py-2 font-heading font-black text-xs uppercase flex items-center justify-center gap-1.5 border-r-2 border-black cursor-pointer ${
                                editorTab === 'drawing' ? 'bg-[#A388EE]' : 'bg-white hover:bg-neutral-50'
                            }`}
                        >
                            <PenTool className="w-3.5 h-3.5" />
                            Sketsa
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditorTab('attachments')}
                            className={`flex-1 py-2 font-heading font-black text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                                editorTab === 'attachments' ? 'bg-[#69D2E7]' : 'bg-white hover:bg-neutral-50'
                            }`}
                        >
                            <FileUp className="w-3.5 h-3.5" />
                            Lampiran ({selectedNote.attachments?.length || 0})
                        </button>
                    </div>

                    {/* Component Panels */}
                    <div>
                        {editorTab === 'text' && (
                            <RichTextEditor
                                value={editorHtml}
                                onChange={setEditorHtml}
                                editable={canEdit}
                            />
                        )}

                        {editorTab === 'checklist' && (
                            <ChecklistEditor
                                items={editorChecklist}
                                onChange={setEditorChecklist}
                                editable={canEdit}
                            />
                        )}

                        {editorTab === 'drawing' && (
                            <DrawingCanvas
                                value={editorDrawing}
                                onChange={setEditorDrawing}
                                editable={canEdit}
                            />
                        )}

                        {editorTab === 'attachments' && (
                            <AttachmentsManager
                                noteId={selectedNote.id}
                                attachments={selectedNote.attachments || []}
                                settings={systemSettings}
                                editable={canEdit}
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
                    {canEdit && groups.length > 0 && (
                        <NeoButton
                            variant="yellow"
                            size="sm"
                            onClick={() => onCreateNote(groups[0].id, 'regular')}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Buat Catatan Sekarang
                        </NeoButton>
                    )}
                </div>
            )}
        </div>
    );
}
