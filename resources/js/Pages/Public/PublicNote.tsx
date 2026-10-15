import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Note } from '@/types';
import Navbar from '@/Components/Navbar';
import { NeoBadge } from '@/Components/UI/NeoInput';
import {
    Calendar, CheckSquare, Download, FileText, Image as ImageIcon,
    Globe, Eye, X, BookOpen, Share2
} from 'lucide-react';

interface PublicNoteProps {
    note: Note;
}

export default function PublicNote({ note }: PublicNoteProps) {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null);

    const parseContent = () => {
        try {
            return note.content_json ? JSON.parse(note.content_json) : { html: '', checklist: [] };
        } catch {
            return { html: note.content_json || '', checklist: [] };
        }
    };

    const parseDrawing = () => {
        try {
            return note.drawing_data ? JSON.parse(note.drawing_data) : null;
        } catch {
            return null;
        }
    };

    const content = parseContent();
    const drawing = parseDrawing();

    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            <Head title={`[Publik] ${note.title}`} />
            <Navbar />

            {/* Banner */}
            <div className="bg-[#69D2E7] border-b-2 border-black px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-black" />
                        <span className="font-heading font-black text-sm uppercase">
                            Catatan Publik Mandiri (Mode Terisolasi)
                        </span>
                    </div>
                    <span className="text-xs font-bold text-neutral-800">
                        Oleh: {note.group?.app?.owner?.name}
                    </span>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
                <div className="border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <NeoBadge variant={note.category === 'task' ? 'coral' : 'yellow'}>
                                {note.category === 'task' ? 'Tugas' : 'Catatan Biasa'}
                            </NeoBadge>
                            <span className="text-xs text-neutral-500 font-bold uppercase">
                                Topik: {note.group?.name}
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-black font-heading text-black uppercase tracking-tight">
                            {note.title}
                        </h1>

                        {note.category === 'task' && note.deadline_at && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border-2 border-black text-xs font-bold text-rose-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <Calendar className="w-4 h-4 text-rose-600" />
                                Batas Pengumpulan / Deadline:{' '}
                                {new Date(note.deadline_at).toLocaleString('id-ID', {
                                    dateStyle: 'full',
                                    timeStyle: 'short',
                                })}
                            </div>
                        )}
                    </div>

                    {/* Rich text */}
                    <div
                        className="p-5 border-2 border-black bg-[#FFFDF8] prose prose-slate max-w-none text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        dangerouslySetInnerHTML={{ __html: content?.html || '<p className="italic text-neutral-400">Tidak ada konten teks.</p>' }}
                    />

                    {/* Interactive Checklist (read-only view) */}
                    {content?.checklist && content.checklist.length > 0 && (
                        <div className="border-2 border-black bg-white p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-heading font-black text-sm uppercase mb-3 flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-black" />
                                Target & Checklist ({content.checklist.filter((c: any) => c.completed).length}/{content.checklist.length})
                            </h3>
                            <div className="space-y-2">
                                {content.checklist.map((item: any) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-2.5 border-2 border-black text-xs font-semibold bg-[#FFFDF8]"
                                    >
                                        <div
                                            className={`w-5 h-5 border-2 border-black flex items-center justify-center ${
                                                item.completed ? 'bg-[#7FBC8C] text-black font-black' : 'bg-white'
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

                    {/* Drawing Sketch Preview */}
                    {drawing?.preview && (
                        <div className="border-2 border-black bg-white p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-heading font-black text-sm uppercase mb-3">
                                Coretan Sketsa & Diagram
                            </h3>
                            <div className="border-2 border-black p-3 bg-neutral-50 flex justify-center">
                                <img
                                    src={drawing.preview}
                                    alt="Sketsa Catatan"
                                    className="max-h-80 object-contain"
                                />
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    {note.attachments && note.attachments.length > 0 && (
                        <div className="border-2 border-black bg-white p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-heading font-black text-sm uppercase mb-3">
                                Lampiran Dokumen & File ({note.attachments.length})
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {note.attachments.map((att) => (
                                    <div
                                        key={att.id}
                                        className="flex items-center justify-between p-3 border-2 border-black bg-[#FFFDF8] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        <div className="overflow-hidden mr-2">
                                            <p className="text-xs font-bold text-neutral-900 truncate">{att.file_name}</p>
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase">{att.formatted_size}</p>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {att.is_image && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewImage(att.url)}
                                                    className="p-1.5 border border-black bg-white hover:bg-[#A388EE] transition-colors"
                                                    title="Pratinjau"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {att.is_pdf && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewPdf({ url: att.url, name: att.file_name })}
                                                    className="p-1.5 border border-black bg-white hover:bg-[#FFDC58] transition-colors"
                                                    title="Pratinjau PDF"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <a
                                                href={att.url}
                                                download={att.file_name}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 border border-black bg-[#7FBC8C] text-black font-bold text-xs hover:bg-[#92cca0]"
                                                title="Unduh"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Lightbox Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] p-2 bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-3 -right-3 p-1.5 bg-[#FF6B6B] border-2 border-black text-black font-bold"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img src={previewImage} alt="Pratinjau" className="max-w-full max-h-[82vh] object-contain mx-auto" />
                    </div>
                </div>
            )}

            {/* PDF Viewer */}
            {previewPdf && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
                    <div className="relative w-full max-w-4xl h-[85vh] flex flex-col bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between p-3 border-b-2 border-black bg-[#FFDC58]">
                            <span className="font-heading font-black text-sm truncate">{previewPdf.name}</span>
                            <button
                                type="button"
                                onClick={() => setPreviewPdf(null)}
                                className="p-1 bg-[#FF6B6B] border border-black"
                            >
                                <X className="w-4 h-4 text-black" />
                            </button>
                        </div>
                        <iframe src={previewPdf.url} className="w-full flex-1 border-none" title="PDF Viewer" />
                    </div>
                </div>
            )}
        </div>
    );
}
