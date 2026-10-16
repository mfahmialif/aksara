import React, { useState, useRef, useEffect } from 'react';
import { NoteAttachment, SystemSettings } from '@/types';
import { router } from '@inertiajs/react';
import {
    FileUp, FileText, Image as ImageIcon, Download, Trash2,
    Eye, X, AlertTriangle, FileArchive, Film, File
} from 'lucide-react';
import NeoButton from '../UI/NeoButton';
import { lockBodyScroll, unlockBodyScroll } from '@/utils/modalScrollLock';

interface AttachmentsManagerProps {
    noteId: string;
    attachments: NoteAttachment[];
    settings?: SystemSettings | null;
    editable?: boolean;
    canEdit?: boolean;
    onAttachmentsUpdated?: (attachments: NoteAttachment[]) => void;
}

function getCsrfToken(): string {
    return (
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
        document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] ||
        ''
    );
}

export default function AttachmentsManager({
    noteId,
    attachments = [],
    settings,
    editable = true,
    canEdit,
    onAttachmentsUpdated,
}: AttachmentsManagerProps) {
    const isEditable = canEdit !== undefined ? canEdit : editable;

    const activeSettings: SystemSettings = {
        max_file_size_mb: settings?.max_file_size_mb || 10,
        max_files_per_upload: settings?.max_files_per_upload || 5,
        allowed_extensions: settings?.allowed_extensions || 'jpg,jpeg,png,webp,gif,pdf,doc,docx,xls,xlsx,zip,txt',
        blocked_extensions: settings?.blocked_extensions || 'exe,bat,sh,php,js,vbs',
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // Lightbox & PDF preview modals
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

    const uploadFiles = async (files: File[]) => {
        setValidationError(null);
        if (files.length === 0 || !isEditable) return;

        // 1. Dynamic Check: Max files per upload
        if (files.length > activeSettings.max_files_per_upload) {
            setValidationError(`Maksimal hanya dapat mengunggah ${activeSettings.max_files_per_upload} file dalam sekali upload.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const maxBytes = activeSettings.max_file_size_mb * 1024 * 1024;
        const allowed = activeSettings.allowed_extensions
            ? activeSettings.allowed_extensions.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)
            : [];
        const blocked = activeSettings.blocked_extensions
            ? activeSettings.blocked_extensions.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)
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
                setValidationError(`File "${file.name}" ditolak. Hanya ekstensi berikut yang diizinkan: ${activeSettings.allowed_extensions}`);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            // Check size
            if (file.size > maxBytes) {
                setValidationError(`Ukuran file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimal ${activeSettings.max_file_size_mb} MB.`);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        }

        const formData = new FormData();
        files.forEach((f) => formData.append('files[]', f));

        setUploading(true);

        try {
            const csrfToken = getCsrfToken();
            const res = await fetch(`/notes/${noteId}/attachments`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (data.attachments && onAttachmentsUpdated) {
                    onAttachmentsUpdated(data.attachments);
                } else {
                    router.reload({ only: ['groups'] });
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                setValidationError(errData.message || 'Gagal mengunggah berkas.');
            }
        } catch {
            // Fallback via Inertia router
            router.post(`/notes/${noteId}/attachments`, formData, {
                preserveScroll: true,
                onError: (err) => {
                    setValidationError(Object.values(err)[0] as string);
                },
            });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        uploadFiles(files);
    };

    const handleDelete = async (attachmentId: string) => {
        if (!confirm('Hapus lampiran ini?')) return;
        try {
            const csrfToken = getCsrfToken();
            const res = await fetch(`/notes/${noteId}/attachments/${attachmentId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (res.ok) {
                const data = await res.json();
                if (data.attachments && onAttachmentsUpdated) {
                    onAttachmentsUpdated(data.attachments);
                } else if (onAttachmentsUpdated) {
                    onAttachmentsUpdated(attachments.filter((a) => a.id !== attachmentId));
                } else {
                    router.reload({ only: ['groups'] });
                }
            } else {
                router.delete(`/notes/${noteId}/attachments/${attachmentId}`);
            }
        } catch {
            router.delete(`/notes/${noteId}/attachments/${attachmentId}`);
        }
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
                        Maks. {activeSettings.max_file_size_mb} MB/file &bull; Hingga {activeSettings.max_files_per_upload} file sekaligus
                    </p>
                </div>

                {isEditable && (
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

            {/* Interactive Drag & Drop Area */}
            {isEditable && (
                <div
                    onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragOver(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragOver(false);
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragOver(false);
                        const files = Array.from(e.dataTransfer.files || []);
                        if (files.length > 0) {
                            uploadFiles(files);
                        }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed p-4 sm:p-5 mb-3 text-center cursor-pointer transition-all select-none ${
                        isDragOver
                            ? 'border-black bg-[#FFDC58] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] scale-[1.01]'
                            : 'border-neutral-400 bg-[#FFFDF8] hover:bg-neutral-50 hover:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                >
                    <div className="w-10 h-10 bg-[#69D2E7] border-2 border-black flex items-center justify-center mx-auto mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <FileUp className="w-5 h-5 text-black" />
                    </div>
                    <p className="text-xs sm:text-sm font-heading font-black uppercase text-black">
                        Tarik & Lepas File ke Sini atau <span className="underline decoration-2">Pilih Berkas</span>
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium mt-1">
                        Bisa drag & drop dari folder, atau paste (Ctrl+V) langsung screenshot gambar
                    </p>
                    {uploading && (
                        <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-black">
                            <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            <span>Sedang mengunggah berkas...</span>
                        </div>
                    )}
                </div>
            )}

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
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs overscroll-contain animate-in fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative w-full sm:w-auto max-w-4xl max-h-[90vh] p-4 bg-white rounded-t-[24px] sm:rounded-none border-t-[3px] border-x-[3px] sm:border-[3px] border-black border-b-0 sm:border-b-[3px] shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-3 sm:hidden shrink-0" />
                        <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-3 right-3 sm:-top-3 sm:-right-3 p-1.5 bg-[#FF6B6B] border-2 border-black text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10 cursor-pointer"
                            title="Tutup"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img src={previewImage} alt="Pratinjau" className="max-w-full max-h-[75vh] object-contain mx-auto" />
                    </div>
                </div>
            )}

            {/* Embedded PDF Viewer Modal */}
            {previewPdf && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs overscroll-contain animate-in fade-in"
                    onClick={() => setPreviewPdf(null)}
                >
                    <div
                        className="relative w-full max-w-4xl h-[88vh] sm:h-[85vh] flex flex-col bg-white rounded-t-[24px] sm:rounded-none border-t-[3px] border-x-[3px] sm:border-[3px] border-black border-b-0 sm:border-b-[3px] shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />
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
                                    className="p-1 bg-[#FF6B6B] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                    title="Tutup"
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
