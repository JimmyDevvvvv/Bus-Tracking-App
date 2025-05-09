'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/adminAuth';
import { AppSidebar } from '@/components/app-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
