import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import NeoCard from '@/Components/UI/NeoCard';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoInput, NeoSelect, NeoBadge } from '@/Components/UI/NeoInput';
import {
    Mail, Server, Key, ShieldCheck, HelpCircle,
    Eye, EyeOff, Save, CheckCircle2, AlertTriangle,
    ExternalLink, Sparkles, Terminal, ChevronDown, ChevronUp
} from 'lucide-react';
import { SystemSettings } from '@/types';

interface SmtpSettingsCardProps {
    settings: SystemSettings;
    onNavigateToTesting?: () => void;
}

export default function SmtpSettingsCard({ settings, onNavigateToTesting }: SmtpSettingsCardProps) {
    const [mailer, setMailer] = useState<'smtp' | 'log'>(settings.mail_mailer || 'smtp');
    const [host, setHost] = useState(settings.mail_host ?? 'smtp.gmail.com');
    const [port, setPort] = useState<number>(settings.mail_port ? Number(settings.mail_port) : 587);
    const [encryption, setEncryption] = useState<'tls' | 'ssl' | 'none'>(settings.mail_encryption || 'tls');
    const [username, setUsername] = useState(settings.mail_username || '');
    const [password, setPassword] = useState(settings.mail_password || '');
    const [fromAddress, setFromAddress] = useState(settings.mail_from_address || 'no-reply@aksara.local');
    const [fromName, setFromName] = useState(settings.mail_from_name || 'Aksara Notes');

    const [showPassword, setShowPassword] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applyPreset = (type: 'gmail' | 'mailtrap' | 'hostinger' | 'log') => {
        setError(null);
        if (type === 'gmail') {
            setMailer('smtp');
            setHost('smtp.gmail.com');
            setPort(587);
            setEncryption('tls');
            if (!fromName) setFromName('Aksara Notes');
            setShowGuide(true);
        } else if (type === 'mailtrap') {
            setMailer('smtp');
            setHost('sandbox.smtp.mailtrap.io');
            setPort(2525);
            setEncryption('tls');
        } else if (type === 'hostinger') {
            setMailer('smtp');
            setHost('smtp.hostinger.com');
            setPort(465);
            setEncryption('ssl');
        } else if (type === 'log') {
            setMailer('log');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        router.put(
            '/admin/settings/mail',
            {
                mail_mailer: mailer,
                mail_host: host,
                mail_port: port,
                mail_encryption: encryption,
                mail_username: username,
                mail_password: password,
                mail_from_address: fromAddress,
                mail_from_name: fromName,
            },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
                onError: (err) => {
                    const firstErr = Object.values(err)[0];
                    setError(typeof firstErr === 'string' ? firstErr : 'Terjadi kesalahan saat menyimpan pengaturan SMTP.');
                },
            }
        );
    };

    return (
        <NeoCard color="bg-white" shadowSize="lg" className="p-6 sm:p-8 space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-black">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFDC58] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                        <Mail className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-heading font-black uppercase text-black">
                                Konfigurasi SMTP & Server Email
                            </h3>
                            <NeoBadge variant={mailer === 'smtp' ? 'mint' : 'yellow'}>
                                {mailer === 'smtp' ? 'SMTP Aktif' : 'Mode Log (Lokal)'}
                            </NeoBadge>
                        </div>
                        <p className="text-xs text-neutral-600 font-medium mt-0.5">
                            Atur kredensial email agar sistem dapat mengirim notifikasi tugas dan pengingat deadline ke inbox pengguna.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFDF8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-heading font-black uppercase hover:bg-neutral-100 transition-all cursor-pointer self-start sm:self-auto"
                >
                    <HelpCircle className="w-4 h-4 text-black" />
                    <span>{showGuide ? 'Tutup Bantuan' : 'Panduan Gmail & SMTP'}</span>
                    {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
            </div>

            {/* Quick Presets */}
            <div className="p-4 bg-[#FFFDF8] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-black" />
                        <span className="text-xs font-black uppercase font-heading text-black">
                            Template Cepat (Quick Presets)
                        </span>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-bold hidden sm:inline">
                        Klik salah satu untuk otomatis mengisi parameter host & port
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                        type="button"
                        onClick={() => applyPreset('gmail')}
                        className="px-3 py-2 bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none text-xs font-black font-heading uppercase text-left transition-all cursor-pointer flex flex-col"
                    >
                        <span>🔴 Gmail (Google)</span>
                        <span className="text-[10px] font-sans font-medium text-neutral-700">Port 587 (TLS)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => applyPreset('mailtrap')}
                        className="px-3 py-2 bg-[#69D2E7] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none text-xs font-black font-heading uppercase text-left transition-all cursor-pointer flex flex-col"
                    >
                        <span>🧪 Mailtrap (Testing)</span>
                        <span className="text-[10px] font-sans font-medium text-neutral-700">Port 2525 (TLS)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => applyPreset('hostinger')}
                        className="px-3 py-2 bg-[#A388EE] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none text-xs font-black font-heading uppercase text-left transition-all cursor-pointer flex flex-col"
                    >
                        <span>🌐 Hostinger / cPanel</span>
                        <span className="text-[10px] font-sans font-medium text-neutral-700">Port 465 (SSL)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => applyPreset('log')}
                        className="px-3 py-2 bg-[#E2E8F0] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none text-xs font-black font-heading uppercase text-left transition-all cursor-pointer flex flex-col"
                    >
                        <span>📝 Mode Log (Lokal)</span>
                        <span className="text-[10px] font-sans font-medium text-neutral-700">Tanpa Kirim Asli</span>
                    </button>
                </div>
            </div>

            {/* EXPANDABLE GUIDE / HELP ACCORDION */}
            {showGuide && (
                <div className="p-4 sm:p-5 bg-[#FEF3C7] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                    <div className="flex items-center gap-2">
                        <NeoBadge variant="yellow">💡 Panduan Langkah demi Langkah</NeoBadge>
                        <h4 className="text-sm font-black font-heading uppercase text-black">
                            Cara Menghubungkan Gmail via Google App Password
                        </h4>
                    </div>

                    <div className="text-xs text-neutral-800 space-y-2.5 font-medium leading-relaxed">
                        <div className="flex gap-2.5 items-start">
                            <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                                1
                            </span>
                            <p>
                                <strong>Buka Keamanan Akun Google:</strong> Akses{' '}
                                <a
                                    href="https://myaccount.google.com/security"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline font-bold text-blue-700 inline-flex items-center gap-0.5 hover:text-black"
                                >
                                    myaccount.google.com/security <ExternalLink className="w-3 h-3" />
                                </a>{' '}
                                pada browser tempat Anda login akun Google Anda.
                            </p>
                        </div>

                        <div className="flex gap-2.5 items-start">
                            <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                                2
                            </span>
                            <p>
                                <strong>Aktifkan Verifikasi 2-Langkah:</strong> Di bagian <em>"Cara Anda login ke Google"</em>, pastikan <strong>Verifikasi 2 Langkah (2-Step Verification)</strong> aktif. Fitur sandi aplikasi hanya bisa dibuat jika verifikasi 2 langkah sudah aktif.
                            </p>
                        </div>

                        <div className="flex gap-2.5 items-start">
                            <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                                3
                            </span>
                            <p>
                                <strong>Buat Sandi Aplikasi:</strong> Ketik <code className="bg-white px-1.5 py-0.5 border border-black font-mono font-bold text-black">Sandi Aplikasi</code> (atau <em>App Passwords</em>) di kolom pencarian atas halaman akun Google.
                            </p>
                        </div>

                        <div className="flex gap-2.5 items-start">
                            <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                                4
                            </span>
                            <p>
                                <strong>Beri Nama & Salin Sandi:</strong> Beri nama aplikasi (misal: <code className="bg-white px-1 py-0.5 border border-black font-mono">Aksara Notes</code>), klik <strong>Buat</strong>. Google akan memberikan 16 karakter sandi acak (contoh: <code className="bg-white px-1 py-0.5 border border-black font-mono font-bold">abcd efgh ijkl mnop</code>).
                            </p>
                        </div>

                        <div className="flex gap-2.5 items-start">
                            <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                                5
                            </span>
                            <p>
                                <strong>Tempelkan di Kolom Bawah:</strong> Masukkan 16 karakter tadi ke kolom <strong>Password SMTP</strong> di bawah ini, dan masukkan alamat Gmail Anda ke kolom <strong>Username SMTP</strong> serta <strong>Email Pengirim</strong>. Klik <strong>Simpan Pengaturan SMTP</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-black/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-700">
                        <span className="flex items-center gap-1 font-bold">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Kredensial disimpan aman di database aplikasi Aksara.
                        </span>
                        {onNavigateToTesting && (
                            <button
                                type="button"
                                onClick={onNavigateToTesting}
                                className="underline font-bold text-black hover:text-neutral-600 cursor-pointer"
                            >
                                Ingin langsung tes? Buka Testing Pengingat &rarr;
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3.5 bg-[#FF6B6B] border-2 border-black text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>{error}</div>
                    </div>
                )}

                {/* Mailer Driver & Host Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Mail Driver */}
                    <div>
                        <NeoSelect
                            label="Driver Email (Mailer)"
                            value={mailer}
                            onChange={(e) => setMailer(e.target.value as 'smtp' | 'log')}
                            helperText="Pilih SMTP untuk pengiriman asli, atau Log untuk testing lokal."
                        >
                            <option value="smtp">SMTP (Pengiriman Nyata)</option>
                            <option value="log">LOG (Catat di laravel.log)</option>
                        </NeoSelect>
                    </div>

                    {/* SMTP Host */}
                    <div className="sm:col-span-2">
                        <NeoInput
                            label="SMTP Host (Server)"
                            value={host}
                            onChange={(e) => setHost(e.target.value)}
                            placeholder="Contoh: smtp.gmail.com"
                            helperText="Alamat server SMTP penyedia email (contoh: smtp.gmail.com atau sandbox.smtp.mailtrap.io)."
                            disabled={mailer === 'log'}
                        />
                    </div>
                </div>

                {/* Port & Encryption */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <NeoInput
                            label="SMTP Port"
                            type="number"
                            value={port}
                            onChange={(e) => setPort(Number(e.target.value))}
                            placeholder="587"
                            helperText="Port standar: 587 (TLS/STARTTLS) atau 465 (SSL)."
                            disabled={mailer === 'log'}
                        />
                    </div>

                    <div>
                        <NeoSelect
                            label="Enkripsi (Encryption)"
                            value={encryption}
                            onChange={(e) => setEncryption(e.target.value as 'tls' | 'ssl' | 'none')}
                            helperText="Pilih TLS untuk port 587 (Gmail), atau SSL untuk port 465."
                            disabled={mailer === 'log'}
                        >
                            <option value="tls">TLS (Direkomendasikan - Port 587)</option>
                            <option value="ssl">SSL (Port 465)</option>
                            <option value="none">Tanpa Enkripsi (None)</option>
                        </NeoSelect>
                    </div>
                </div>

                {/* Username & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <NeoInput
                            label="Username SMTP (Email Login)"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="nama.anda@gmail.com"
                            helperText="Untuk Gmail, isi dengan alamat email Gmail lengkap Anda."
                            disabled={mailer === 'log'}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold uppercase tracking-wider text-black mb-1.5 font-heading">
                            Password / App Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="16 karakter Google App Password"
                                disabled={mailer === 'log'}
                                className="w-full px-3.5 py-2.5 bg-white text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 font-medium text-sm placeholder:text-neutral-400 pr-10 disabled:bg-neutral-100 disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-black cursor-pointer"
                                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-neutral-600 font-medium">
                            Untuk Gmail: Gunakan <strong>Google App Password</strong> (16 karakter tanpa spasi), bukan password email biasa.
                        </p>
                    </div>
                </div>

                {/* Sender Information (From Address & Name) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-black/10">
                    <div>
                        <NeoInput
                            label="Email Pengirim (From Address)"
                            type="email"
                            value={fromAddress}
                            onChange={(e) => setFromAddress(e.target.value)}
                            placeholder="no-reply@aksara.local"
                            helperText="Alamat email yang tertera sebagai pengirim saat user menerima notifikasi."
                            required
                        />
                    </div>

                    <div>
                        <NeoInput
                            label="Nama Pengirim (From Name)"
                            type="text"
                            value={fromName}
                            onChange={(e) => setFromName(e.target.value)}
                            placeholder="Aksara Notes"
                            helperText="Nama pengirim yang muncul di inbox email pengguna (misal: Aksara Notes)."
                            required
                        />
                    </div>
                </div>

                {/* Submit button bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t-2 border-black">
                    <div className="text-xs text-neutral-600 font-medium flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-black" />
                        <span>Pengaturan langsung diterapkan secara dinamis tanpa perlu restart web server.</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <NeoButton
                            type="submit"
                            variant="primary"
                            disabled={submitting}
                            className="w-full sm:w-auto"
                        >
                            <Save className="w-4 h-4" />
                            <span>{submitting ? 'Menyimpan...' : 'Simpan Konfigurasi SMTP'}</span>
                        </NeoButton>
                    </div>
                </div>
            </form>
        </NeoCard>
    );
}
