import React, { useState, useEffect } from 'react';
import NeoModal from '@/Components/UI/NeoModal';
import { NeoInput } from '@/Components/UI/NeoInput';
import NeoButton from '@/Components/UI/NeoButton';
import { NoteGroup } from '@/types';
import { Layers, Check, Trash2 } from 'lucide-react';

export const TOPIC_PRESET_COLORS = [
    { label: 'Kuning', value: '#FFDC58' },
    { label: 'Ungu', value: '#A388EE' },
    { label: 'Hijau Mint', value: '#7FBC8C' },
    { label: 'Merah Koral', value: '#FF6B6B' },
    { label: 'Biru Langit', value: '#69D2E7' },
    { label: 'Pink Neon', value: '#FF8FAB' },
    { label: 'Oranye Aprikot', value: '#FFA94D' },
    { label: 'Cyan Elektrik', value: '#38BDF8' },
    { label: 'Hijau Segar', value: '#4ADE80' },
    { label: 'Fuchsia', value: '#F472B6' },
    { label: 'Abu Slate', value: '#CBD5E1' },
    { label: 'Putih Bersih', value: '#FFFFFF' },
];

export const FOLDER_PRESET_COLORS = TOPIC_PRESET_COLORS;

interface FolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'create' | 'edit';
    initialGroup?: NoteGroup | null;
    topicLabel?: string;
    onSubmit: (name: string, color: string) => void;
    onDelete?: (groupId: string) => void;
}

export default function FolderModal({
    isOpen,
    onClose,
    mode,
    initialGroup,
    topicLabel = 'Topik',
    onSubmit,
    onDelete,
}: FolderModalProps) {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#FFDC58');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialGroup) {
                setName(initialGroup.name || '');
                setColor(initialGroup.color || '#FFDC58');
            } else {
                setName('');
                setColor('#FFDC58');
            }
            setError('');
        }
    }, [isOpen, mode, initialGroup]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError(`Nama ${topicLabel.toLowerCase()} wajib diisi.`);
            return;
        }
        onSubmit(trimmed, color || '#FFDC58');
        onClose();
    };

    const handleDelete = () => {
        if (!initialGroup || !onDelete) return;
        if (confirm(`Hapus ${topicLabel.toLowerCase()} "${initialGroup.name}"? Catatan di dalamnya akan ikut terhapus secara permanen.`)) {
            onDelete(initialGroup.id);
            onClose();
        }
    };

    return (
        <NeoModal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'create' ? `Tambah ${topicLabel} Baru` : `Edit ${topicLabel}`}
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* 1. Topic Name Input */}
                <div>
                    <NeoInput
                        label={`Nama ${topicLabel}`}
                        placeholder="Contoh: Pekerjaan, Ide Proyek, Kuliah, Pribadi..."
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (error) setError('');
                        }}
                        error={error}
                        autoFocus
                        maxLength={80}
                        required
                    />
                </div>

                {/* 2. Color Preset Selection */}
                <div>
                    <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-black mb-2 font-heading">
                        Pilihan Warna {topicLabel}
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {TOPIC_PRESET_COLORS.map((preset) => {
                            const isSelected = color.toUpperCase() === preset.value.toUpperCase();
                            return (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => setColor(preset.value)}
                                    className={`h-9 rounded-none border-2 border-black flex items-center justify-center cursor-pointer transition-all ${
                                        isSelected
                                            ? 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ring-2 ring-black -translate-y-0.5'
                                            : 'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
                                    }`}
                                    style={{ backgroundColor: preset.value }}
                                    title={preset.label}
                                >
                                    {isSelected && (
                                        <Check className="w-4 h-4 text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Custom Color Picker & Hex Code */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5 font-heading">
                        Atau Pilih Warna Kustom
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="relative shrink-0">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-10 h-10 border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white p-0.5"
                                title="Klik untuk membuka palet warna bebas"
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                placeholder="#FFDC58"
                                maxLength={9}
                                className="w-full px-3 py-2 bg-white text-black font-mono font-bold text-xs sm:text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Live Badge Preview */}
                <div className="p-3 bg-[#F4F0EA] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-2">
                    <span className="text-[11px] font-heading font-black uppercase text-neutral-600 tracking-wide shrink-0">
                        Pratinjau Badge:
                    </span>
                    <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-heading font-black uppercase text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] truncate max-w-[200px]"
                        style={{ backgroundColor: color || '#FFDC58' }}
                    >
                        <Layers className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{name.trim() || `Nama ${topicLabel}`}</span>
                    </span>
                </div>

                {/* 5. Footer Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2">
                    {mode === 'edit' && onDelete && initialGroup ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-[#FF6B6B] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 font-heading font-black text-xs uppercase text-black transition-all cursor-pointer"
                            title={`Hapus ${topicLabel.toLowerCase()} ini`}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Hapus</span>
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center gap-2">
                        <NeoButton
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={onClose}
                        >
                            Batal
                        </NeoButton>
                        <NeoButton
                            type="submit"
                            variant="primary"
                            size="sm"
                        >
                            {mode === 'create' ? `Buat ${topicLabel}` : 'Simpan'}
                        </NeoButton>
                    </div>
                </div>
            </form>
        </NeoModal>
    );
}
