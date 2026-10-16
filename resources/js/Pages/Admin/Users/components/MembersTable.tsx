import React from 'react';
import { User } from '@/types';
import { NeoBadge } from '@/Components/UI/NeoInput';

interface MembersTableProps {
    members: (User & { note_apps_count?: number })[];
    onToggleStatus: (userId: string) => void;
}

export default function MembersTable({ members = [], onToggleStatus }: MembersTableProps) {
    return (
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
                                                referrerPolicy="no-referrer"
                                                crossOrigin="anonymous"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                                className="w-7 h-7 border border-black bg-amber-100 object-cover"
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
                                            onClick={() => onToggleStatus(member.id)}
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
    );
}
