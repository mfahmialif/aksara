import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { SettingsProps } from './types';
import FileSettingsCard from './components/FileSettingsCard';
import ReminderTestingCard from './components/ReminderTestingCard';
import SmtpSettingsCard from './components/SmtpSettingsCard';
import { Sliders, Bell, Layers, Mail } from 'lucide-react';

export default function Settings({
    settings,
    users = [],
    notes = [],
    reminder_stats,
}: SettingsProps) {
    const [activeTab, setActiveTab] = useState<'all' | 'smtp' | 'reminders' | 'files'>('all');

    return (
        <AdminLayout title="Modul Pengaturan (Admin)" maxWidth="max-w-5xl" spaceY="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-black">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <NeoBadge variant="coral">Pusat Kendali Admin</NeoBadge>
                        <NeoBadge variant="sky">Sistem & Mailer</NeoBadge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black font-heading uppercase text-black">
                        Modul Pengaturan Sistem
                    </h1>
                    <p className="text-xs text-neutral-600 font-medium">
                        Konfigurasi server SMTP email, pengujian engine pengingat, dan batasan unggahan file.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] self-start md:self-auto overflow-x-auto max-w-full">
                    <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className={`px-3 py-1.5 text-xs font-heading font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                            activeTab === 'all'
                                ? 'bg-black text-white'
                                : 'bg-transparent text-black hover:bg-neutral-100'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Semua</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('smtp')}
                        className={`px-3 py-1.5 text-xs font-heading font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                            activeTab === 'smtp'
                                ? 'bg-[#69D2E7] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                : 'bg-transparent text-black hover:bg-neutral-100'
                        }`}
                    >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Server SMTP</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('reminders')}
                        className={`px-3 py-1.5 text-xs font-heading font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                            activeTab === 'reminders'
                                ? 'bg-[#FFDC58] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                : 'bg-transparent text-black hover:bg-neutral-100'
                        }`}
                    >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Testing Pengingat</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('files')}
                        className={`px-3 py-1.5 text-xs font-heading font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                            activeTab === 'files'
                                ? 'bg-[#A388EE] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                : 'bg-transparent text-black hover:bg-neutral-100'
                        }`}
                    >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Batasan File</span>
                    </button>
                </div>
            </div>

            {/* SECTIONS */}
            <div className="space-y-6">
                {(activeTab === 'all' || activeTab === 'smtp') && (
                    <section id="konfigurasi-smtp" className="space-y-3">
                        <div className="flex items-center gap-2">
                            <NeoBadge variant="sky">Server Mailer</NeoBadge>
                            <h2 className="text-lg font-heading font-black uppercase text-black">
                                Pengaturan SMTP & Kredensial Email
                            </h2>
                        </div>
                        <SmtpSettingsCard
                            settings={settings}
                            onNavigateToTesting={() => setActiveTab('reminders')}
                        />
                    </section>
                )}

                {(activeTab === 'all' || activeTab === 'reminders') && (
                    <section id="testing-pengingat" className="space-y-3">
                        <div className="flex items-center gap-2">
                            <NeoBadge variant="yellow">Engine Reminder</NeoBadge>
                            <h2 className="text-lg font-heading font-black uppercase text-black">
                                Uji Coba Pengiriman & Antrean Pengingat
                            </h2>
                        </div>
                        <ReminderTestingCard
                            stats={reminder_stats}
                            users={users}
                            notes={notes}
                        />
                    </section>
                )}

                {(activeTab === 'all' || activeTab === 'files') && (
                    <section id="batasan-file" className="space-y-3">
                        <div className="flex items-center gap-2">
                            <NeoBadge variant="purple">Kebijakan Upload</NeoBadge>
                            <h2 className="text-lg font-heading font-black uppercase text-black">
                                Batasan File & Format Ekstensi
                            </h2>
                        </div>
                        <FileSettingsCard settings={settings} />
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}
