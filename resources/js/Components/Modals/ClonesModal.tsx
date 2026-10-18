import React, { useState, useEffect } from 'react';
import { NoteApp, ActiveCloneItem } from '@/types';
import NeoModal from '../UI/NeoModal';
import NeoButton from '../UI/NeoButton';
import { GitFork, Users, Calendar, User as UserIcon, Loader2, Sparkles } from 'lucide-react';

interface ClonesModalProps {
    isOpen: boolean;
    onClose: () => void;
    app: NoteApp | null;
}

export default function ClonesModal({
    isOpen,
    onClose,
    app,
}: ClonesModalProps) {
    if (!app) return null;

    const [isLoading, setIsLoading] = useState(false);
    const [totalClones, setTotalClones] = useState<number>(app.clone_count || 0);
    const [activeCount, setActiveCount] = useState<number>(app.active_clones_count || 0);
    const [clones, setClones] = useState<ActiveCloneItem[]>([]);

    useEffect(() => {
        if (!isOpen || !app) return;

        setIsLoading(true);
        fetch(`/app/${app.id}/clones`, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setTotalClones(data.total_clones || 0);
                    setActiveCount(data.active_count || 0);
                    setClones(data.clones || []);
                }
            })
            .catch(() => {
                // Ignore error, keep initial counts
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [isOpen, app?.id]);

    return (
        <NeoModal
            isOpen={isOpen}
            onClose={onClose}
            title="Daftar Pengguna yang Menduplikat"
            maxWidth="lg"
        >
            <div className="space-y-4">
                {/* Stats Header Bar */}
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-[#E0E7FF] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5">
                        <div className="p-1.5 bg-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <Sparkles className="w-4 h-4 text-indigo-700" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-neutral-600 uppercase">Pernah Diduplikat</p>
                            <p className="font-heading font-black text-lg text-black">{totalClones} Kali</p>
                        </div>
                    </div>

                    <div className="p-3 bg-[#D4FF32] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5">
                        <div className="p-1.5 bg-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <Users className="w-4 h-4 text-black" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-neutral-700 uppercase">Masih Aktif</p>
                            <p className="font-heading font-black text-lg text-black">{activeCount} Pengguna</p>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-neutral-600 font-medium">
                    Berikut adalah pengguna yang saat ini masih aktif menyimpan hasil duplikasi dari ruang kerja <strong>"{app.name}"</strong>:
                </p>

                {/* List Container */}
                {isLoading ? (
                    <div className="p-8 text-center space-y-2 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-black" />
                        <p className="text-xs font-bold text-neutral-600">Memuat data duplikat...</p>
                    </div>
                ) : clones.length === 0 ? (
                    <div className="p-8 text-center space-y-2 border-2 border-dashed border-black bg-[#FFFDF8]">
                        <GitFork className="w-8 h-8 text-neutral-400 mx-auto" />
                        <p className="text-xs font-bold text-neutral-600">
                            Belum ada pengguna aktif yang menduplikat ruang kerja ini.
                        </p>
                        <p className="text-[11px] text-neutral-500">
                            Jika sebelumnya ada yang menduplikat lalu menghapusnya, riwayatnya otomatis dibersihkan dari daftar aktif.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                        {clones.map((item) => (
                            <div
                                key={item.id}
                                className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {item.owner.avatar ? (
                                        <img
                                            src={item.owner.avatar}
                                            alt={item.owner.name}
                                            className="w-8 h-8 rounded-full border border-black object-cover shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#FFDC58] border border-black flex items-center justify-center shrink-0">
                                            <UserIcon className="w-4 h-4 text-black" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-heading font-black text-xs uppercase text-black truncate">
                                            {item.owner.name}
                                        </p>
                                        <p className="text-[11px] text-neutral-600 font-bold truncate">
                                            Nama Duplikat: <span className="text-neutral-900">{item.name}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-500 bg-[#F4F0EA] border border-black px-1.5 py-0.5">
                                        <Calendar className="w-3 h-3 text-neutral-700" />
                                        {item.created_at}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end pt-2 border-t-2 border-black">
                    <NeoButton
                        type="button"
                        variant="white"
                        size="sm"
                        onClick={onClose}
                    >
                        Tutup
                    </NeoButton>
                </div>
            </div>
        </NeoModal>
    );
}
