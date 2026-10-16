import React from 'react';
import NeoCard from '@/Components/UI/NeoCard';
import { BookOpen, CheckSquare, PenTool, Users } from 'lucide-react';

export default function FeaturesSection() {
    return (
        <section className="py-16 bg-[#FFFDF8] border-b-3 border-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black font-heading uppercase mb-3 text-black">
                        Editor Multi-Komponen Terpadu
                    </h2>
                    <p className="text-sm sm:text-base text-neutral-700 font-medium">
                        Satu catatan menampung teks kaya, checklist tugas interaktif dengan animasi confetti,
                        sketsa tangan bebas kanvas HTML5, serta pengunggah file dengan batasan dinamis.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <NeoCard color="bg-white" shadowSize="md" hoverEffect className="p-6">
                        <div className="w-12 h-12 bg-[#FFDC58] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-4">
                            <BookOpen className="w-6 h-6 text-black" />
                        </div>
                        <h3 className="font-heading font-black text-lg mb-2 text-black">TipTap Rich Text</h3>
                        <p className="text-xs text-neutral-700 font-medium leading-relaxed">
                            Format tulisan lengkap: heading, bold, italic, bullet list, quote, hingga code block dengan navigasi cepat.
                        </p>
                    </NeoCard>

                    <NeoCard color="bg-white" shadowSize="md" hoverEffect className="p-6">
                        <div className="w-12 h-12 bg-[#7FBC8C] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-4">
                            <CheckSquare className="w-6 h-6 text-black" />
                        </div>
                        <h3 className="font-heading font-black text-lg mb-2 text-black">Checklist & Confetti</h3>
                        <p className="text-xs text-neutral-700 font-medium leading-relaxed">
                            Coret daftar tugas satu per satu dengan persentase progres dinamis dan perayaan confetti saat semua tugas tuntas.
                        </p>
                    </NeoCard>

                    <NeoCard color="bg-white" shadowSize="md" hoverEffect className="p-6">
                        <div className="w-12 h-12 bg-[#A388EE] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-4">
                            <PenTool className="w-6 h-6 text-black" />
                        </div>
                        <h3 className="font-heading font-black text-lg mb-2 text-black">Sketsa Tangan Kanvas</h3>
                        <p className="text-xs text-neutral-700 font-medium leading-relaxed">
                            Goreskan diagram, coretan cepat, atau tanda tangan dengan pilihan palet warna tebal dan fitur touch lock mobile.
                        </p>
                    </NeoCard>

                    <NeoCard color="bg-white" shadowSize="md" hoverEffect className="p-6">
                        <div className="w-12 h-12 bg-[#69D2E7] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-4">
                            <Users className="w-6 h-6 text-black" />
                        </div>
                        <h3 className="font-heading font-black text-lg mb-2 text-black">Kolaborasi Berlapis</h3>
                        <p className="text-xs text-neutral-700 font-medium leading-relaxed">
                            Bagikan seluruh ruang kerja aplikasi atau isolasi kolaborasi hanya pada satu catatan tertentu tanpa membocorkan materi lainnya.
                        </p>
                    </NeoCard>
                </div>
            </div>
        </section>
    );
}
