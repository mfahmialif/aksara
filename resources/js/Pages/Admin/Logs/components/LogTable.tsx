import React from 'react';
import { Link } from '@inertiajs/react';
import { ActivityLog } from '@/types';
import { PaginatedLogs } from '../types';
import { Users, Shield, Cpu, Eye, Clock, Monitor } from 'lucide-react';

interface LogTableProps {
    logs: PaginatedLogs;
    onViewDetail: (log: ActivityLog) => void;
}

export default function LogTable({ logs, onViewDetail }: LogTableProps) {
    const getActionBadgeColor = (act: string) => {
        if (act.includes('CREATE')) return 'bg-emerald-100 text-emerald-800 border-emerald-900';
        if (act.includes('UPDATE')) return 'bg-amber-100 text-amber-800 border-amber-900';
        if (act.includes('DELETE')) return 'bg-rose-100 text-rose-800 border-rose-900';
        if (act.includes('LOGIN')) return 'bg-blue-100 text-blue-800 border-blue-900';
        if (act.includes('REMINDER')) return 'bg-purple-100 text-purple-800 border-purple-900';
        return 'bg-neutral-100 text-neutral-800 border-neutral-900';
    };

    return (
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="bg-[#FFDC58] border-b-2 border-black font-heading font-black uppercase tracking-wider text-black">
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3 w-28">Waktu</th>
                            <th className="p-3 w-36">Pelaku (Actor)</th>
                            <th className="p-3 w-40">Aksi</th>
                            <th className="p-3">Deskripsi Aktivitas</th>
                            <th className="p-3 w-28">IP Address</th>
                            <th className="p-3 w-20 text-center">Detail</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                        {logs.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-neutral-500 font-bold">
                                    Tidak ada catatan log aktivitas yang cocok dengan kriteria pencarian.
                                </td>
                            </tr>
                        ) : (
                            logs.data.map((log, index) => {
                                const actorRole = log.causer_type ? (log.causer_type.includes('Admin') ? 'admin' : 'user') : 'system';
                                const actorName = log.causer?.name || (actorRole === 'system' ? 'Sistem Otomatis' : 'Guest/Anonim');

                                return (
                                    <tr key={log.id} className="hover:bg-amber-50/50 transition-colors">
                                        <td className="p-3 text-center font-mono text-neutral-500 font-bold">
                                            {(logs.current_page - 1) * 20 + index + 1}
                                        </td>
                                        <td className="p-3 font-mono text-neutral-700 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-neutral-400" />
                                                <span>
                                                    {new Date(log.created_at).toLocaleDateString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1.5 font-bold text-black truncate max-w-[140px]" title={actorName}>
                                                {actorRole === 'admin' ? (
                                                    <span className="p-0.5 bg-[#A388EE] border border-black shrink-0">
                                                        <Shield className="w-3 h-3 text-black" />
                                                    </span>
                                                ) : actorRole === 'user' ? (
                                                    <span className="p-0.5 bg-[#FFDC58] border border-black shrink-0">
                                                        <Users className="w-3 h-3 text-black" />
                                                    </span>
                                                ) : (
                                                    <span className="p-0.5 bg-[#7FBC8C] border border-black shrink-0">
                                                        <Cpu className="w-3 h-3 text-black" />
                                                    </span>
                                                )}
                                                <span className="truncate">{actorName}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`inline-block px-2 py-0.5 border text-[10px] font-black font-mono tracking-tight uppercase ${getActionBadgeColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-3 font-medium text-neutral-800">
                                            <p className="line-clamp-1">{log.description}</p>
                                        </td>
                                        <td className="p-3 font-mono text-neutral-600">
                                            <div className="flex items-center gap-1">
                                                <Monitor className="w-3 h-3 text-neutral-400" />
                                                <span>{log.ip_address || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => onViewDetail(log)}
                                                className="p-1.5 bg-white hover:bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                                                title="Lihat Detail Log"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-black" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {logs.last_page > 1 && (
                <div className="p-4 border-t-2 border-black bg-[#FFFDF8] flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-neutral-600 font-mono">
                        Menampilkan {logs.data.length} dari total {logs.total} aktivitas
                    </span>
                    <div className="flex items-center gap-1">
                        {logs.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-2.5 py-1 text-xs font-bold border-2 border-black transition-all ${
                                    link.active
                                        ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                        : !link.url
                                        ? 'bg-neutral-100 text-neutral-400 opacity-60 cursor-not-allowed'
                                        : 'bg-white hover:bg-neutral-100'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
