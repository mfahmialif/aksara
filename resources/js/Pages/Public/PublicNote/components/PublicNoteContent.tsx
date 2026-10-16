import React from 'react';
import { Note, UserNoteReminder } from '@/types';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { Calendar, CheckSquare, Download, FileText, Image as ImageIcon, Eye, Edit3 } from 'lucide-react';
import PersonalNoteReminder from '@/Components/PersonalNoteReminder';

interface PublicNoteContentProps {
    note: Note;
    content: { html: string; checklist: any[] };
    drawing: string | null;
    userReminder?: UserNoteReminder | null;
    canEdit?: boolean;
    onPreviewImage: (url: string) => void;
    onPreviewPdf: (pdf: { url: string; name: string }) => void;
    onToggleChecklist?: (itemId: string) => void;
    onOpenEdit?: () => void;
}

export default function PublicNoteContent({
    note,
    content,
    drawing,
    userReminder,
    canEdit = false,
    onPreviewImage,
    onPreviewPdf,
    onToggleChecklist,
    onOpenEdit,
}: PublicNoteContentProps) {
    return (
        <div className="border-2 sm:border-[3px] border-black bg-white p-4 sm:p-6 md:p-8 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 sm:space-y-6">
            <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <NeoBadge variant={note.category === 'task' ? 'coral' : 'yellow'}>
                            {note.category === 'task' ? 'Tugas' : 'Catatan Biasa'}
                        </NeoBadge>
                        <span className="text-[11px] sm:text-xs text-neutral-500 font-bold truncate max-w-full">
                            Ruang kerja: {note.group?.app?.name} &bull; Topik: {note.group?.name}
                        </span>
                    </div>

                    {canEdit && onOpenEdit && (
                        <button
                            type="button"
                            onClick={onOpenEdit}
                            className="h-7 sm:h-8 px-2.5 bg-[#FFDC58] hover:bg-[#FFE57F] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black font-heading font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Edit Catatan Ini"
                        >
                            <Edit3 className="w-3.5 h-3.5 text-black" />
                            <span>Edit Catatan</span>
                        </button>
                    )}
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading uppercase text-black break-words leading-tight">
                    {note.title}
                </h1>

                {note.category === 'task' && note.deadline_at && (
                    <p className="text-xs font-bold text-rose-700 mt-2 flex flex-wrap items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Tenggat Waktu: {new Date(note.deadline_at).toLocaleString('id-ID')}</span>
                    </p>
                )}
            </div>

            {/* Personal Reminder Widget */}
            <PersonalNoteReminder note={note} initialReminder={userReminder} />

            {/* Rich Text Body */}
            {content.html && (
                <div className="space-y-2">
                    <h4 className="font-heading font-black text-xs uppercase tracking-wider text-neutral-500">
                        Isi Catatan
                    </h4>
                    <div
                        className="p-3.5 sm:p-5 bg-[#FFFDF8] border-2 border-black prose prose-sm max-w-none text-neutral-900 font-medium overflow-x-auto break-words [&_pre]:overflow-x-auto [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto"
                        dangerouslySetInnerHTML={{ __html: content.html }}
                    />
                </div>
            )}

            {/* Checklist */}
            {content.checklist && content.checklist.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="font-heading font-black text-xs uppercase tracking-wider text-neutral-500">
                            Daftar Checklist Tugas
                        </h4>
                        {canEdit && (
                            <span className="text-[10px] font-bold text-neutral-500 uppercase">
                                Klik kotak untuk menandai selesai
                            </span>
                        )}
                    </div>
                    <div className="space-y-2 border-2 border-black p-3.5 sm:p-4 bg-[#FFFDF8]">
                        {content.checklist.map((item: any) => (
                            <div key={item.id} className="flex items-start sm:items-center gap-2 text-xs font-bold">
                                <button
                                    type="button"
                                    disabled={!canEdit}
                                    onClick={() => onToggleChecklist && onToggleChecklist(item.id)}
                                    className={`w-4 h-4 border border-black flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 transition-all ${
                                        canEdit ? 'cursor-pointer hover:border-black active:scale-95' : 'cursor-default'
                                    } ${item.completed ? 'bg-[#7FBC8C]' : 'bg-white'}`}
                                    title={canEdit ? (item.completed ? 'Tandai belum selesai' : 'Tandai selesai') : undefined}
                                >
                                    {item.completed && <CheckSquare className="w-3 h-3 text-black" />}
                                </button>
                                <span className={`break-words select-none ${item.completed ? 'line-through text-neutral-500' : 'text-black'}`}>
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
                    <div className="border-2 border-black p-2 sm:p-3 bg-white flex justify-center overflow-hidden">
                        <img
                            src={drawing}
                            alt="Sketsa Catatan"
                            className="w-full max-h-72 sm:max-h-96 object-contain border border-neutral-300"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        {note.attachments.map((att) => {
                            const isImage = att.is_image;
                            const isPdf = att.is_pdf;

                            return (
                                <div
                                    key={att.id}
                                    className="flex items-center justify-between p-2.5 sm:p-3 bg-[#FFFDF8] border-2 border-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    <div className="flex items-center gap-2 min-w-0 mr-2">
                                        {isImage ? (
                                            <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                                        ) : (
                                            <FileText className="w-4 h-4 text-black shrink-0" />
                                        )}
                                        <div className="min-w-0 truncate">
                                            <p className="font-bold truncate text-black" title={att.file_name}>
                                                {att.file_name}
                                            </p>
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase">
                                                {att.formatted_size}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {isImage && (
                                            <button
                                                type="button"
                                                onClick={() => onPreviewImage(att.url)}
                                                className="p-2 sm:p-1.5 bg-white border border-black hover:bg-neutral-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                                                title="Lihat Gambar"
                                                aria-label="Lihat Gambar"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-black" />
                                            </button>
                                        )}

                                        {isPdf && (
                                            <button
                                                type="button"
                                                onClick={() => onPreviewPdf({ url: att.url, name: att.file_name })}
                                                className="p-2 sm:p-1.5 bg-white border border-black hover:bg-neutral-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                                                title="Lihat PDF"
                                                aria-label="Lihat PDF"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-black" />
                                            </button>
                                        )}

                                        <a
                                            href={`/attachments/${att.id}/download`}
                                            download={att.file_name}
                                            className="p-2 sm:p-1.5 bg-[#FFDC58] border border-black hover:bg-[#ffe37d] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                                            title="Unduh File"
                                            aria-label="Unduh File"
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
