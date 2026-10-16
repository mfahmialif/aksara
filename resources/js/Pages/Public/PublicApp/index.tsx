import React from 'react';
import { Note } from '@/types';
import PublicLayout from '@/Layouts/PublicLayout';
import NeoCard from '@/Components/UI/NeoCard';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { Globe, Calendar, CheckSquare, Download, FileText } from 'lucide-react';
import { PublicAppProps } from './types';
import PublicAppSidebar from './components/PublicAppSidebar';

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
        <PublicLayout title={`[Publik] ${app.name}`}>
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

            <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-black font-heading uppercase text-black">{app.name}</h1>
                        <NeoBadge variant="mint">Aplikasi Terverifikasi</NeoBadge>
                    </div>
                    {app.description && (
                        <p className="text-sm text-neutral-700 font-medium max-w-2xl">{app.description}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Sidebar */}
                    <PublicAppSidebar
                        appToken={app.public_token || ''}
                        groups={groups}
                        selectedNote={selected_note}
                    />

                    {/* Note Content Viewer */}
                    <div className="lg:col-span-8">
                        {selected_note ? (
                            <NeoCard color="bg-white" className="p-6 space-y-6">
                                <div className="border-b-2 border-black pb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <NeoBadge variant={selected_note.category === 'task' ? 'coral' : 'yellow'}>
                                            {selected_note.category === 'task' ? 'Tugas' : 'Catatan Biasa'}
                                        </NeoBadge>
                                        <span className="text-xs text-neutral-500 font-bold">
                                            Grup: {selected_note.group?.name}
                                        </span>
                                    </div>

                                    <h2 className="text-2xl sm:text-3xl font-black font-heading uppercase text-black">
                                        {selected_note.title}
                                    </h2>

                                    {selected_note.category === 'task' && selected_note.deadline_at && (
                                        <p className="text-xs font-bold text-rose-700 mt-2 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Deadline: {new Date(selected_note.deadline_at).toLocaleString('id-ID')}
                                        </p>
                                    )}
                                </div>

                                {/* Rich Text HTML */}
                                {noteContent?.html && (
                                    <div className="space-y-2">
                                        <h4 className="font-heading font-black text-xs uppercase tracking-wider text-neutral-500">
                                            Isi Catatan
                                        </h4>
                                        <div
                                            className="p-4 bg-[#FFFDF8] border-2 border-black prose prose-sm max-w-none text-neutral-900 font-medium"
                                            dangerouslySetInnerHTML={{ __html: noteContent.html }}
                                        />
                                    </div>
                                )}

                                {/* Checklist Read Only */}
                                {noteContent?.checklist && noteContent.checklist.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-heading font-black text-xs uppercase tracking-wider text-neutral-500">
                                            Daftar Checklist
                                        </h4>
                                        <div className="space-y-2 border-2 border-black p-4 bg-[#FFFDF8]">
                                            {noteContent.checklist.map((item: any) => (
                                                <div key={item.id} className="flex items-center gap-2 text-xs font-bold">
                                                    <div className={`w-4 h-4 border border-black flex items-center justify-center ${item.completed ? 'bg-[#7FBC8C]' : 'bg-white'}`}>
                                                        {item.completed && <CheckSquare className="w-3 h-3 text-black" />}
                                                    </div>
                                                    <span className={item.completed ? 'line-through text-neutral-500' : 'text-black'}>
                                                        {item.text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Drawing Read Only */}
                                {drawingData && (
                                    <div className="space-y-2">
                                        <h4 className="font-heading font-black text-xs uppercase tracking-wider text-neutral-500">
                                            Sketsa Kanvas
                                        </h4>
                                        <div className="border-2 border-black p-2 bg-white flex justify-center">
                                            <img
                                                src={drawingData}
                                                alt="Sketsa Catatan"
                                                className="max-h-72 object-contain border border-neutral-300"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Attachments */}
                                {selected_note.attachments && selected_note.attachments.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-heading font-black text-xs uppercase tracking-wider text-neutral-500">
                                            Lampiran Berkas ({selected_note.attachments.length})
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {selected_note.attachments.map((att) => (
                                                <div
                                                    key={att.id}
                                                    className="flex items-center justify-between p-2.5 bg-[#FFFDF8] border-2 border-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                >
                                                    <div className="flex items-center gap-2 truncate mr-2">
                                                        <FileText className="w-4 h-4 text-black shrink-0" />
                                                        <div className="truncate">
                                                            <p className="font-bold truncate text-black">{att.original_name}</p>
                                                            <p className="text-[10px] text-neutral-500">
                                                                {(att.size / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`/attachments/${att.id}/download`}
                                                        className="p-1.5 bg-[#FFDC58] border border-black hover:bg-neutral-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0"
                                                        title="Unduh File"
                                                    >
                                                        <Download className="w-3.5 h-3.5 text-black" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </NeoCard>
                        ) : (
                            <div className="border-2 border-black bg-white p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                                <h3 className="font-heading font-black text-lg uppercase mb-1">Pilih Catatan</h3>
                                <p className="text-xs text-neutral-600 font-medium">
                                    Pilih catatan dari menu di sebelah kiri untuk membaca.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
