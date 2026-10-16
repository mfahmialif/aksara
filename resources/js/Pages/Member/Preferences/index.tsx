import React from 'react';
import MemberLayout from '@/Layouts/MemberLayout';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { PreferencesProps } from './types';
import PreferencesCard from './components/PreferencesCard';

export default function Preferences({ user }: PreferencesProps) {
    return (
        <MemberLayout title="Pengaturan & Preferensi Member" maxWidth="max-w-3xl">
            <div className="mb-8 pb-4 border-b-2 border-black">
                <div className="flex items-center gap-2 mb-2">
                    <NeoBadge variant="purple">Pengaturan Global</NeoBadge>
                </div>
                <h1 className="text-3xl font-black font-heading uppercase text-black">
                    Profil & Preferensi Pengingat
                </h1>
                <p className="text-sm text-neutral-600 font-medium">
                    Atur nilai bawaan pengingat deadline yang otomatis diterapkan saat Anda membuat tugas baru.
                </p>
            </div>

            <PreferencesCard user={user} />
        </MemberLayout>
    );
}
