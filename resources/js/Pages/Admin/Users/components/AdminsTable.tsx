import React from 'react';
import { AdminUser } from '@/types';
import { NeoBadge } from '@/Components/UI/NeoInput';

interface AdminsTableProps {
    admins: AdminUser[];
}

export default function AdminsTable({ admins = [] }: AdminsTableProps) {
    return (
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
    );
}
