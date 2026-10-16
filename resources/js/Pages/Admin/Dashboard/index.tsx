import React from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { Users, BookOpen, HardDrive, Bell, Sliders } from 'lucide-react';
import { DashboardProps } from './types';
import StatCard from './components/StatCard';
import RecentRemindersCard from './components/RecentRemindersCard';
import RecentMembersCard from './components/RecentMembersCard';

export default function Dashboard({
    metrics,
    recent_reminders = [],
    recent_members = [],
}: DashboardProps) {
    return (
        <AdminLayout title="Admin Dashboard">
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
                            <Sliders className="w-3.5 h-3.5 mr-1" />
                            Pengaturan Batasan File
                        </NeoButton>
                    </Link>
                </div>
            </div>

            {/* METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    title="Member Aktif"
                    value={metrics.active_members}
                    subtitle={`/ ${metrics.total_members} total`}
                    icon={Users}
                    iconBg="bg-[#FFDC58]"
                />
                <StatCard
                    title="Aplikasi & Catatan"
                    value={metrics.total_apps}
                    subtitle={`app • ${metrics.total_notes} catatan`}
                    icon={BookOpen}
                    iconBg="bg-[#A388EE]"
                />
                <StatCard
                    title="Penyimpanan Lampiran"
                    value={metrics.storage_mb}
                    subtitle="MB terpakai"
                    icon={HardDrive}
                    iconBg="bg-[#69D2E7]"
                />
                <StatCard
                    title="Log Pengingat"
                    value={metrics.total_reminders_sent}
                    subtitle={`terkirim • ${metrics.pending_reminders} menunggu`}
                    icon={Bell}
                    iconBg="bg-[#7FBC8C]"
                />
            </div>

            {/* TABLES GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentRemindersCard reminders={recent_reminders} />
                <RecentMembersCard members={recent_members} />
            </div>
        </AdminLayout>
    );
}
