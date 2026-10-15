import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Note, NoteApp } from '@/types';
import Navbar from '@/Components/Navbar';
import NeoButton from '@/Components/UI/NeoButton';
import NeoCard from '@/Components/UI/NeoCard';
import { NeoBadge, NeoInput, NeoSelect, NeoTextarea } from '@/Components/UI/NeoInput';
import NeoModal from '@/Components/UI/NeoModal';
import DebouncedPrefetchLink from '@/Components/DebouncedPrefetchLink';
import {
    Plus, BookOpen, GraduationCap, Briefcase, FolderGit2,
    Calendar, Users, Globe, Lock, ArrowRight, FileText
} from 'lucide-react';

interface AppIndexProps {
    my_apps: NoteApp[];
    shared_apps: NoteApp[];
    standalone_notes: Note[];
}

export default function AppIndex({
    my_apps = [],
    shared_apps = [],
    standalone_notes = [],
}: AppIndexProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
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
                    setCreateModalOpen(false);
                    setSubmitting(false);
                },
                onError: (err) => {
                    setError(Object.values(err)[0] as string);
                    setSubmitting(false);
                },
            }
        );
    };

    const themeColors: Record<string, { bg: string; badge: 'yellow' | 'purple' | 'mint' | 'coral' | 'sky' | 'white' }> = {
        yellow: { bg: 'bg-[#FFDC58]', badge: 'yellow' },
        purple: { bg: 'bg-[#A388EE]', badge: 'purple' },
        mint: { bg: 'bg-[#7FBC8C]', badge: 'mint' },
        coral: { bg: 'bg-[#FF6B6B]', badge: 'coral' },
        sky: { bg: 'bg-[#69D2E7]', badge: 'sky' },
        pink: { bg: 'bg-[#FF8FAB]', badge: 'coral' },
        orange: { bg: 'bg-[#FFA94D]', badge: 'yellow' },
    };

    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            <Head title="Aplikasi Catatanku" />
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b-2 border-black">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black font-heading uppercase text-black">
                            Ruang Kerja Catatanku
                        </h1>
                        <p className="text-sm text-neutral-600 font-medium">
                            Kelola ruang kerja, mata kuliah, proyek, dan catatan kolaboratif Anda.
                        </p>
                    </div>

                    <NeoButton variant="yellow" size="md" onClick={() => setCreateModalOpen(true)}>
                        <Plus className="w-5 h-5" />
                        Tambah Aplikasi
                    </NeoButton>
                </div>

                {/* SECTION 1: MY APPS */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <NeoBadge variant="yellow">Level 1</NeoBadge>
                        <h2 className="text-xl font-black font-heading uppercase text-black">
                            Aplikasi Catatanku ({my_apps.length})
                        </h2>
                    </div>

                    {my_apps.length === 0 ? (
                        <div className="p-8 border-2 border-black bg-white text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                            <p className="font-heading font-bold text-neutral-700 mb-3">
                                Anda belum memiliki Aplikasi Catatan.
                            </p>
                            <NeoButton variant="yellow" size="sm" onClick={() => setCreateModalOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Buat Aplikasi Pertama
                            </NeoButton>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {my_apps.map((app) => {
                                const theme = themeColors[app.color_theme] || themeColors.yellow;
                                const totalNotes = app.groups?.reduce((acc, g) => acc + (g.notes?.length || 0), 0) || 0;

                                return (
                                    <NeoCard
                                        key={app.id}
                                        color="bg-white"
                                        shadowSize="md"
                                        hoverEffect
                                        className="flex flex-col justify-between overflow-hidden"
                                    >
                                        <div>
                                            {/* Colored Top Header */}
                                            <div className={`${theme.bg} p-4 border-b-2 border-black flex items-center justify-between`}>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                        <BookOpen className="w-5 h-5 text-black" />
                                                    </div>
                                                    <h3 className="font-heading font-black text-lg text-black truncate max-w-[180px]">
                                                        {app.name}
                                                    </h3>
                                                </div>

                                                <span title={app.is_public ? 'Publik' : 'Privat'}>
                                                    {app.is_public ? (
                                                        <Globe className="w-4 h-4 text-black" />
                                                    ) : (
                                                        <Lock className="w-4 h-4 text-black/60" />
                                                    )}
                                                </span>
                                            </div>

                                            <div className="p-4 space-y-3">
                                                <p className="text-xs text-neutral-600 line-clamp-2 font-medium min-h-[32px]">
                                                    {app.description || 'Tidak ada deskripsi ruang kerja.'}
                                                </p>

                                                <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
                                                    <span className="px-2 py-0.5 bg-[#F4F0EA] border border-black">
                                                        {app.groups?.length || 0} Grup
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-[#F4F0EA] border border-black">
                                                        {totalNotes} Catatan
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 pt-0">
                                            <DebouncedPrefetchLink
                                                href={`/app/${app.id}`}
                                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-neutral-100 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-heading font-bold text-xs uppercase transition-all active:translate-x-0.5 active:translate-y-0.5"
                                            >
                                                Buka Workspace
                                                <ArrowRight className="w-4 h-4" />
                                            </DebouncedPrefetchLink>
                                        </div>
                                    </NeoCard>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* SECTION 2: SHARED APPS (App-Level Collaboration) */}
                {shared_apps.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <NeoBadge variant="purple">Kolaborasi Level Aplikasi</NeoBadge>
                            <h2 className="text-xl font-black font-heading uppercase text-black">
                                Aplikasi Dibagikan ke Saya ({shared_apps.length})
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {shared_apps.map((app) => (
                                <NeoCard
                                    key={app.id}
                                    color="bg-white"
                                    shadowSize="md"
                                    hoverEffect
                                    className="flex flex-col justify-between overflow-hidden"
                                >
                                    <div>
                                        <div className="bg-[#A388EE] p-4 border-b-2 border-black flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    <Users className="w-5 h-5 text-black" />
                                                </div>
                                                <h3 className="font-heading font-black text-lg text-black truncate max-w-[180px]">
                                                    {app.name}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-2">
                                            <p className="text-xs font-bold text-neutral-500">
                                                Pemilik: {app.owner?.name} ({app.owner?.email})
                                            </p>
                                            <p className="text-xs text-neutral-700 font-medium">
                                                Akses Edit ke seluruh grup dan catatan di dalam aplikasi ini.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 pt-0">
                                        <DebouncedPrefetchLink
                                            href={`/app/${app.id}`}
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#FFDC58] hover:bg-[#ffe580] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-heading font-bold text-xs uppercase transition-all"
                                        >
                                            Buka Catatan Kolaborasi
                                            <ArrowRight className="w-4 h-4" />
                                        </DebouncedPrefetchLink>
                                    </div>
                                </NeoCard>
                            ))}
                        </div>
                    </section>
                )}

                {/* SECTION 3: STANDALONE SHARED NOTES (Per-Note Granular Collaboration) */}
                {standalone_notes.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <NeoBadge variant="coral">Kolaborasi Level Catatan</NeoBadge>
                            <h2 className="text-xl font-black font-heading uppercase text-black">
                                Catatan Khusus Dibagikan ke Saya ({standalone_notes.length})
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {standalone_notes.map((note) => (
                                <div
                                    key={note.id}
                                    className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
                                >
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between gap-1 mb-2">
                                            <NeoBadge variant={note.category === 'task' ? 'coral' : 'yellow'}>
                                                {note.category === 'task' ? 'Tugas' : 'Catatan'}
                                            </NeoBadge>
                                            <span className="text-[10px] text-neutral-500 font-bold uppercase">
                                                Oleh: {note.group?.app?.owner?.name}
                                            </span>
                                        </div>

                                        <h4 className="font-heading font-black text-base text-black mb-1">
                                            {note.title}
                                        </h4>
                                        <p className="text-xs text-neutral-600 font-medium">
                                            Akses kolaborasi terisolasi hanya pada catatan ini.
                                        </p>
                                    </div>

                                    <DebouncedPrefetchLink
                                        href={`/notes/${note.id}`}
                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#69D2E7] hover:bg-[#85dded] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-heading font-bold text-xs uppercase"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        Buka Catatan Ini
                                    </DebouncedPrefetchLink>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* CREATE APP MODAL */}
            <NeoModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Tambah Aplikasi Catatan Baru"
            >
                <form onSubmit={handleCreateApp} className="space-y-4">
                    <NeoInput
                        label="Nama Aplikasi (Workspace)"
                        placeholder="Contoh: Catatan Tugas Kuliah, Proyek Freelance..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={error || undefined}
                        required
                    />

                    <div>
                        <label className="block text-sm font-bold uppercase tracking-wider text-black mb-1.5 font-heading">
                            Warna Aksen Neobrutalism
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {['yellow', 'purple', 'mint', 'coral', 'sky', 'orange'].map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColorTheme(c)}
                                    className={`h-10 border-2 border-black transition-all cursor-pointer ${
                                        themeColors[c]?.bg || 'bg-neutral-100'
                                    } ${
                                        colorTheme === c
                                            ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] scale-105 ring-2 ring-black'
                                            : 'opacity-70 hover:opacity-100'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <NeoTextarea
                        label="Deskripsi Singkat (Opsional)"
                        placeholder="Catatan mengenai ruang kerja ini..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />

                    <div className="flex items-center gap-2 p-3 bg-[#F4F0EA] border-2 border-black">
                        <input
                            type="checkbox"
                            id="app-is-public"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="w-4 h-4 border-2 border-black cursor-pointer"
                        />
                        <label htmlFor="app-is-public" className="text-xs font-bold cursor-pointer select-none">
                            Jadikan Publik (Dapat dibaca siapa pun dengan tautan berbagi)
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
                        <NeoButton type="button" variant="white" onClick={() => setCreateModalOpen(false)}>
                            Batal
                        </NeoButton>
                        <NeoButton type="submit" variant="yellow" disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Buat Aplikasi'}
                        </NeoButton>
                    </div>
                </form>
            </NeoModal>
        </div>
    );
}
