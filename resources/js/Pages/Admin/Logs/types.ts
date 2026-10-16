import { ActivityLog } from '@/types';

export interface PaginatedLogs {
    data: ActivityLog[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface LogStats {
    total_logs: number;
    member_logs: number;
    admin_logs: number;
    system_logs: number;
}

export interface LogFiltersState {
    search: string;
    role: string;
    action: string;
}

export interface LogsProps {
    logs: PaginatedLogs;
    stats: LogStats;
    filters: LogFiltersState;
}
