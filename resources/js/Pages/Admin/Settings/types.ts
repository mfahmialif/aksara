import { SystemSettings } from '@/types';

export interface ReminderStats {
    total_sent: number;
    total_failed: number;
    pending_tasks: number;
    pending_personal: number;
    mail_driver: string;
    mail_from: string;
    last_run: string;
}

export interface UserOption {
    id: string;
    name: string;
    email: string;
}

export interface NoteOption {
    id: string;
    title: string;
    category?: string;
}

export interface SettingsProps {
    settings: SystemSettings;
    users?: UserOption[];
    notes?: NoteOption[];
    reminder_stats?: ReminderStats;
}
