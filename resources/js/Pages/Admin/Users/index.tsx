import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { UserPlus, Users as UsersIcon } from 'lucide-react';
import { UsersPageProps, MemberUser } from './types';
import UserStatCards from './components/UserStatCards';
import UserFilters from './components/UserFilters';
import MembersTable from './components/MembersTable';
import AdminsTable from './components/AdminsTable';
import CreateAdminModal from './components/CreateAdminModal';
import MemberDetailModal from './components/MemberDetailModal';
import EditUserModal from './components/EditUserModal';
import DeleteUserModal from './components/DeleteUserModal';

export default function UsersManagement({
    members,
    admins = [],
    stats,
    filters = { search: '', status: 'all', sort: 'latest' },
}: UsersPageProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [sort, setSort] = useState(filters.sort || 'latest');

    const [createAdminModal, setCreateAdminModal] = useState(false);
    const [detailMember, setDetailMember] = useState<MemberUser | null>(null);
    const [editingMember, setEditingMember] = useState<MemberUser | null>(null);
    const [deletingMember, setDeletingMember] = useState<MemberUser | null>(null);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/users',
            {
                search: search.trim() || undefined,
                status: status !== 'all' ? status : undefined,
                sort: sort !== 'latest' ? sort : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleReset = () => {
        setSearch('');
        setStatus('all');
        setSort('latest');
        router.get('/admin/users');
    };

    const handleToggleMember = (userId: string) => {
        router.post(`/admin/users/${userId}/toggle-status`, {}, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Manajemen Pengguna (Admin)" spaceY="space-y-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-black">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <NeoBadge variant="coral">Administrasi Pengguna</NeoBadge>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black font-heading uppercase text-black flex items-center gap-3">
                        <span className="p-2 bg-[#FFDC58] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] inline-flex">
                            <UsersIcon className="w-7 h-7 text-black" />
                        </span>
                        Kelola Member & Administrator
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-600 font-medium mt-1">
                        Pantau akun member Google OAuth, kelola hak akses, serta akun staf internal pengelola sistem.
                    </p>
                </div>

                <NeoButton variant="coral" size="sm" onClick={() => setCreateAdminModal(true)}>
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Tambah Admin Baru
                </NeoButton>
            </div>

            {/* STATS OVERVIEW CARDS */}
            <UserStatCards stats={stats} adminsCount={admins.length} />

            {/* FILTER TOOLBAR */}
            <UserFilters
                search={search}
                setSearch={setSearch}
                status={status}
                setStatus={setStatus}
                sort={sort}
                setSort={setSort}
                onFilter={handleFilter}
                onReset={handleReset}
            />

            {/* MEMBERS TABLE WITH PAGINATION & PREFETCH */}
            <MembersTable
                members={members}
                onViewDetail={setDetailMember}
                onEdit={setEditingMember}
                onDelete={setDeletingMember}
                onToggleStatus={handleToggleMember}
            />

            {/* ADMINS TABLE */}
            <AdminsTable admins={admins} />

            {/* DETAIL MODAL */}
            <MemberDetailModal
                member={detailMember}
                onClose={() => setDetailMember(null)}
                onEdit={(m) => setEditingMember(m)}
            />

            {/* EDIT USER MODAL */}
            <EditUserModal
                member={editingMember}
                onClose={() => setEditingMember(null)}
            />

            {/* DELETE USER CONFIRMATION MODAL */}
            <DeleteUserModal
                member={deletingMember}
                onClose={() => setDeletingMember(null)}
            />

            {/* CREATE ADMIN MODAL */}
            <CreateAdminModal
                isOpen={createAdminModal}
                onClose={() => setCreateAdminModal(false)}
            />
        </AdminLayout>
    );
}
