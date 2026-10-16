import { AppNotification } from '@/types';

export interface PaginatedNotifications {
    data: AppNotification[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface NotificationsProps {
    notifications: PaginatedNotifications;
    unread_count: number;
    archived_count: number;
    current_tab: 'unread' | 'archived';
}
