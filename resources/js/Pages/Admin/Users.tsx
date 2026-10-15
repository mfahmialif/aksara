import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AdminUser, User } from '@/types';
import AdminNavbar from '@/Components/AdminNavbar';
import NeoCard from '@/Components/UI/NeoCard';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge, NeoInput, NeoSelect } from '@/Components/UI/NeoInput';
import NeoModal from '@/Components/UI/NeoModal';
import { Users, UserPlus, Shield, Power, CheckCircle, Ban, Mail } from 'lucide-react';

interface UsersPageProps {
    members: (User & { note_apps_count?: number })[];
    admins: AdminUser[];
}

export default function UsersManagement({ members = [], admins = [] }: UsersPageProps) {
    const [createAdminModal, setCreateAdminModal] = useState(false);
    const [adminName, setAdminName] = useState('');
    const [adminUsername, setAdminUsername] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminRole, setAdminRole] = useState('admin');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleToggleMember = (userId: number) => {
        router.post(`/admin/users/${userId}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleCreateAdmin = (e: React.FormEvent) => {
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
                    setCreateAdminModal(false);
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
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            <Head title="Manajemen Pengguna (Admin)" />
            <AdminNavbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-10">
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
                        <UserPlus className="w-4 h-4" />
                        Tambah Admin Baru
                    </NeoButton>
                </div>

                {/* MEMBERS TABLE */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <NeoBadge variant="yellow">Member Reguler ({members.length})</NeoBadge>
                    </div>

                    <div className="border-2 border-black bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-[#FFDC58] border-b-2 border-black uppercase font-heading font-black">
                                    <tr>
                                        <th className="p-3">Nama Member</th>
                                        <th className="p-3">Email Google</th>
                                        <th className="p-3 text-center">Ruang Kerja</th>
                                        <th className="p-3 text-center">Default Pengingat</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-black font-medium">
                                    {members.map((member) => (
                                        <tr key={member.id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="p-3 flex items-center gap-2 font-bold">
                                                {member.avatar ? (
                                                    <img
                                                        src={member.avatar}
                                                        alt={member.name}
                                                        className="w-7 h-7 border border-black bg-amber-100"
                                                    />
                                                ) : (
                                                    <div className="w-7 h-7 bg-[#A388EE] border border-black flex items-center justify-center font-black">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                )}
                                                <span>{member.name}</span>
                                            </td>
                                            <td className="p-3 text-neutral-700">{member.email}</td>
                                            <td className="p-3 text-center font-bold">
                                                {member.note_apps_count || 0}
                                            </td>
                                            <td className="p-3 text-center font-bold">
                                                {member.default_reminder_days} Hari
                                            </td>
                                            <td className="p-3 text-center">
                                                <NeoBadge variant={member.is_active ? 'mint' : 'coral'} className="text-[10px]">
                                                    {member.is_active ? 'Aktif' : 'Nonaktif'}
                                                </NeoBadge>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleMember(member.id)}
                                                    className={`px-3 py-1 border border-black text-xs font-bold uppercase transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 ${
                                                        member.is_active
                                                            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                    }`}
                                                >
                                                    {member.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* ADMINS TABLE */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <NeoBadge variant="coral">Internal Admins ({admins.length})</NeoBadge>
                    </div>

                    <div className="border-2 border-black bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-[#A388EE] border-b-2 border-black uppercase font-heading font-black">
                                    <tr>
                                        <th className="p-3">Nama Admin</th>
                                        <th className="p-3">Username</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Role</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-black font-medium">
                                    {admins.map((adm) => (
                                        <tr key={adm.id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="p-3 font-bold">{adm.name}</td>
                                            <td className="p-3 font-mono">{adm.username}</td>
                                            <td className="p-3 text-neutral-700">{adm.email}</td>
                                            <td className="p-3">
                                                <NeoBadge variant="coral" className="text-[10px]">
                                                    {adm.role}
                                                </NeoBadge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>

            {/* CREATE ADMIN MODAL */}
            <NeoModal
                isOpen={createAdminModal}
                onClose={() => setCreateAdminModal(false)}
                title="Daftarkan Admin Internal"
            >
                <form onSubmit={handleCreateAdmin} className="space-y-4">
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
                        <NeoButton type="button" variant="white" onClick={() => setCreateAdminModal(false)}>
                            Batal
                        </NeoButton>
                        <NeoButton type="submit" variant="coral" disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan Admin'}
                        </NeoButton>
                    </div>
                </form>
            </NeoModal>
        </div>
    );
}
