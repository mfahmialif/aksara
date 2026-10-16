import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ActivityLog } from '@/types';
import AdminNavbar from '@/Components/AdminNavbar';
import NeoButton from '@/Components/UI/NeoButton';
import NeoCard from '@/Components/UI/NeoCard';
import { NeoBadge, NeoInput, NeoSelect } from '@/Components/UI/NeoInput';
import NeoModal from '@/Components/UI/NeoModal';
import {
    ClipboardList, Users, Shield, Cpu, Search, RotateCcw,
    Trash2, Globe, Monitor, Info, CheckCircle2, Clock, Eye
} from 'lucide-react';

interface PaginatedLogs {
    data: ActivityLog[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface LogsProps {
    logs: PaginatedLogs;
    stats: {
        total_logs: number;
        member_logs: number;
        admin_logs: number;
        system_logs: number;
    };
    filters: {
        search: string;
        role: string;
        action: string;
    };
}

export default function Logs({ logs, stats, filters }: LogsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || 'all');
    const [action, setAction] = useState(filters.action || 'all');
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/logs', {
            search: search.trim() || undefined,
            role: role !== 'all' ? role : undefined,
            action: action !== 'all' ? action : undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setRole('all');
        setAction('all');
        router.get('/admin/logs');
    };

    const handleClearLogs = () => {
        if (confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh riwayat log aktivitas sistem? Tindakan ini tidak dapat dibatalkan.')) {
            router.delete('/admin/logs/clear');
        }
    };

    const getActionBadgeColor = (act: string) => {
        if (act.includes('CREATE')) return 'bg-emerald-100 text-emerald-800 border-emerald-900';
        if (act.includes('UPDATE')) return 'bg-amber-100 text-amber-800 border-amber-900';
        if (act.includes('DELETE')) return 'bg-rose-100 text-rose-800 border-rose-900';
        if (act.includes('LOGIN')) return 'bg-blue-100 text-blue-800 border-blue-900';
        if (act.includes('REMINDER')) return 'bg-purple-100 text-purple-800 border-purple-900';
        return 'bg-neutral-100 text-neutral-800 border-neutral-900';
    };

    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            <Head title="Log Aktivitas Pro - Admin" />
            <AdminNavbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:py-8 flex-1 w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b-2 border-black">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <NeoBadge variant="purple" className="text-xs">
                                Audit Trail Pro
                            </NeoBadge>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black font-heading uppercase text-black flex items-center gap-3">
                            <span className="p-2 bg-[#FF8FAB] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] inline-flex">
                                <ClipboardList className="w-7 h-7 text-black" />
                            </span>
                            Log Aktivitas Sistem
                        </h1>
                        <p className="text-sm text-neutral-600 font-medium mt-1">
                            Pantau seluruh aktivitas real-time dari Member, Admin, serta cron pengingat sistem.
                        </p>
                    </div>

                    {stats.total_logs > 0 && (
                        <NeoButton
                            variant="danger"
                            size="sm"
                            onClick={handleClearLogs}
                            className="w-full sm:w-auto"
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Bersihkan Log Lama
                        </NeoButton>
                    )}
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <NeoCard color="bg-white" className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
                            <ClipboardList className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase text-neutral-500 font-heading">Total Aktivitas</p>
                            <p className="text-2xl font-black font-heading text-black">{stats.total_logs}</p>
                        </div>
                    </NeoCard>

                    <NeoCard color="bg-white" className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#7FBC8C] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase text-neutral-500 font-heading">Aksi Member</p>
                            <p className="text-2xl font-black font-heading text-black">{stats.member_logs}</p>
                        </div>
                    </NeoCard>

                    <NeoCard color="bg-white" className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FF6B6B] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase text-neutral-500 font-heading">Aksi Admin</p>
                            <p className="text-2xl font-black font-heading text-black">{stats.admin_logs}</p>
                        </div>
                    </NeoCard>

                    <NeoCard color="bg-white" className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#A388EE] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
                            <Cpu className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase text-neutral-500 font-heading">Aksi Sistem</p>
                            <p className="text-2xl font-black font-heading text-black">{stats.system_logs}</p>
                        </div>
                    </NeoCard>
                </div>

                {/* Filter Toolbar */}
                <NeoCard color="bg-white" className="p-5 mb-8">
                    <form onSubmit={handleFilter} className="flex flex-col md:flex-row items-end gap-3">
                        <div className="flex-1 w-full">
                            <NeoInput
                                label="Cari Deskripsi / Pengguna / IP"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Ketik kata kunci pencarian..."
                            />
                        </div>

                        <div className="w-full md:w-44">
                            <NeoSelect
                                label="Peran Pelaku"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                options={[
                                    { value: 'all', label: 'Semua Peran' },
                                    { value: 'member', label: 'Member' },
                                    { value: 'admin', label: 'Admin' },
                                    { value: 'system', label: 'Sistem Cron' },
                                ]}
                            />
                        </div>

                        <div className="w-full md:w-48">
                            <NeoSelect
                                label="Kelompok Aksi"
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                                options={[
                                    { value: 'all', label: 'Semua Aksi' },
                                    { value: 'LOGIN', label: 'Autentikasi (LOGIN)' },
                                    { value: 'WORKSPACE', label: 'Ruang Kerja' },
                                    { value: 'NOTE', label: 'Catatan' },
                                    { value: 'ATTACHMENT', label: 'Lampiran File' },
                                    { value: 'COLLABORATOR', label: 'Kolaborasi' },
                                    { value: 'SETTINGS', label: 'Pengaturan Sistem' },
                                    { value: 'REMINDER', label: 'Pengingat Deadline' },
                                ]}
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <NeoButton type="submit" variant="yellow" size="md" className="flex-1 md:flex-none">
                                <Search className="w-4 h-4 mr-1" />
                                Cari
                            </NeoButton>
                            <NeoButton type="button" variant="white" size="md" onClick={handleReset}>
                                <RotateCcw className="w-4 h-4" />
                            </NeoButton>
                        </div>
                    </form>
                </NeoCard>

                {/* Table Data */}
                <div className="bg-white border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-black bg-[#F4F0EA]">
                                    <th className="p-3.5 text-xs font-black uppercase tracking-wider text-black font-heading">Waktu</th>
                                    <th className="p-3.5 text-xs font-black uppercase tracking-wider text-black font-heading">Pelaku</th>
                                    <th className="p-3.5 text-xs font-black uppercase tracking-wider text-black font-heading">Tipe Aksi</th>
                                    <th className="p-3.5 text-xs font-black uppercase tracking-wider text-black font-heading">Deskripsi Aktivitas</th>
                                    <th className="p-3.5 text-xs font-black uppercase tracking-wider text-black font-heading">IP & Device</th>
                                    <th className="p-3.5 text-xs font-black uppercase tracking-wider text-black font-heading text-center">Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-black">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-sm font-bold text-neutral-500">
                                            Tidak ada riwayat log aktivitas yang cocok dengan filter.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-amber-50/50 transition-colors">
                                            {/* Timestamp */}
                                            <td className="p-3.5 text-xs font-medium text-neutral-600 whitespace-nowrap">
                                                <div className="font-bold text-black">
                                                    {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </div>
                                                <div className="text-[11px] text-neutral-500">
                                                    {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>

                                            {/* Causer / Actor */}
                                            <td className="p-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-heading font-black text-xs text-black">
                                                        {log.causer_name}
                                                    </span>
                                                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 border border-black ${
                                                        log.causer_role === 'admin' ? 'bg-[#FF6B6B] text-white' :
                                                        log.causer_role === 'member' ? 'bg-[#7FBC8C] text-black' :
                                                        'bg-[#A388EE] text-black'
                                                    }`}>
                                                        {log.causer_role}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Action Type */}
                                            <td className="p-3.5 whitespace-nowrap">
                                                <span className={`inline-block text-[11px] font-black uppercase tracking-wider px-2 py-0.5 border ${getActionBadgeColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>

                                            {/* Description */}
                                            <td className="p-3.5 text-xs font-bold text-neutral-800 leading-snug max-w-md">
                                                {log.description}
                                            </td>

                                            {/* IP & Device */}
                                            <td className="p-3.5 text-[11px] text-neutral-600 whitespace-nowrap">
                                                {log.ip_address ? (
                                                    <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-black">
                                                        <Globe className="w-3 h-3 text-neutral-500" />
                                                        {log.ip_address}
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-400">Internal</span>
                                                )}
                                                {log.user_agent && (
                                                    <div className="text-[10px] text-neutral-500 max-w-[150px] truncate" title={log.user_agent}>
                                                        {log.user_agent}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Detail Button */}
                                            <td className="p-3.5 text-center whitespace-nowrap">
                                                {log.properties ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedLog(log)}
                                                        className="px-2 py-1 bg-white hover:bg-[#FFDC58] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                                                        title="Lihat payload data"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        JSON
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] text-neutral-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {logs.links && logs.links.length > 3 && (
                    <div className="flex justify-center gap-1.5 mt-8">
                        {logs.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-3 py-1.5 text-xs font-heading font-black border-2 border-black transition-all ${
                                    link.active
                                        ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                        : link.url
                                        ? 'bg-white hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-300'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                {/* Inspect Modal */}
                <NeoModal
                    isOpen={selectedLog !== null}
                    onClose={() => setSelectedLog(null)}
                    title={`Detail Log Aktivitas #${selectedLog?.id}`}
                    maxWidth="max-w-2xl"
                >
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="p-3 bg-[#FFFDF8] border-2 border-black text-xs space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="font-bold text-neutral-600">Aksi:</span>
                                    <span className="font-black">{selectedLog.action}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold text-neutral-600">Pelaku:</span>
                                    <span className="font-bold">{selectedLog.causer_name} ({selectedLog.causer_role})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold text-neutral-600">Waktu:</span>
                                    <span className="font-medium">{new Date(selectedLog.created_at).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold text-neutral-600">IP Address:</span>
                                    <span className="font-mono">{selectedLog.ip_address || 'Internal'}</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-black uppercase text-black font-heading mb-1.5">
                                    Payload Properti Data (JSON):
                                </h4>
                                <pre className="p-3.5 bg-neutral-900 text-emerald-400 border-2 border-black text-xs font-mono overflow-x-auto max-h-60 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {JSON.stringify(selectedLog.properties, null, 2)}
                                </pre>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <NeoButton variant="white" onClick={() => setSelectedLog(null)}>
                                    Tutup
                                </NeoButton>
                            </div>
                        </div>
                    )}
                </NeoModal>
            </main>
        </div>
    );
}
