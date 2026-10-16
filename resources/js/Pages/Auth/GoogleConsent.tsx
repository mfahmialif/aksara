import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import NeoButton from '@/Components/UI/NeoButton';
import NeoCard from '@/Components/UI/NeoCard';
import { NeoInput, NeoBadge } from '@/Components/UI/NeoInput';
import { ArrowLeft, CheckCircle2, UserPlus, ShieldAlert, Sparkles } from 'lucide-react';

interface Account {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
}

interface GoogleConsentProps {
    accounts: Account[];
}

export default function GoogleConsent({ accounts = [] }: GoogleConsentProps) {
    const { flash } = usePage<PageProps>().props;
    const [useCustomAccount, setUseCustomAccount] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customEmail, setCustomEmail] = useState('');
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [submittingCustom, setSubmittingCustom] = useState(false);

    const handleSelectAccount = (userId: number) => {
        setLoadingId(userId);
        router.post('/auth/google/consent', { user_id: userId }, {
            onFinish: () => setLoadingId(null),
        });
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customName.trim() || !customEmail.trim()) return;

        setSubmittingCustom(true);
        router.post('/auth/google/consent', {
            name: customName.trim(),
            email: customEmail.trim(),
        }, {
            onFinish: () => setSubmittingCustom(false),
        });
    };

    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col justify-center items-center p-4 font-sans">
            <Head title="Masuk dengan Google - Pilih Akun" />

            <div className="w-full max-w-md">
                {/* Back to Home Link */}
                <div className="mb-4">
                    <Link
                        href="/"
                        className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black gap-1 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Beranda
                    </Link>
                </div>

                {/* Main Account Chooser Card */}
                <NeoCard color="bg-white" shadowSize="lg" className="p-6 sm:p-8">
                    {/* Google Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-full mb-3">
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                />
                            </svg>
                        </div>

                        <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-black">
                            Pilih Akun Google
                        </h1>
                        <p className="text-xs sm:text-sm text-neutral-600 font-medium mt-1">
                            untuk melanjutkan ke <strong className="text-black">Catatan PRO</strong>
                        </p>
                    </div>

                    {/* Flash Error if any */}
                    {flash.error && (
                        <div className="mb-4 p-3 bg-rose-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs font-bold text-rose-800 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{flash.error}</span>
                        </div>
                    )}

                    {!useCustomAccount ? (
                        <>
                            {/* Accounts List */}
                            <div className="space-y-2 mb-4">
                                {accounts.map((acc) => (
                                    <button
                                        key={acc.id}
                                        type="button"
                                        disabled={loadingId !== null}
                                        onClick={() => handleSelectAccount(acc.id)}
                                        className="w-full text-left p-3 bg-[#FFFDF8] hover:bg-[#FFDC58] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-3 group"
                                    >
                                        {acc.avatar ? (
                                            <img
                                                src={acc.avatar}
                                                alt={acc.name}
                                                className="w-10 h-10 border border-black bg-white shrink-0 object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-[#A388EE] border border-black flex items-center justify-center font-heading font-black text-sm shrink-0">
                                                {acc.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black font-heading text-black truncate group-hover:underline">
                                                {acc.name}
                                            </p>
                                            <p className="text-xs text-neutral-600 truncate">
                                                {acc.email}
                                            </p>
                                        </div>
                                        {loadingId === acc.id ? (
                                            <span className="text-xs font-bold animate-pulse text-neutral-800">
                                                Masuk...
                                            </span>
                                        ) : (
                                            <span className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Pilih
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Use Another Account Button */}
                            <button
                                type="button"
                                onClick={() => setUseCustomAccount(true)}
                                className="w-full p-3 bg-white hover:bg-neutral-50 border-2 border-dashed border-black font-bold text-xs uppercase tracking-wider text-neutral-800 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                            >
                                <UserPlus className="w-4 h-4" />
                                Gunakan Akun Google Lainnya
                            </button>
                        </>
                    ) : (
                        /* Custom Account Form */
                        <form onSubmit={handleCustomSubmit} className="space-y-4">
                            <div className="bg-[#FFFDF8] p-3 border-2 border-black text-xs text-neutral-700 font-medium">
                                Masukkan nama dan email Google Anda untuk masuk atau mendaftar otomatis.
                            </div>

                            <NeoInput
                                label="Nama Lengkap"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="Contoh: Ahmad Fauzi"
                                required
                            />

                            <NeoInput
                                label="Alamat Email Google"
                                type="email"
                                value={customEmail}
                                onChange={(e) => setCustomEmail(e.target.value)}
                                placeholder="nama@gmail.com"
                                required
                            />

                            <div className="flex gap-2 pt-2">
                                <NeoButton
                                    type="button"
                                    variant="white"
                                    onClick={() => setUseCustomAccount(false)}
                                    className="flex-1"
                                >
                                    Batal
                                </NeoButton>
                                <NeoButton
                                    type="submit"
                                    variant="yellow"
                                    disabled={submittingCustom}
                                    className="flex-1"
                                >
                                    {submittingCustom ? 'Memproses...' : 'Lanjutkan Masuk'}
                                </NeoButton>
                            </div>
                        </form>
                    )}

                    {/* Developer Notice */}
                    <div className="mt-6 pt-4 border-t-2 border-neutral-200">
                        <div className="flex items-start gap-2 bg-[#F4F0EA] p-2.5 border border-black text-[11px] text-neutral-700 leading-normal">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                                <strong>Mode Simulasi Google OAuth:</strong> Kredensial Google Cloud belum diisi di <code className="bg-white px-1 border border-black">.env</code>. Memilih akun di atas akan langsung mengotentikasi Anda sebagai pengguna tersebut.
                            </span>
                        </div>
                    </div>
                </NeoCard>
            </div>
        </div>
    );
}
