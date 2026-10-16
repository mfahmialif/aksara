import React, { useState, useEffect } from 'react';
import { Note, PageProps, UserNoteReminder } from '@/types';
import { usePage } from '@inertiajs/react';
import { Bell, BellRing, Check, Clock, Trash2, Calendar, AlertCircle } from 'lucide-react';
import NeoButton from '@/Components/UI/NeoButton';

interface PersonalNoteReminderProps {
    note: Note;
    initialReminder?: UserNoteReminder | null;
}

function getCsrfToken(): string {
    return (
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
        document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] ||
        ''
    );
}

export default function PersonalNoteReminder({ note, initialReminder }: PersonalNoteReminderProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;

    const [reminder, setReminder] = useState<UserNoteReminder | null>(initialReminder || null);
    const [selectedDays, setSelectedDays] = useState<number | null>(
        initialReminder?.reminder_days_before !== undefined && initialReminder?.reminder_days_before !== null
            ? initialReminder.reminder_days_before
            : 1
    );
    const [customDateTime, setCustomDateTime] = useState<string>(
        initialReminder?.custom_remind_at
            ? new Date(initialReminder.custom_remind_at).toISOString().slice(0, 16)
            : ''
    );
    const [useCustomTime, setUseCustomTime] = useState<boolean>(Boolean(initialReminder?.custom_remind_at));
    const [loading, setLoading] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Synchronize or fetch reminder dynamically when note changes
    useEffect(() => {
        if (!user || !note?.id) return;

        if (initialReminder !== undefined) {
            setReminder(initialReminder);
            setSelectedDays(
                initialReminder?.reminder_days_before !== undefined && initialReminder?.reminder_days_before !== null
                    ? initialReminder.reminder_days_before
                    : 1
            );
            setCustomDateTime(
                initialReminder?.custom_remind_at
                    ? new Date(initialReminder.custom_remind_at).toISOString().slice(0, 16)
                    : ''
            );
            setUseCustomTime(Boolean(initialReminder?.custom_remind_at));
            return;
        }

        let isMounted = true;
        fetch(`/notes/${note.id}/personal-reminder`, {
            headers: {
                Accept: 'application/json',
            },
        })
            .then((res) => {
                if (res.ok) return res.json();
                return null;
            })
            .then((data) => {
                if (!isMounted || !data) return;
                if (data.reminder) {
                    setReminder(data.reminder);
                    setSelectedDays(
                        data.reminder.reminder_days_before !== undefined && data.reminder.reminder_days_before !== null
                            ? data.reminder.reminder_days_before
                            : 1
                    );
                    setCustomDateTime(
                        data.reminder.custom_remind_at
                            ? new Date(data.reminder.custom_remind_at).toISOString().slice(0, 16)
                            : ''
                    );
                    setUseCustomTime(Boolean(data.reminder.custom_remind_at));
                } else {
                    setReminder(null);
                    setSelectedDays(1);
                    setCustomDateTime('');
                    setUseCustomTime(false);
                }
            })
            .catch(() => {});

        return () => {
            isMounted = false;
        };
    }, [note.id, initialReminder, user]);

    // If user is not logged in, prompt them to login
    if (!user) {
        return (
            <div className="p-3.5 sm:p-5 bg-[#FFFEF0] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#FFDC58] border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                    </div>
                    <div>
                        <h4 className="font-heading font-black text-xs sm:text-sm uppercase text-black">
                            Pasang Pengingat Pribadi
                        </h4>
                        <p className="text-[11px] sm:text-xs text-neutral-600 font-medium">
                            Masuk dengan akun Google Anda untuk memasang notifikasi pengingat khusus untuk diri Anda sendiri (tidak dibagikan ke orang lain).
                        </p>
                    </div>
                </div>
                <a
                    href="/auth/google/redirect"
                    className="w-full sm:w-auto text-center px-4 py-2.5 sm:py-2 bg-[#69D2E7] hover:bg-[#52c1d8] text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 transition-transform active:translate-x-0.5 active:translate-y-0.5"
                >
                    Masuk dengan Google
                </a>
            </div>
        );
    }

    const hasDeadline = Boolean(note.deadline_at);

    const handleSave = async () => {
        setLoading(true);
        setStatusMessage(null);
        setErrorMessage(null);

        const payload: { reminder_days_before?: number | null; custom_remind_at?: string | null } = {};

        if (useCustomTime || !hasDeadline) {
            if (!customDateTime) {
                setErrorMessage('Silakan pilih tanggal dan jam pengingat.');
                setLoading(false);
                return;
            }
            payload.custom_remind_at = customDateTime;
            payload.reminder_days_before = null;
        } else {
            payload.reminder_days_before = selectedDays;
            payload.custom_remind_at = null;
        }

        try {
            const res = await fetch(`/notes/${note.id}/personal-reminder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setReminder(data.reminder);
                setStatusMessage('Pengingat pribadi Anda berhasil disimpan! Pengingat ini berlaku eksklusif untuk akun Anda.');
            } else {
                setErrorMessage(data.message || 'Gagal menyimpan pengingat.');
            }
        } catch {
            setErrorMessage('Terjadi kesalahan jaringan saat menyimpan pengingat.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Apakah Anda yakin ingin membatalkan pengingat pribadi untuk catatan ini?')) {
            return;
        }

        setLoading(true);
        setStatusMessage(null);
        setErrorMessage(null);

        try {
            const res = await fetch(`/notes/${note.id}/personal-reminder`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setReminder(null);
                setStatusMessage('Pengingat pribadi Anda telah dibatalkan.');
            } else {
                setErrorMessage(data.message || 'Gagal menghapus pengingat.');
            }
        } catch {
            setErrorMessage('Terjadi kesalahan jaringan saat menghapus pengingat.');
        } finally {
            setLoading(false);
        }
    };

    const presets = [
        { label: 'Hari-H', days: 0 },
        { label: '1 Hari Sebelum', days: 1 },
        { label: '2 Hari Sebelum', days: 2 },
        { label: '3 Hari Sebelum', days: 3 },
        { label: '1 Minggu', days: 7 },
    ];

    return (
        <div className="border-2 border-black bg-white p-3.5 sm:p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3.5 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-black">
                <div className="flex items-start sm:items-center gap-2.5">
                    <div className="w-8 h-8 bg-[#FFDC58] border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <BellRing className="w-4 h-4 text-black" />
                    </div>
                    <div>
                        <h4 className="font-heading font-black text-xs sm:text-sm uppercase text-black">
                            Pengingat Pribadi Saya
                        </h4>
                        <p className="text-[11px] text-neutral-600 font-medium">
                            Khusus akun Anda ({user.email}). Tidak memengaruhi pembuat catatan atau kolaborator lain.
                        </p>
                    </div>
                </div>

                {reminder ? (
                    <span className="self-start sm:self-center px-2.5 py-1 bg-[#7FBC8C] border-2 border-black text-[10px] sm:text-[11px] font-black uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {reminder.reminder_sent_at ? 'Pengingat Sudah Terkirim' : 'Pengingat Aktif'}
                    </span>
                ) : (
                    <span className="self-start sm:self-center px-2.5 py-1 bg-neutral-100 border-2 border-black text-[10px] sm:text-[11px] font-bold text-neutral-600">
                        Belum Diatur
                    </span>
                )}
            </div>

            {statusMessage && (
                <div className="p-3 bg-emerald-50 border-2 border-emerald-600 text-xs font-bold text-emerald-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{statusMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div className="p-3 bg-rose-50 border-2 border-rose-600 text-xs font-bold text-rose-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {reminder && (
                <div className="p-3 bg-[#FFFDF8] border-2 border-black text-xs font-medium space-y-1">
                    <p className="font-bold text-black flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-black shrink-0" />
                        <span>Jadwal Pengingat:</span>
                    </p>
                    {reminder.custom_remind_at ? (
                        <p className="text-neutral-700 pl-5">
                            Pada tanggal & jam: <span className="font-bold text-black">{new Date(reminder.custom_remind_at).toLocaleString('id-ID')}</span>
                        </p>
                    ) : (
                        <p className="text-neutral-700 pl-5">
                            {reminder.reminder_days_before === 0
                                ? 'Pada Hari-H tenggat waktu tugas'
                                : `${reminder.reminder_days_before} hari sebelum tenggat waktu tugas`}
                        </p>
                    )}
                    {reminder.reminder_sent_at && (
                        <p className="text-emerald-700 text-[11px] font-bold pl-5">
                            Notifikasi telah dikirimkan ke akun Anda pada {new Date(reminder.reminder_sent_at).toLocaleString('id-ID')}.
                        </p>
                    )}
                </div>
            )}

            <div className="space-y-2 sm:space-y-3">
                <label className="block text-xs font-black uppercase font-heading text-neutral-800">
                    Atur Waktu Pengingat:
                </label>

                {hasDeadline && (
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
                        {presets.map((p) => {
                            const isSelected = !useCustomTime && selectedDays === p.days;
                            return (
                                <button
                                    key={p.days}
                                    type="button"
                                    onClick={() => {
                                        setUseCustomTime(false);
                                        setSelectedDays(p.days);
                                    }}
                                    className={`px-2.5 sm:px-3 py-2 text-xs font-bold border-2 border-black transition-all ${
                                        isSelected
                                            ? 'bg-[#FFDC58] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                                            : 'bg-white hover:bg-neutral-100 text-neutral-800'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            );
                        })}

                        <button
                            type="button"
                            onClick={() => setUseCustomTime(true)}
                            className={`col-span-2 sm:col-span-1 px-2.5 sm:px-3 py-2 text-xs font-bold border-2 border-black transition-all ${
                                useCustomTime
                                    ? 'bg-[#69D2E7] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                                    : 'bg-white hover:bg-neutral-100 text-neutral-800'
                            }`}
                        >
                            Pilih Waktu Spesifik
                        </button>
                    </div>
                )}

                {(useCustomTime || !hasDeadline) && (
                    <div className="space-y-1.5 pt-1">
                        <label className="text-[11px] font-bold text-neutral-700 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>Tentukan Tanggal & Jam Pengingat:</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={customDateTime}
                            onChange={(e) => setCustomDateTime(e.target.value)}
                            className="w-full sm:w-auto px-3 py-2 text-xs font-bold bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-white"
                        />
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
                <NeoButton
                    type="button"
                    variant="yellow"
                    size="sm"
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full sm:w-auto justify-center"
                >
                    {loading ? 'Menyimpan...' : reminder ? 'Perbarui Pengingat' : 'Simpan Pengingat'}
                </NeoButton>

                {reminder && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-black uppercase text-rose-700 bg-rose-50 hover:bg-rose-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                    >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        Batalkan Pengingat
                    </button>
                )}
            </div>
        </div>
    );
}
