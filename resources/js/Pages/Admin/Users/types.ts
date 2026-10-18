import { AdminUser, User } from '@/types';

export interface MemberUser extends User {
    note_apps_count?: number;
    collaborations_count?: number;
    saved_shared_links_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface PaginatedMembers {
    data: MemberUser[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface UserStats {
    total_members: number;
    active_members: number;
    inactive_members: number;
}

export interface UserFiltersState {
    search: string;
    status: string;
    sort: string;
}

export interface UsersPageProps {
    members: PaginatedMembers;
    admins: AdminUser[];
    stats: UserStats;
    filters: UserFiltersState;
}

export interface UserDetailData {
    user: MemberUser & {
        note_apps?: {
            id: string;
            name: string;
            color_theme: string;
            is_public: boolean;
            groups_count?: number;
            created_at: string;
        }[];
    };
    recent_logs: {
        id: string;
        action: string;
        description: string;
        created_at: string;
        ip_address?: string;
    }[];
}
