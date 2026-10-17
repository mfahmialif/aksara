import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Globe, X, Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react';
import { PageProps } from '@/types';
import { PublicNoteProps } from './types';
import PublicNoteContent from './components/PublicNoteContent';
import KeepNoteModal from '@/Pages/Member/NoteEditor/components/KeepNoteModal';
import { lockBodyScroll, unlockBodyScroll } from '@/utils/modalScrollLock';
import { getCsrfToken } from '@/utils/csrf';

export default function PublicNote({
    note,
    app,
    groups,
    user_reminder,
    is_saved = false,
    can_edit = false,
    is_owner = false,
    share_public_token,
}: PublicNoteProps) {
    const { auth, system_settings } = usePage<PageProps>().props;
    const user = auth?.user;

    const [localNote, setLocalNote] = useState(note);
    const [savedState, setSavedState] = useState<boolean>(Boolean(is_saved));
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewPdf, setPreviewPdf] = useState<{ id?: string; url: string; name: string } | null>(null);

    useEffect(() => {
        setLocalNote(note);
    }, [note]);

    useEffect(() => {
        setSavedState(Boolean(is_saved));
    }, [is_saved]);

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

    const handleToggleSave = async () => {
        if (!user) {
            router.visit(route('login'));
            return;
        }
        if (isSaving) return;
        setIsSaving(true);
        const nextState = !savedState;
        setSavedState(nextState);

        try {
            const csrfToken = getCsrfToken();
            if (nextState) {
                await fetch('/saved-links', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        item_type: 'note',
                        item_id: localNote.id,
                        public_token: share_public_token || localNote.public_token,
                        share_url: typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined,
                    }),
                });
            } else {
                await fetch('/saved-links', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        item_type: 'note',
                        item_id: localNote.id,
                    }),
                });
            }
        } catch {
            setSavedState(!nextState);
        } finally {
            setIsSaving(false);
        }
    };

    const parseContent = () => {
        try {
            return localNote.content_json ? JSON.parse(localNote.content_json) : { html: '', checklist: [] };
        } catch {
            return { html: localNote.content_json || '', checklist: [] };
        }
    };

    const parseDrawing = () => {
        try {
            return localNote.drawing_data ? JSON.parse(localNote.drawing_data) : null;
        } catch {
            return null;
        }
    };

    const content = parseContent();
    const drawing = parseDrawing();

    const handleToggleChecklist = async (itemId: string) => {
        if (!can_edit) return;
        const currentChecklist = content.checklist || [];
        const nextChecklist = currentChecklist.map((item: any) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        const nextContentJson = JSON.stringify({
            ...content,
            checklist: nextChecklist,
        });

        // Optimistic update
        setLocalNote((prev) => ({
            ...prev,
            content_json: nextContentJson,
        }));

        try {
            const csrfToken = getCsrfToken();
            await fetch(`/notes/${localNote.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    content_json: nextContentJson,
                }),
            });
        } catch {
            // Revert on error
            setLocalNote((prev) => ({
                ...prev,
                content_json: localNote.content_json,
            }));
        }
    };

    const resolvedGroups = groups && groups.length > 0 ? groups : (localNote.group ? [localNote.group] : []);

    return (
        <PublicLayout title={`[Publik] ${localNote.title}`}>
            {/* Banner Header */}
            <div className="bg-[#69D2E7] border-b-2 border-black px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-black shrink-0" />
                        <span className="font-heading font-black text-xs sm:text-sm uppercase truncate">
                            Catatan Publik Mandiri
                        </span>
                        {localNote.group?.name && (
                            <span className="hidden sm:inline text-xs font-bold text-neutral-800 truncate">
                                &bull; {localNote.group.name}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
                        <span className="text-xs font-bold text-neutral-800">
                            Oleh: {localNote.group?.app?.owner?.name || 'Pemilik'}
                        </span>

                        {/* Save Bookmark Button */}
                        {user && (
                            <button
                                type="button"
                                onClick={handleToggleSave}
                                disabled={isSaving}
                                className={`h-7 sm:h-8 px-2 sm:px-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer transition-all flex items-center gap-1.5 text-xs font-heading font-black uppercase ${
                                    savedState
                                        ? 'bg-[#7FBC8C] hover:bg-[#6fae7c]'
                                        : 'bg-white hover:bg-[#FFDC58]'
                                }`}
                                title={savedState ? 'Link tersimpan di Ruang Kerja Anda (Klik untuk menghapus)' : 'Simpan link ini ke Ruang Kerja Saya'}
                            >
                                {savedState ? (
                                    <>
                                        <BookmarkCheck className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                                        <span>Tersimpan</span>
                                    </>
                                ) : (
                                    <>
                                        <Bookmark className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                                        <span>Simpan Link</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Owner shortcut to open in full workspace */}
                        {is_owner && localNote.group?.note_app_id && (
                            <Link
                                href={`/app/${localNote.group.note_app_id}?note_id=${localNote.id}`}
                                className="h-7 sm:h-8 px-2 sm:px-2.5 bg-white hover:bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer transition-all flex items-center gap-1.5 text-xs font-heading font-black uppercase"
                                title="Buka di Ruang Kerja Saya"
                            >
                                <ExternalLink className="w-3.5 h-3.5 text-black" />
                                <span className="hidden sm:inline">Buka di Workspace</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 flex-1 w-full">
                <PublicNoteContent
                    note={localNote}
                    content={content}
                    drawing={drawing}
                    userReminder={user_reminder}
                    canEdit={can_edit}
                    onPreviewImage={setPreviewImage}
                    onPreviewPdf={setPreviewPdf}
                    onToggleChecklist={handleToggleChecklist}
                    onOpenEdit={() => setIsEditModalOpen(true)}
                />
            </div>

            {/* Modal for Editing if user has edit permission */}
            {can_edit && isEditModalOpen && (
                <KeepNoteModal
                    note={localNote}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    groups={resolvedGroups}
                    canEdit={can_edit}
                    user={user}
                    systemSettings={system_settings}
                    onNoteUpdated={(updated) => {
                        setLocalNote(updated);
                    }}
                    onNoteCreated={() => {}}
                    onDeleteNote={() => {
                        router.visit(user ? '/app' : '/');
                    }}
                />
            )}

            {/* Lightbox Modal for Images */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain animate-in fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative w-full sm:w-auto max-w-4xl max-h-[90vh] bg-white rounded-t-[24px] sm:rounded-none border-t-[3px] border-x-[3px] sm:border-[3px] border-black border-b-0 sm:border-b-[3px] p-4 shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-3 sm:hidden shrink-0" />
                        <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-3 right-3 sm:-top-3 sm:-right-3 p-1.5 bg-[#FF6B6B] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer z-10"
                            title="Tutup"
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
                        className="relative w-full max-w-5xl h-[88vh] sm:h-[85vh] bg-white rounded-t-[24px] sm:rounded-none border-t-[3px] border-x-[3px] sm:border-[3px] border-black border-b-0 sm:border-b-[3px] p-4 shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />
                        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black">
                            <span className="font-heading font-black text-sm truncate uppercase">
                                Dokumen PDF: {previewPdf.name}
                            </span>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewPdf.id ? `/attachments/${previewPdf.id}/download` : previewPdf.url}
                                    download={previewPdf.name}
                                    className="px-2.5 py-1 bg-[#FFDC58] border-2 border-black text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffe37d] active:translate-x-0.5 active:translate-y-0.5"
                                >
                                    Unduh
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setPreviewPdf(null)}
                                    className="p-1 bg-[#FF6B6B] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                                    title="Tutup"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
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
