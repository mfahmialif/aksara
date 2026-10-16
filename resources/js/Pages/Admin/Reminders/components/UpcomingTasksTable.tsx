import React from 'react';
import { Note } from '@/types';
import { NeoBadge } from '@/Components/UI/NeoInput';

interface UpcomingTasksTableProps {
    upcoming: Note[];
}

export default function UpcomingTasksTable({ upcoming = [] }: UpcomingTasksTableProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <NeoBadge variant="coral">Antrean Tugas Mendatang ({upcoming.length})</NeoBadge>
            </div>

            <div className="border-2 border-black bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#69D2E7] border-b-2 border-black uppercase font-heading font-black">
                            <tr>
                                <th className="p-3">Judul Tugas</th>
                                <th className="p-3">Pemilik</th>
                                <th className="p-3">Tenggat Waktu (Deadline)</th>
                                <th className="p-3 text-center">Jadwal Pengingat</th>
                                <th className="p-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-black font-medium">
                            {upcoming.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-neutral-500 italic">
                                        Tidak ada tugas yang sedang menunggu pengiriman pengingat.
                                    </td>
                                </tr>
                            ) : (
                                upcoming.map((task) => (
                                    <tr key={task.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="p-3 font-bold text-black">{task.title}</td>
                                        <td className="p-3 text-neutral-700">
                                            {task.group?.app?.owner?.name} ({task.group?.app?.owner?.email})
                                        </td>
                                        <td className="p-3 text-rose-700 font-bold">
                                            {task.deadline_at && new Date(task.deadline_at).toLocaleString('id-ID')}
                                        </td>
                                        <td className="p-3 text-center font-bold">
                                            {task.reminder_days_before} Hari Sebelumnya
                                        </td>
                                        <td className="p-3 text-center">
                                            <NeoBadge variant="yellow" className="text-[10px]">
                                                Dijadwalkan
                                            </NeoBadge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
