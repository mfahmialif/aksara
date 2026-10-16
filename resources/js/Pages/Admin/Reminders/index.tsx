import React from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { RefreshCw } from 'lucide-react';
import { RemindersPageProps } from './types';
import UpcomingTasksTable from './components/UpcomingTasksTable';
import ReminderLogsTable from './components/ReminderLogsTable';

export default function Reminders({ logs, upcoming = [] }: RemindersPageProps) {
    const handleRunRemindersManually = () => {
        router.reload();
    };

    return (
        <AdminLayout title="Log & Antrean Pengingat (Admin)">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <NeoBadge variant="mint">Scheduler & Queue</NeoBadge>
                    </div>
                    <h1 className="text-3xl font-black font-heading uppercase text-black">
                        Monitoring Pengingat Email
                    </h1>
                    <p className="text-xs text-neutral-600 font-medium">
                        Pemantauan riwayat pengiriman notifikasi tenggat waktu tugas dan jadwal antrean pengingat mendatang.
                    </p>
                </div>

                <NeoButton variant="yellow" size="sm" onClick={handleRunRemindersManually}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Segarkan Status
                </NeoButton>
            </div>

            {/* UPCOMING TASKS QUEUE */}
            <UpcomingTasksTable upcoming={upcoming} />

            {/* LOGS TABLE */}
            <ReminderLogsTable logs={logs} />
        </AdminLayout>
    );
}
