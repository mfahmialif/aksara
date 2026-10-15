import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { SystemSettings } from '@/types';
import AdminNavbar from '@/Components/AdminNavbar';
import NeoCard from '@/Components/UI/NeoCard';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge, NeoInput, NeoTextarea } from '@/Components/UI/NeoInput';
import { Sliders, Save, ShieldAlert, CheckCircle2, AlertOctagon } from 'lucide-react';

interface SettingsProps {
    settings: SystemSettings;
}

export default function Settings({ settings }: SettingsProps) {
    const [maxFileSizeMb, setMaxFileSizeMb] = useState(settings.max_file_size_mb || 10);
    const [maxFilesPerUpload, setMaxFilesPerUpload] = useState(settings.max_files_per_upload || 5);
    const [allowedExtensions, setAllowedExtensions] = useState(
        settings.allowed_extensions || 'jpg,jpeg,png,gif,webp,svg,pdf,doc,docx,xls,xlsx,ppt,pptx,zip,txt,mp4'
    );
    const [blockedExtensions, setBlockedExtensions] = useState(
        settings.blocked_extensions || 'exe,sh,bat,cmd,bin,dll,com,vbs'
    );

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        router.put(
            '/admin/settings',
            {
                max_file_size_mb: maxFileSizeMb,
                max_files_per_upload: maxFilesPerUpload,
                allowed_extensions: allowedExtensions,
                blocked_extensions: blockedExtensions,
            },
            {
                onFinish: () => setSubmitting(false),
                onError: (err) => setError(Object.values(err)[0] as string),
            }
        );
    };

    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            <Head title="Pengaturan Batasan File (Admin)" />
            <AdminNavbar />

            <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
                <div className="pb-4 border-b-2 border-black">
                    <div className="flex items-center gap-2 mb-1">
                        <NeoBadge variant="coral">Kebijakan Dinamis</NeoBadge>
                    </div>
                    <h1 className="text-3xl font-black font-heading uppercase text-black">
                        Batasan File & Keamanan Upload
                    </h1>
                    <p className="text-xs text-neutral-600 font-medium">
                        Perubahan di sini langsung berlaku secara real-time pada validasi form member (frontend) dan server (backend).
                    </p>
                </div>

                <NeoCard color="bg-white" shadowSize="lg" className="p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-[#FF6B6B] border-2 border-black text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Max Size */}
                            <div className="p-4 bg-[#FFFDF8] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1 font-heading">
                                    Ukuran Maksimal Per File (MB)
                                </label>
                                <p className="text-[11px] text-neutral-600 mb-2 font-medium">
                                    Batas kapasitas satu file dokumen/gambar.
                                </p>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={maxFileSizeMb}
                                    onChange={(e) => setMaxFileSizeMb(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 text-lg font-black font-heading bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    required
                                />
                            </div>

                            {/* Max Files per upload */}
                            <div className="p-4 bg-[#FFFDF8] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1 font-heading">
                                    Jumlah File Maksimal Per Upload
                                </label>
                                <p className="text-[11px] text-neutral-600 mb-2 font-medium">
                                    Batas maksimal jumlah file yang diunggah sekaligus.
                                </p>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={maxFilesPerUpload}
                                    onChange={(e) => setMaxFilesPerUpload(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 text-lg font-black font-heading bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    required
                                />
                            </div>
                        </div>

                        {/* Allowed Extensions */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-black uppercase tracking-wider text-black font-heading">
                                Ekstensi Yang Diizinkan (Dipisahkan Koma)
                            </label>
                            <p className="text-[11px] text-neutral-600 font-medium">
                                Format file yang dapat diunggah oleh pengguna pada catatan mereka.
                            </p>
                            <NeoTextarea
                                value={allowedExtensions}
                                onChange={(e) => setAllowedExtensions(e.target.value)}
                                rows={2}
                                required
                            />
                        </div>

                        {/* Blocked Extensions */}
                        <div className="p-4 bg-rose-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
                            <div className="flex items-center gap-1.5 text-rose-800">
                                <AlertOctagon className="w-4 h-4" />
                                <label className="text-xs font-black uppercase tracking-wider font-heading">
                                    Ekstensi Terlarang / Diblokir (Demi Keamanan)
                                </label>
                            </div>
                            <p className="text-[11px] text-neutral-700 font-medium">
                                File dengan ekstensi berikut akan langsung ditolak sistem baik di browser maupun server Laravel.
                            </p>
                            <NeoTextarea
                                value={blockedExtensions}
                                onChange={(e) => setBlockedExtensions(e.target.value)}
                                rows={2}
                                required
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t-2 border-black">
                            <NeoButton type="submit" variant="coral" size="md" disabled={submitting}>
                                <Save className="w-4 h-4" />
                                {submitting ? 'Menyimpan...' : 'Perbarui Kebijakan File'}
                            </NeoButton>
                        </div>
                    </form>
                </NeoCard>
            </main>
        </div>
    );
}
