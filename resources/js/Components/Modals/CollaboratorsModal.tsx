import React, { useState } from 'react';
import { Collaborator } from '@/types';
import { router } from '@inertiajs/react';
import NeoModal from '../UI/NeoModal';
import { NeoInput } from '../UI/NeoInput';
import NeoButton from '../UI/NeoButton';
import { UserPlus, Trash2, Mail, ShieldCheck } from 'lucide-react';

interface CollaboratorsModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: 'app' | 'note';
    targetId: number;
    title: string;
    collaborators: Collaborator[];
}

export default function CollaboratorsModal({
    isOpen,
    onClose,
    level,
    targetId,
    title,
    collaborators = [],
}: CollaboratorsModalProps) {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setSubmitting(true);
        setError(null);

        const route = level === 'app'
            ? `/app/${targetId}/collaborators`
            : `/notes/${targetId}/collaborators`;

        router.post(route, { email: email.trim(), permission: 'edit' }, {
            onSuccess: () => {
                setEmail('');
                setSubmitting(false);
            },
            onError: (err) => {
                setError(Object.values(err)[0] as string);
                setSubmitting(false);
            },
        });
    };

    const handleRemove = (collabId: number) => {
        if (!confirm('Hapus kolaborator ini?')) return;

        const route = level === 'app'
            ? `/app/${targetId}/collaborators/${collabId}`
            : `/notes/${targetId}/collaborators/${collabId}`;

        router.delete(route);
    };

    return (
        <NeoModal
            isOpen={isOpen}
            onClose={onClose}
            title={level === 'app' ? 'Kolaborator Ruang Kerja' : 'Kolaborator Catatan Ini'}
            maxWidth="md"
        >
            <div className="space-y-4">
                <div className="p-3 bg-[#F4F0EA] border-2 border-black">
                    <p className="text-xs text-neutral-700">
                        {level === 'app' ? (
                            <>
                                Mengundang kolaborator di tingkat <strong>Aplikasi</strong> memberikan akses untuk
                                melihat, menambah, dan mengedit <strong>seluruh grup dan catatan</strong> di dalamnya.
                            </>
                        ) : (
                            <>
                                Kolaborator tingkat <strong>Catatan</strong> hanya dapat mengakses dan mengedit catatan
                                ini saja tanpa melihat grup atau catatan lain di aplikasi induknya.
                            </>
                        )}
                    </p>
                </div>

                {/* Invite Form */}
                <form onSubmit={handleInvite} className="space-y-3">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <NeoInput
                                label="Undang Email Google"
                                type="email"
                                placeholder="nama@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={error || undefined}
                                required
                            />
                        </div>
                        <NeoButton type="submit" variant="yellow" disabled={submitting}>
                            <UserPlus className="w-4 h-4" />
                            {submitting ? '...' : 'Undang'}
                        </NeoButton>
                    </div>
                </form>

                {/* Current Collaborators */}
                <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-black mb-2 font-heading">
                        Kolaborator Aktif ({collaborators.length})
                    </h4>

                    {collaborators.length === 0 ? (
                        <p className="text-xs text-neutral-500 italic py-2">Belum ada kolaborator yang diundang.</p>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {collaborators.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex items-center justify-between p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-8 h-8 bg-[#A388EE] border border-black flex items-center justify-center font-black text-xs shrink-0">
                                            {c.user?.name ? c.user.name.charAt(0).toUpperCase() : <Mail className="w-4 h-4" />}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-bold truncate">
                                                {c.user?.name || c.invited_email}
                                            </p>
                                            <p className="text-[10px] text-neutral-500 truncate flex items-center gap-1 font-medium">
                                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                                Dapat Mengedit
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemove(c.id)}
                                        className="p-1.5 border border-black bg-white hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                        title="Hapus Kolaborator"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </NeoModal>
    );
}
