import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { ClipboardList, Trash2 } from 'lucide-react';
import { ActivityLog } from '@/types';
import { LogsProps } from './types';
import LogStatCards from './components/LogStatCards';
import LogFilters from './components/LogFilters';
import LogTable from './components/LogTable';
import LogDetailModal from './components/LogDetailModal';

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

    return (
        <AdminLayout title="Log Aktivitas Pro - Admin" spaceY="space-y-0">
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

                <NeoButton variant="danger" size="sm" onClick={handleClearLogs}>
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Kosongkan Seluruh Log
                </NeoButton>
            </div>

            {/* STATS OVERVIEW */}
            <LogStatCards stats={stats} />

            {/* FILTER TOOLBAR */}
            <LogFilters
                search={search}
                setSearch={setSearch}
                role={role}
                setRole={setRole}
                action={action}
                setAction={setAction}
                onFilter={handleFilter}
                onReset={handleReset}
            />

            {/* TABLE SECTION */}
            <LogTable logs={logs} onViewDetail={setSelectedLog} />

            {/* DETAIL MODAL */}
            <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        </AdminLayout>
    );
}
