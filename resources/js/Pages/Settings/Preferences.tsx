import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { User } from '@/types';
import Navbar from '@/Components/Navbar';
import NeoButton from '@/Components/UI/NeoButton';
import NeoCard from '@/Components/UI/NeoCard';
import { NeoBadge, NeoInput } from '@/Components/UI/NeoInput';
import { Bell, User as UserIcon, ShieldCheck, CheckCircle2, Save } from 'lucide-react';

interface PreferencesProps {
    user: User;
}

export default function Preferences({ user }: PreferencesProps) {
    const [name, setName] = useState(user.name);
    const [defaultReminderDays, setDefaultReminderDays] = useState(user.default_reminder_days || 1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        router.put(
            '/settings/preferences',
            {
                name: name.trim(),
                default_reminder_days: defaultReminderDays,
            },
            {
                onFinish: () => setSubmitting(false),
                onError: (err) => setError(Object.values(err)[0] as string),
            }
        );
    };

    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            <Head title="Pengaturan & Preferensi Member" />
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 py-10 flex-1 w-full">
                <div className="mb-8 pb-4 border-b-2 border-black">
                    <div className="flex items-center gap-2 mb-2">
                        <NeoBadge variant="purple">Pengaturan Global</NeoBadge>
                    </div>
                    <h1 className="text-3xl font-black font-heading uppercase text-black">
                        Profil & Preferensi Pengingat
                    </h1>
                    <p className="text-sm text-neutral-600 font-medium">
                        Atur nilai bawaan pengingat deadline yang otomatis diterapkan saat Anda membuat tugas baru.
                    </p>
                </div>

                <NeoCard color="bg-white" shadowSize="lg" className="p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-[#FF6B6B] border-2 border-black text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {error}
                            </div>
                        )}

                        {/* Account Info */}
                        <div className="flex items-center gap-4 p-4 bg-[#F4F0EA] border-2 border-black">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-14 h-14 border-2 border-black bg-amber-100"
                                />
                            ) : (
                                <div className="w-14 h-14 bg-[#FFDC58] border-2 border-black flex items-center justify-center font-black text-xl">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h3 className="font-heading font-black text-lg text-black">{user.name}</h3>
                                <p className="text-xs text-neutral-600 font-medium">{user.email}</p>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Akun Google Terverifikasi
                                </span>
                            </div>
                        </div>

                        {/* Name Input */}
                        <NeoInput
                            label="Nama Tampilan"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        {/* Default Reminder Days Setting (Acceptance Criteria 2) */}
                        <div className="p-5 border-2 border-black bg-[#FFFDF8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <Bell className="w-4 h-4 text-black" />
                                </div>
                                <label className="text-sm font-black uppercase tracking-wider text-black font-heading">
                                    Default Pengingat Deadline
                                </label>
                            </div>

                            <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                                Nilai ini akan otomatis menjadi isian default pada kolom <em>"Ingatkan saya X hari sebelum deadline"</em>{' '}
                                saat Anda memilih kategori <strong>Tugas</strong>. Anda tetap bebas mengubah angka ini pada catatan tugas tertentu tanpa memengaruhi setelan profil ini.
                            </p>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={30}
                                    value={defaultReminderDays}
                                    onChange={(e) => setDefaultReminderDays(parseInt(e.target.value) || 0)}
                                    className="w-24 px-3 py-2 text-base font-black font-heading text-center bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                                />
                                <span className="text-sm font-bold text-black uppercase font-heading">
                                    Hari Sebelum Deadline
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t-2 border-black">
                            <NeoButton type="submit" variant="yellow" size="md" disabled={submitting}>
                                <Save className="w-4 h-4" />
                                {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </NeoButton>
                        </div>
                    </form>
                </NeoCard>
            </main>
        </div>
    );
}
