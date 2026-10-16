import { User } from '@/types';

export interface Metrics {
    total_members: number;
    active_members: number;
    total_apps: number;
    total_notes: number;
    total_tasks: number;
    storage_mb: number;
    total_reminders_sent: number;
    pending_reminders: number;
}

export interface DashboardProps {
    metrics: Metrics;
    recent_reminders: any[];
    recent_members: User[];
}
