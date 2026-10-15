import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { User } from '@/types';
import AdminNavbar from '@/Components/AdminNavbar';
import NeoCard from '@/Components/UI/NeoCard';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import {
    Users, BookOpen, HardDrive, Bell, CheckCircle2,
    Clock, Sliders, ExternalLink, ArrowRight, Shield
} from 'lucide-react';

interface Metrics {
    total_members: number;
    active_members: number;
    total_apps: number;
    total_notes: number;
    total_tasks: number;
    storage_mb: number;
    total_reminders_sent: number;
    pending_reminders: number;
}

interface DashboardProps {
    metrics: Metrics;
    recent_reminders: any[];
    recent_members: User[];
}

export default function Dashboard({
    metrics,
    recent_reminders = [],
    recent_members = [],
}: DashboardProps) {
    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            <Head title="Admin Dashboard" />
            <AdminNavbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <NeoBadge variant="coral">Internal Control</NeoBadge>
                        </div>
                        <h1 className="text-3xl font-black font-heading uppercase text-black">
                            Ringkasan Metrik Sistem
                        </h1>
                        <p className="text-xs text-neutral-600 font-medium">
                            Monitoring beban server, kuota penyimpanan, dan aktivitas pengingat otomatis.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/admin/settings">
                            <NeoButton variant="purple" size="sm">
                                <Sliders className="w-3.5 h-3.5" />
                                Pengaturan Batasan File
                            </NeoButton>
                        </Link>
                    </div>
                </div>

                {/* METRICS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Metric 1 */}
                    <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase tracking-wider text-neutral-600 font-heading">
                                Member Aktif
                            </span>
                            <div className="p-2 bg-[#FFDC58] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                <Users className="w-4 h-4 text-black" />
                            </div>
                        </div>
                        <p className="text-3xl font-black font-heading text-black">
                            {metrics.active_members}{' '}
                            <span className="text-xs font-normal text-neutral-500">/ {metrics.total_members} total</span>
                        </p>
                    </div>

                    {/* Metric 2 */}
                    <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase tracking-wider text-neutral-600 font-heading">
                                Aplikasi & Catatan
                            </span>
                            <div className="p-2 bg-[#A388EE] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                <BookOpen className="w-4 h-4 text-black" />
                            </div>
                        </div>
                        <p className="text-3xl font-black font-heading text-black">
                            {metrics.total_apps}{' '}
                            <span className="text-xs font-normal text-neutral-500">app &bull; {metrics.total_notes} catatan</span>
                        </p>
                    </div>

                    {/* Metric 3 */}
                    <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase tracking-wider text-neutral-600 font-heading">
                                Penyimpanan Lampiran
                            </span>
                            <div className="p-2 bg-[#69D2E7] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                <HardDrive className="w-4 h-4 text-black" />
                            </div>
                        </div>
                        <p className="text-3xl font-black font-heading text-black">
                            {metrics.storage_mb}{' '}
                            <span className="text-xs font-normal text-neutral-500">MB terpakai</span>
                        </p>
                    </div>

                    {/* Metric 4 */}
                    <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase tracking-wider text-neutral-600 font-heading">
                                Log Pengingat
                            </span>
                            <div className="p-2 bg-[#7FBC8C] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                <Bell className="w-4 h-4 text-black" />
                            </div>
                        </div>
                        <p className="text-3xl font-black font-heading text-black">
                            {metrics.total_reminders_sent}{' '}
                            <span className="text-xs font-normal text-neutral-500">
                                terkirim &bull; {metrics.pending_reminders} menunggu
                            </span>
                        </p>
                    </div>
                </div>

                {/* TABLES GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Reminders */}
                    <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black">
                            <h3 className="font-heading font-black text-sm uppercase tracking-wide">
                                Riwayat Pengiriman Pengingat
                            </h3>
                            <Link href="/admin/reminders" className="text-xs font-bold text-neutral-700 hover:underline">
                                Lihat Semua
                            </Link>
                        </div>

                        {recent_reminders.length === 0 ? (
                            <p className="text-xs text-neutral-400 italic py-4">Belum ada aktivitas pengiriman pengingat.</p>
                        ) : (
                            <div className="space-y-2">
                                {recent_reminders.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-center justify-between p-2.5 bg-[#FFFDF8] border border-black text-xs font-medium"
                                    >
                                        <div className="overflow-hidden mr-2">
                                            <p className="font-bold truncate text-black">{log.note?.title || 'Tugas'}</p>
                                            <p className="text-[10px] text-neutral-500 truncate">Kepada: {log.recipient_email}</p>
                                        </div>
                                        <NeoBadge variant={log.status === 'sent' ? 'mint' : 'coral'} className="text-[9px]">
                                            {log.status}
                                        </NeoBadge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Members */}
                    <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black">
                            <h3 className="font-heading font-black text-sm uppercase tracking-wide">
                                Member Terbaru
                            </h3>
                            <Link href="/admin/users" className="text-xs font-bold text-neutral-700 hover:underline">
                                Kelola Pengguna
                            </Link>
                        </div>

                        {recent_members.length === 0 ? (
                            <p className="text-xs text-neutral-400 italic py-4">Belum ada member terdaftar.</p>
                        ) : (
                            <div className="space-y-2">
                                {recent_members.map((m) => (
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
                </div>
            </main>
        </div>
    );
}
