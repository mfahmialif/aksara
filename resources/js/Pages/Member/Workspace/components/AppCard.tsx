import React from 'react';
import { NoteApp } from '@/types';
import NeoCard from '@/Components/UI/NeoCard';
import DebouncedPrefetchLink from '@/Components/DebouncedPrefetchLink';
import { BookOpen, Globe, Lock, ArrowRight } from 'lucide-react';

interface AppCardProps {
    app: NoteApp;
    themeBg: string;
}

export default function AppCard({ app, themeBg }: AppCardProps) {
    const totalNotes = app.groups?.reduce((acc, g) => acc + (g.notes?.length || 0), 0) || 0;

    return (
        <NeoCard
            color="bg-white"
            shadowSize="md"
            hoverEffect
            className="flex flex-col justify-between overflow-hidden"
        >
            <div>
                {/* Colored Top Header */}
                <div className={`${themeBg} p-4 border-b-2 border-black flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <BookOpen className="w-5 h-5 text-black" />
                        </div>
                        <h3 className="font-heading font-black text-lg text-black truncate max-w-[180px]">
                            {app.name}
                        </h3>
                    </div>

                    <span title={app.is_public ? 'Publik' : 'Privat'}>
                        {app.is_public ? (
                            <Globe className="w-4 h-4 text-black" />
                        ) : (
                            <Lock className="w-4 h-4 text-black/60" />
                        )}
                    </span>
                </div>

                <div className="p-4 space-y-3">
                    <p className="text-xs text-neutral-600 line-clamp-2 font-medium min-h-[32px]">
                        {app.description || 'Tidak ada deskripsi ruang kerja.'}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
                        <span className="px-2 py-0.5 bg-[#F4F0EA] border border-black">
                            {app.groups?.length || 0} Grup
                        </span>
                        <span className="px-2 py-0.5 bg-[#F4F0EA] border border-black">
                            {totalNotes} Catatan
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-4 pt-0">
                <DebouncedPrefetchLink
                    href={`/app/${app.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-neutral-100 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-heading font-bold text-xs uppercase transition-all active:translate-x-0.5 active:translate-y-0.5"
                >
                    Buka Workspace
                    <ArrowRight className="w-4 h-4" />
                </DebouncedPrefetchLink>
            </div>
        </NeoCard>
    );
}
