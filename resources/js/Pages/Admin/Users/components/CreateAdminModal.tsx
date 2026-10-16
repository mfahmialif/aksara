import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import NeoModal from '@/Components/UI/NeoModal';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoInput, NeoSelect } from '@/Components/UI/NeoInput';

interface CreateAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateAdminModal({ isOpen, onClose }: CreateAdminModalProps) {
    const [adminName, setAdminName] = useState('');
    const [adminUsername, setAdminUsername] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminRole, setAdminRole] = useState('admin');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        router.post(
            '/admin/admins',
            {
                name: adminName,
                username: adminUsername,
                email: adminEmail,
                password: adminPassword,
                role: adminRole,
            },
            {
                onSuccess: () => {
                    onClose();
                    setAdminName('');
                    setAdminUsername('');
                    setAdminEmail('');
                    setAdminPassword('');
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
            title="Daftarkan Admin Internal"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-[#FF6B6B] border-2 border-black text-xs font-bold text-black">
                        {error}
                    </div>
                )}

                <NeoInput
                    label="Nama Lengkap"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                />

                <NeoInput
                    label="Username"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                />

                <NeoInput
                    label="Email"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                />

                <NeoInput
                    label="Password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                />

                <NeoSelect
                    label="Hak Akses / Role"
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value)}
                >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                </NeoSelect>

                <div className="flex justify-end gap-2 pt-3 border-t-2 border-black">
                    <NeoButton type="button" variant="white" onClick={onClose}>
                        Batal
                    </NeoButton>
                    <NeoButton type="submit" variant="coral" disabled={submitting}>
                        {submitting ? 'Menyimpan...' : 'Simpan Admin'}
                    </NeoButton>
                </div>
            </form>
        </NeoModal>
    );
}
