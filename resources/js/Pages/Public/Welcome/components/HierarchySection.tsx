import React from 'react';

export default function HierarchySection() {
    return (
        <section className="py-16 bg-[#FFFDF8]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black font-heading uppercase text-black">
                        Arsitektur Hierarki 3-Tingkat
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-xs font-black bg-[#FFDC58] px-2 py-0.5 border border-black mb-3 inline-block">
                            LEVEL 1
                        </span>
                        <h4 className="font-heading font-black text-lg mb-2 text-black">Aplikasi Catatan (Workspace)</h4>
                        <p className="text-xs text-neutral-700 font-medium">
                            Ruang kerja independen seperti <em>Catatan Tugas Kuliah</em>, <em>Proyek Freelance</em>, atau <em>Jurnal Pribadi</em> dengan tema warna dan izin khusus.
                        </p>
                    </div>

                    <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-xs font-black bg-[#A388EE] px-2 py-0.5 border border-black mb-3 inline-block text-black">
                            LEVEL 2
                        </span>
                        <h4 className="font-heading font-black text-lg mb-2 text-black">Grup (Folder Topik)</h4>
                        <p className="text-xs text-neutral-700 font-medium">
                            Pengelompokan materi seperti <em>Bahasa Indonesia</em>, <em>Bahasa Inggris</em>, dan <em>Bahasa Arab</em> yang dapat diurutkan secara dinamis.
                        </p>
                    </div>

                    <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-xs font-black bg-[#7FBC8C] px-2 py-0.5 border border-black mb-3 inline-block text-black">
                            LEVEL 3
                        </span>
                        <h4 className="font-heading font-black text-lg mb-2 text-black">Catatan (Biasa & Tugas)</h4>
                        <p className="text-xs text-neutral-700 font-medium">
                            Catatan multi-komponen dengan opsi pengingat deadline otomatis dan kuota upload file yang divalidasi langsung dari database admin.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
