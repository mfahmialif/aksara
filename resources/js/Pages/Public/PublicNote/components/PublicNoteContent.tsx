import React from 'react';
import { Note } from '@/types';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { Calendar, CheckSquare, Download, FileText, Image as ImageIcon, Eye } from 'lucide-react';

interface PublicNoteContentProps {
    note: Note;
    content: { html: string; checklist: any[] };
    drawing: string | null;
    onPreviewImage: (url: string) => void;
    onPreviewPdf: (pdf: { url: string; name: string }) => void;
}

export default function PublicNoteContent({
    note,
    content,
    drawing,
    onPreviewImage,
    onPreviewPdf,
}: PublicNoteContentProps) {
    return (
        <div className="border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <NeoBadge variant={note.category === 'task' ? 'coral' : 'yellow'}>
                        {note.category === 'task' ? 'Tugas' : 'Catatan Biasa'}
                    </NeoBadge>
                    <span className="text-xs text-neutral-500 font-bold">
                        Bagian dari ruang kerja: {note.group?.app?.name} &bull; Grup: {note.group?.name}
                    </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black font-heading uppercase text-black">
                    {note.title}
                </h1>

                {note.category === 'task' && note.deadline_at && (
                    <p className="text-xs font-bold text-rose-700 mt-2 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Tenggat Waktu: {new Date(note.deadline_at).toLocaleString('id-ID')}
                    </p>
                )}
            </div>

            {/* Rich Text Body */}
            {content.html && (
                <div className="space-y-2">
                    <h4 className="font-heading font-black text-xs uppercase tracking-wider text-neutral-500">
                        Isi Catatan
                    </h4>
                    <div
                        className="p-5 bg-[#FFFDF8] border-2 border-black prose prose-sm max-w-none text-neutral-900 font-medium"
                        dangerouslySetInnerHTML={{ __html: content.html }}
                    />
                </div>
            )}

            {/* Checklist */}
            {content.checklist && content.checklist.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-heading font-black text-xs uppercase tracking-wider text-neutral-500">
                        Daftar Checklist Tugas
                    </h4>
                    <div className="space-y-2 border-2 border-black p-4 bg-[#FFFDF8]">
                        {content.checklist.map((item: any) => (
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

            {/* Drawing Preview */}
            {drawing && (
                <div className="space-y-2">
                    <h4 className="font-heading font-black text-xs uppercase tracking-wider text-neutral-500">
                        Sketsa Kanvas
                    </h4>
                    <div className="border-2 border-black p-3 bg-white flex justify-center">
                        <img
                            src={drawing}
                            alt="Sketsa Catatan"
                            className="max-h-96 object-contain border border-neutral-300"
                        />
                    </div>
                </div>
            )}

            {/* Attachments */}
            {note.attachments && note.attachments.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-heading font-black text-xs uppercase tracking-wider text-neutral-500">
                        Lampiran File ({note.attachments.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {note.attachments.map((att) => {
                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(att.extension?.toLowerCase());
                            const isPdf = att.extension?.toLowerCase() === 'pdf';

                            return (
                                <div
                                    key={att.id}
                                    className="flex items-center justify-between p-3 bg-[#FFFDF8] border-2 border-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    <div className="flex items-center gap-2 truncate mr-2">
                                        {isImage ? (
                                            <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                                        ) : (
                                            <FileText className="w-4 h-4 text-black shrink-0" />
                                        )}
                                        <div className="truncate">
                                            <p className="font-bold truncate text-black">{att.original_name}</p>
                                            <p className="text-[10px] text-neutral-500">
                                                {(att.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {isImage && (
                                            <button
                                                type="button"
                                                onClick={() => onPreviewImage(`/attachments/${att.id}/preview`)}
                                                className="p-1.5 bg-white border border-black hover:bg-neutral-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                                title="Lihat Gambar"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-black" />
                                            </button>
                                        )}

                                        {isPdf && (
                                            <button
                                                type="button"
                                                onClick={() => onPreviewPdf({ url: `/attachments/${att.id}/preview`, name: att.original_name })}
                                                className="p-1.5 bg-white border border-black hover:bg-neutral-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                                title="Lihat PDF"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-black" />
                                            </button>
                                        )}

                                        <a
                                            href={`/attachments/${att.id}/download`}
                                            className="p-1.5 bg-[#FFDC58] border border-black hover:bg-neutral-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                            title="Unduh File"
                                        >
                                            <Download className="w-3.5 h-3.5 text-black" />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
