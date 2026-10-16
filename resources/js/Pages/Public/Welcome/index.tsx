import React from 'react';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import PublicLayout from '@/Layouts/PublicLayout';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HierarchySection from './components/HierarchySection';

export default function Welcome() {
    const { flash } = usePage<PageProps>().props;

    return (
        <PublicLayout title="Aksara - Catatan & Tugas Kolaboratif">
            <HeroSection flashError={flash.error} flashSuccess={flash.success} />
            <FeaturesSection />
            <HierarchySection />
        </PublicLayout>
    );
}
