import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Note, NoteApp, NoteGroup } from '@/types';
import Navbar from '@/Components/Navbar';
import NeoCard from '@/Components/UI/NeoCard';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { BookOpen, Calendar, CheckSquare, Download, FileText, Globe, Lock, Share2 } from 'lucide-react';

interface PublicAppProps {
    app: NoteApp;
    groups: NoteGroup[];
    selected_note?: Note | null;
}

export default function PublicApp({ app, groups = [], selected_note }: PublicAppProps) {
    const parseContent = (note: Note) => {
        try {
            return note.content_json ? JSON.parse(note.content_json) : { html: '', checklist: [] };
        } catch {
            return { html: note.content_json || '', checklist: [] };
        }
    };

    const parseDrawing = (note: Note) => {
        try {
            return note.drawing_data ? JSON.parse(note.drawing_data) : null;
        } catch {
            return null;
        }
    };

    const noteContent = selected_note ? parseContent(selected_note) : null;
    const drawingData = selected_note ? parseDrawing(selected_note) : null;

    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            <Head title={`[Publik] ${app.name}`} />
            <Navbar />

            {/* Public Header Banner */}
            <div className="bg-[#FFDC58] border-b-2 border-black px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-black" />
                        <span className="font-heading font-black text-sm uppercase">
                            Halaman Publik Aplikasi (Mode Read-Only)
                        </span>
                    </div>
                    <span className="text-xs font-bold text-neutral-800">
                        Oleh: {app.owner?.name}
                    </span>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-black font-heading uppercase text-black">{app.name}</h1>
                        <NeoBadge variant="mint">Aplikasi Terverifikasi</NeoBadge>
                    </div>
                    {app.description && <p className="text-sm text-neutral-700 font-medium">{app.description}</p>}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Groups and Notes Navigation (Left Sidebar) */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-heading font-black text-sm uppercase tracking-wide mb-3 pb-2 border-b-2 border-black">
                                Daftar Grup & Catatan
                            </h3>

                            <div className="space-y-4">
                                {groups.map((group) => (
                                    <div key={group.id} className="space-y-2">
                                        <p className="text-xs font-black uppercase text-neutral-600 bg-[#F4F0EA] px-2 py-1 border border-black">
                                            {group.name}
                                        </p>

                                        {group.notes && group.notes.length > 0 ? (
                                            <div className="space-y-1.5 pl-2">
                                                {group.notes.map((n) => {
                                                    const isSelected = selected_note?.id === n.id;
                                                    return (
                                                        <Link
                                                            key={n.id}
                                                            href={`/s/app/${app.public_token}?note_id=${n.id}`}
                                                            className={`block p-2.5 border-2 border-black transition-all ${
                                                                isSelected
                                                                    ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5'
                                                                    : 'bg-white hover:bg-neutral-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                                <span className="font-bold text-xs truncate text-black">{n.title}</span>
                                                                <NeoBadge
                                                                    variant={n.category === 'task' ? 'coral' : 'yellow'}
                                                                    className="text-[9px] px-1.5 py-0"
                                                                >
                                                                    {n.category === 'task' ? 'Tugas' : 'Biasa'}
                                                                </NeoBadge>
                                                            </div>
                                                            {n.category === 'task' && n.deadline_at && (
                                                                <p className="text-[10px] text-neutral-600 flex items-center gap-1 font-medium">
                                                                    <Calendar className="w-3 h-3 text-rose-600" />
                                                                    Deadline: {new Date(n.deadline_at).toLocaleDateString('id-ID')}
                                                                </p>
                                                            )}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-neutral-400 italic pl-2">Belum ada catatan di grup ini.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Note Content Display (Right Area) */}
                    <div className="lg:col-span-8">
                        {selected_note ? (
                            <div className="border-[3px] border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <NeoBadge variant={selected_note.category === 'task' ? 'coral' : 'yellow'}>
                                            {selected_note.category === 'task' ? 'Tugas' : 'Catatan Biasa'}
                                        </NeoBadge>
                                        <span className="text-xs text-neutral-500 font-bold uppercase">
                                            Grup: {selected_note.group?.name}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black font-heading text-black uppercase">
                                        {selected_note.title}
                                    </h2>
                                    {selected_note.category === 'task' && selected_note.deadline_at && (
                                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-black text-xs font-bold text-rose-700">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Batas Waktu:{' '}
                                            {new Date(selected_note.deadline_at).toLocaleString('id-ID', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Rich Text Body */}
                                <div
                                    className="p-4 border-2 border-black bg-[#FFFDF8] prose prose-slate max-w-none text-sm"
                                    dangerouslySetInnerHTML={{ __html: noteContent?.html || '<p className="italic text-neutral-400">Tidak ada konten teks.</p>' }}
                                />

                                {/* Checklist (Read-only) */}
                                {noteContent?.checklist && noteContent.checklist.length > 0 && (
                                    <div className="border-2 border-black bg-white p-4">
                                        <h4 className="font-heading font-black text-xs uppercase mb-3 flex items-center gap-1.5">
                                            <CheckSquare className="w-4 h-4 text-black" />
                                            Daftar Checklist
                                        </h4>
                                        <div className="space-y-2">
                                            {noteContent.checklist.map((item: any) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-2 p-2 border border-black text-xs font-medium"
                                                >
                                                    <div
                                                        className={`w-4 h-4 border border-black flex items-center justify-center ${
                                                            item.completed ? 'bg-[#7FBC8C]' : 'bg-white'
                                                        }`}
                                                    >
                                                        {item.completed && '✓'}
                                                    </div>
                                                    <span className={item.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}>
                                                        {item.text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Drawing Canvas Preview */}
                                {drawingData?.preview && (
                                    <div className="border-2 border-black bg-white p-4">
                                        <h4 className="font-heading font-black text-xs uppercase mb-3">
                                            Sketsa / Diagram Visual
                                        </h4>
                                        <div className="border border-black p-2 bg-neutral-50 max-h-72 flex justify-center">
                                            <img
                                                src={drawingData.preview}
                                                alt="Sketsa Catatan"
                                                className="max-h-64 object-contain"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Attachments */}
                                {selected_note.attachments && selected_note.attachments.length > 0 && (
                                    <div className="border-2 border-black bg-white p-4">
                                        <h4 className="font-heading font-black text-xs uppercase mb-3">
                                            Lampiran File ({selected_note.attachments.length})
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {selected_note.attachments.map((att) => (
                                                <div
                                                    key={att.id}
                                                    className="flex items-center justify-between p-2 border border-black bg-[#FFFDF8]"
                                                >
                                                    <div className="overflow-hidden mr-2">
                                                        <p className="text-xs font-bold truncate">{att.file_name}</p>
                                                        <p className="text-[10px] text-neutral-500">{att.formatted_size}</p>
                                                    </div>
                                                    <a
                                                        href={att.url}
                                                        download={att.file_name}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 border border-black bg-[#7FBC8C] text-black font-bold text-xs"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="border-2 border-black bg-white p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                                <p className="font-heading font-bold text-base text-neutral-600">
                                    Pilih catatan dari menu di sebelah kiri untuk membaca.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
