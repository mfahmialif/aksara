import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DebouncedPrefetchLink from '@/Components/DebouncedPrefetchLink';
import { NeoInput } from '@/Components/UI/NeoInput';
import NeoButton from '@/Components/UI/NeoButton';
import NeoCard from '@/Components/UI/NeoCard';
import { Lock, ArrowLeft, KeyRound } from 'lucide-react';

interface LoginProps {
    errors?: Record<string, string>;
}

export default function Login({ errors = {} }: LoginProps) {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        router.post(
            '/admin/login',
            { login, password, remember },
            {
                onFinish: () => setSubmitting(false),
            }
        );
    };

    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col justify-center items-center p-4 font-sans">
            <Head title="Login Admin Aksara" />

            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <DebouncedPrefetchLink
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-black mb-4 uppercase tracking-wider"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Kembali ke Halaman Utama
                    </DebouncedPrefetchLink>

                    <div className="w-16 h-16 bg-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto mb-3 p-1.5 overflow-hidden">
                        <img src="/logo.png" alt="Aksara" className="w-full h-full object-contain" />
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black font-heading uppercase tracking-tight text-black">
                        Panel Admin Aksara
                    </h1>
                    <p className="text-xs text-neutral-600 font-medium mt-1">
                        Akses khusus staf internal pengelolaan sistem aksara.barakode.id
                    </p>
                </div>

                <NeoCard color="bg-white" shadowSize="lg" className="p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {errors.login && (
                            <div className="p-3 bg-[#FF6B6B] border-2 border-black text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {errors.login}
                            </div>
                        )}

                        <NeoInput
                            label="Username atau Email Admin"
                            type="text"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            required
                        />

                        <NeoInput
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <div className="flex items-center justify-between text-xs font-bold">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="w-4 h-4 border-2 border-black"
                                />
                                Ingat Sesi Saya
                            </label>
                        </div>

                        <NeoButton
                            type="submit"
                            variant="coral"
                            size="md"
                            fullWidth
                            disabled={submitting}
                        >
                            <KeyRound className="w-4 h-4 mr-1" />
                            {submitting ? 'Mengotentikasi...' : 'Masuk ke Dashboard'}
                        </NeoButton>
                    </form>
                </NeoCard>
            </div>
        </div>
    );
}
