import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import NeoModal from '@/Components/UI/NeoModal';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoInput, NeoSelect, NeoTextarea } from '@/Components/UI/NeoInput';

interface CreateAppModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateAppModal({ isOpen, onClose }: CreateAppModalProps) {
    const [name, setName] = useState('');
    const [colorTheme, setColorTheme] = useState('yellow');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateApp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSubmitting(true);
        setError(null);

        router.post(
            '/app',
            {
                name: name.trim(),
                color_theme: colorTheme,
                description: description.trim() || null,
                is_public: isPublic,
            },
            {
                onSuccess: () => {
                    setName('');
                    setDescription('');
                    onClose();
                    setSubmitting(false);
                },
                onError: (err) => {
                    setError(Object.values(err)[0] as string);
                    setSubmitting(false);
                },
            }
        );
    };

    return (
        <NeoModal
            isOpen={isOpen}
            onClose={onClose}
            title="Tambah Aplikasi Catatan Baru"
        >
            <form onSubmit={handleCreateApp} className="space-y-4">
                {error && (
                    <div className="p-3 bg-[#FF6B6B] border-2 border-black text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {error}
                    </div>
                )}

                <NeoInput
                    label="Nama Ruang Kerja / Aplikasi"
                    placeholder="Contoh: Catatan Tugas Kuliah, Proyek Freelance..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <NeoSelect
                    label="Warna Tema Identitas"
                    value={colorTheme}
                    onChange={(e) => setColorTheme(e.target.value)}
                    options={[
                        { value: 'yellow', label: 'Vibrant Yellow (Standar)' },
                        { value: 'purple', label: 'Neo Purple' },
                        { value: 'mint', label: 'Mint Fresh' },
                        { value: 'coral', label: 'Coral Rose' },
                        { value: 'sky', label: 'Sky Blue' },
                        { value: 'pink', label: 'Pastel Pink' },
                        { value: 'orange', label: 'Warm Orange' },
                    ]}
                />

                <NeoTextarea
                    label="Deskripsi Ruang Kerja (Opsional)"
                    placeholder="Catatan mengenai ruang kerja ini..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                />

                <div className="p-3 bg-neutral-50 border-2 border-black flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="is_public_workspace"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="w-4 h-4 border-2 border-black accent-[#FFDC58]"
                    />
                    <label htmlFor="is_public_workspace" className="text-xs font-bold text-neutral-800 cursor-pointer">
                        Jadikan Ruang Kerja ini Publik (dapat dibaca siapa saja via tautan link)
                    </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t-2 border-black">
                    <NeoButton type="button" variant="white" onClick={onClose}>
                        Batal
                    </NeoButton>
                    <NeoButton type="submit" variant="yellow" disabled={submitting}>
                        {submitting ? 'Menyimpan...' : 'Buat Ruang Kerja'}
                    </NeoButton>
                </div>
            </form>
        </NeoModal>
    );
}
