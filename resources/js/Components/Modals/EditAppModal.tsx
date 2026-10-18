import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { NoteApp } from '@/types';
import NeoModal from '@/Components/UI/NeoModal';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoInput, NeoTextarea } from '@/Components/UI/NeoInput';
import { Settings, UserCheck, Check, Mail, AlertTriangle, XCircle, Send, Clock, ShieldAlert, Trash2 } from 'lucide-react';
import { getCsrfToken } from '@/utils/csrf';

const COLOR_THEMES = [
    { value: 'yellow', label: 'Vibrant Yellow (Standar)', hex: '#FFDC58', bgClass: 'bg-[#FFDC58]', emoji: '🟡' },
    { value: 'purple', label: 'Neo Purple', hex: '#A388EE', bgClass: 'bg-[#A388EE]', emoji: '🟣' },
    { value: 'mint', label: 'Mint Fresh', hex: '#7FBC8C', bgClass: 'bg-[#7FBC8C]', emoji: '🟢' },
    { value: 'coral', label: 'Coral Rose', hex: '#FF6B6B', bgClass: 'bg-[#FF6B6B]', emoji: '🔴' },
    { value: 'sky', label: 'Sky Blue', hex: '#69D2E7', bgClass: 'bg-[#69D2E7]', emoji: '🔵' },
    { value: 'pink', label: 'Pastel Pink', hex: '#FF8FAB', bgClass: 'bg-[#FF8FAB]', emoji: '🌸' },
    { value: 'orange', label: 'Warm Orange', hex: '#FFA94D', bgClass: 'bg-[#FFA94D]', emoji: '🟠' },
];

interface EditAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    app: NoteApp;
    isOwner: boolean;
    onUpdated?: (updatedApp: NoteApp) => void;
    onDeleted?: (deletedAppId: string) => void;
}

export default function EditAppModal({
    isOpen,
    onClose,
    app,
    isOwner,
    onUpdated,
}: EditAppModalProps) {
    const [activeTab, setActiveTab] = useState<'settings' | 'transfer'>('settings');

    // Settings form state
    const [name, setName] = useState(app.name || '');
    const [colorTheme, setColorTheme] = useState(app.color_theme || 'yellow');
    const [description, setDescription] = useState(app.description || '');
    const [topicLabel, setTopicLabel] = useState(app.topic_label || 'Topik');
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isDeletingApp, setIsDeletingApp] = useState(false);
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

    // Transfer ownership state
    const [transferEmail, setTransferEmail] = useState('');
    const [isSendingTransfer, setIsSendingTransfer] = useState(false);
    const [isCancelingTransfer, setIsCancelingTransfer] = useState(false);
    const [transferError, setTransferError] = useState<string | null>(null);
    const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
    const [pendingTransfer, setPendingTransfer] = useState<{ target_email: string; created_at: string } | null>(null);
    const [isLoadingPending, setIsLoadingPending] = useState(false);

    // Sync state when app prop changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setName(app.name || '');
            setColorTheme(app.color_theme || 'yellow');
            setDescription(app.description || '');
            setTopicLabel(app.topic_label || 'Topik');
            setSettingsError(null);
            setSettingsSuccess(null);
            setTransferError(null);
            setTransferSuccess(null);
            setTransferEmail('');
            setIsDeletingApp(false);

            // Fetch pending transfer if owner
            if (isOwner) {
                checkPendingTransfer();
            }
        }
    }, [isOpen, app.id]);

    const checkPendingTransfer = async () => {
        setIsLoadingPending(true);
        try {
            const res = await fetch(`/app/${app.id}/pending-transfer`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await res.json();
            if (data.pending && data.transfer) {
                setPendingTransfer(data.transfer);
            } else {
                setPendingTransfer(null);
            }
        } catch {
            // Silently ignore check failure
        } finally {
            setIsLoadingPending(false);
        }
    };

    const handleDeleteApp = () => {
        if (!isOwner) return;

        const confirmMsg = `Hapus ruang kerja "${app.name}" secara permanen?\n\nSemua ${topicLabel.toLowerCase()} dan catatan di dalamnya akan terhapus dan tidak dapat dikembalikan!`;
        if (!window.confirm(confirmMsg)) return;

        setIsDeletingApp(true);
        setSettingsError(null);

        router.delete(`/app/${app.id}`, {
            onSuccess: () => {
                onClose();
                if (onDeleted) {
                    onDeleted(app.id);
                }
            },
            onError: () => {
                setIsDeletingApp(false);
                setSettingsError('Terjadi kesalahan saat menghapus ruang kerja.');
            },
        });
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSavingSettings(true);
        setSettingsError(null);
        setSettingsSuccess(null);

        const payload = {
            name: name.trim(),
            color_theme: colorTheme,
            description: description.trim() || null,
            topic_label: topicLabel.trim() || 'Topik',
        };

        try {
            const csrfToken = getCsrfToken();
            const res = await fetch(`/app/${app.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMsg = data.errors ? Object.values(data.errors)[0] : (data.message || 'Gagal menyimpan perubahan.');
                setSettingsError(String(errorMsg));
                setIsSavingSettings(false);
                return;
            }

            setSettingsSuccess(data.message || 'Pengaturan ruang kerja berhasil diperbarui.');
            if (onUpdated && data.app) {
                onUpdated(data.app);
            }

            setTimeout(() => {
                setIsSavingSettings(false);
                onClose();
            }, 600);
        } catch {
            setSettingsError('Terjadi kesalahan jaringan saat memperbarui ruang kerja.');
            setIsSavingSettings(false);
        }
    };

    const handleInitiateTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEmail = transferEmail.trim().toLowerCase();
        if (!trimmedEmail) return;

        if (!confirm(`Apakah Anda yakin ingin memindahkan kepemilikan ruang kerja "${app.name}" ke ${trimmedEmail}?\n\nCalon pemilik akan menerima tautan konfirmasi via email.`)) {
            return;
        }

        setIsSendingTransfer(true);
        setTransferError(null);
        setTransferSuccess(null);

        try {
            const csrfToken = getCsrfToken();
            const res = await fetch(`/app/${app.id}/transfer-ownership`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ email: trimmedEmail }),
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMsg = data.errors ? Object.values(data.errors)[0] : (data.message || 'Gagal mengirim email konfirmasi transfer.');
                setTransferError(String(errorMsg));
                setIsSendingTransfer(false);
                return;
            }

            setTransferSuccess(data.message || `Email konfirmasi telah dikirimkan ke ${trimmedEmail}.`);
            setPendingTransfer(data.pending_transfer || { target_email: trimmedEmail, created_at: new Date().toISOString() });
            setTransferEmail('');
            setIsSendingTransfer(false);
        } catch {
            setTransferError('Terjadi kesalahan jaringan saat memproses pemindahan kepemilikan.');
            setIsSendingTransfer(false);
        }
    };

    const handleCancelTransfer = async () => {
        if (!confirm('Apakah Anda yakin ingin membatalkan permintaan pemindahan kepemilikan ini?')) {
            return;
        }

        setIsCancelingTransfer(true);
        setTransferError(null);
        setTransferSuccess(null);

        try {
            const csrfToken = getCsrfToken();
            const res = await fetch(`/app/${app.id}/transfer-ownership`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const data = await res.json();

            if (!res.ok) {
                setTransferError(data.message || 'Gagal membatalkan pemindahan.');
                setIsCancelingTransfer(false);
                return;
            }

            setPendingTransfer(null);
            setTransferSuccess('Permintaan pemindahan kepemilikan telah berhasil dibatalkan.');
            setIsCancelingTransfer(false);
        } catch {
            setTransferError('Terjadi kesalahan saat membatalkan pemindahan.');
            setIsCancelingTransfer(false);
        }
    };

    return (
        <NeoModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Pengaturan: ${app.name}`}
            maxWidth="lg"
        >
            <div className="space-y-4">
                {/* Neo-Brutalist Navigation Tabs */}
                <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('settings')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-heading font-black text-xs uppercase border-2 border-black transition-all cursor-pointer ${
                            activeTab === 'settings'
                                ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5'
                                : 'bg-white hover:bg-neutral-100 text-neutral-700'
                        }`}
                    >
                        <Settings className="w-3.5 h-3.5 text-black" />
                        <span>Edit Ruang Kerja</span>
                    </button>

                    {isOwner && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('transfer')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-heading font-black text-xs uppercase border-2 border-black transition-all cursor-pointer ${
                                activeTab === 'transfer'
                                    ? 'bg-[#FF8FAB] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5'
                                    : 'bg-white hover:bg-neutral-100 text-neutral-700'
                            }`}
                        >
                            <UserCheck className="w-3.5 h-3.5 text-black" />
                            <span>Pindah Kepemilikan</span>
                            {pendingTransfer && (
                                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse ml-0.5" title="Transfer pending" />
                            )}
                        </button>
                    )}
                </div>

                {/* TAB 1: EDIT WORKSPACE SETTINGS */}
                {activeTab === 'settings' && (
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                        {settingsError && (
                            <div className="p-3 bg-[#FF6B6B] border-2 border-black text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{settingsError}</span>
                            </div>
                        )}

                        {settingsSuccess && (
                            <div className="p-3 bg-[#7FBC8C] border-2 border-black text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                                <Check className="w-4 h-4 shrink-0" />
                                <span>{settingsSuccess}</span>
                            </div>
                        )}

                        <NeoInput
                            label="Nama Ruang Kerja"
                            placeholder="Contoh: Catatan Tugas Kuliah, Proyek Freelance..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        {/* Custom Topic Term */}
                        <div>
                            <NeoInput
                                label="Istilah Pengelompokan / Topik"
                                placeholder="Contoh: Topik, Mata Kuliah, Kategori, Proyek..."
                                value={topicLabel}
                                onChange={(e) => setTopicLabel(e.target.value)}
                                maxLength={50}
                            />
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                <span className="text-[10px] font-bold text-neutral-500 uppercase">Pilihan Cepat:</span>
                                {['Topik', 'Mata Kuliah', 'Kategori', 'Proyek', 'Modul', 'Bab'].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setTopicLabel(preset)}
                                        className={`px-2 py-0.5 text-[10px] font-heading font-bold border border-black uppercase transition-all ${
                                            topicLabel.toLowerCase() === preset.toLowerCase()
                                                ? 'bg-[#FFDC58] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                                : 'bg-white hover:bg-neutral-100 text-neutral-700'
                                        }`}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme Color Picker */}
                        <div>
                            <label className="block text-xs font-black font-heading uppercase text-neutral-900 mb-2">
                                Warna Tema Ruang Kerja
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {COLOR_THEMES.map((theme) => {
                                    const isSelected = colorTheme === theme.value;
                                    return (
                                        <button
                                            key={theme.value}
                                            type="button"
                                            onClick={() => setColorTheme(theme.value)}
                                            className={`p-2.5 border-2 border-black flex items-center gap-2 text-left transition-all cursor-pointer ${theme.bgClass} ${
                                                isSelected
                                                    ? 'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 font-black ring-2 ring-black'
                                                    : 'hover:opacity-90 opacity-75'
                                            }`}
                                        >
                                            <span className="text-base">{theme.emoji}</span>
                                            <span className="text-[11px] font-bold text-black truncate">
                                                {theme.label.split(' ')[0]}
                                            </span>
                                            {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-black stroke-[3]" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <NeoTextarea
                            label="Deskripsi Ruang Kerja (Opsional)"
                            placeholder="Tuliskan tujuan atau keterangan ringkas ruang kerja ini..."
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />

                        {/* Danger Zone: Hapus Ruang Kerja */}
                        {isOwner && (
                            <div className="p-3.5 bg-[#FFF0F0] border-2 border-[#FF6B6B] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2 mt-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-1.5 text-rose-950 font-heading font-black text-xs uppercase">
                                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                            <span>Zona Berbahaya</span>
                                        </div>
                                        <p className="text-[11px] text-rose-800 mt-0.5">
                                            Hapus permanen ruang kerja ini beserta seluruh {topicLabel.toLowerCase()} dan catatannya.
                                        </p>
                                    </div>
                                    <NeoButton
                                        type="button"
                                        variant="coral"
                                        size="sm"
                                        onClick={handleDeleteApp}
                                        disabled={isSavingSettings || isDeletingApp}
                                        className="shrink-0"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                                        <span>{isDeletingApp ? 'Menghapus...' : 'Hapus Ruang Kerja'}</span>
                                    </NeoButton>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-black">
                            <NeoButton
                                type="button"
                                variant="white"
                                size="sm"
                                onClick={onClose}
                                disabled={isSavingSettings || isDeletingApp}
                            >
                                Batal
                            </NeoButton>
                            <NeoButton
                                type="submit"
                                variant="yellow"
                                size="sm"
                                disabled={isSavingSettings || isDeletingApp || !name.trim()}
                            >
                                {isSavingSettings ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </NeoButton>
                        </div>
                    </form>
                )}

                {/* TAB 2: TRANSFER OWNERSHIP (OWNER ONLY) */}
                {activeTab === 'transfer' && isOwner && (
                    <div className="space-y-4">
                        {transferError && (
                            <div className="p-3 bg-[#FF6B6B] border-2 border-black text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{transferError}</span>
                            </div>
                        )}

                        {transferSuccess && (
                            <div className="p-3 bg-[#7FBC8C] border-2 border-black text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                                <Check className="w-4 h-4 shrink-0" />
                                <span>{transferSuccess}</span>
                            </div>
                        )}

                        <div className="p-3.5 bg-[#FFF9DB] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
                                <h4 className="font-heading font-black text-xs uppercase text-amber-950">
                                    Aturan Pemindahan Kepemilikan
                                </h4>
                            </div>
                            <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                                1. Calon pemilik baru akan menerima <strong>email konfirmasi</strong> dengan tautan bertoken aman.<br />
                                2. Jika calon pemilik belum login, mereka akan diarahkan untuk masuk terlebih dahulu.<br />
                                3. Begitu disetujui, hak kendali penuh beralih ke penerima, dan Anda otomatis tetap memiliki akses sebagai <strong>Kolaborator (Editor)</strong>.
                            </p>
                        </div>

                        {/* Ongoing Pending Transfer State */}
                        {pendingTransfer ? (
                            <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-1.5 text-xs font-black text-black uppercase mb-1">
                                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                            <span>Menunggu Konfirmasi Email</span>
                                        </div>
                                        <p className="text-xs text-neutral-700">
                                            Undangan telah dikirimkan ke: <strong className="text-black">{pendingTransfer.target_email}</strong>
                                        </p>
                                        <p className="text-[10px] text-neutral-500 mt-0.5">
                                            Dikirim pada: {new Date(pendingTransfer.created_at).toLocaleString('id-ID')}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleCancelTransfer}
                                        disabled={isCancelingTransfer}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FF6B6B] hover:bg-rose-500 text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[11px] font-heading font-black uppercase transition-all cursor-pointer"
                                        title="Batalkan permintaan transfer"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>{isCancelingTransfer ? 'Membatalkan...' : 'Batalkan'}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleInitiateTransfer} className="space-y-3">
                                <NeoInput
                                    label="Alamat Email Calon Pemilik Baru"
                                    type="email"
                                    placeholder="contoh: kolega@gmail.com"
                                    value={transferEmail}
                                    onChange={(e) => setTransferEmail(e.target.value)}
                                    required
                                />

                                <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
                                    <NeoButton
                                        type="button"
                                        variant="white"
                                        size="sm"
                                        onClick={onClose}
                                        disabled={isSendingTransfer}
                                    >
                                        Tutup
                                    </NeoButton>
                                    <NeoButton
                                        type="submit"
                                        variant="pink"
                                        size="sm"
                                        disabled={isSendingTransfer || !transferEmail.trim()}
                                    >
                                        <Send className="w-3.5 h-3.5 mr-1" />
                                        {isSendingTransfer ? 'Mengirim Email...' : 'Kirim Konfirmasi Pindah Kepemilikan'}
                                    </NeoButton>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </NeoModal>
    );
}
