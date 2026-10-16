import { AdminUser, User } from '@/types';

export interface UsersPageProps {
    members: (User & { note_apps_count?: number })[];
    admins: AdminUser[];
}
