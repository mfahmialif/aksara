import React, { useState, useEffect } from 'react';
import { Note } from '@/types';
import PublicLayout from '@/Layouts/PublicLayout';
import NeoCard from '@/Components/UI/NeoCard';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { Globe, Calendar, CheckSquare, Download, FileText, Image as ImageIcon, Eye, X } from 'lucide-react';
import { PublicAppProps } from './types';
import PublicAppSidebar from './components/PublicAppSidebar';
import PersonalNoteReminder from '@/Components/PersonalNoteReminder';
import { lockBodyScroll, unlockBodyScroll } from '@/utils/modalScrollLock';

export default function PublicApp({ app, groups = [], selected_note, user_reminder }: PublicAppProps) {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null);

    useEffect(() => {
        const isAnyPreviewOpen = Boolean(previewImage || previewPdf);
        if (isAnyPreviewOpen) {
            lockBodyScroll();
        }
        return () => {
            if (isAnyPreviewOpen) {
                unlockBodyScroll();
            }
        };
    }, [previewImage, previewPdf]);

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
            <div className="bg-[#FFDC58] border-b-2 border-black px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-black shrink-0" />
                        <span className="font-heading font-black text-xs sm:text-sm uppercase truncate">
                            Halaman Publik Aplikasi (Mode Read-Only)
                        </span>
                    </div>
                    <span className="text-xs font-bold text-neutral-800 shrink-0">
                        Oleh: {app.owner?.name}
                    </span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 flex-1 w-full">
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                        <h1 className="text-2xl sm:text-3xl font-black font-heading uppercase text-black break-words">
                            {app.name}
                        </h1>
                        <NeoBadge variant="mint">Aplikasi Terverifikasi</NeoBadge>
                    </div>
                    {app.description && (
                        <p className="text-xs sm:text-sm text-neutral-700 font-medium max-w-2xl break-words">
                            {app.description}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                    {/* Sidebar */}
                    <PublicAppSidebar
                        appToken={app.public_token || ''}
                        groups={groups}
                        selectedNote={selected_note}
                    />

                    {/* Note Content Viewer */}
                    <div className="lg:col-span-8">
                        {selected_note ? (
                            <NeoCard color="bg-white" className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                                <div className="border-b-2 border-black pb-3 sm:pb-4">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <NeoBadge variant={selected_note.category === 'task' ? 'coral' : 'yellow'}>
                                            {selected_note.category === 'task' ? 'Tugas' : 'Catatan Biasa'}
                                        </NeoBadge>
                                        <span className="text-[11px] sm:text-xs text-neutral-500 font-bold truncate max-w-full">
                                            Grup: {selected_note.group?.name}
                                        </span>
                                    </div>

                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-heading uppercase text-black break-words leading-tight">
                                        {selected_note.title}
                                    </h2>

                                    {selected_note.category === 'task' && selected_note.deadline_at && (
                                        <p className="text-xs font-bold text-rose-700 mt-2 flex flex-wrap items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                                            <span>Deadline: {new Date(selected_note.deadline_at).toLocaleString('id-ID')}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Personal Note Reminder */}
                                <PersonalNoteReminder note={selected_note} initialReminder={user_reminder} />

                                {/* Rich Text HTML */}
                                {noteContent?.html && (
                                    <div className="space-y-2">
                                        <h4 className="font-heading font-black text-xs uppercase tracking-wider text-neutral-500">
                                            Isi Catatan
                                        </h4>
                                        <div
                                            className="p-3.5 sm:p-4 bg-[#FFFDF8] border-2 border-black prose prose-sm max-w-none text-neutral-900 font-medium overflow-x-auto break-words [&_pre]:overflow-x-auto [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto"
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
                                        <div className="space-y-2 border-2 border-black p-3.5 sm:p-4 bg-[#FFFDF8]">
                                            {noteContent.checklist.map((item: any) => (
                                                <div key={item.id} className="flex items-start sm:items-center gap-2 text-xs font-bold">
                                                    <div className={`w-4 h-4 border border-black flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${item.completed ? 'bg-[#7FBC8C]' : 'bg-white'}`}>
                                                        {item.completed && <CheckSquare className="w-3 h-3 text-black" />}
                                                    </div>
                                                    <span className={`break-words ${item.completed ? 'line-through text-neutral-500' : 'text-black'}`}>
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
                                        <div className="border-2 border-black p-2 sm:p-3 bg-white flex justify-center overflow-hidden">
                                            <img
                                                src={drawingData}
                                                alt="Sketsa Catatan"
                                                className="w-full max-h-72 object-contain border border-neutral-300"
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
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                                            {selected_note.attachments.map((att) => {
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
                                                                    onClick={() => setPreviewImage(att.url)}
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
                                                                    onClick={() => setPreviewPdf({ url: att.url, name: att.file_name })}
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
                            </NeoCard>
                        ) : (
                            <div className="border-2 border-black bg-white p-8 sm:p-12 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-400 mx-auto mb-3" />
                                <h3 className="font-heading font-black text-base sm:text-lg uppercase mb-1">Pilih Catatan</h3>
                                <p className="text-xs text-neutral-600 font-medium max-w-sm mx-auto">
                                    Pilih catatan dari daftar grup untuk mulai membaca isi catatan.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal for Images */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain animate-in fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative w-full sm:w-auto max-w-4xl max-h-[90vh] bg-white rounded-t-[20px] sm:rounded-none border-t-[3px] border-x-[3px] sm:border-[3px] border-black border-b-0 sm:border-b-[3px] p-3 sm:p-4 shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-3 sm:hidden shrink-0" />
                        <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-3 right-3 sm:-top-3 sm:-right-3 p-1.5 bg-[#FF6B6B] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer z-10 active:translate-x-0.5 active:translate-y-0.5"
                            title="Tutup"
                            aria-label="Tutup"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-h-[75vh] w-auto object-contain mx-auto"
                        />
                    </div>
                </div>
            )}

            {/* Modal for PDF Preview */}
            {previewPdf && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain animate-in fade-in"
                    onClick={() => setPreviewPdf(null)}
                >
                    <div
                        className="relative w-full max-w-5xl h-[88vh] sm:h-[85vh] bg-white rounded-t-[20px] sm:rounded-none border-t-[3px] border-x-[3px] sm:border-[3px] border-black border-b-0 sm:border-b-[3px] p-3 sm:p-4 shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />
                        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b-2 border-black">
                            <span className="font-heading font-black text-xs sm:text-sm truncate uppercase">
                                Dokumen PDF: {previewPdf.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPreviewPdf(null)}
                                className="p-1 bg-[#FF6B6B] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                                title="Tutup"
                                aria-label="Tutup"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <iframe
                            src={previewPdf.url}
                            className="w-full flex-1 border-2 border-black"
                            title="Pratinjau PDF"
                        />
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
