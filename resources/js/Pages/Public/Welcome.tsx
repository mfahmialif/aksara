import React from 'react';
import { Head } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import NeoButton from '@/Components/UI/NeoButton';
import NeoCard from '@/Components/UI/NeoCard';
import { NeoBadge } from '@/Components/UI/NeoInput';
import {
    BookOpen, CheckSquare, PenTool, Sparkles,
    ArrowRight, Users
} from 'lucide-react';

export default function Welcome() {

    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            <Head title="Sistem Aplikasi Catatan Kolaboratif" />
            <Navbar />

            <main className="flex-1">
                {/* HERO SECTION */}
                <section className="relative border-b-3 border-black bg-[#FFFDF8] overflow-hidden py-16 md:py-24">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-10 right-10 w-32 h-32 bg-[#FFDC58] border-2 border-black rotate-12 hidden lg:block -z-0 opacity-80" />
                    <div className="absolute bottom-10 left-10 w-24 h-24 bg-[#A388EE] border-2 border-black -rotate-6 hidden lg:block -z-0 opacity-80" />

                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 mb-6">
                            <NeoBadge variant="purple" className="text-xs px-3 py-1">
                                <Sparkles className="w-3.5 h-3.5 mr-1" />
                                Neobrutalism Edition
                            </NeoBadge>
                            <NeoBadge variant="mint" className="text-xs px-3 py-1">
                                Hierarki 3-Level
                            </NeoBadge>
                        </div>

                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-heading text-black tracking-tight leading-[1.05] mb-6 uppercase">
                            Catatan & Tugas Tanpa Batas,{' '}
                            <span className="bg-[#FFDC58] px-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] inline-block mt-2">
                                Kolaborasi Nyata.
                            </span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-800 font-medium mb-10 leading-relaxed">
                            Organisir catatan ke dalam <strong>Ruang Kerja</strong>, kelompokkan ke dalam <strong>Grup Topik</strong>,
                            dan buat catatan lengkap dengan <em>Rich Text</em>, <em>Checklist Interaktif</em>, <em>Sketsa Kanvas</em>,
                            serta lampiran multi-file bebas.
                        </p>

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
                                            d="M12.18 4.9c1.47 0 2.79.51 3.83 1.5l2.87-2.87C17.14 1.9 14.88 1 12.18 1 8.27 1 4.86 3.28 3.21 6.43l3.38 2.6c.79-2.37 2.99-4.13 5.59-4.13z"
                                        />
                                    </svg>
                                    Masuk dengan Google
                                    <ArrowRight className="w-5 h-5 ml-1" />
                                </NeoButton>
                            </a>
                        </div>
                    </div>
                </section>

                {/* FEATURE SHOWCASE GRID */}
                <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <NeoBadge variant="coral" className="text-xs mb-3">
                            Fitur Lengkap
                        </NeoBadge>
                        <h2 className="text-3xl sm:text-4xl font-black font-heading uppercase">
                            Editor Multi-Komponen & Kolaborasi Granular
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Feature 1 */}
                        <NeoCard color="bg-[#FFFDF8]" shadowSize="md" hoverEffect className="p-5 flex flex-col">
                            <div className="w-12 h-12 bg-[#FFDC58] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-4">
                                <BookOpen className="w-6 h-6 text-black" />
                            </div>
                            <h3 className="font-heading font-black text-lg mb-2 uppercase">Rich Text & Format</h3>
                            <p className="text-xs text-neutral-700 leading-relaxed font-medium flex-1">
                                Heading H1–H3, Bold, Italic, Code block, Quote, dan sorotan warna kontras untuk membedakan intisari materi.
                            </p>
                        </NeoCard>

                        {/* Feature 2 */}
                        <NeoCard color="bg-[#FFFDF8]" shadowSize="md" hoverEffect className="p-5 flex flex-col">
                            <div className="w-12 h-12 bg-[#7FBC8C] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-4">
                                <CheckSquare className="w-6 h-6 text-black" />
                            </div>
                            <h3 className="font-heading font-black text-lg mb-2 uppercase">Checklist & Progress</h3>
                            <p className="text-xs text-neutral-700 leading-relaxed font-medium flex-1">
                                To-do list interaktif dengan indikator persentase penyelesaian dan animasi selebrasi saat target tuntas 100%.
                            </p>
                        </NeoCard>

                        {/* Feature 3 */}
                        <NeoCard color="bg-[#FFFDF8]" shadowSize="md" hoverEffect className="p-5 flex flex-col">
                            <div className="w-12 h-12 bg-[#A388EE] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-4">
                                <PenTool className="w-6 h-6 text-black" />
                            </div>
                            <h3 className="font-heading font-black text-lg mb-2 uppercase">Kanvas Sketsa & Touch</h3>
                            <p className="text-xs text-neutral-700 leading-relaxed font-medium flex-1">
                                Coretan bebas, diagram, dan mindmap langsung di kanvas sentuh yang mengunci scrolling layar saat menggambar.
                            </p>
                        </NeoCard>

                        {/* Feature 4 */}
                        <NeoCard color="bg-[#FFFDF8]" shadowSize="md" hoverEffect className="p-5 flex flex-col">
                            <div className="w-12 h-12 bg-[#69D2E7] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-black" />
                            </div>
                            <h3 className="font-heading font-black text-lg mb-2 uppercase">Granular Sharing</h3>
                            <p className="text-xs text-neutral-700 leading-relaxed font-medium flex-1">
                                Bagikan seluruh ruang kerja aplikasi atau isolasi kolaborasi hanya pada satu catatan tertentu tanpa membocorkan materi lainnya.
                            </p>
                        </NeoCard>
                    </div>
                </section>

                {/* HIERARCHY SECTION */}
                <section className="py-16 bg-[#F4F0EA] border-t-3 border-b-3 border-black">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-10">
                            <NeoBadge variant="yellow" className="text-xs mb-3">
                                Struktur Terorganisir
                            </NeoBadge>
                            <h2 className="text-3xl sm:text-4xl font-black font-heading uppercase">
                                Arsitektur Hierarki 3-Tingkat
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <span className="text-xs font-black bg-[#FFDC58] px-2 py-0.5 border border-black mb-3 inline-block">
                                    LEVEL 1
                                </span>
                                <h4 className="font-heading font-black text-lg mb-2">Aplikasi Catatan (Workspace)</h4>
                                <p className="text-xs text-neutral-700 font-medium">
                                    Ruang kerja independen seperti <em>Catatan Tugas Kuliah</em>, <em>Proyek Freelance</em>, atau <em>Jurnal Pribadi</em> dengan tema warna dan izin khusus.
                                </p>
                            </div>

                            <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <span className="text-xs font-black bg-[#A388EE] px-2 py-0.5 border border-black mb-3 inline-block text-black">
                                    LEVEL 2
                                </span>
                                <h4 className="font-heading font-black text-lg mb-2">Grup (Folder Topik)</h4>
                                <p className="text-xs text-neutral-700 font-medium">
                                    Pengelompokan materi seperti <em>Bahasa Indonesia</em>, <em>Bahasa Inggris</em>, dan <em>Bahasa Arab</em> yang dapat diurutkan secara dinamis.
                                </p>
                            </div>

                            <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <span className="text-xs font-black bg-[#7FBC8C] px-2 py-0.5 border border-black mb-3 inline-block text-black">
                                    LEVEL 3
                                </span>
                                <h4 className="font-heading font-black text-lg mb-2">Catatan (Biasa & Tugas)</h4>
                                <p className="text-xs text-neutral-700 font-medium">
                                    Catatan multi-komponen dengan opsi pengingat deadline otomatis dan kuota upload file yang divalidasi langsung dari database admin.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="border-t-2 border-black bg-white py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-xs font-bold text-neutral-700 uppercase tracking-widest font-heading">
                        Sistem Catatan Kolaboratif &bull; Neobrutalism Design Standard &bull; Laravel + Inertia React
                    </p>
                </div>
            </footer>
        </div>
    );
}
