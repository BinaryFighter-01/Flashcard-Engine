'use client';

import { redirect } from 'next/navigation';

// Quick study redirect - pass mode in query params instead
export default function QuickStudyPage() {
     // This component redirects to the parent study page with quick mode
     // The actual quick mode logic is in the parent route
     redirect('..');
}
