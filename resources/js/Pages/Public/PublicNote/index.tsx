import React, { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Globe, X } from 'lucide-react';
import { PublicNoteProps } from './types';
import PublicNoteContent from './components/PublicNoteContent';

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
        <PublicLayout title={`[Publik] ${note.title}`}>
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

            <div className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
                <PublicNoteContent
                    note={note}
                    content={content}
                    drawing={drawing}
                    onPreviewImage={setPreviewImage}
                    onPreviewPdf={setPreviewPdf}
                />
            </div>

            {/* Lightbox Modal for Images */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] bg-white border-3 border-black p-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-3 -right-3 p-1.5 bg-[#FF6B6B] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-h-[80vh] w-auto object-contain mx-auto"
                        />
                    </div>
                </div>
            )}

            {/* Modal for PDF Preview */}
            {previewPdf && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setPreviewPdf(null)}
                >
                    <div
                        className="relative w-full max-w-5xl h-[85vh] bg-white border-3 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black">
                            <span className="font-heading font-black text-sm truncate uppercase">
                                Dokumen PDF: {previewPdf.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPreviewPdf(null)}
                                className="p-1 bg-[#FF6B6B] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer"
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
