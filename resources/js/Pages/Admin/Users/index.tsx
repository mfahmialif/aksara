import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { UserPlus } from 'lucide-react';
import { UsersPageProps } from './types';
import MembersTable from './components/MembersTable';
import AdminsTable from './components/AdminsTable';
import CreateAdminModal from './components/CreateAdminModal';

export default function UsersManagement({ members = [], admins = [] }: UsersPageProps) {
    const [createAdminModal, setCreateAdminModal] = useState(false);

    const handleToggleMember = (userId: string) => {
        router.post(`/admin/users/${userId}/toggle-status`, {}, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Manajemen Pengguna (Admin)">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <NeoBadge variant="coral">Administrasi Pengguna</NeoBadge>
                    </div>
                    <h1 className="text-3xl font-black font-heading uppercase text-black">
                        Kelola Member & Administrator
                    </h1>
                    <p className="text-xs text-neutral-600 font-medium">
                        Pantau akun member Google OAuth serta akun staf internal pengelola sistem.
                    </p>
                </div>

                <NeoButton variant="coral" size="sm" onClick={() => setCreateAdminModal(true)}>
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Tambah Admin Baru
                </NeoButton>
            </div>

            {/* MEMBERS TABLE */}
            <MembersTable members={members} onToggleStatus={handleToggleMember} />

            {/* ADMINS TABLE */}
            <AdminsTable admins={admins} />

            {/* CREATE ADMIN MODAL */}
            <CreateAdminModal
                isOpen={createAdminModal}
                onClose={() => setCreateAdminModal(false)}
            />
        </AdminLayout>
    );
}
