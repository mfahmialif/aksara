export interface User {
    id: string;
    name: string;
    email: string;
    google_id?: string | null;
    avatar?: string | null;
    default_reminder_days: number;
    is_active?: boolean;
}

export interface AdminUser {
    id: string;
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
    mail_mailer?: 'smtp' | 'log';
    mail_host?: string;
    mail_port?: number;
    mail_encryption?: 'tls' | 'ssl' | 'none';
    mail_username?: string;
    mail_password?: string;
    mail_from_address?: string;
    mail_from_name?: string;
}

export interface NoteApp {
    id: string;
    owner_id: string;
    name: string;
    icon?: string;
    color_theme: string;
    description?: string;
    is_public: boolean;
    public_token: string;
    public_permission?: 'read' | 'edit';
    topic_label?: string;
    created_at: string;
    updated_at: string;
    owner?: User;
    groups?: NoteGroup[];
    collaborators?: Collaborator[];
    groups_count?: number;
    is_saved?: boolean;
}

export interface SavedSharedLink {
    id: string;
    user_id: string;
    item_type: 'app' | 'group' | 'note';
    item_id: string;
    note_app_id?: string | null;
    title?: string | null;
    share_url: string;
    public_token?: string | null;
    created_at?: string;
    updated_at?: string;
    note_app?: NoteApp | null;
}

export interface NoteGroup {
    id: string;
    note_app_id: string;
    name: string;
    color?: string;
    sort_order: number;
    is_public?: boolean;
    public_token?: string | null;
    public_permission?: 'read' | 'edit';
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
    id: string;
    note_id: string;
    file_name: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    url: string;
    preview_url?: string;
    download_url?: string;
    formatted_size: string;
    is_image: boolean;
    is_pdf: boolean;
    created_at: string;
}

export interface Collaborator {
    id: string;
    collaboratable_type: string;
    collaboratable_id: string;
    user_id?: string | null;
    invited_email: string;
    permission: string;
    user?: User | null;
    created_at: string;
}

export interface Note {
    id: string;
    note_group_id: string;
    title: string;
    category: 'regular' | 'task';
    content_json?: string | null;
    drawing_data?: string | null;
    deadline_at?: string | null;
    reminder_days_before?: number | null;
    reminder_sent_at?: string | null;
    is_public: boolean;
    public_token: string;
    public_permission?: 'read' | 'edit';
    is_pinned?: boolean;
    sort_order?: number;
    created_at: string;
    updated_at: string;
    group?: NoteGroup;
    attachments?: NoteAttachment[];
    collaborators?: Collaborator[];
}

export interface AppNotification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'reminder' | 'collaboration' | 'task' | 'system';
    action_url?: string | null;
    read_at?: string | null;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserNoteReminder {
    id: string;
    user_id: string;
    note_id: string;
    reminder_days_before?: number | null;
    custom_remind_at?: string | null;
    reminder_sent_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface ActivityLog {
    id: string;
    causer_type?: string | null;
    causer_id?: string | null;
    causer_name: string;
    causer_role: 'member' | 'admin' | 'system';
    action: string;
    entity_type?: string | null;
    entity_id?: string | null;
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
        info?: string | null;
    };
    notifications_summary?: {
        unread_count: number;
        recent: AppNotification[];
    } | null;
    system_settings: SystemSettings;
    [key: string]: unknown;
}
