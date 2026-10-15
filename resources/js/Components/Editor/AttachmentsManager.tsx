import React, { useState, useRef } from 'react';
import { NoteAttachment, SystemSettings } from '@/types';
import { router } from '@inertiajs/react';
import {
    FileUp, FileText, Image as ImageIcon, Download, Trash2,
    Eye, X, AlertTriangle, FileArchive, Film, File
} from 'lucide-react';
import NeoButton from '../UI/NeoButton';

interface AttachmentsManagerProps {
    noteId: number;
    attachments: NoteAttachment[];
    settings: SystemSettings;
    editable?: boolean;
}

export default function AttachmentsManager({
    noteId,
    attachments = [],
    settings,
    editable = true,
}: AttachmentsManagerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Lightbox & PDF preview modals
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValidationError(null);
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // 1. Dynamic Check: Max files per upload
        if (files.length > settings.max_files_per_upload) {
            setValidationError(`Maksimal hanya dapat mengunggah ${settings.max_files_per_upload} file dalam sekali upload.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const maxBytes = settings.max_file_size_mb * 1024 * 1024;
        const allowed = settings.allowed_extensions
            ? settings.allowed_extensions.split(',').map((x) => x.trim().toLowerCase())
            : [];
        const blocked = settings.blocked_extensions
            ? settings.blocked_extensions.split(',').map((x) => x.trim().toLowerCase())
            : [];

        // 2. Dynamic check each file for size, blocked ext, and allowed ext
        for (const file of files) {
            const ext = file.name.split('.').pop()?.toLowerCase() || '';

            // Check blocked
            if (blocked.includes(ext)) {
                setValidationError(`File "${file.name}" ditolak. Ekstensi .${ext} diblokir oleh Admin.`);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            // Check allowed
            if (allowed.length > 0 && !allowed.includes(ext)) {
                setValidationError(`File "${file.name}" ditolak. Hanya ekstensi berikut yang diizinkan: ${settings.allowed_extensions}`);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            // Check size
            if (file.size > maxBytes) {
                setValidationError(`Ukuran file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimal ${settings.max_file_size_mb} MB.`);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        }

        // Upload files via Inertia router
        const formData = new FormData();
        files.forEach((f) => formData.append('files[]', f));

        setUploading(true);
        router.post(`/notes/${noteId}/attachments`, formData, {
            onFinish: () => {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
            onError: (err) => {
                setValidationError(Object.values(err)[0] as string);
                setUploading(false);
            },
        });
    };

    const handleDelete = (attachmentId: number) => {
        if (!confirm('Hapus lampiran ini?')) return;
        router.delete(`/notes/${noteId}/attachments/${attachmentId}`);
    };

    const getFileIcon = (att: NoteAttachment) => {
        if (att.is_image) return <ImageIcon className="w-5 h-5 text-purple-600" />;
        if (att.is_pdf) return <FileText className="w-5 h-5 text-rose-600" />;
        if (att.file_name.endsWith('.zip') || att.file_name.endsWith('.rar')) {
            return <FileArchive className="w-5 h-5 text-amber-600" />;
        }
        if (att.mime_type.startsWith('video/')) return <Film className="w-5 h-5 text-sky-600" />;
        return <File className="w-5 h-5 text-neutral-600" />;
    };

    return (
        <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b-2 border-black">
                <div>
                    <h4 className="font-heading font-black text-sm uppercase tracking-wide flex items-center gap-2">
                        <FileUp className="w-4 h-4 text-black" />
                        Lampiran File ({attachments.length})
                    </h4>
                    <p className="text-[11px] text-neutral-500 font-medium">
                        Maks. {settings.max_file_size_mb} MB/file &bull; Hingga {settings.max_files_per_upload} file sekaligus
                    </p>
                </div>

                {editable && (
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            id="attachment-file-input"
                        />
                        <label htmlFor="attachment-file-input">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#69D2E7] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-xs uppercase cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                                <FileUp className="w-3.5 h-3.5" />
                                {uploading ? 'Mengunggah...' : 'Upload File'}
                            </span>
                        </label>
                    </div>
                )}
            </div>

            {/* Validation Error Banner */}
            {validationError && (
                <div className="mb-3 p-2.5 bg-[#FF6B6B] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-start gap-2 text-xs font-bold text-black">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="flex-1">{validationError}</span>
                    <button type="button" onClick={() => setValidationError(null)} className="cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Attachments List / Grid */}
            {attachments.length === 0 ? (
                <p className="text-xs text-neutral-500 italic py-2">Belum ada file lampiran.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {attachments.map((att) => (
                        <div
                            key={att.id}
                            className="flex items-center justify-between p-2.5 bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group"
                        >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                                {att.is_image ? (
                                    <button
                                        type="button"
                                        onClick={() => setPreviewImage(att.url)}
                                        className="w-10 h-10 border border-black shrink-0 overflow-hidden bg-neutral-100 cursor-pointer hover:opacity-80"
                                        title="Klik untuk pratinjau"
                                    >
                                        <img src={att.url} alt={att.file_name} className="w-full h-full object-cover" />
                                    </button>
                                ) : (
                                    <div className="w-10 h-10 border border-black shrink-0 flex items-center justify-center bg-white">
                                        {getFileIcon(att)}
                                    </div>
                                )}

                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-neutral-900 truncate" title={att.file_name}>
                                        {att.file_name}
                                    </p>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase">{att.formatted_size}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                {att.is_image && (
                                    <button
                                        type="button"
                                        onClick={() => setPreviewImage(att.url)}
                                        className="p-1 border border-black bg-white hover:bg-[#A388EE] transition-colors"
                                        title="Pratinjau Gambar"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                {att.is_pdf && (
                                    <button
                                        type="button"
                                        onClick={() => setPreviewPdf({ url: att.url, name: att.file_name })}
                                        className="p-1 border border-black bg-white hover:bg-[#FFDC58] transition-colors"
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
                                    className="p-1 border border-black bg-white hover:bg-[#7FBC8C] transition-colors"
                                    title="Unduh File"
                                >
                                    <Download className="w-3.5 h-3.5 text-black" />
                                </a>

                                {editable && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(att.id)}
                                        className="p-1 border border-black bg-white hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                        title="Hapus File"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox Modal for Images */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] p-2 bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-3 -right-3 p-1.5 bg-[#FF6B6B] border-2 border-black text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img src={previewImage} alt="Pratinjau" className="max-w-full max-h-[82vh] object-contain mx-auto" />
                    </div>
                </div>
            )}

            {/* Embedded PDF Viewer Modal */}
            {previewPdf && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
                    <div className="relative w-full max-w-4xl h-[85vh] flex flex-col bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between p-3 border-b-2 border-black bg-[#FFDC58]">
                            <span className="font-heading font-black text-sm truncate">{previewPdf.name}</span>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewPdf.url}
                                    download={previewPdf.name}
                                    className="px-2.5 py-1 bg-white border border-black text-xs font-bold uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    Unduh
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setPreviewPdf(null)}
                                    className="p-1 bg-[#FF6B6B] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    <X className="w-4 h-4 text-black" />
                                </button>
                            </div>
                        </div>
                        <iframe src={previewPdf.url} className="w-full flex-1 border-none" title="PDF Viewer" />
                    </div>
                </div>
            )}
        </div>
    );
}
