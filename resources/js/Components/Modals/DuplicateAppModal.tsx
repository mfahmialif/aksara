import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { NoteApp } from '@/types';
import NeoModal from '../UI/NeoModal';
import { NeoInput } from '../UI/NeoInput';
import NeoButton from '../UI/NeoButton';
import { Copy, Sparkles, Check, AlertCircle } from 'lucide-react';
import { getCsrfToken } from '@/utils/csrf';

interface DuplicateAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    app: NoteApp | null;
    onSuccess?: (newApp: NoteApp) => void;
}

export default function DuplicateAppModal({
    isOpen,
    onClose,
    app,
    onSuccess,
}: DuplicateAppModalProps) {
    if (!app) return null;

    const [name, setName] = useState(`${app.name} - Duplikat`);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDuplicate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Nama ruang kerja hasil duplikat tidak boleh kosong.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const csrfToken = getCsrfToken();
            const res = await fetch(`/app/${app.id}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    name: name.trim(),
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                onClose();
                if (onSuccess && data.app) {
                    onSuccess(data.app);
                } else if (data.redirect) {
                    router.visit(data.redirect);
                } else {
                    router.reload();
                }
            } else {
                setError(data.message || 'Gagal menduplikat ruang kerja.');
            }
        } catch {
            setError('Terjadi kesalahan jaringan saat menduplikat.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalNotes = app.groups?.reduce((acc, g) => acc + (g.notes?.length || 0), 0) || 0;

    return (
        <NeoModal
            isOpen={isOpen}
            onClose={onClose}
            title="Duplikat Ruang Kerja"
            maxWidth="md"
        >
            <form onSubmit={handleDuplicate} className="space-y-4">
                <div className="p-3 bg-[#FFF3D6] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-neutral-800 space-y-1">
                        <p className="font-bold text-black">
                            Menduplikasi "{app.name}" ke akun Anda
                        </p>
                        <p className="text-neutral-700">
                            Semua topik/mata kuliah ({app.groups?.length || 0}) beserta seluruh isi catatan ({totalNotes} catatan), checklist, sketsa, dan lampiran akan diduplikat sebagai ruang kerja independen milik Anda.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="p-2.5 bg-rose-100 border-2 border-black text-rose-800 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{error}</span>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-heading font-black uppercase text-black mb-1.5">
                        Nama Ruang Kerja Baru:
                    </label>
                    <NeoInput
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError(null);
                        }}
                        placeholder="Contoh: MMPI ONLINE - PUNYAKU"
                        required
                        autoFocus
                    />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
                    <NeoButton
                        type="button"
                        variant="white"
                        size="sm"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Batal
                    </NeoButton>
                    <NeoButton
                        type="submit"
                        variant="yellow"
                        size="sm"
                        disabled={isSubmitting}
                    >
                        <Copy className="w-4 h-4 mr-1.5" />
                        {isSubmitting ? 'Menduplikasi...' : 'Duplikat Sekarang'}
                    </NeoButton>
                </div>
            </form>
        </NeoModal>
    );
}
