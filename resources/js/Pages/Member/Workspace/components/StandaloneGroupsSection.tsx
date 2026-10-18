import React from 'react';
import { NoteGroup } from '@/types';
import NeoCard from '@/Components/UI/NeoCard';
import { NeoBadge } from '@/Components/UI/NeoInput';
import DebouncedPrefetchLink from '@/Components/DebouncedPrefetchLink';
import { FolderKanban, ArrowRight } from 'lucide-react';

interface StandaloneGroupsSectionProps {
    standaloneGroups: NoteGroup[];
}

export default function StandaloneGroupsSection({ standaloneGroups }: StandaloneGroupsSectionProps) {
    if (!standaloneGroups || standaloneGroups.length === 0) return null;

    return (
        <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
                <NeoBadge variant="purple">Kolaborasi Folder</NeoBadge>
                <h2 className="text-xl font-black font-heading uppercase text-black">
                    Folder Khusus Dibagikan ke Saya ({standaloneGroups.length})
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {standaloneGroups.map((group) => {
                    const bgColor = group.color || '#FFDC58';

                    return (
                        <NeoCard
                            key={group.id}
                            color="bg-white"
                            shadowSize="md"
                            hoverEffect
                            className="flex flex-col justify-between overflow-hidden"
                        >
                            <div>
                                <div
                                    className="p-4 border-b-2 border-black flex items-center justify-between"
                                    style={{ backgroundColor: bgColor }}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <FolderKanban className="w-5 h-5 text-black" />
                                        </div>
                                        <div>
                                            <h3 className="font-heading font-black text-lg text-black truncate max-w-[180px]">
                                                {group.name}
                                            </h3>
                                            <p className="text-[10px] text-neutral-800 font-bold">
                                                Ruang kerja: {group.app?.name || 'Aksara'} &bull;{' '}
                                                {group.notes_count ?? group.notes?.length ?? 0} Catatan
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 space-y-3">
                                    <p className="text-xs text-neutral-600 line-clamp-2 font-medium min-h-[32px]">
                                        Dibuat oleh: {group.app?.owner?.name} ({group.app?.owner?.email})
                                    </p>
                                    <span className="inline-block text-[11px] font-bold text-neutral-700 bg-[#F4F0EA] px-2 py-0.5 border border-black">
                                        Akses kolaborasi terisolasi hanya pada folder ini.
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 pt-0">
                                <DebouncedPrefetchLink
                                    href={`/groups/${group.id}`}
                                    prefetch="hover"
                                    cacheFor="1m"
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-neutral-100 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-heading font-bold text-xs uppercase transition-all"
                                >
                                    Buka Folder Ini
                                    <ArrowRight className="w-4 h-4" />
                                </DebouncedPrefetchLink>
                            </div>
                        </NeoCard>
                    );
                })}
            </div>
        </section>
    );
}
