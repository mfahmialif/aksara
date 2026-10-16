import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import NeoModal from '@/Components/UI/NeoModal';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoInput, NeoSelect, NeoTextarea } from '@/Components/UI/NeoInput';
import { Check } from 'lucide-react';

const COLOR_THEMES = [
    { value: 'yellow', label: 'Vibrant Yellow (Standar)', hex: '#FFDC58', bgClass: 'bg-[#FFDC58]', emoji: '🟡' },
    { value: 'purple', label: 'Neo Purple', hex: '#A388EE', bgClass: 'bg-[#A388EE]', emoji: '🟣' },
    { value: 'mint', label: 'Mint Fresh', hex: '#7FBC8C', bgClass: 'bg-[#7FBC8C]', emoji: '🟢' },
    { value: 'coral', label: 'Coral Rose', hex: '#FF6B6B', bgClass: 'bg-[#FF6B6B]', emoji: '🔴' },
    { value: 'sky', label: 'Sky Blue', hex: '#69D2E7', bgClass: 'bg-[#69D2E7]', emoji: '🔵' },
    { value: 'pink', label: 'Pastel Pink', hex: '#FF8FAB', bgClass: 'bg-[#FF8FAB]', emoji: '🌸' },
    { value: 'orange', label: 'Warm Orange', hex: '#FFA94D', bgClass: 'bg-[#FFA94D]', emoji: '🟠' },
];

interface CreateAppModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateAppModal({ isOpen, onClose }: CreateAppModalProps) {
    const [name, setName] = useState('');
    const [colorTheme, setColorTheme] = useState('yellow');
    const [description, setDescription] = useState('');
    const [topicLabel, setTopicLabel] = useState('Topik');
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
                topic_label: topicLabel.trim() || 'Topik',
                is_public: isPublic,
            },
            {
                onSuccess: () => {
                    setName('');
                    setDescription('');
                    setTopicLabel('Topik');
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
                                className={`text-[10px] font-heading font-black px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all ${
                                    topicLabel === preset ? 'bg-[#FFDC58] -translate-y-0.5' : 'bg-white hover:bg-neutral-100'
                                }`}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Visual Color Palette Swatches & Select */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold uppercase tracking-wider text-black font-heading">
                        Warna Tema Identitas
                    </label>

                    {/* Interactive Color Swatch Chips */}
                    <div className="flex flex-wrap items-center gap-2 p-2.5 bg-neutral-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {COLOR_THEMES.map((theme) => {
                            const isSelected = colorTheme === theme.value;
                            return (
                                <button
                                    key={theme.value}
                                    type="button"
                                    onClick={() => setColorTheme(theme.value)}
                                    title={theme.label}
                                    className={`
                                        w-8 h-8 rounded-none border-2 border-black transition-all flex items-center justify-center cursor-pointer
                                        ${theme.bgClass}
                                        ${isSelected ? 'scale-110 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ring-2 ring-black' : 'hover:scale-105 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] opacity-85 hover:opacity-100'}
                                    `}
                                >
                                    {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
                                </button>
                            );
                        })}
                    </div>

                    <NeoSelect
                        value={colorTheme}
                        onChange={(e) => setColorTheme(e.target.value)}
                        options={COLOR_THEMES.map((t) => ({
                            value: t.value,
                            label: `${t.emoji} ${t.label}`,
                        }))}
                    />

                    {/* Live Preview Card */}
                    <div className={`p-2.5 border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                        COLOR_THEMES.find((t) => t.value === colorTheme)?.bgClass || 'bg-[#FFDC58]'
                    }`}>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-white px-1.5 py-0.5 border border-black">
                                Pratinjau
                            </span>
                            <span className="text-xs font-black truncate max-w-[200px]">
                                {name.trim() || 'Nama Ruang Kerja'}
                            </span>
                        </div>
                        <span className="text-[11px] font-bold text-neutral-800">
                            {COLOR_THEMES.find((t) => t.value === colorTheme)?.label}
                        </span>
                    </div>
                </div>

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
