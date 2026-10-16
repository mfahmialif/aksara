import React, { useState } from 'react';
import MemberLayout from '@/Layouts/MemberLayout';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { Plus, BookOpen } from 'lucide-react';
import { WorkspacePageProps } from './types';
import CreateAppModal from './components/CreateAppModal';
import AppCard from './components/AppCard';
import SharedAppsSection from './components/SharedAppsSection';
import StandaloneNotesSection from './components/StandaloneNotesSection';

export default function WorkspaceIndex({
    my_apps = [],
    shared_apps = [],
    standalone_notes = [],
}: WorkspacePageProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const themeColors: Record<string, string> = {
        yellow: 'bg-[#FFDC58]',
        purple: 'bg-[#A388EE]',
        mint: 'bg-[#7FBC8C]',
        coral: 'bg-[#FF6B6B]',
        sky: 'bg-[#69D2E7]',
        pink: 'bg-[#FF8FAB]',
        orange: 'bg-[#FFA94D]',
    };

    return (
        <MemberLayout title="Ruang Kerja Aksara">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b-2 border-black">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black font-heading uppercase text-black">
                        Ruang Kerja Catatanku
                    </h1>
                    <p className="text-sm text-neutral-600 font-medium">
                        Kelola ruang kerja, mata kuliah, proyek, dan catatan kolaboratif Anda.
                    </p>
                </div>

                <NeoButton variant="yellow" size="md" onClick={() => setCreateModalOpen(true)}>
                    <Plus className="w-5 h-5 mr-1" />
                    Tambah Aplikasi
                </NeoButton>
            </div>

            {/* SECTION 1: MY APPS */}
            <section className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                    <NeoBadge variant="yellow">Level 1</NeoBadge>
                    <h2 className="text-xl font-black font-heading uppercase text-black">
                        Aplikasi Catatanku ({my_apps.length})
                    </h2>
                </div>

                {my_apps.length === 0 ? (
                    <div className="p-8 border-2 border-black bg-white text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                        <p className="font-heading font-bold text-neutral-700 mb-3">
                            Anda belum memiliki Aplikasi Catatan.
                        </p>
                        <NeoButton variant="yellow" size="sm" onClick={() => setCreateModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-1" />
                            Buat Aplikasi Pertama
                        </NeoButton>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {my_apps.map((app) => (
                            <AppCard
                                key={app.id}
                                app={app}
                                themeBg={themeColors[app.color_theme] || themeColors.yellow}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* SECTION 2: SHARED APPS (App-Level Collaboration) */}
            <SharedAppsSection sharedApps={shared_apps} />

            {/* SECTION 3: STANDALONE NOTES (Note-Level Collaboration) */}
            <StandaloneNotesSection standaloneNotes={standalone_notes} />

            {/* CREATE APP MODAL */}
            <CreateAppModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
            />
        </MemberLayout>
    );
}
