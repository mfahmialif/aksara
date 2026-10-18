import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { NoteApp, SyncTargetApp, SyncDiffItem } from '@/types';
import NeoModal from '../UI/NeoModal';
import NeoButton from '../UI/NeoButton';
import {
    RefreshCw, ArrowRight, ArrowLeftRight, Check, AlertCircle,
    FileText, Plus, Copy, RotateCcw, Loader2, Sparkles, Folder
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

    // Step: 'select_target' | 'review_diff'
    const [step, setStep] = useState<'select_target' | 'review_diff'>('select_target');
    const [isLoadingTargets, setIsLoadingTargets] = useState(false);
    const [targets, setTargets] = useState<SyncTargetApp[]>([]);
    const [selectedTargetId, setSelectedTargetId] = useState<string>('');

    // Direction: 'pull' (Target -> Current) or 'push' (Current -> Target)
    const [syncDirection, setSyncDirection] = useState<'pull' | 'push'>('pull');

    // Diff Data
    const [isLoadingDiff, setIsLoadingDiff] = useState(false);
    const [diffItems, setDiffItems] = useState<SyncDiffItem[]>([]);
    const [actions, setActions] = useState<Record<string, 'add' | 'overwrite' | 'create_new' | 'skip'>>({});
    const [sourceAppName, setSourceAppName] = useState('');
    const [targetAppName, setTargetAppName] = useState('');

    // Submitting Merge
    const [isApplying, setIsApplying] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch targets on modal open
    useEffect(() => {
        if (!isOpen || !currentApp) return;

        setStep('select_target');
        setStatusMessage(null);
        setIsLoadingTargets(true);

        fetch(`/app/${currentApp.id}/sync-targets`, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success && Array.isArray(data.targets)) {
                    setTargets(data.targets);
                    if (data.targets.length > 0) {
                        setSelectedTargetId(data.targets[0].id);
                    }
                }
            })
            .catch(() => {
                setStatusMessage({ type: 'error', text: 'Gagal memuat daftar ruang kerja pasangan.' });
            })
            .finally(() => {
                setIsLoadingTargets(false);
            });
    }, [isOpen, currentApp?.id]);

    // Handle comparing diff
    const handleCompareDiff = async () => {
        if (!selectedTargetId) return;

        setIsLoadingDiff(true);
        setStatusMessage(null);

        const sourceId = syncDirection === 'pull' ? selectedTargetId : currentApp.id;
        const targetId = syncDirection === 'pull' ? currentApp.id : selectedTargetId;

        try {
            const csrfToken = getCsrfToken();
            const res = await fetch(`/app/${currentApp.id}/sync-diff`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    source_app_id: sourceId,
                    target_app_id: targetId,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setDiffItems(data.diff || []);
                setSourceAppName(data.source_app?.name || 'Sumber');
                setTargetAppName(data.target_app?.name || 'Tujuan');

                // Initialize action mappings with default actions
                const initialActions: Record<string, 'add' | 'overwrite' | 'create_new' | 'skip'> = {};
                (data.diff || []).forEach((item: SyncDiffItem, idx: number) => {
                    const key = item.source_note_id || item.target_note_id || `idx_${idx}`;
                    initialActions[key] = item.default_action || 'skip';
                });
                setActions(initialActions);
                setStep('review_diff');
            } else {
                setStatusMessage({ type: 'error', text: data.message || 'Gagal membandingkan perubahan.' });
            }
        } catch {
            setStatusMessage({ type: 'error', text: 'Terjadi kesalahan jaringan saat membandingkan.' });
        } finally {
            setIsLoadingDiff(false);
        }
    };

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
        setIsApplying(true);
        setStatusMessage(null);

        const sourceId = syncDirection === 'pull' ? selectedTargetId : currentApp.id;
        const targetId = syncDirection === 'pull' ? currentApp.id : selectedTargetId;

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
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    source_app_id: sourceId,
                    target_app_id: targetId,
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

    const activeChangesCount = Object.values(actions).filter((a) => a !== 'skip').length;

    return (
        <NeoModal
            isOpen={isOpen}
            onClose={onClose}
            title="Sinkronisasi Ruang Kerja & Catatan"
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

                {/* STEP 1: SELECT TARGET & DIRECTION */}
                {step === 'select_target' && (
                    <div className="space-y-4">
                        <div className="p-3 bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs text-neutral-700">
                            Sinkronisasi terisolasi aman khusus untuk akun Anda. Anda bisa membandingkan catatan, menimpa yang sudah berubah, atau menambahkan catatan baru dari/ke duplikat.
                        </div>

                        {isLoadingTargets ? (
                            <div className="p-8 text-center space-y-2 border-2 border-black bg-white">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-black" />
                                <p className="text-xs font-bold text-neutral-600">Memeriksa pasangan ruang kerja...</p>
                            </div>
                        ) : targets.length === 0 ? (
                            <div className="p-6 text-center space-y-3 border-2 border-dashed border-black bg-[#FFFDF8]">
                                <RefreshCw className="w-8 h-8 text-neutral-400 mx-auto" />
                                <p className="text-xs font-bold text-neutral-700">
                                    Belum ada ruang kerja pasangan untuk disinkronkan.
                                </p>
                                <p className="text-[11px] text-neutral-500">
                                    Duplikat ruang kerja ini terlebih dahulu atau gunakan ruang kerja hasil duplikat untuk memulai sinkronisasi.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label className="block text-xs font-heading font-black uppercase text-black">
                                    Pilih Ruang Kerja Pasangan:
                                </label>
                                <div className="space-y-2">
                                    {targets.map((tgt) => (
                                        <label
                                            key={tgt.id}
                                            className={`p-3 border-2 border-black flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                                selectedTargetId === tgt.id
                                                    ? 'bg-[#FFDC58] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                                    : 'bg-white hover:bg-neutral-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <input
                                                    type="radio"
                                                    name="syncTarget"
                                                    value={tgt.id}
                                                    checked={selectedTargetId === tgt.id}
                                                    onChange={() => setSelectedTargetId(tgt.id)}
                                                    className="w-4 h-4 accent-black cursor-pointer"
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-heading font-black text-xs uppercase text-black truncate">
                                                        {tgt.name}
                                                    </p>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 border border-black uppercase ${
                                                        tgt.is_master ? 'bg-indigo-100 text-indigo-900' : 'bg-white text-black'
                                                    }`}>
                                                        {tgt.is_master ? 'Ruang Kerja Induk (Master)' : 'Hasil Duplikat'}
                                                    </span>
                                                </div>
                                            </div>

                                            <span className="text-[10px] font-bold text-neutral-600 shrink-0">
                                                Diperbarui: {tgt.updated_at}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                {/* Sync Direction Picker */}
                                <div className="pt-2">
                                    <label className="block text-xs font-heading font-black uppercase text-black mb-1.5">
                                        Arah Alur Sinkronisasi:
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSyncDirection('pull')}
                                            className={`p-2.5 border-2 border-black text-left cursor-pointer transition-all ${
                                                syncDirection === 'pull'
                                                    ? 'bg-[#A6E3A1] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold'
                                                    : 'bg-white hover:bg-neutral-50'
                                            }`}
                                        >
                                            <p className="text-xs font-heading font-black uppercase text-black flex items-center gap-1.5">
                                                <ArrowLeftRight className="w-3.5 h-3.5 text-black" />
                                                Tarik Pembaruan
                                            </p>
                                            <p className="text-[10px] text-neutral-600 mt-0.5">
                                                Ambil update dari pasangan ke <strong>"{currentApp.name}"</strong>
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSyncDirection('push')}
                                            className={`p-2.5 border-2 border-black text-left cursor-pointer transition-all ${
                                                syncDirection === 'push'
                                                    ? 'bg-[#A6E3A1] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold'
                                                    : 'bg-white hover:bg-neutral-50'
                                            }`}
                                        >
                                            <p className="text-xs font-heading font-black uppercase text-black flex items-center gap-1.5">
                                                <ArrowRight className="w-3.5 h-3.5 text-black" />
                                                Kirim Pembaruan
                                            </p>
                                            <p className="text-[10px] text-neutral-600 mt-0.5">
                                                Kirim catatan dari <strong>"{currentApp.name}"</strong> ke pasangan
                                            </p>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
                            <NeoButton
                                type="button"
                                variant="white"
                                size="sm"
                                onClick={onClose}
                            >
                                Batal
                            </NeoButton>

                            {targets.length > 0 && (
                                <NeoButton
                                    type="button"
                                    variant="yellow"
                                    size="sm"
                                    disabled={!selectedTargetId || isLoadingDiff}
                                    onClick={handleCompareDiff}
                                >
                                    <Sparkles className="w-4 h-4 mr-1.5" />
                                    {isLoadingDiff ? 'Membandingkan...' : 'Bandingkan & Cek Perubahan'}
                                </NeoButton>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2: REVIEW DIFF & CHOOSE MERGE ACTIONS */}
                {step === 'review_diff' && (
                    <div className="space-y-4">
                        {/* Source -> Target Indicator Header */}
                        <div className="p-3 bg-[#F4F0EA] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-2 text-xs flex-wrap">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-bold text-neutral-600 uppercase text-[10px]">Sumber:</span>
                                <span className="font-heading font-black uppercase text-black truncate max-w-[140px]">{sourceAppName}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-black shrink-0" />
                                <span className="font-bold text-neutral-600 uppercase text-[10px]">Tujuan:</span>
                                <span className="font-heading font-black uppercase text-black truncate max-w-[140px]">{targetAppName}</span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep('select_target')}
                                className="text-[10px] font-heading font-black uppercase text-black underline hover:text-indigo-700 cursor-pointer"
                            >
                                Ganti Pasangan
                            </button>
                        </div>

                        {/* Summary Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                            <span className="px-2 py-0.5 bg-[#A6E3A1] text-emerald-950 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                {newCount} Catatan Baru
                            </span>
                            <span className="px-2 py-0.5 bg-[#FFE57F] text-amber-950 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                {modifiedCount} Berubah
                            </span>
                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                {identicalCount} Identik (Sama)
                            </span>
                            {targetOnlyCount > 0 && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-950 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    {targetOnlyCount} Hanya di Target
                                </span>
                            )}
                        </div>

                        {/* Quick Selection Buttons */}
                        <div className="p-2.5 bg-white border-2 border-black flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] font-heading font-black uppercase text-neutral-500">
                                Aksi Cepat:
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => handleSetAllActions('add')}
                                    className="px-2 py-0.5 bg-white hover:bg-neutral-100 border border-black text-[10px] font-bold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                >
                                    Semua Tambah
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetAllActions('overwrite')}
                                    className="px-2 py-0.5 bg-white hover:bg-neutral-100 border border-black text-[10px] font-bold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                >
                                    Semua Timpa
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetAllActions('create_new')}
                                    className="px-2 py-0.5 bg-white hover:bg-neutral-100 border border-black text-[10px] font-bold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                >
                                    Semua Nama Baru
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetAllActions('skip')}
                                    className="px-2 py-0.5 bg-white hover:bg-neutral-100 border border-black text-[10px] font-bold text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                >
                                    Abaikan Semua
                                </button>
                            </div>
                        </div>

                        {/* Notes Diff List */}
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                            {diffItems.length === 0 ? (
                                <div className="p-6 text-center text-xs font-bold text-neutral-500 border-2 border-dashed border-black">
                                    Tidak ada catatan untuk dibandingkan.
                                </div>
                            ) : (
                                diffItems.map((item, idx) => {
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
                                                    <span className={`px-1.5 py-0.2 border border-black text-[9px] font-black uppercase shrink-0 ${
                                                        item.status === 'new'
                                                            ? 'bg-[#A6E3A1] text-emerald-950'
                                                            : (item.status === 'modified'
                                                                ? 'bg-[#FFE57F] text-amber-950'
                                                                : (item.status === 'identical'
                                                                    ? 'bg-neutral-200 text-neutral-800'
                                                                    : 'bg-purple-100 text-purple-950'))
                                                    }`}>
                                                        {item.status === 'new' ? 'Baru' : (item.status === 'modified' ? 'Berubah' : (item.status === 'identical' ? 'Sama' : 'Hanya di Target'))}
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
                                                <div className="flex items-center gap-1 shrink-0">
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
                                                                title="Timpa isi catatan di tujuan dengan versi sumber"
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
                                                        <span><strong className="text-black">Sumber:</strong> {item.source_preview}</span>
                                                    ) : null}
                                                    {item.target_preview && item.source_preview !== item.target_preview ? (
                                                        <span className="block mt-0.5 text-neutral-500"><strong className="text-neutral-700">Tujuan:</strong> {item.target_preview}</span>
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
                                onClick={() => setStep('select_target')}
                                disabled={isApplying}
                            >
                                Kembali
                            </NeoButton>

                            <NeoButton
                                type="button"
                                variant="yellow"
                                size="sm"
                                onClick={handleApplySync}
                                disabled={isApplying || activeChangesCount === 0}
                            >
                                <RefreshCw className={`w-4 h-4 mr-1.5 ${isApplying ? 'animate-spin' : ''}`} />
                                {isApplying ? 'Menerapkan...' : `Terapkan Sinkronisasi (${activeChangesCount} Aksi)`}
                            </NeoButton>
                        </div>
                    </div>
                )}
            </div>
        </NeoModal>
    );
}
