import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import NeoCard from '@/Components/UI/NeoCard';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge, NeoInput } from '@/Components/UI/NeoInput';
import DebouncedPrefetchLink from '@/Components/DebouncedPrefetchLink';
import {
    Bell, Send, Mail, Play, CheckCircle2, AlertCircle,
    Server, Clock, ArrowRight, Sparkles, User as UserIcon
} from 'lucide-react';
import { ReminderStats, UserOption, NoteOption } from '../types';
import { PageProps } from '@/types';

interface ReminderTestingCardProps {
    stats?: ReminderStats;
    users?: UserOption[];
    notes?: NoteOption[];
}

export default function ReminderTestingCard({
    stats,
    users = [],
    notes = [],
}: ReminderTestingCardProps) {
    const { auth } = usePage<PageProps>().props;
    const admin = auth.admin;

    const defaultEmail = admin?.email || (users[0]?.email || 'admin@aksara.barakode.id');
    const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
    const [testTitle, setTestTitle] = useState('⏰ [Uji Coba] Deadline Catatan & Laporan Tugas');
    const [selectedNoteId, setSelectedNoteId] = useState(notes[0]?.id || '');

    const [isSendingTest, setIsSendingTest] = useState(false);
    const [isRunningEngine, setIsRunningEngine] = useState(false);

    const handleSendTest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipientEmail || isSendingTest) return;

        setIsSendingTest(true);
        router.post(
            '/admin/settings/test-reminder',
            {
                recipient_email: recipientEmail,
                title: testTitle,
                note_id: selectedNoteId || undefined,
            },
            {
                preserveScroll: true,
                onFinish: () => setIsSendingTest(false),
            }
        );
    };

    const handleRunEngine = () => {
        if (isRunningEngine) return;
        setIsRunningEngine(true);

        router.post(
            '/admin/settings/run-reminders',
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsRunningEngine(false),
            }
        );
    };

    return (
        <NeoCard color="bg-white" shadowSize="lg" className="p-5 sm:p-7 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-black">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                        <Bell className="w-5 h-5 text-black stroke-[2.5]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-heading font-black uppercase text-black leading-tight">
                            Pengujian Engine Pengingat & Email
                        </h2>
                        <p className="text-xs text-neutral-600 font-medium">
                            Uji coba pengiriman pengingat deadline dan verifikasi scheduler notifikasi.
                        </p>
                    </div>
                </div>
                <NeoBadge variant="sky">Diagnostik Sistem</NeoBadge>
            </div>

            {/* Diagnostic Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
                        <Server className="w-3.5 h-3.5 text-black" />
                        <span className="text-[10px] font-heading font-black uppercase tracking-wider">Mail Driver</span>
                    </div>
                    <p className="text-base sm:text-lg font-heading font-black text-black uppercase">
                        {stats?.mail_driver || 'log'}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-medium truncate">
                        {stats?.mail_driver === 'log' ? 'Simulasi log aman' : 'Layanan Mailer'}
                    </p>
                </div>

                <div className="p-3.5 bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] font-heading font-black uppercase tracking-wider">Pengingat Terkirim</span>
                    </div>
                    <p className="text-base sm:text-lg font-heading font-black text-black">
                        {stats?.total_sent || 0}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-medium">
                        Gagal: {stats?.total_failed || 0}
                    </p>
                </div>

                <div className="p-3.5 bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
                        <Clock className="w-3.5 h-3.5 text-black" />
                        <span className="text-[10px] font-heading font-black uppercase tracking-wider">Tugas Deadline</span>
                    </div>
                    <p className="text-base sm:text-lg font-heading font-black text-black">
                        {stats?.pending_tasks || 0}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-medium">
                        Menunggu jatuh tempo
                    </p>
                </div>

                <div className="p-3.5 bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#A388EE]" />
                        <span className="text-[10px] font-heading font-black uppercase tracking-wider">Pengingat Terakhir</span>
                    </div>
                    <p className="text-xs sm:text-sm font-heading font-black text-black truncate mt-1">
                        {stats?.last_run || 'Belum ada'}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-medium truncate">
                        Dari scheduler/manual
                    </p>
                </div>
            </div>

            {/* SECTION 1: Form Direct Test Reminder */}
            <form onSubmit={handleSendTest} className="p-4 sm:p-5 bg-[#FFFDF8] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-300">
                    <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-black" />
                        <h3 className="font-heading font-black text-sm uppercase text-black">
                            1. Kirim Pengingat Simulasi Langsung
                        </h3>
                    </div>
                    <span className="text-[11px] font-bold text-neutral-600">
                        Membuat Log & Notifikasi In-App
                    </span>
                </div>

                {/* Email Recipient Input */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-heading font-black uppercase tracking-wider text-black">
                        Email Penerima
                    </label>
                    <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="nama@domain.com"
                        className="w-full px-3 py-2 text-sm font-bold bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0"
                        required
                    />

                    {/* Quick Recipient Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] font-bold text-neutral-500 mr-1">
                            Pilih Cepat:
                        </span>
                        {admin?.email && (
                            <button
                                type="button"
                                onClick={() => setRecipientEmail(admin.email)}
                                className="px-2 py-0.5 bg-white hover:bg-[#FFDC58] border border-black text-[10px] font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 transition-all cursor-pointer"
                            >
                                Admin ({admin.name})
                            </button>
                        )}
                        {users.slice(0, 3).map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => setRecipientEmail(u.email)}
                                className="px-2 py-0.5 bg-white hover:bg-[#69D2E7] border border-black text-[10px] font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 transition-all cursor-pointer"
                            >
                                {u.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Test Title Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-heading font-black uppercase tracking-wider text-black">
                            Judul Catatan / Subjek Pengingat
                        </label>
                        <input
                            type="text"
                            value={testTitle}
                            onChange={(e) => setTestTitle(e.target.value)}
                            className="w-full px-3 py-2 text-sm font-bold bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-heading font-black uppercase tracking-wider text-black">
                            Kaitkan Catatan (Opsional)
                        </label>
                        <select
                            value={selectedNoteId}
                            onChange={(e) => setSelectedNoteId(e.target.value)}
                            className="w-full px-3 py-2 text-sm font-bold bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0 cursor-pointer"
                        >
                            <option value="">Pilih Otomatis / Catatan Default</option>
                            {notes.map((n) => (
                                <option key={n.id} value={n.id}>
                                    {n.title} {n.category === 'task' ? '(Tugas)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-neutral-600 font-medium">
                        Email simulasi akan dikirim melalui mailer dan tercatat di Log Pengingat.
                    </p>
                    <NeoButton
                        type="submit"
                        variant="yellow"
                        size="md"
                        disabled={isSendingTest}
                        className="cursor-pointer"
                    >
                        <Send className="w-4 h-4 mr-1.5" />
                        {isSendingTest ? 'Mengirim Pengingat...' : 'Kirim Test Pengingat'}
                    </NeoButton>
                </div>
            </form>

            {/* SECTION 2: Trigger Engine Cron Manually */}
            <div className="p-4 sm:p-5 bg-[#F4F0EA] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-black fill-black" />
                        <h3 className="font-heading font-black text-sm uppercase text-black">
                            2. Jalankan Engine Pengingat Cron Manual
                        </h3>
                    </div>
                    <p className="text-xs text-neutral-700 font-medium max-w-xl">
                        Mengeksekusi command <code className="bg-white px-1.5 py-0.5 border border-black font-mono font-bold text-[11px]">php artisan notes:send-reminders</code> saat ini juga untuk memeriksa semua catatan tugas yang jatuh tempo.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <DebouncedPrefetchLink
                        href="/admin/reminders"
                        className="px-3 py-2 bg-white hover:bg-neutral-100 border-2 border-black font-heading font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 transition-all inline-flex items-center gap-1 text-black"
                    >
                        Lihat Log <ArrowRight className="w-3.5 h-3.5" />
                    </DebouncedPrefetchLink>

                    <NeoButton
                        type="button"
                        variant="mint"
                        size="md"
                        onClick={handleRunEngine}
                        disabled={isRunningEngine}
                        className="cursor-pointer"
                    >
                        <Play className="w-4 h-4 mr-1.5 fill-black" />
                        {isRunningEngine ? 'Memproses Engine...' : 'Jalankan Engine Sekarang'}
                    </NeoButton>
                </div>
            </div>

            {/* SECTION 3: Information & Help Notes */}
            <div className="p-3.5 bg-sky-50 border-2 border-black text-xs text-neutral-800 space-y-1.5">
                <p className="font-heading font-black uppercase text-sky-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-sky-800" />
                    Bagaimana Pengingat Bekerja di Aksara Notes:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-neutral-700 font-medium pl-1">
                    <li>
                        <strong>Notifikasi In-App:</strong> Pengguna akan menerima lonceng notifikasi aktif di pojok kanan atas aplikasi beserta tautan instan ke catatan.
                    </li>
                    <li>
                        <strong>Pengingat Pribadi:</strong> Pengguna yang menyimpan catatan publik dapat memasang pengingat pribadi tanpa mengubah konfigurasi pemilik catatan.
                    </li>
                    <li>
                        <strong>Log Pengingat:</strong> Seluruh riwayat pengingat dicatat secara permanen di database dan dapat dipantau di halaman <DebouncedPrefetchLink href="/admin/reminders" className="underline font-bold text-black">Log Pengingat</DebouncedPrefetchLink>.
                    </li>
                </ul>
            </div>
        </NeoCard>
    );
}
