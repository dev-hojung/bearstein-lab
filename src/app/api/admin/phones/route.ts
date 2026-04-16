import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { sessionOptions, type LabSession, normalizePhone, isValidKoreanMobile } from '@/lib/session';

async function requireAdmin() {
  const session = await getIronSession<LabSession>(await cookies(), sessionOptions);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('allowed_phones')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ phones: data });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => ({}));
  const rawPhone = typeof body.phone === 'string' ? body.phone : '';
  const label = typeof body.label === 'string' ? body.label : null;
  const MAX_MIN = 365 * 24 * 60;
  const sessionMinutes = Math.max(1, Math.min(MAX_MIN, Number(body.session_minutes) || 1440));

  const phone = normalizePhone(rawPhone);
  if (!isValidKoreanMobile(phone)) {
    return NextResponse.json({ error: '유효한 번호가 아닙니다.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('allowed_phones')
    .upsert({ phone, label, session_minutes: sessionMinutes })
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const url = new URL(req.url);
  const phone = normalizePhone(url.searchParams.get('phone') || '');
  if (!phone) return NextResponse.json({ error: 'phone 쿼리 파라미터 필요' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('allowed_phones').delete().eq('phone', phone);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
