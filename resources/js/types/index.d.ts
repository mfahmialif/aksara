export interface User {
    id: number;
    name: string;
    email: string;
    google_id?: string | null;
    avatar?: string | null;
    default_reminder_days: number;
    is_active?: boolean;
}

export interface AdminUser {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
}

export interface SystemSettings {
    max_file_size_mb: number;
    max_files_per_upload: number;
    allowed_extensions: string;
    blocked_extensions: string;
}

export interface NoteApp {
    id: number;
    owner_id: number;
    name: string;
    icon?: string;
    color_theme: string;
    description?: string;
    is_public: boolean;
    public_token: string;
    created_at: string;
    updated_at: string;
    owner?: User;
    groups?: NoteGroup[];
    collaborators?: Collaborator[];
    groups_count?: number;
}

export interface NoteGroup {
    id: number;
    note_app_id: number;
    name: string;
    sort_order: number;
    notes?: Note[];
    app?: NoteApp;
}

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface NoteContentJson {
    html: string;
    checklist: ChecklistItem[];
}

export interface NoteAttachment {
    id: number;
    note_id: number;
    file_name: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    url: string;
    formatted_size: string;
    is_image: boolean;
    is_pdf: boolean;
    created_at: string;
}

export interface Collaborator {
    id: number;
    collaboratable_type: string;
    collaboratable_id: number;
    user_id?: number | null;
    invited_email: string;
    permission: string;
    user?: User | null;
    created_at: string;
}

export interface Note {
    id: number;
    note_group_id: number;
    title: string;
    category: 'regular' | 'task';
    content_json?: string | null;
    drawing_data?: string | null;
    deadline_at?: string | null;
    reminder_days_before?: number | null;
    reminder_sent_at?: string | null;
    is_public: boolean;
    public_token: string;
    created_at: string;
    updated_at: string;
    group?: NoteGroup;
    attachments?: NoteAttachment[];
    collaborators?: Collaborator[];
}

export interface AppNotification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: 'reminder' | 'collaboration' | 'task' | 'system';
    action_url?: string | null;
    read_at?: string | null;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

export interface ActivityLog {
    id: number;
    causer_type?: string | null;
    causer_id?: number | null;
    causer_name: string;
    causer_role: 'member' | 'admin' | 'system';
    action: string;
    entity_type?: string | null;
    entity_id?: number | null;
    description: string;
    ip_address?: string | null;
    user_agent?: string | null;
    properties?: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export interface PageProps<T = Record<string, unknown>> {
    auth: {
        user: User | null;
        admin: AdminUser | null;
    };
    flash: {
        success?: string | null;
        error?: string | null;
    };
    notifications_summary?: {
        unread_count: number;
        recent: AppNotification[];
    } | null;
    system_settings: SystemSettings;
    [key: string]: unknown;
}
