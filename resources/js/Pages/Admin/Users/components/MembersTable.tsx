import React from 'react';
import DebouncedPrefetchLink from '@/Components/DebouncedPrefetchLink';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { PaginatedMembers, MemberUser } from '../types';
import { Eye, Edit3, Trash2, Power, UserX, Calendar, ShieldCheck } from 'lucide-react';

interface MembersTableProps {
    members: PaginatedMembers;
    onViewDetail: (member: MemberUser) => void;
    onEdit: (member: MemberUser) => void;
    onDelete: (member: MemberUser) => void;
    onToggleStatus: (userId: string) => void;
}

export default function MembersTable({
    members,
    onViewDetail,
    onEdit,
    onDelete,
    onToggleStatus,
}: MembersTableProps) {
    const list = members.data || [];

    return (
        <section className="space-y-4 mb-8">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <NeoBadge variant="yellow" className="text-xs">
                        Member Reguler ({members.total})
                    </NeoBadge>
                    <span className="text-xs text-neutral-500 font-bold hidden sm:inline">
                        Halaman {members.current_page} dari {members.last_page || 1}
                    </span>
                </div>
            </div>

            <div className="border-2 border-black bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#FFDC58] border-b-2 border-black uppercase font-heading font-black tracking-wide text-black">
                            <tr>
                                <th className="p-3 w-12 text-center">#</th>
                                <th className="p-3">Nama Member</th>
                                <th className="p-3">Email Google</th>
                                <th className="p-3 text-center">Ruang Kerja</th>
                                <th className="p-3 text-center">Default Pengingat</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-right w-48">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-neutral-200 font-medium">
                            {list.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-neutral-500 font-bold">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="p-3 bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                <UserX className="w-6 h-6 text-neutral-400" />
                                            </div>
                                            <p className="text-sm font-black text-black uppercase font-heading">
                                                Tidak Ada Data Member Ditemukan
                                            </p>
                                            <p className="text-xs text-neutral-500 max-w-sm">
                                                Tidak ada member yang cocok dengan kata kunci atau filter status yang dipilih.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                list.map((member, index) => {
                                    const serialNumber = (members.current_page - 1) * members.per_page + index + 1;
                                    return (
                                        <tr key={member.id} className="hover:bg-amber-50/40 transition-colors">
                                            <td className="p-3 text-center font-mono text-neutral-500 font-bold">
                                                {serialNumber}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2.5">
                                                    {member.avatar ? (
                                                        <img
                                                            src={member.avatar}
                                                            alt={member.name}
                                                            referrerPolicy="no-referrer"
                                                            crossOrigin="anonymous"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                            className="w-8 h-8 border border-black bg-amber-100 object-cover shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-[#A388EE] border border-black flex items-center justify-center font-black shrink-0 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                            {member.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <button
                                                            type="button"
                                                            onClick={() => onViewDetail(member)}
                                                            className="font-black text-black hover:underline text-left block"
                                                        >
                                                            {member.name}
                                                        </button>
                                                        {member.created_at && (
                                                            <span className="text-[10px] text-neutral-500 font-medium flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(member.created_at).toLocaleDateString('id-ID', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 font-mono text-neutral-700">
                                                {member.email}
                                            </td>
                                            <td className="p-3 text-center font-bold font-mono">
                                                <span className="px-2 py-0.5 bg-neutral-100 border border-black">
                                                    {member.note_apps_count || 0}
                                                </span>
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
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Detail Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => onViewDetail(member)}
                                                        className="p-1.5 bg-white hover:bg-[#FFDC58] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                                                        title="Lihat Detail Profil & Ruang Kerja"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-black" />
                                                    </button>

                                                    {/* Edit Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => onEdit(member)}
                                                        className="p-1.5 bg-white hover:bg-[#A388EE] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                                                        title="Edit Data Member"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5 text-black" />
                                                    </button>

                                                    {/* Toggle Status Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => onToggleStatus(member.id)}
                                                        className={`p-1.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                                                            member.is_active
                                                                ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                        }`}
                                                        title={member.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                                                    >
                                                        <Power className="w-3.5 h-3.5" />
                                                    </button>

                                                    {/* Delete Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => onDelete(member)}
                                                        className="p-1.5 bg-rose-50 hover:bg-[#FF6B6B] text-rose-800 hover:text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                                                        title="Hapus Member Permanen"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Neo-brutalism Pagination with Hover Prefetching */}
                {members.last_page > 1 && (
                    <div className="p-4 border-t-2 border-black bg-[#FFFDF8] flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-bold text-neutral-600 font-mono">
                            Menampilkan {members.from ?? 0} - {members.to ?? 0} dari total {members.total} member
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {members.links.map((link, i) => (
                                <DebouncedPrefetchLink
                                    key={i}
                                    href={link.url || '#'}
                                    prefetch="hover"
                                    className={`px-3 py-1 text-xs font-bold border-2 border-black transition-all ${
                                        link.active
                                            ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                            : !link.url
                                            ? 'bg-neutral-100 text-neutral-400 opacity-60 cursor-not-allowed'
                                            : 'bg-white hover:bg-neutral-100 active:translate-x-0.5 active:translate-y-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
