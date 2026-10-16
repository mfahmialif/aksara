import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { SettingsProps } from './types';
import FileSettingsCard from './components/FileSettingsCard';

export default function Settings({ settings }: SettingsProps) {
    return (
        <AdminLayout title="Pengaturan Batasan File (Admin)" maxWidth="max-w-4xl" spaceY="space-y-6">
            <div className="pb-4 border-b-2 border-black">
                <div className="flex items-center gap-2 mb-1">
                    <NeoBadge variant="coral">Kebijakan Dinamis</NeoBadge>
                </div>
                <h1 className="text-3xl font-black font-heading uppercase text-black">
                    Batasan File & Keamanan Upload
                </h1>
                <p className="text-xs text-neutral-600 font-medium">
                    Perubahan di sini langsung berlaku secara real-time pada validasi form member (frontend) dan server (backend).
                </p>
            </div>

            <FileSettingsCard settings={settings} />
        </AdminLayout>
    );
}
