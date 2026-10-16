import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import NeoModal from '../UI/NeoModal';
import NeoButton from '../UI/NeoButton';
import {
    Share2, Copy, Check, ExternalLink, Globe, Lock,
    Link as LinkIcon, RefreshCw, AlertCircle, CheckCircle2,
    Eye, Edit3
} from 'lucide-react';
import { getCsrfToken } from '@/utils/csrf';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: 'app' | 'group' | 'note';
    targetId: string;
    title: string;
    isPublic: boolean;
    publicToken?: string | null;
    publicPermission?: 'read' | 'edit';
    canEdit?: boolean;
    isOwner?: boolean;
    isPublicView?: boolean;
    contextInherited?: boolean;
    rootName?: string;
    contextPermission?: 'read' | 'edit';
    contextShareUrl?: string;
    onSharingUpdated?: (updated: {
        is_public: boolean;
        public_token: string;
        public_permission?: 'read' | 'edit';
    }) => void;
}

export default function ShareModal({
    isOpen,
    onClose,
    level,
    targetId,
    title,
    isPublic,
    publicToken,
    publicPermission = 'read',
    canEdit = true,
    isOwner = true,
    isPublicView = false,
    contextInherited = false,
    rootName,
    contextPermission = 'read',
    contextShareUrl,
    onSharingUpdated,
}: ShareModalProps) {
    const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);
    const [currentPermission, setCurrentPermission] = useState<'read' | 'edit'>(publicPermission);
    const [currentSlug, setCurrentSlug] = useState(publicToken || '');
    const [inputSlug, setInputSlug] = useState(publicToken || '');
    const [copiedDirect, setCopiedDirect] = useState(false);
    const [copiedContext, setCopiedContext] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [updatingPermission, setUpdatingPermission] = useState(false);
    const [savingSlug, setSavingSlug] = useState(false);
    const [slugError, setSlugError] = useState<string | null>(null);
    const [slugSuccess, setSlugSuccess] = useState<string | null>(null);

    const canConfigure = Boolean(isOwner && !isPublicView);

    // Availability state
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [availabilityStatus, setAvailabilityStatus] = useState<{
        available: boolean;
        message: string;
    } | null>(null);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const getEndpoint = () => {
        if (level === 'app') return `/app/${targetId}/share`;
        if (level === 'group') return `/groups/${targetId}/share`;
        return `/notes/${targetId}/share`;
    };

    // Synchronize modal state with props when modal opens or props change
    useEffect(() => {
        if (isOpen) {
            setCurrentIsPublic(isPublic);
            setCurrentPermission(publicPermission || 'read');
            setCurrentSlug(publicToken || '');
            setInputSlug(publicToken || '');
            setSlugError(null);
            setSlugSuccess(null);
            setAvailabilityStatus(null);
            setCopiedDirect(false);
            setCopiedContext(false);
        }
    }, [isOpen, isPublic, publicToken, publicPermission]);

    const directShareUrl = typeof window !== 'undefined' && currentSlug
        ? `${window.location.origin}/s/${currentSlug}`
        : '';

    const effectiveContextUrl = contextShareUrl || '';

    const handleCopy = (url: string, type: 'direct' | 'context' = 'direct') => {
        if (!url) return;
        navigator.clipboard.writeText(url);
        if (type === 'direct') {
            setCopiedDirect(true);
            setTimeout(() => setCopiedDirect(false), 2500);
        } else {
            setCopiedContext(true);
            setTimeout(() => setCopiedContext(false), 2500);
        }
    };

    // Toggle Public Status
    const handleTogglePublic = async () => {
        setToggling(true);
        setSlugError(null);
        setSlugSuccess(null);

        const nextIsPublic = !currentIsPublic;
        const endpoint = getEndpoint();

        try {
            const csrfToken = getCsrfToken();
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    is_public: nextIsPublic,
                    public_permission: currentPermission,
                    custom_slug: currentSlug || null,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setCurrentIsPublic(data.is_public);
                setCurrentSlug(data.public_token);
                setInputSlug(data.public_token);
                if (data.public_permission) {
                    setCurrentPermission(data.public_permission);
                }
                setSlugSuccess(data.message);

                if (onSharingUpdated) {
                    onSharingUpdated({
                        is_public: data.is_public,
                        public_token: data.public_token,
                        public_permission: data.public_permission || currentPermission,
                    });
                }

                // Keep page props in sync in background
                router.reload({ only: ['app', 'groups', 'selected_note'] });
            } else {
                setSlugError(data.message || 'Gagal mengubah status publik.');
            }
        } catch {
            setSlugError('Terjadi kesalahan jaringan saat memperbarui status.');
        } finally {
            setToggling(false);
        }
    };

    // Update Public Permission (Read-Only vs Full Access)
    const handleSetPermission = async (newPermission: 'read' | 'edit') => {
        if (currentPermission === newPermission || !canEdit || updatingPermission) return;

        setUpdatingPermission(true);
        setSlugError(null);
        setSlugSuccess(null);

        const endpoint = getEndpoint();

        try {
            const csrfToken = getCsrfToken();
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    is_public: true,
                    public_permission: newPermission,
                    custom_slug: currentSlug || null,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                const updatedPerm = data.public_permission || newPermission;
                setCurrentPermission(updatedPerm);
                setCurrentIsPublic(data.is_public);
                setSlugSuccess(data.message);

                if (onSharingUpdated) {
                    onSharingUpdated({
                        is_public: data.is_public,
                        public_token: data.public_token,
                        public_permission: updatedPerm,
                    });
                }

                router.reload({ only: ['app', 'groups', 'selected_note'] });
            } else {
                setSlugError(data.message || 'Gagal mengubah mode izin publik.');
            }
        } catch {
            setSlugError('Terjadi kesalahan jaringan saat mengubah izin.');
        } finally {
            setUpdatingPermission(false);
        }
    };

    // Live Debounced Availability Check
    const handleSlugInputChange = (val: string) => {
        const cleaned = val.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        setInputSlug(cleaned);
        setSlugError(null);
        setSlugSuccess(null);
        setAvailabilityStatus(null);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (cleaned.length === 0 || cleaned === currentSlug) {
            setCheckingAvailability(false);
            return;
        }

        if (cleaned.length < 3) {
            setAvailabilityStatus({
                available: false,
                message: 'Minimal 3 karakter',
            });
            return;
        }

        setCheckingAvailability(true);
        debounceTimerRef.current = setTimeout(async () => {
            try {
                const params = new URLSearchParams({
                    slug: cleaned,
                    level,
                    current_id: targetId,
                });
                const res = await fetch(`/share/check-slug?${params.toString()}`);
                const data = await res.json();
                setAvailabilityStatus(data);
            } catch {
                // Ignore network error in background check
            } finally {
                setCheckingAvailability(false);
            }
        }, 350);
    };

    // Save Custom Shortlink
    const handleSaveCustomSlug = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputSlug.trim().toLowerCase();

        if (!trimmed) {
            setSlugError('Shortlink tidak boleh kosong.');
            return;
        }

        if (trimmed.length < 3) {
            setSlugError('Shortlink minimal 3 karakter.');
            return;
        }

        if (trimmed === currentSlug) {
            setSlugSuccess('Shortlink ini sudah aktif.');
            return;
        }

        setSavingSlug(true);
        setSlugError(null);
        setSlugSuccess(null);

        const endpoint = getEndpoint();

        try {
            const csrfToken = getCsrfToken();
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    is_public: true, // Saving custom slug automatically makes/keeps it public
                    public_permission: currentPermission,
                    custom_slug: trimmed,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setCurrentIsPublic(data.is_public);
                setCurrentSlug(data.public_token);
                setInputSlug(data.public_token);
                if (data.public_permission) {
                    setCurrentPermission(data.public_permission);
                }
                setSlugSuccess('Shortlink kustom berhasil disimpan!');
                setAvailabilityStatus(null);

                if (onSharingUpdated) {
                    onSharingUpdated({
                        is_public: data.is_public,
                        public_token: data.public_token,
                        public_permission: data.public_permission || currentPermission,
                    });
                }

                router.reload({ only: ['app', 'groups', 'selected_note'] });
            } else {
                setSlugError(
                    data.errors?.custom_slug?.[0] ||
                    data.message ||
                    'Gagal menyimpan shortlink.'
                );
            }
        } catch {
            setSlugError('Terjadi kesalahan jaringan.');
        } finally {
            setSavingSlug(false);
        }
    };

    return (
        <NeoModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                level === 'app'
                    ? 'Bagikan Aplikasi Publik'
                    : level === 'group'
                    ? 'Bagikan Topik Publik'
                    : 'Bagikan Catatan Publik'
            }
            maxWidth="md"
        >
            <div className="space-y-5">
                {!canConfigure ? (
                    /* VIEW & COPY ONLY MODE (FOR VISITORS ON PUBLIC LINKS / NON-OWNERS) */
                    <div className="space-y-4">
                        {/* Status Card */}
                        <div className="p-4 bg-[#7FBC8C]/20 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center gap-2 mb-2">
                                <Globe className="w-5 h-5 text-emerald-700 shrink-0" />
                                <div>
                                    <span className="font-heading font-black text-sm uppercase block">
                                        {contextInherited
                                            ? `Status: Mengikuti ${rootName || 'Ruang Kerja'} (${contextPermission === 'edit' ? 'Bisa Diedit' : 'Hanya Baca'})`
                                            : `Status: Publik (${currentPermission === 'edit' ? 'Bisa Diedit' : 'Hanya Baca'})`}
                                    </span>
                                    <span className="text-[11px] text-neutral-600 font-medium truncate block max-w-[280px]">
                                        {title}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-neutral-700 font-medium leading-relaxed">
                                {contextInherited
                                    ? `Izin akses pada tampilan ini diwarisi langsung dari tautan ${rootName || 'ruang kerja'} yang sedang aktif (${contextPermission === 'edit' ? 'Akses Penuh / Bisa Diedit' : 'Hanya Baca / Read-Only'}). Siapa pun yang membuka tautan ini dapat melihatnya dalam ruang kerja tersebut.`
                                    : `Tautan publik ini berstatus aktif dengan izin ${currentPermission === 'edit' ? 'Akses Penuh (Bisa Diedit)' : 'Hanya Baca (Read-Only)'}. Siapa pun dapat mengakses konten ini setelah masuk akun.`}
                            </p>
                        </div>

                        {/* Public Link Boxes (Context and/or Direct) */}
                        <div className="space-y-3">
                            {/* 1. Context Link (inherited from parent App/Folder) */}
                            {effectiveContextUrl && (
                                <div className="p-3 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black uppercase tracking-wider text-black font-heading flex items-center gap-1.5">
                                            <LinkIcon className="w-3.5 h-3.5 text-black" />
                                            Tautan Konteks {rootName || 'Ruang Kerja'} ({contextPermission === 'edit' ? 'Bisa Diedit' : 'Hanya Baca'})
                                        </label>
                                        <span className="text-[10px] font-black uppercase px-1.5 py-0.5 bg-[#FFDC58] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                            Mewarisi Izin
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-neutral-600">
                                        Membuka {level === 'group' ? 'topik' : 'catatan'} ini di dalam {rootName || 'ruang kerja'} dengan hak akses {contextPermission === 'edit' ? 'Bisa Diedit (Full Edit)' : 'Hanya Baca (Read-Only)'}.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={effectiveContextUrl}
                                            onClick={(e) => (e.target as HTMLInputElement).select()}
                                            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-neutral-900 outline-none select-all"
                                        />
                                        <NeoButton
                                            type="button"
                                            variant={copiedContext ? 'mint' : 'yellow'}
                                            size="sm"
                                            onClick={() => handleCopy(effectiveContextUrl, 'context')}
                                            className="shrink-0"
                                        >
                                            {copiedContext ? (
                                                <>
                                                    <Check className="w-4 h-4 mr-1 text-black" />
                                                    Tersalin!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 mr-1 text-black" />
                                                    Salin Link
                                                </>
                                            )}
                                        </NeoButton>
                                    </div>
                                    <div className="pt-1 flex items-center justify-between border-t border-dashed border-neutral-300">
                                        <a
                                            href={effectiveContextUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-neutral-800 hover:text-black hover:underline"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Buka tautan ini di tab baru
                                        </a>
                                        {copiedContext && (
                                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-400">
                                                Tautan konteks berhasil disalin!
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 2. Direct Note/Group Link (if has its own public token) */}
                            {directShareUrl && (!effectiveContextUrl || currentIsPublic) && (
                                <div className="p-3 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black uppercase tracking-wider text-black font-heading flex items-center gap-1.5">
                                            <LinkIcon className="w-3.5 h-3.5 text-black" />
                                            Tautan Mandiri {level === 'app' ? 'Ruang Kerja' : level === 'group' ? 'Topik' : 'Catatan'} ({currentPermission === 'edit' ? 'Bisa Diedit' : 'Hanya Baca'})
                                        </label>
                                        <span className="text-[10px] font-black uppercase px-1.5 py-0.5 bg-[#A8E6CF] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                            Izin Mandiri
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-neutral-600">
                                        Tautan mandiri khusus untuk {level === 'app' ? 'ruang kerja' : level === 'group' ? 'topik' : 'catatan'} ini dengan izin {currentPermission === 'edit' ? 'Bisa Diedit' : 'Hanya Baca'}.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={directShareUrl}
                                            onClick={(e) => (e.target as HTMLInputElement).select()}
                                            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-neutral-900 outline-none select-all"
                                        />
                                        <NeoButton
                                            type="button"
                                            variant={copiedDirect ? 'mint' : 'yellow'}
                                            size="sm"
                                            onClick={() => handleCopy(directShareUrl, 'direct')}
                                            className="shrink-0"
                                        >
                                            {copiedDirect ? (
                                                <>
                                                    <Check className="w-4 h-4 mr-1 text-black" />
                                                    Tersalin!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 mr-1 text-black" />
                                                    Salin Link
                                                </>
                                            )}
                                        </NeoButton>
                                    </div>
                                    <div className="pt-1 flex items-center justify-between border-t border-dashed border-neutral-300">
                                        <a
                                            href={directShareUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-neutral-800 hover:text-black hover:underline"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Buka tautan ini di tab baru
                                        </a>
                                        {copiedDirect && (
                                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-400">
                                                Tautan mandiri berhasil disalin!
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notice Banner */}
                        <div className="p-3 bg-[#69D2E7]/20 border-2 border-black text-xs font-bold text-neutral-800 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <AlertCircle className="w-4 h-4 shrink-0 text-black" />
                            <span>
                                Mode Pratinjau Tautan: Anda hanya dapat melihat dan menyalin tautan. Pengaturan status publik, mode hak akses, dan shortlink hanya dapat diubah oleh pemilik catatan.
                            </span>
                        </div>
                    </div>
                ) : (
                    /* OWNER CONFIGURATION MODE */
                    <div className="space-y-5">
                        {/* 1. Status Toggle Card */}
                        <div
                            className={`p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors ${
                                currentIsPublic ? 'bg-[#7FBC8C]/20' : 'bg-[#FFFDF8]'
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                    {currentIsPublic ? (
                                        <Globe className="w-5 h-5 text-emerald-700 shrink-0" />
                                    ) : (
                                        <Lock className="w-5 h-5 text-neutral-600 shrink-0" />
                                    )}
                                    <div>
                                        <span className="font-heading font-black text-sm uppercase block">
                                            Status: {currentIsPublic ? (currentPermission === 'edit' ? 'Publik (Bisa Diedit)' : 'Publik (Hanya Baca)') : 'Pribadi (Terkunci)'}
                                        </span>
                                        <span className="text-[11px] text-neutral-500 font-medium truncate block max-w-[240px]">
                                            {title}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleTogglePublic}
                                    disabled={toggling}
                                    className={`px-4 py-2 border-2 border-black font-heading font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                                        currentIsPublic
                                            ? 'bg-[#FF6B6B] hover:bg-[#ff8585] text-black'
                                            : 'bg-[#7FBC8C] hover:bg-[#92cca0] text-black'
                                    }`}
                                >
                                    {toggling ? 'Memproses...' : currentIsPublic ? 'Ubah ke Privat' : 'Jadikan Publik'}
                                </button>
                            </div>

                            <p className="text-xs text-neutral-600 font-medium">
                                {currentIsPublic ? (
                                    currentPermission === 'edit' ? (
                                        level === 'app' ? (
                                            'Siapa pun yang memiliki tautan dapat membuka ruang kerja dan membuat, mengedit, atau menghapus catatan secara penuh setelah masuk akun.'
                                        ) : level === 'group' ? (
                                            'Siapa pun yang memiliki tautan dapat membuka topik ini dan membuat, mengedit, atau menghapus catatan di dalam topik ini saja setelah masuk akun.'
                                        ) : (
                                            'Siapa pun dengan tautan ini dapat membaca dan langsung mengedit isi catatan ini secara penuh setelah masuk akun.'
                                        )
                                    ) : (
                                        level === 'app' ? (
                                            'Siapa pun yang memiliki tautan dapat melihat ruang kerja dan membaca catatan di dalamnya secara read-only setelah masuk akun.'
                                        ) : level === 'group' ? (
                                            'Siapa pun yang memiliki tautan dapat melihat topik ini dan membaca catatan di dalamnya secara read-only setelah masuk akun.'
                                        ) : (
                                            'Siapa pun dengan tautan ini dapat membaca isi catatan ini (termasuk checklist, sketsa, dan lampiran) secara read-only setelah masuk akun.'
                                        )
                                    )
                                ) : (
                                    'Konten saat ini hanya dapat diakses oleh Anda dan kolaborator resmi yang diundang.'
                                )}
                            </p>
                        </div>

                        {/* 2. Public Permission Mode Selector (Read-Only vs Full Access) */}
                        {currentIsPublic && (
                            <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-black uppercase tracking-wider text-black font-heading">
                                        Hak Akses Pengunjung Publik:
                                    </label>
                                    {updatingPermission && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-500">
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                            Menyimpan...
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {/* Read-Only Option */}
                                    <button
                                        type="button"
                                        disabled={updatingPermission}
                                        onClick={() => handleSetPermission('read')}
                                        className={`p-3 text-left border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between ${
                                            currentPermission === 'read'
                                                ? 'bg-[#FFDC58] ring-2 ring-black font-black'
                                                : 'bg-[#FFFDF8] hover:bg-neutral-100 opacity-80'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="flex items-center gap-1.5 text-xs font-heading font-black uppercase text-black">
                                                <Eye className="w-4 h-4 text-neutral-800" />
                                                Hanya Baca (Read-Only)
                                            </span>
                                            {currentPermission === 'read' && (
                                                <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[11px] text-neutral-700 font-medium leading-tight">
                                            Pengunjung hanya dapat membaca dan melihat konten tanpa izin menambah, mengedit, atau menghapus.
                                        </p>
                                    </button>

                                    {/* Full Access Option */}
                                    <button
                                        type="button"
                                        disabled={updatingPermission}
                                        onClick={() => handleSetPermission('edit')}
                                        className={`p-3 text-left border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between ${
                                            currentPermission === 'edit'
                                                ? 'bg-[#7FBC8C] ring-2 ring-black font-black'
                                                : 'bg-[#FFFDF8] hover:bg-[#7FBC8C]/20 opacity-80'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="flex items-center gap-1.5 text-xs font-heading font-black uppercase text-black">
                                                <Edit3 className="w-4 h-4 text-black" />
                                                Bisa Diedit (Full Access)
                                            </span>
                                            {currentPermission === 'edit' && (
                                                <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[11px] text-neutral-700 font-medium leading-tight">
                                            Siapa pun yang memiliki tautan dapat langsung mengedit, menambah, dan menghapus catatan setelah masuk akun.
                                        </p>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3. Public Link & One-Click Copy Box (Visible when public) */}
                        {currentIsPublic && (
                            <div className="space-y-4 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-black font-heading mb-1.5 flex items-center gap-1.5">
                                        <LinkIcon className="w-3.5 h-3.5 text-black" />
                                        Tautan Mandiri Publik ({currentPermission === 'edit' ? 'Akses Penuh / Bisa Diedit' : 'Hanya Baca / Read-Only'})
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={directShareUrl}
                                            onClick={(e) => (e.target as HTMLInputElement).select()}
                                            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-neutral-900 outline-none select-all"
                                        />
                                        <NeoButton
                                            type="button"
                                            variant={copiedDirect ? 'mint' : 'yellow'}
                                            size="sm"
                                            onClick={() => handleCopy(directShareUrl, 'direct')}
                                            className="shrink-0"
                                        >
                                            {copiedDirect ? (
                                                <>
                                                    <Check className="w-4 h-4 mr-1 text-black" />
                                                    Tersalin!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 mr-1 text-black" />
                                                    Salin Link
                                                </>
                                            )}
                                        </NeoButton>
                                    </div>

                                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-dashed border-neutral-300">
                                        <a
                                            href={directShareUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-neutral-800 hover:text-black hover:underline"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Buka pratinjau publik di tab baru
                                        </a>
                                        {copiedDirect && (
                                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-400">
                                                Tautan berhasil disalin ke clipboard!
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Context link display for owner if available */}
                                {effectiveContextUrl && (
                                    <div className="pt-3 border-t border-dashed border-neutral-300 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                                                <LinkIcon className="w-3 h-3 text-neutral-600" />
                                                Tautan dalam Konteks Ruang Kerja:
                                            </label>
                                            <span className="text-[10px] font-mono font-bold text-neutral-500">
                                                Mewarisi izin ruang kerja
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={effectiveContextUrl}
                                                className="flex-1 px-2.5 py-1.5 text-xs bg-[#FFFDF8] border border-black font-mono text-neutral-800 outline-none"
                                            />
                                            <NeoButton
                                                type="button"
                                                variant={copiedContext ? 'mint' : 'yellow'}
                                                size="sm"
                                                onClick={() => handleCopy(effectiveContextUrl, 'context')}
                                            >
                                                {copiedContext ? 'Tersalin!' : 'Salin'}
                                            </NeoButton>
                                        </div>
                                    </div>
                                )}

                                {/* Custom Shortlink Form */}
                                <div className="pt-3 border-t-2 border-black">
                                    <label className="block text-xs font-black uppercase tracking-wider text-black font-heading mb-1">
                                        Kustomisasi Shortlink (Semau Anda)
                                    </label>
                                    <p className="text-[11px] text-neutral-600 font-medium mb-3">
                                        Buat tautan yang keren dan mudah diingat sesuka Anda, asal belum dipakai pengguna lain.
                                    </p>

                                    <form onSubmit={handleSaveCustomSlug} className="space-y-3">
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                            <div className="flex-1 flex items-center bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1.5 focus-within:ring-2 focus-within:ring-black">
                                                <span className="text-xs font-bold font-mono text-neutral-500 shrink-0 select-none">
                                                    {typeof window !== 'undefined' ? `${window.location.host}/s/` : '.../s/'}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={inputSlug}
                                                    onChange={(e) => handleSlugInputChange(e.target.value)}
                                                    placeholder={
                                                        level === 'app'
                                                            ? 'misal: ruang-kerja-tim'
                                                            : level === 'group'
                                                            ? 'misal: topik-sprint'
                                                            : 'misal: catatan-laravel'
                                                    }
                                                    maxLength={60}
                                                    className="w-full bg-transparent text-xs sm:text-sm font-bold font-mono text-black outline-none pl-1"
                                                />
                                                {checkingAvailability && (
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-400 shrink-0" />
                                                )}
                                            </div>

                                            <NeoButton
                                                type="submit"
                                                variant="yellow"
                                                size="sm"
                                                disabled={
                                                    savingSlug ||
                                                    checkingAvailability ||
                                                    !inputSlug.trim() ||
                                                    inputSlug.trim() === currentSlug ||
                                                    (availabilityStatus !== null && !availabilityStatus.available)
                                                }
                                                className="shrink-0"
                                            >
                                                {savingSlug ? 'Menyimpan...' : 'Terapkan Shortlink'}
                                            </NeoButton>
                                        </div>

                                        {/* Live feedback badge */}
                                        {availabilityStatus && inputSlug !== currentSlug && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                {availabilityStatus.available ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-500">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        {availabilityStatus.message}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-500">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        {availabilityStatus.message}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {slugSuccess && (
                                            <div className="p-2 bg-emerald-50 border-2 border-emerald-600 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                                                {slugSuccess}
                                            </div>
                                        )}

                                        {slugError && (
                                            <div className="p-2 bg-rose-50 border-2 border-rose-600 text-rose-800 text-xs font-bold flex items-center gap-1.5">
                                                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                                                {slugError}
                                            </div>
                                        )}
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </NeoModal>
    );
}
