import { Note, NoteApp, SavedSharedLink } from '@/types';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

export interface WorkspaceFilters {
    search?: string;
    type?: 'all' | 'my_apps' | 'shared' | 'saved';
    page?: number;
}

export interface WorkspaceCounts {
    all: number;
    my_apps: number;
    shared: number;
    saved?: number;
    standalone_notes?: number;
}

export interface WorkspacePageProps {
    apps: PaginatedData<NoteApp>;
    standalone_notes?: Note[];
    saved_other_links?: SavedSharedLink[];
    filters: WorkspaceFilters;
    counts: WorkspaceCounts;
    my_apps?: NoteApp[];
    shared_apps?: NoteApp[];
}
