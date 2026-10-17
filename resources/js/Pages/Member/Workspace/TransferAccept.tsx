import React, { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import MemberLayout from '@/Layouts/MemberLayout';
import NeoCard from '@/Components/UI/NeoCard';
import NeoButton from '@/Components/UI/NeoButton';
import { Sparkles, ShieldCheck, UserCheck, XCircle, AlertTriangle, BookOpen, Layers, FileText, ArrowRight } from 'lucide-react';

interface TransferAcceptProps {
    app: {
        id: string;
        name: string;
        color_theme: string;
        description: string | null;
        topic_label: string;
        groups_count: number;
        notes_count: number;
        owner: {
            name: string;
            email: string;
            avatar: string | null;
        };
    };
    transfer: {
        target_email: string;
        sender_name: string;
        sender_email: string;
        created_at: string;
        token: string;
    };
    current_user: {
        name: string;
        email: string;
    };
    is_email_match: boolean;
}

export default function TransferAccept({
    app,
    transfer,
    current_user,
    is_email_match,
}: TransferAcceptProps) {
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    const themeColors: Record<string, string> = {
        yellow: 'bg-[#FFDC58]',
        purple: 'bg-[#A388EE]',
        mint: 'bg-[#7FBC8C]',
        coral: 'bg-[#FF6B6B]',
        sky: 'bg-[#69D2E7]',
        pink: 'bg-[#FF8FAB]',
        orange: 'bg-[#FFA94D]',
    };

    const themeBg = themeColors[app.color_theme] || themeColors.yellow;

    const handleAccept = () => {
        if (!confirm(`Konfirmasi: Ambil alih kepemilikan ruang kerja "${app.name}"?`)) {
            return;
        }

        setIsAccepting(true);
        router.post(`/app/${app.id}/transfer-accept`, {
            token: transfer.token,
        }, {
            onError: () => setIsAccepting(false),
        });
    };

    const handleReject = () => {
        if (!confirm(`Apakah Anda yakin ingin menolak pemindahan kepemilikan ruang kerja "${app.name}"?`)) {
            return;
        }

        setIsRejecting(true);
        router.post(`/app/${app.id}/transfer-reject`, {
            token: transfer.token,
        }, {
            onError: () => setIsRejecting(false),
        });
    };

    return (
        <MemberLayout title={`Konfirmasi Kepemilikan: ${app.name}`}>
            <Head title={`Konfirmasi Kepemilikan: ${app.name} - Aksara`} />

            <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4">
                {/* Header Banner */}
                <div className="p-6 bg-[#FFDC58] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6 text-center">
                    <div className="inline-flex p-3 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-3">
                        <Sparkles className="w-8 h-8 text-black" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black font-heading uppercase text-black mb-2">
                        Undangan Pindah Kepemilikan
                    </h1>
                    <p className="text-sm text-neutral-800 font-medium max-w-lg mx-auto">
                        Anda telah diundang untuk menjadi pemilik resmi dari ruang kerja di bawah ini.
                    </p>
                </div>

                {/* Account Notice if emails don't match exactly */}
                {!is_email_match && (
                    <div className="p-4 bg-[#FF6B6B] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-black shrink-0 mt-0.5" />
                        <div className="text-xs font-bold text-black leading-relaxed">
                            <p className="uppercase font-heading font-black text-sm mb-1">Pemberitahuan Akun</p>
                            Anda saat ini masuk sebagai <strong>{current_user.email}</strong>, sedangkan undangan ini ditujukan untuk <strong>{transfer.target_email}</strong>.
                            Pastikan Anda menggunakan akun yang sesuai sebelum menyetujui pemindahan ini.
                        </div>
                    </div>
                )}

                {/* Workspace Details Card */}
                <NeoCard
                    color="bg-white"
                    shadowSize="lg"
                    className="overflow-hidden mb-8"
                >
                    {/* Header Workspace */}
                    <div className={`${themeBg} p-5 border-b-2 border-black flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <BookOpen className="w-6 h-6 text-black" />
                            </div>
                            <div>
                                <span className="text-[10px] font-heading font-black uppercase px-2 py-0.5 bg-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    Ruang Kerja Catatan
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black font-heading text-black mt-1 uppercase">
                                    {app.name}
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Description */}
                        <div>
                            <h4 className="text-xs font-black font-heading uppercase text-neutral-500 mb-1">
                                Deskripsi Ruang Kerja:
                            </h4>
                            <p className="text-sm font-medium text-neutral-800 bg-[#F4F0EA] p-3 border-2 border-black">
                                {app.description || 'Tidak ada deskripsi ruang kerja.'}
                            </p>
                        </div>

                        {/* Current Owner & Sender Info */}
                        <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
                            <div className="flex items-center gap-2 text-xs font-black uppercase text-neutral-600">
                                <UserCheck className="w-4 h-4 text-black" />
                                <span>Pemilik Saat Ini</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-heading font-black text-base text-black">
                                    {transfer.sender_name}
                                </span>
                                <span className="text-xs font-mono font-bold text-neutral-600">
                                    {transfer.sender_email}
                                </span>
                            </div>
                        </div>

                        {/* Counts Badge */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-[#F4F0EA] border-2 border-black flex items-center gap-2.5">
                                <Layers className="w-4 h-4 text-black shrink-0" />
                                <div>
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase block">Jumlah {app.topic_label || 'Topik'}</span>
                                    <span className="font-heading font-black text-base text-black">{app.groups_count}</span>
                                </div>
                            </div>
                            <div className="p-3 bg-[#F4F0EA] border-2 border-black flex items-center gap-2.5">
                                <FileText className="w-4 h-4 text-black shrink-0" />
                                <div>
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase block">Total Catatan</span>
                                    <span className="font-heading font-black text-base text-black">{app.notes_count}</span>
                                </div>
                            </div>
                        </div>

                        {/* Important Terms Box */}
                        <div className="p-4 bg-[#E8F5E9] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center gap-2 mb-1.5">
                                <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0" />
                                <h4 className="font-heading font-black text-xs uppercase text-emerald-950">
                                    Hak Akses Setelah Diterima
                                </h4>
                            </div>
                            <ul className="text-xs text-emerald-900 space-y-1 font-medium list-disc list-inside">
                                <li>Anda akan menjadi <strong>pemilik sah (owner)</strong> dari ruang kerja ini.</li>
                                <li>Pemilik sebelumnya ({transfer.sender_name}) otomatis menjadi <strong>kolaborator (editor)</strong>.</li>
                                <li>Anda memiliki wewenang penuh untuk mengubah nama, topik, berbagi link, maupun mengelola kolaborator.</li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t-2 border-black">
                            <button
                                type="button"
                                onClick={handleReject}
                                disabled={isAccepting || isRejecting}
                                className="w-full sm:w-1/3 py-3 px-4 bg-white hover:bg-neutral-100 text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-heading font-black text-xs uppercase transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                            >
                                <XCircle className="w-4 h-4 text-black" />
                                <span>{isRejecting ? 'Menolak...' : 'Tolak Undangan'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleAccept}
                                disabled={isAccepting || isRejecting}
                                className="w-full sm:w-2/3 py-3 px-4 bg-[#7FBC8C] hover:bg-[#6fae7c] text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-heading font-black text-sm uppercase transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-4 h-4 text-black" />
                                <span>{isAccepting ? 'Memproses Pengalihan...' : 'Setujui & Ambil Alih Kepemilikan'}</span>
                                <ArrowRight className="w-4 h-4 text-black" />
                            </button>
                        </div>
                    </div>
                </NeoCard>
            </div>
        </MemberLayout>
    );
}
