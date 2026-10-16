import React from 'react';
import { Link } from '@inertiajs/react';
import { User } from '@/types';
import { NeoBadge } from '@/Components/UI/NeoInput';

interface RecentMembersCardProps {
    members: User[];
}

export default function RecentMembersCard({ members = [] }: RecentMembersCardProps) {
    return (
        <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black">
                <h3 className="font-heading font-black text-sm uppercase tracking-wide">
                    Member Terbaru
                </h3>
                <Link href="/admin/users" className="text-xs font-bold text-neutral-700 hover:underline">
                    Kelola Pengguna
                </Link>
            </div>

            {members.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-4">Belum ada member terdaftar.</p>
            ) : (
                <div className="space-y-2">
                    {members.map((m) => (
                        <div
                            key={m.id}
                            className="flex items-center justify-between p-2.5 bg-[#FFFDF8] border border-black text-xs font-medium"
                        >
                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                                <div className="w-7 h-7 bg-[#FFDC58] border border-black flex items-center justify-center font-bold text-xs shrink-0">
                                    {m.name.charAt(0)}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold truncate text-black">{m.name}</p>
                                    <p className="text-[10px] text-neutral-500 truncate">{m.email}</p>
                                </div>
                            </div>
                            <NeoBadge variant={m.is_active ? 'mint' : 'gray'} className="text-[9px]">
                                {m.is_active ? 'Aktif' : 'Nonaktif'}
                            </NeoBadge>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
