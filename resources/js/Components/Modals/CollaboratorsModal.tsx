import React, { useState, useEffect } from 'react';
import { Collaborator } from '@/types';
import { router } from '@inertiajs/react';
import NeoModal from '../UI/NeoModal';
import { NeoInput } from '../UI/NeoInput';
import NeoButton from '../UI/NeoButton';
import { UserPlus, Trash2, Mail, ShieldCheck, Lock } from 'lucide-react';

export interface CollaboratorWithOrigin extends Collaborator {
    scope?: 'app' | 'group' | 'note';
    origin_label?: string;
    can_delete?: boolean;
}

interface CollaboratorsModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: 'app' | 'group' | 'note';
    targetId: string;
    title: string;
    collaborators: CollaboratorWithOrigin[];
}

export default function CollaboratorsModal({
    isOpen,
    onClose,
    level,
    targetId,
    title,
    collaborators: initialCollaborators = [],
}: CollaboratorsModalProps) {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeCollabs, setActiveCollabs] = useState<CollaboratorWithOrigin[]>(initialCollaborators);
    const [loadingList, setLoadingList] = useState(false);

    const fetchCollaborators = async () => {
        if (!targetId || !isOpen) return;
        setLoadingList(true);
        try {
            const res = await fetch(`/collaborators/${level}/${targetId}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.collaborators) {
                    setActiveCollabs(data.collaborators);
                }
            }
        } catch {
            // Keep existing activeCollabs on fetch failure
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setActiveCollabs(initialCollaborators);
            fetchCollaborators();
        }
    }, [isOpen, targetId, level]);

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setSubmitting(true);
        setError(null);

        const route =
            level === 'app'
                ? `/app/${targetId}/collaborators`
                : level === 'group'
                ? `/groups/${targetId}/collaborators`
                : `/notes/${targetId}/collaborators`;

        router.post(
            route,
            { email: email.trim(), permission: 'edit' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEmail('');
                    setSubmitting(false);
                    fetchCollaborators();
                },
                onError: (err) => {
                    setError(Object.values(err)[0] as string);
                    setSubmitting(false);
                },
            }
        );
    };

    const handleRemove = (collabId: string) => {
        if (!confirm('Hapus kolaborator ini?')) return;

        const route =
            level === 'app'
                ? `/app/${targetId}/collaborators/${collabId}`
                : level === 'group'
                ? `/groups/${targetId}/collaborators/${collabId}`
                : `/notes/${targetId}/collaborators/${collabId}`;

        router.delete(route, {
            preserveScroll: true,
            onSuccess: () => {
                fetchCollaborators();
            },
        });
    };

    const modalTitle =
        level === 'app'
            ? 'Kolaborator Ruang Kerja'
            : level === 'group'
            ? `Kolaborator Folder (${title})`
            : `Kolaborator Catatan (${title})`;

    return (
        <NeoModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="md">
            <div className="space-y-4">
                <div className="p-3 bg-[#F4F0EA] border-2 border-black">
                    <p className="text-xs text-neutral-700 leading-relaxed">
                        {level === 'app' ? (
                            <>
                                Mengundang kolaborator di tingkat <strong>Ruang Kerja</strong> memberikan akses penuh untuk
                                melihat, menambah, dan mengedit <strong>seluruh folder dan catatan</strong> di dalamnya.
                            </>
                        ) : level === 'group' ? (
                            <>
                                Kolaborator tingkat <strong>Folder</strong> memiliki akses penuh untuk melihat, menambah, dan mengedit
                                <strong> seluruh catatan di dalam folder ini saja</strong>.
                            </>
                        ) : (
                            <>
                                Kolaborator tingkat <strong>Catatan</strong> memiliki akses penuh khusus pada catatan ini saja
                                secara mandiri tanpa melihat folder atau catatan lain di ruang kerja induknya.
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
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-black font-heading">
                            Kolaborator Aktif ({activeCollabs.length})
                        </h4>
                        {loadingList && <span className="text-[10px] text-neutral-500 font-bold">Memperbarui...</span>}
                    </div>

                    {activeCollabs.length === 0 ? (
                        <p className="text-xs text-neutral-500 italic py-2">Belum ada kolaborator yang diundang.</p>
                    ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {activeCollabs.map((c) => {
                                const scope = c.scope || level;
                                const isDirect = c.can_delete !== false;

                                return (
                                    <div
                                        key={c.id || c.invited_email}
                                        className="flex items-center justify-between p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                            <div className="w-8 h-8 bg-[#A388EE] border border-black flex items-center justify-center font-black text-xs shrink-0">
                                                {c.user?.name ? (
                                                    c.user.name.charAt(0).toUpperCase()
                                                ) : (
                                                    <Mail className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold truncate text-black">
                                                    {c.user?.name || c.invited_email}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    <span
                                                        className={`inline-flex items-center px-1.5 py-0.2 text-[9px] font-black uppercase border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                                                            scope === 'app'
                                                                ? 'bg-[#A388EE] text-white'
                                                                : scope === 'group'
                                                                ? 'bg-[#FFDC58] text-black'
                                                                : 'bg-[#69D2E7] text-black'
                                                        }`}
                                                    >
                                                        {c.origin_label ||
                                                            (scope === 'app'
                                                                ? 'Akses Ruang Kerja'
                                                                : scope === 'group'
                                                                ? 'Akses Folder Ini'
                                                                : 'Akses Catatan Ini')}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-600 flex items-center gap-0.5 font-bold">
                                                        <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
                                                        Akses Penuh
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {isDirect ? (
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(c.id)}
                                                className="p-1.5 border border-black bg-white hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                                title="Hapus Kolaborator"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        ) : (
                                            <div
                                                className="p-1.5 text-neutral-400 flex items-center"
                                                title={`Akses ini diwarisi dari ${
                                                    scope === 'app' ? 'Ruang Kerja' : 'Folder'
                                                }. Dikelola di tingkat ${scope === 'app' ? 'Ruang Kerja' : 'Folder'}.`}
                                            >
                                                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </NeoModal>
    );
}
