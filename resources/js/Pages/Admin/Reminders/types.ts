import { Note } from '@/types';

export interface RemindersPageProps {
    logs: {
        data: any[];
        links: any[];
        total: number;
    };
    upcoming: Note[];
}
