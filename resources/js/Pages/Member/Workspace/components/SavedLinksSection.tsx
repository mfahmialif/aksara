import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { SavedSharedLink } from '@/types';
import NeoCard from '@/Components/UI/NeoCard';
import { NeoBadge } from '@/Components/UI/NeoInput';
import DebouncedPrefetchLink from '@/Components/DebouncedPrefetchLink';
import { ArrowRight, Folder, FileText, Trash2, User } from 'lucide-react';
import { getCsrfToken } from '@/utils/csrf';

interface SavedLinksSectionProps {
    savedLinks: SavedSharedLink[];
}

export default function SavedLinksSection({ savedLinks }: SavedLinksSectionProps) {
    if (!savedLinks || savedLinks.length === 0) return null;

    const [removingId, setRemovingId] = useState<string | null>(null);

    const handleRemove = async (link: SavedSharedLink) => {
        if (!confirm(`Hapus tautan "${link.title || 'Tautan'}" dari daftar tersimpan Anda?`)) {
            return;
        }

        setRemovingId(link.id);
        try {
            const csrfToken = getCsrfToken();
            await fetch('/saved-links', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    item_type: link.item_type,
                    item_id: link.item_id,
                }),
            });

            router.reload({ only: ['saved_other_links', 'counts'] });
        } catch {
            setRemovingId(null);
        }
    };

    return (
        <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
                <NeoBadge variant="mint">Tautan Khusus Tersimpan</NeoBadge>
                <h2 className="text-xl font-black font-heading uppercase text-black">
                    Topik & Catatan Tersimpan ({savedLinks.length})
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedLinks.map((link) => (
                    <NeoCard
                        key={link.id}
                        color="bg-white"
                        shadowSize="md"
                        hoverEffect
                        className="flex flex-col justify-between overflow-hidden"
                    >
                        <div>
                            <div className="bg-[#7FBC8C] p-4 border-b-2 border-black flex items-center justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                        {link.item_type === 'group' ? (
                                            <Folder className="w-5 h-5 text-black" />
                                        ) : (
                                            <FileText className="w-5 h-5 text-black" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-heading font-black text-lg text-black truncate max-w-[180px]">
                                            {link.title || 'Tautan Publik'}
                                        </h3>
                                        <p className="text-[10px] text-neutral-800 font-bold truncate max-w-[180px]">
                                            {link.item_type === 'group' ? 'Topik / Folder Dibagikan' : 'Catatan Dibagikan'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleRemove(link)}
                                    disabled={removingId === link.id}
                                    title="Hapus dari daftar tersimpan"
                                    className="p-1.5 bg-white hover:bg-rose-400 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-black" />
                                </button>
                            </div>

                            <div className="p-4 space-y-2.5">
                                <div className="space-y-1 text-xs">
                                    <p className="text-neutral-700 font-medium">
                                        {link.note_app?.name ? (
                                            <>
                                                <span className="font-bold text-black">Ruang Kerja:</span> "{link.note_app.name}"
                                            </>
                                        ) : (
                                            'Tautan publik tersimpan di akun Anda.'
                                        )}
                                    </p>

                                    {link.note_app?.owner && (
                                        <div className="flex items-center gap-1.5 text-neutral-800 pt-0.5">
                                            {link.note_app.owner.avatar ? (
                                                <img
                                                    src={link.note_app.owner.avatar}
                                                    alt={link.note_app.owner.name}
                                                    className="w-4 h-4 rounded-full border border-black object-cover shrink-0"
                                                />
                                            ) : (
                                                <User className="w-3.5 h-3.5 text-black shrink-0" />
                                            )}
                                            <span className="truncate">
                                                <span className="font-bold text-black">Pemilik:</span> {link.note_app.owner.name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-0.5">
                                    <span className="inline-block text-[11px] font-bold text-emerald-900 bg-[#E8F5E9] px-2 py-0.5 border border-black uppercase">
                                        {link.item_type === 'group' ? 'Topik Tersimpan' : 'Catatan Tersimpan'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 pt-0">
                            <DebouncedPrefetchLink
                                href={link.share_url}
                                prefetch="hover"
                                cacheFor="1m"
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-[#FFDC58] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-heading font-bold text-xs uppercase transition-all"
                            >
                                Buka Tautan Tersimpan
                                <ArrowRight className="w-4 h-4" />
                            </DebouncedPrefetchLink>
                        </div>
                    </NeoCard>
                ))}
            </div>
        </section>
    );
}
