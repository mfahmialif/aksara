import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { NoteApp, SyncDiffItem } from '@/types';
import NeoModal from '../UI/NeoModal';
import NeoButton from '../UI/NeoButton';
import {
    RefreshCw, ArrowRight, Check, AlertCircle,
    Loader2, Sparkles, Folder, ShieldCheck
} from 'lucide-react';
import { getCsrfToken } from '@/utils/csrf';

interface SyncWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentApp: NoteApp | null;
    onSuccess?: () => void;
}

export default function SyncWorkspaceModal({
    isOpen,
    onClose,
    currentApp,
    onSuccess,
}: SyncWorkspaceModalProps) {
    if (!currentApp) return null;

    // Diff Data
    const [isLoadingDiff, setIsLoadingDiff] = useState(false);
    const [diffItems, setDiffItems] = useState<SyncDiffItem[]>([]);
    const [actions, setActions] = useState<Record<string, 'add' | 'overwrite' | 'create_new' | 'skip'>>({});
    const [sourceAppName, setSourceAppName] = useState('');
    const [targetAppName, setTargetAppName] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'modified' | 'identical' | 'target_only'>('all');

    // Submitting Merge
    const [isApplying, setIsApplying] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch diff directly on modal open pulling strictly from original master
    useEffect(() => {
        if (!isOpen || !currentApp) return;

        setStatusMessage(null);
        setActiveFilter('all');

        if (!currentApp.cloned_from_id) {
            setStatusMessage({
                type: 'error',
                text: 'Ruang kerja ini adalah ruang kerja asli (master). Sinkronisasi hanya dapat dilakukan pada ruang kerja hasil duplikat.',
            });
            return;
        }

        setIsLoadingDiff(true);

        const csrfToken = getCsrfToken();
        fetch(`/app/${currentApp.id}/sync-diff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                source_app_id: currentApp.cloned_from_id,
                target_app_id: currentApp.id,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setDiffItems(data.diff || []);
                    setSourceAppName(data.source_app?.name || 'Ruang Kerja Asal');
                    setTargetAppName(data.target_app?.name || currentApp.name);

                    // Initialize action mappings with default actions
                    const initialActions: Record<string, 'add' | 'overwrite' | 'create_new' | 'skip'> = {};
                    (data.diff || []).forEach((item: SyncDiffItem, idx: number) => {
                        const key = item.source_note_id || item.target_note_id || `idx_${idx}`;
                        initialActions[key] = item.default_action || 'skip';
                    });
                    setActions(initialActions);
                } else {
                    setStatusMessage({
                        type: 'error',
                        text: data.message || 'Gagal membandingkan perubahan dengan ruang kerja asal.',
                    });
                }
            })
            .catch(() => {
                setStatusMessage({
                    type: 'error',
                    text: 'Terjadi kesalahan jaringan saat membandingkan dengan ruang kerja asal.',
                });
            })
            .finally(() => {
                setIsLoadingDiff(false);
            });
    }, [isOpen, currentApp?.id, currentApp?.cloned_from_id]);

    // Bulk action helpers
    const handleSetAllActions = (action: 'add' | 'overwrite' | 'create_new' | 'skip') => {
        const nextActions = { ...actions };
        diffItems.forEach((item, idx) => {
            const key = item.source_note_id || item.target_note_id || `idx_${idx}`;
            if (item.status === 'new') {
                nextActions[key] = action === 'overwrite' ? 'add' : action;
            } else if (item.status === 'modified') {
                nextActions[key] = action;
            } else if (item.status === 'identical') {
                nextActions[key] = 'skip';
            }
        });
        setActions(nextActions);
    };

    // Handle applying sync merge
    const handleApplySync = async () => {
        if (!currentApp.cloned_from_id) return;

        setIsApplying(true);
        setStatusMessage(null);

        const actionPayload = diffItems.map((item, idx) => {
            const key = item.source_note_id || item.target_note_id || `idx_${idx}`;
            return {
                source_note_id: item.source_note_id,
                target_note_id: item.target_note_id,
                action: actions[key] || 'skip',
            };
        });

        try {
            const csrfToken = getCsrfToken();
            const res = await fetch(`/app/${currentApp.id}/sync-apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    source_app_id: currentApp.cloned_from_id,
                    target_app_id: currentApp.id,
                    actions: actionPayload,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setStatusMessage({ type: 'success', text: data.message || 'Sinkronisasi berhasil diterapkan!' });
                setTimeout(() => {
                    onClose();
                    if (onSuccess) {
                        onSuccess();
                    } else {
                        router.reload();
                    }
                }, 1200);
            } else {
                setStatusMessage({ type: 'error', text: data.message || 'Gagal menerapkan sinkronisasi.' });
            }
        } catch {
            setStatusMessage({ type: 'error', text: 'Terjadi kesalahan jaringan saat menerapkan sinkronisasi.' });
        } finally {
            setIsApplying(false);
        }
    };

    // Stats
    const newCount = diffItems.filter((i) => i.status === 'new').length;
    const modifiedCount = diffItems.filter((i) => i.status === 'modified').length;
    const identicalCount = diffItems.filter((i) => i.status === 'identical').length;
    const targetOnlyCount = diffItems.filter((i) => i.status === 'target_only').length;

    const filteredItems = diffItems.filter((item) => {
        if (activeFilter === 'all') return true;
        return item.status === activeFilter;
    });

    const activeChangesCount = Object.values(actions).filter((a) => a !== 'skip').length;

    return (
        <NeoModal
            isOpen={isOpen}
            onClose={onClose}
            title="Tarik Sinkronisasi dari Asal"
            maxWidth="xl"
        >
            <div className="space-y-4">
                {statusMessage && (
                    <div
                        className={`p-3 border-2 border-black font-bold text-xs flex items-center gap-2 ${
                            statusMessage.type === 'success' ? 'bg-[#A6E3A1] text-black' : 'bg-rose-100 text-rose-800'
                        }`}
                    >
                        {statusMessage.type === 'success' ? (
                            <Check className="w-4 h-4 text-emerald-800 stroke-[3]" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <span>{statusMessage.text}</span>
                    </div>
                )}

                {/* Safety & Direction Header */}
                <div className="p-3 bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-black flex-wrap">
                        <span className="px-2 py-0.5 bg-neutral-100 border border-black uppercase text-[10px] font-black">
                            Asal
                        </span>
                        <span className="font-heading font-black uppercase text-black truncate max-w-[160px]">
                            {sourceAppName || 'Ruang Kerja Asal'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-black shrink-0" />
                        <span className="px-2 py-0.5 bg-[#FFDC58] border border-black uppercase text-[10px] font-black">
                            Tujuan (Duplikat)
                        </span>
                        <span className="font-heading font-black uppercase text-black truncate max-w-[160px]">
                            {targetAppName || currentApp.name}
                        </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                            Sinkronisasi satu arah: mengambil data dari ruang kerja original ke duplikat ini. Ruang kerja original Anda tidak akan pernah terubah.
                        </span>
                    </p>
                </div>

                {isLoadingDiff ? (
                    <div className="p-10 text-center space-y-3 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Loader2 className="w-7 h-7 animate-spin mx-auto text-black" />
                        <p className="text-xs font-heading font-black uppercase text-neutral-800">
                            Memeriksa perbedaan dengan ruang kerja asal...
                        </p>
                        <p className="text-[11px] text-neutral-500">
                            Menganalisis catatan baru, yang telah berubah, dan yang identik.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Summary Badges & Filter Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                            <button
                                type="button"
                                onClick={() => setActiveFilter('all')}
                                className={`px-2.5 py-1 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all ${
                                    activeFilter === 'all'
                                        ? 'bg-black text-white font-black'
                                        : 'bg-white hover:bg-neutral-100 text-black'
                                }`}
                            >
                                Semua ({diffItems.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveFilter('modified')}
                                className={`px-2.5 py-1 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all ${
                                    activeFilter === 'modified'
                                        ? 'bg-[#FFDC58] text-black font-black ring-2 ring-black'
                                        : 'bg-[#FFE57F] text-amber-950 hover:bg-[#FFDC58]'
                                }`}
                            >
                                Berubah ({modifiedCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveFilter('new')}
                                className={`px-2.5 py-1 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all ${
                                    activeFilter === 'new'
                                        ? 'bg-[#A6E3A1] text-emerald-950 font-black ring-2 ring-black'
                                        : 'bg-[#DCFCE7] text-emerald-900 hover:bg-[#A6E3A1]'
                                }`}
                            >
                                Baru ({newCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveFilter('identical')}
                                className={`px-2.5 py-1 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all ${
                                    activeFilter === 'identical'
                                        ? 'bg-neutral-400 text-black font-black ring-2 ring-black'
                                        : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                                }`}
                            >
                                Sama ({identicalCount})
                            </button>
                            {targetOnlyCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setActiveFilter('target_only')}
                                    className={`px-2.5 py-1 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all ${
                                        activeFilter === 'target_only'
                                            ? 'bg-purple-300 text-purple-950 font-black ring-2 ring-black'
                                            : 'bg-purple-100 text-purple-950 hover:bg-purple-200'
                                    }`}
                                >
                                    Hanya di Duplikat ({targetOnlyCount})
                                </button>
                            )}
                        </div>

                        {/* Quick Selection Buttons */}
                        <div className="p-2.5 bg-white border-2 border-black flex flex-wrap items-center justify-between gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-[10px] font-heading font-black uppercase text-neutral-600 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-black" />
                                Aksi Cepat:
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => handleSetAllActions('overwrite')}
                                    className="px-2 py-0.5 bg-[#FFDC58] hover:bg-[#FFE57F] border border-black text-[10px] font-bold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                >
                                    Timpa yang Berubah
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetAllActions('add')}
                                    className="px-2 py-0.5 bg-[#A6E3A1] hover:bg-[#DCFCE7] border border-black text-[10px] font-bold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                >
                                    Tambahkan yang Baru
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetAllActions('create_new')}
                                    className="px-2 py-0.5 bg-[#69D2E7] hover:bg-[#A8E6CF] border border-black text-[10px] font-bold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                >
                                    Salinan Baru
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetAllActions('skip')}
                                    className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 border border-black text-[10px] font-bold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                >
                                    Abaikan Semua
                                </button>
                            </div>
                        </div>

                        {/* Notes Diff List */}
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                            {filteredItems.length === 0 ? (
                                <div className="p-6 text-center text-xs font-bold text-neutral-500 border-2 border-dashed border-black bg-[#FFFDF8]">
                                    {diffItems.length === 0
                                        ? 'Tidak ada catatan di ruang kerja asal.'
                                        : 'Tidak ada catatan pada kategori filter ini.'}
                                </div>
                            ) : (
                                filteredItems.map((item, idx) => {
                                    const key = item.source_note_id || item.target_note_id || `idx_${idx}`;
                                    const currentAction = actions[key] || 'skip';

                                    return (
                                        <div
                                            key={key}
                                            className={`p-3 border-2 border-black transition-all ${
                                                currentAction !== 'skip'
                                                    ? 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                    : 'bg-[#FAF8F5] opacity-75'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className={`px-1.5 py-0.5 border border-black text-[9px] font-black uppercase shrink-0 ${
                                                        item.status === 'new'
                                                            ? 'bg-[#A6E3A1] text-emerald-950'
                                                            : (item.status === 'modified'
                                                                ? 'bg-[#FFDC58] text-amber-950'
                                                                : (item.status === 'identical'
                                                                    ? 'bg-neutral-200 text-neutral-800'
                                                                    : 'bg-purple-100 text-purple-950'))
                                                    }`}>
                                                        {item.status === 'new' ? 'Baru' : (item.status === 'modified' ? 'Berubah' : (item.status === 'identical' ? 'Sama' : 'Hanya di Duplikat'))}
                                                    </span>

                                                    <div className="min-w-0">
                                                        <p className="font-heading font-black text-xs uppercase text-black truncate">
                                                            {item.source_title || item.target_title}
                                                        </p>
                                                        <p className="text-[10px] text-neutral-500 font-bold flex items-center gap-1 truncate">
                                                            <Folder className="w-3 h-3 text-neutral-600" />
                                                            {item.group_name || item.target_group_name}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Selector */}
                                                <div className="flex items-center gap-1 shrink-0 flex-wrap">
                                                    {item.status === 'new' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setActions({ ...actions, [key]: 'add' })}
                                                            className={`px-2 py-1 text-[10px] font-heading font-black uppercase border border-black cursor-pointer ${
                                                                currentAction === 'add' ? 'bg-[#A6E3A1] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-neutral-50'
                                                            }`}
                                                        >
                                                            + Tambah
                                                        </button>
                                                    )}

                                                    {item.status === 'modified' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActions({ ...actions, [key]: 'overwrite' })}
                                                                className={`px-2 py-1 text-[10px] font-heading font-black uppercase border border-black cursor-pointer ${
                                                                    currentAction === 'overwrite' ? 'bg-[#FFDC58] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-neutral-50'
                                                                }`}
                                                                title="Timpa isi catatan di duplikat ini dengan versi original asal"
                                                            >
                                                                🔄 Timpa
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActions({ ...actions, [key]: 'create_new' })}
                                                                className={`px-2 py-1 text-[10px] font-heading font-black uppercase border border-black cursor-pointer ${
                                                                    currentAction === 'create_new' ? 'bg-[#69D2E7] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-neutral-50'
                                                                }`}
                                                                title="Simpan sebagai catatan baru dengan akhiran (Salinan Sync)"
                                                            >
                                                                📑 Nama Baru
                                                            </button>
                                                        </>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => setActions({ ...actions, [key]: 'skip' })}
                                                        className={`px-2 py-1 text-[10px] font-heading font-black uppercase border border-black cursor-pointer ${
                                                            currentAction === 'skip' ? 'bg-neutral-300 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-neutral-50'
                                                        }`}
                                                    >
                                                        Abaikan
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Preview Text */}
                                            {(item.source_preview || item.target_preview) && (
                                                <div className="pt-2 text-[11px] text-neutral-600 line-clamp-2">
                                                    {item.source_preview ? (
                                                        <span><strong className="text-black">Sumber (Asal):</strong> {item.source_preview}</span>
                                                    ) : null}
                                                    {item.target_preview && item.source_preview !== item.target_preview ? (
                                                        <span className="block mt-0.5 text-neutral-500"><strong className="text-neutral-700">Tujuan (Duplikat):</strong> {item.target_preview}</span>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Apply Footer */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t-2 border-black flex-wrap">
                            <NeoButton
                                type="button"
                                variant="white"
                                size="sm"
                                onClick={onClose}
                                disabled={isApplying}
                            >
                                Batal
                            </NeoButton>

                            <NeoButton
                                type="button"
                                variant="yellow"
                                size="sm"
                                onClick={handleApplySync}
                                disabled={isApplying || activeChangesCount === 0}
                            >
                                <RefreshCw className={`w-4 h-4 mr-1.5 ${isApplying ? 'animate-spin' : ''}`} />
                                {isApplying ? 'Menerapkan...' : `Tarik Sinkronisasi (${activeChangesCount} Catatan)`}
                            </NeoButton>
                        </div>
                    </div>
                )}
            </div>
        </NeoModal>
    );
}
