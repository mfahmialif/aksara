import React from 'react';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { Sparkles, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface HeroSectionProps {
    flashError?: string | null;
    flashSuccess?: string | null;
    flashInfo?: string | null;
}

export default function HeroSection({ flashError, flashSuccess, flashInfo }: HeroSectionProps) {
    return (
        <section className="relative border-b-3 border-black bg-[#FFFDF8] overflow-hidden py-16 md:py-24">
            {/* Decorative Background Elements */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-[#FFDC58] border-2 border-black rotate-12 hidden lg:block -z-0 opacity-80" />
            <div className="absolute bottom-10 left-10 w-24 h-24 bg-[#A388EE] border-2 border-black -rotate-6 hidden lg:block -z-0 opacity-80" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                <div className="inline-flex items-center gap-2 mb-6">
                    <NeoBadge variant="purple" className="text-xs px-3 py-1 font-mono">
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        aksara.barakode.id
                    </NeoBadge>
                    <NeoBadge variant="mint" className="text-xs px-3 py-1">
                        Neobrutalism Edition
                    </NeoBadge>
                </div>

                <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-heading text-black tracking-tight leading-[1.05] mb-6 uppercase">
                    Aksara: Catatan & Tugas,{' '}
                    <span className="bg-[#FFDC58] px-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] inline-block mt-2">
                        Kolaborasi Nyata.
                    </span>
                </h1>

                <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-800 font-medium mb-10 leading-relaxed">
                    Organisir catatan ke dalam <strong>Ruang Kerja</strong>, kelompokkan ke dalam <strong>Grup Topik</strong>,
                    dan buat catatan lengkap dengan <em>Rich Text</em>, <em>Checklist Interaktif</em>, <em>Sketsa Kanvas</em>,
                    serta lampiran multi-file bebas.
                </p>

                {/* Alert Banner if Google OAuth is not configured or error occurs */}
                {flashError && (
                    <div className="max-w-xl mx-auto mb-8 p-4 bg-[#FFE8E8] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex items-start gap-3.5">
                        <div className="w-8 h-8 bg-rose-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-heading font-black text-sm uppercase text-black">
                                Pemberitahuan Sistem
                            </h4>
                            <p className="text-xs sm:text-sm font-bold text-neutral-800 mt-1 leading-snug">
                                {flashError}
                            </p>
                        </div>
                    </div>
                )}

                {flashSuccess && (
                    <div className="max-w-xl mx-auto mb-8 p-4 bg-[#E8F8EE] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex items-start gap-3.5">
                        <div className="w-8 h-8 bg-emerald-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-heading font-black text-sm uppercase text-black">
                                Berhasil
                            </h4>
                            <p className="text-xs sm:text-sm font-bold text-neutral-800 mt-1 leading-snug">
                                {flashSuccess}
                            </p>
                        </div>
                    </div>
                )}

                {flashInfo && (
                    <div className="max-w-xl mx-auto mb-8 p-4 bg-[#E8F0FE] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex items-start gap-3.5">
                        <div className="w-8 h-8 bg-sky-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 mt-0.5">
                            <Info className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-heading font-black text-sm uppercase text-black">
                                Akses Masuk Diperlukan
                            </h4>
                            <p className="text-xs sm:text-sm font-bold text-neutral-800 mt-1 leading-snug">
                                {flashInfo}
                            </p>
                        </div>
                    </div>
                )}

                {/* Primary Single CTA Button for Google OAuth */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                    <a href="/auth/google/redirect" className="w-full sm:w-auto">
                        <NeoButton variant="yellow" size="lg" className="w-full sm:w-auto text-base sm:text-lg">
                            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                                <path
                                    fill="#000000"
                                    d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.25-.94 2.31-2 3.03v2.52h3.24c1.9-1.75 2.99-4.33 2.99-7.43 0-.71-.06-1.4-.33-2.1z"
                                />
                                <path
                                    fill="#000000"
                                    d="M12.18 21c2.7 0 4.96-.9 6.62-2.43l-3.24-2.52c-.9.6-2.05.95-3.38.95-2.6 0-4.8-1.76-5.59-4.13H3.21v2.6C4.86 18.72 8.27 21 12.18 21z"
                                />
                                <path
                                    fill="#000000"
                                    d="M6.59 12.87c-.2-.6-.31-1.25-.31-1.92s.11-1.32.31-1.92V6.43H3.21C2.55 7.74 2.18 9.21 2.18 10.95s.37 3.21 1.03 4.52l3.38-2.6z"
                                />
                                <path
                                    fill="#000000"
                                    d="M12.18 5.43c1.47 0 2.8.5 3.84 1.49l2.87-2.87C17.14 2.4 14.88 1.5 12.18 1.5 8.27 1.5 4.86 3.78 3.21 6.43l3.38 2.6c.79-2.37 2.99-4.13 5.59-4.13z"
                                />
                            </svg>
                            Masuk dengan Akun Google
                        </NeoButton>
                    </a>
                </div>

                <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
                    Langsung aktif tanpa pendaftaran formulir rumit.
                </p>
            </div>
        </section>
    );
}
