import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { sessionOptions, type LabSession } from '@/lib/session';

/**
 * Lightweight session check used by the client `<SessionGuard>` on tab focus.
 * Returns 200 if session is still valid, 401 otherwise so the client can redirect.
 */
export async function GET() {
  const session = await getIronSession<LabSession>(await cookies(), sessionOptions);

  if (!session.phone && !session.isAdmin) {
    return NextResponse.json({ ok: false, reason: 'no-session' }, { status: 401 });
  }

  // Verify phone still whitelisted (admin session is always valid)
  if (session.phone && !session.isAdmin) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('allowed_phones')
        .select('phone')
        .eq('phone', session.phone)
        .maybeSingle();
      if (!data) {
        session.destroy();
        return NextResponse.json({ ok: false, reason: 'revoked' }, { status: 401 });
      }
    } catch {
      // DB error — fail open
    }
  }

  return NextResponse.json({ ok: true });
}
