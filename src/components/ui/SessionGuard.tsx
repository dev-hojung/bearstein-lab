'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Watches tab focus / visibility events and pings /api/auth/check.
 * On 401 (cookie expired OR phone revoked), redirects to /auth.
 *
 * Without this, a user who keeps the tab open past their session window
 * could keep interacting client-side until they navigate or call an API.
 */
export default function SessionGuard() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (cancelled || document.hidden) return;
      try {
        const res = await fetch('/api/auth/check', { cache: 'no-store' });
        if (res.status === 401) {
          router.replace('/auth');
        }
      } catch {
        // Network error — ignore; will retry on next focus
      }
    };

    const onFocus = () => check();
    const onVisibility = () => {
      if (!document.hidden) check();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [router]);

  return null;
}
