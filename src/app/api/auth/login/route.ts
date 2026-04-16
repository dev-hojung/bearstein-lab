import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { sessionOptionsWithMinutes, type LabSession, normalizePhone, isValidKoreanMobile } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { phone: raw } = await req.json().catch(() => ({ phone: '' }));
  if (typeof raw !== 'string' || !raw) {
    return NextResponse.json({ error: '휴대폰 번호를 입력해주세요.' }, { status: 400 });
  }

  const phone = normalizePhone(raw);
  if (!isValidKoreanMobile(phone)) {
    return NextResponse.json({ error: '유효한 휴대폰 번호 형식이 아닙니다.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('allowed_phones')
    .select('phone,session_minutes')
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Supabase 조회 실패: ' + error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: '등록되지 않은 번호입니다. 관리자에게 문의하세요.' },
      { status: 403 },
    );
  }

  // Touch last_seen_at (best effort; ignore errors)
  await supabase
    .from('allowed_phones')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('phone', phone);

  const minutes = data.session_minutes ?? 1440;
  const session = await getIronSession<LabSession>(await cookies(), sessionOptionsWithMinutes(minutes));
  session.phone = phone;
  session.issuedAt = Date.now();
  await session.save();

  return NextResponse.json({ ok: true });
}
