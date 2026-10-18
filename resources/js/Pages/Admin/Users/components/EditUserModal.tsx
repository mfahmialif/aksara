import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import NeoModal from '@/Components/UI/NeoModal';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoInput, NeoSelect } from '@/Components/UI/NeoInput';
import { MemberUser } from '../types';
import { Save } from 'lucide-react';

interface EditUserModalProps {
    member: MemberUser | null;
    onClose: () => void;
}

export default function EditUserModal({ member, onClose }: EditUserModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isActive, setIsActive] = useState('1');
    const [defaultReminderDays, setDefaultReminderDays] = useState('3');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (member) {
            setName(member.name || '');
            setEmail(member.email || '');
            setIsActive(member.is_active ? '1' : '0');
            setDefaultReminderDays(String(member.default_reminder_days ?? 3));
            setErrors({});
        }
    }, [member]);

    if (!member) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        router.put(
            `/admin/users/${member.id}`,
            {
                name: name.trim(),
                email: email.trim(),
                is_active: isActive === '1',
                default_reminder_days: parseInt(defaultReminderDays, 10) || 0,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitting(false);
                    onClose();
                },
                onError: (errs) => {
                    setErrors(errs);
                    setSubmitting(false);
                },
            }
        );
    };

    return (
        <NeoModal
            isOpen={true}
            onClose={onClose}
            title={`Edit Akun Member: ${member.name}`}
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {Object.keys(errors).length > 0 && (
                    <div className="p-3 bg-[#FF6B6B] border-2 border-black text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {Object.values(errors)[0]}
                    </div>
                )}

                <NeoInput
                    label="Nama Member"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    required
                />

                <NeoInput
                    label="Email Google OAuth"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <NeoSelect
                        label="Status Akun"
                        value={isActive}
                        onChange={(e) => setIsActive(e.target.value)}
                        error={errors.is_active}
                        options={[
                            { value: '1', label: 'Aktif (Dapat Login)' },
                            { value: '0', label: 'Nonaktif (Dibekukan)' },
                        ]}
                    />

                    <NeoInput
                        label="Default Pengingat (Hari)"
                        type="number"
                        min="0"
                        max="30"
                        value={defaultReminderDays}
                        onChange={(e) => setDefaultReminderDays(e.target.value)}
                        error={errors.default_reminder_days}
                        helperText="Hari sebelum tenggat waktu"
                        required
                    />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-black">
                    <NeoButton type="button" variant="white" size="sm" onClick={onClose} disabled={submitting}>
                        Batal
                    </NeoButton>
                    <NeoButton type="submit" variant="yellow" size="sm" disabled={submitting}>
                        <Save className="w-4 h-4 mr-1.5" />
                        {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </NeoButton>
                </div>
            </form>
        </NeoModal>
    );
}
