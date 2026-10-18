import React, { useState, useEffect, useRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import MemberLayout from '@/Layouts/MemberLayout';
import NeoButton from '@/Components/UI/NeoButton';
import DebouncedPrefetchLink from '@/Components/DebouncedPrefetchLink';
import { Plus, BookOpen, Search, X, FolderKanban, Users, Sparkles, Bookmark } from 'lucide-react';
import { PageProps, NoteApp } from '@/types';
import { WorkspacePageProps } from './types';
import CreateAppModal from './components/CreateAppModal';
import EditAppModal from '@/Components/Modals/EditAppModal';
import DuplicateAppModal from '@/Components/Modals/DuplicateAppModal';
import SyncWorkspaceModal from '@/Components/Modals/SyncWorkspaceModal';
import ClonesModal from '@/Components/Modals/ClonesModal';
import AppCard from './components/AppCard';
import StandaloneGroupsSection from './components/StandaloneGroupsSection';
import StandaloneNotesSection from './components/StandaloneNotesSection';
import SavedLinksSection from './components/SavedLinksSection';

export default function WorkspaceIndex({
    apps,
    standalone_groups = [],
    standalone_notes = [],
    saved_other_links = [],
    filters = { type: 'all', search: '', page: 1 },
    counts = { all: 0, my_apps: 0, shared: 0, saved: 0 },
    my_apps = [],
    shared_apps = [],
}: WorkspacePageProps) {
    const { auth } = usePage<PageProps>().props;
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<NoteApp | null>(null);
    const [duplicatingApp, setDuplicatingApp] = useState<NoteApp | null>(null);
    const [syncingApp, setSyncingApp] = useState<NoteApp | null>(null);
    const [clonesApp, setClonesApp] = useState<NoteApp | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [activeType, setActiveType] = useState<'all' | 'my_apps' | 'shared' | 'saved'>(filters?.type || 'all');

    const isInitialMount = useRef(true);

    // Sync from server props if URL / filters change
    useEffect(() => {
        setSearchQuery(filters?.search || '');
        setActiveType(filters?.type || 'all');
    }, [filters?.search, filters?.type]);

    // Debounced search
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const trimmedQuery = searchQuery.trim();
        const currentServerQuery = (filters?.search || '').trim();

        if (trimmedQuery === currentServerQuery) {
            return;
        }

        const timer = setTimeout(() => {
            const params: Record<string, any> = {};
            if (trimmedQuery) {
                params.search = trimmedQuery;
            }
            if (activeType !== 'all') {
                params.type = activeType;
            }

            router.get('/app', params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 350);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle filter tab click
    const handleFilterChange = (newType: 'all' | 'my_apps' | 'shared' | 'saved') => {
        setActiveType(newType);
        const params: Record<string, any> = {};
        if (newType !== 'all') {
            params.type = newType;
        }
        if (searchQuery.trim()) {
            params.search = searchQuery.trim();
        }

        router.get('/app', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Handle immediate search on Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmedQuery = searchQuery.trim();
            const params: Record<string, any> = {};
            if (trimmedQuery) {
                params.search = trimmedQuery;
            }
            if (activeType !== 'all') {
                params.type = activeType;
            }

            router.get('/app', params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }
    };

    // Clear search
    const handleClearSearch = () => {
        setSearchQuery('');
        const params: Record<string, any> = {};
        if (activeType !== 'all') {
            params.type = activeType;
        }

        router.get('/app', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleDeleteApp = (targetApp: NoteApp) => {
        const label = targetApp.topic_label ? targetApp.topic_label.toLowerCase() : 'topik';
        const confirmMsg = `Hapus ruang kerja "${targetApp.name}" secara permanen?\n\nSemua ${label} dan catatan di dalamnya akan terhapus dan tidak dapat dikembalikan!`;
        if (!window.confirm(confirmMsg)) return;

        router.delete(`/app/${targetApp.id}`, {
            preserveScroll: true,
        });
    };

    const themeColors: Record<string, string> = {
        yellow: 'bg-[#FFDC58]',
        purple: 'bg-[#A388EE]',
        mint: 'bg-[#7FBC8C]',
        coral: 'bg-[#FF6B6B]',
        sky: 'bg-[#69D2E7]',
        pink: 'bg-[#FF8FAB]',
        orange: 'bg-[#FFA94D]',
    };

    // Resolve app items (paginated or legacy fallback)
    const appsList = apps?.data || my_apps || [];
    const totalAppsCount = apps?.total ?? (counts?.all || (my_apps.length + shared_apps.length));

    return (
        <MemberLayout title="Ruang Kerja Aksara">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-black">
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

            {/* SEARCH & FILTER BAR */}
            <div className="mb-8 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleFilterChange('all')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-heading font-black uppercase border-2 border-black transition-all ${
                            activeType === 'all'
                                ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5'
                                : 'bg-white hover:bg-neutral-100 text-neutral-700'
                        }`}
                    >
                        <FolderKanban className="w-3.5 h-3.5 text-black" />
                        <span>Semua ({counts?.all ?? totalAppsCount})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleFilterChange('my_apps')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-heading font-black uppercase border-2 border-black transition-all ${
                            activeType === 'my_apps'
                                ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5'
                                : 'bg-white hover:bg-neutral-100 text-neutral-700'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5 text-black" />
                        <span>Milik Saya ({counts?.my_apps ?? 0})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleFilterChange('shared')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-heading font-black uppercase border-2 border-black transition-all ${
                            activeType === 'shared'
                                ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5'
                                : 'bg-white hover:bg-neutral-100 text-neutral-700'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5 text-black" />
                        <span>Dibagikan ({counts?.shared ?? 0})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleFilterChange('saved')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-heading font-black uppercase border-2 border-black transition-all ${
                            activeType === 'saved'
                                ? 'bg-[#7FBC8C] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 text-black'
                                : 'bg-white hover:bg-neutral-100 text-neutral-700'
                        }`}
                    >
                        <Bookmark className="w-3.5 h-3.5 text-black" />
                        <span>Disimpan ({counts?.saved ?? 0})</span>
                    </button>
                </div>

                {/* Search Input with Neo Styling */}
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-black" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Cari ruang kerja atau deskripsi..."
                        className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm font-bold bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-[#FFDC58] focus:border-black placeholder:text-neutral-400 font-sans"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-600 hover:text-black transition-colors"
                            title="Hapus pencarian"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* WORKSPACE CARDS GRID */}
            <section className="mb-10">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black font-heading uppercase text-black">
                            {activeType === 'all' && `Semua Ruang Kerja (${apps?.total ?? appsList.length})`}
                            {activeType === 'my_apps' && `Aplikasi Milik Saya (${apps?.total ?? appsList.length})`}
                            {activeType === 'shared' && `Aplikasi Kolaborasi (${apps?.total ?? appsList.length})`}
                            {activeType === 'saved' && `Ruang Kerja Tersimpan (${apps?.total ?? appsList.length})`}
                        </h2>
                    </div>

                    {filters?.search && (
                        <span className="text-xs font-bold text-neutral-600">
                            Pencarian: &ldquo;{filters.search}&rdquo;
                        </span>
                    )}
                </div>

                {appsList.length === 0 ? (
                    <div className="p-8 border-2 border-black bg-white text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                        <h3 className="font-heading font-black text-lg text-neutral-800 mb-1">
                            {filters?.search
                                ? 'Tidak Ada Ruang Kerja Ditemukan'
                                : activeType === 'saved'
                                ? 'Belum Ada Link yang Disimpan'
                                : activeType === 'shared'
                                ? 'Belum Ada Aplikasi yang Dibagikan'
                                : activeType === 'my_apps'
                                ? 'Belum Ada Aplikasi Milik Sendiri'
                                : 'Anda Belum Memiliki Aplikasi Catatan'}
                        </h3>
                        <p className="text-xs font-medium text-neutral-600 max-w-md mx-auto mb-4">
                            {filters?.search
                                ? `Tidak ditemukan ruang kerja yang sesuai dengan kata kunci "${filters.search}". Silakan coba kata kunci lain atau bersihkan pencarian.`
                                : activeType === 'saved'
                                ? 'Ketika Anda membuka tautan publik yang dibagikan dan mengklik tombol "Simpan Link", tautan tersebut akan otomatis tersimpan di sini.'
                                : activeType === 'shared'
                                ? 'Aplikasi yang dibagikan oleh teman atau rekan kolaborasi Anda akan otomatis muncul di sini.'
                                : 'Mulai atur catatan kuliah, proyek tim, atau ide harian dengan membuat aplikasi catatan pertama Anda.'}
                        </p>

                        {filters?.search ? (
                            <NeoButton variant="default" size="sm" onClick={handleClearSearch}>
                                <X className="w-4 h-4 mr-1" />
                                Bersihkan Pencarian
                            </NeoButton>
                        ) : activeType !== 'shared' && activeType !== 'saved' ? (
                            <NeoButton variant="yellow" size="sm" onClick={() => setCreateModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-1" />
                                Buat Aplikasi Pertama
                            </NeoButton>
                        ) : null}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {appsList.map((app) => (
                            <AppCard
                                key={app.id}
                                app={app}
                                themeBg={themeColors[app.color_theme] || themeColors.yellow}
                                onEdit={(targetApp) => setEditingApp(targetApp)}
                                onDuplicate={(targetApp) => setDuplicatingApp(targetApp)}
                                onSync={(targetApp) => setSyncingApp(targetApp)}
                                onViewClones={(targetApp) => setClonesApp(targetApp)}
                                onDelete={handleDeleteApp}
                            />
                        ))}
                    </div>
                )}

                {/* PAGINATION (STANDARD NUMBERED GET LINKS) */}
                {apps && apps.last_page > 1 && (
                    <div className="mt-8 p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-xs font-bold text-neutral-600 font-mono">
                            Menampilkan {apps.from || 0} - {apps.to || 0} dari total {apps.total} ruang kerja
                        </span>
                        <div className="flex items-center flex-wrap gap-1.5 justify-center">
                            {apps.links.map((link, i) => {
                                let labelText = link.label;
                                if (link.label.includes('Previous')) {
                                    labelText = '&laquo; Sebelumnya';
                                } else if (link.label.includes('Next')) {
                                    labelText = 'Berikutnya &raquo;';
                                }

                                if (!link.url) {
                                    return (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 text-xs font-heading font-bold border-2 border-neutral-300 bg-neutral-100 text-neutral-400 opacity-60 cursor-not-allowed select-none"
                                            dangerouslySetInnerHTML={{ __html: labelText }}
                                        />
                                    );
                                }

                                return (
                                    <DebouncedPrefetchLink
                                        key={i}
                                        href={link.url}
                                        preserveScroll
                                        prefetch="hover"
                                        cacheFor="1m"
                                        className={`px-3 py-1.5 text-xs font-heading font-bold border-2 border-black transition-all ${
                                            link.active
                                                ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                                                : 'bg-white hover:bg-neutral-100 active:translate-x-0.5 active:translate-y-0.5'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: labelText }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>

            {/* STANDALONE GROUPS SECTION (Folder-Level Collaboration, shown if any exist and on page 1 of all/shared) */}
            {standalone_groups && standalone_groups.length > 0 && (activeType === 'all' || activeType === 'shared') && (!filters?.page || filters.page === 1) && (
                <StandaloneGroupsSection standaloneGroups={standalone_groups} />
            )}

            {/* STANDALONE NOTES SECTION (Note-Level Collaboration, shown if any exist and on page 1 of all/shared) */}
            {standalone_notes && standalone_notes.length > 0 && (activeType === 'all' || activeType === 'shared') && (!filters?.page || filters.page === 1) && (
                <StandaloneNotesSection standaloneNotes={standalone_notes} />
            )}

            {/* SAVED OTHER LINKS (Saved Groups & Notes from public share links) */}
            {saved_other_links && saved_other_links.length > 0 && (activeType === 'all' || activeType === 'saved') && (!filters?.page || filters.page === 1) && (
                <SavedLinksSection savedLinks={saved_other_links} />
            )}

            {/* CREATE APP MODAL */}
            <CreateAppModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
            />

            {/* EDIT APP MODAL */}
            {editingApp && (
                <EditAppModal
                    isOpen={Boolean(editingApp)}
                    onClose={() => setEditingApp(null)}
                    app={editingApp}
                    isOwner={Boolean(auth?.user?.id && editingApp.owner_id === auth.user.id)}
                    onUpdated={() => {
                        router.reload({ only: ['apps', 'counts'] });
                    }}
                    onDeleted={() => {
                        setEditingApp(null);
                    }}
                />
            )}

            {/* DUPLICATE APP MODAL */}
            {duplicatingApp && (
                <DuplicateAppModal
                    isOpen={Boolean(duplicatingApp)}
                    onClose={() => setDuplicatingApp(null)}
                    app={duplicatingApp}
                    onSuccess={() => {
                        setDuplicatingApp(null);
                        router.reload({ only: ['apps', 'counts'] });
                    }}
                />
            )}

            {/* SYNC WORKSPACE MODAL */}
            {syncingApp && (
                <SyncWorkspaceModal
                    isOpen={Boolean(syncingApp)}
                    onClose={() => setSyncingApp(null)}
                    currentApp={syncingApp}
                    onSuccess={() => {
                        setSyncingApp(null);
                        router.reload({ only: ['apps', 'counts'] });
                    }}
                />
            )}

            {/* CLONES LIST MODAL */}
            {clonesApp && (
                <ClonesModal
                    isOpen={Boolean(clonesApp)}
                    onClose={() => setClonesApp(null)}
                    app={clonesApp}
                />
            )}
        </MemberLayout>
    );
}
