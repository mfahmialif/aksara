import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import NeoModal from '@/Components/UI/NeoModal';
import NeoButton from '@/Components/UI/NeoButton';
import { MemberUser } from '../types';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteUserModalProps {
    member: MemberUser | null;
    onClose: () => void;
}

export default function DeleteUserModal({ member, onClose }: DeleteUserModalProps) {
    const [deleting, setDeleting] = useState(false);

    if (!member) return null;

    const handleDelete = () => {
        setDeleting(true);
        router.delete(`/admin/users/${member.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleting(false);
                onClose();
            },
            onError: () => {
                setDeleting(false);
            },
        });
    };

    return (
        <NeoModal
            isOpen={true}
            onClose={onClose}
            title="Konfirmasi Hapus Akun Member"
            maxWidth="md"
        >
            <div className="space-y-4">
                <div className="p-4 bg-[#FF6B6B]/20 border-2 border-black flex items-start gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="p-2 bg-[#FF6B6B] border border-black shrink-0">
                        <AlertTriangle className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black font-heading text-black uppercase">
                            Tindakan Ini Bersifat Permanen!
                        </h4>
                        <p className="text-xs text-neutral-800 font-medium mt-1 leading-relaxed">
                            Menghapus akun ini akan menghapus seluruh data ruang kerja (workspace), grup topik, catatan & to-do list, file lampiran di server, serta pengaturan pengingat milik member ini.
                        </p>
                    </div>
                </div>

                <div className="p-3 bg-neutral-50 border-2 border-black text-xs space-y-1">
                    <p className="font-bold text-neutral-600 uppercase text-[10px]">Data Pengguna yang Akan Dihapus:</p>
                    <p className="font-black text-black text-sm">{member.name}</p>
                    <p className="font-mono text-neutral-700">{member.email}</p>
                    <p className="text-neutral-500 text-[11px] font-medium">
                        Memiliki {member.note_apps_count || 0} ruang kerja aplikasi catatan.
                    </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-black">
                    <NeoButton type="button" variant="white" size="sm" onClick={onClose} disabled={deleting}>
                        Batal
                    </NeoButton>
                    <NeoButton
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        {deleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
                    </NeoButton>
                </div>
            </div>
        </NeoModal>
    );
}
