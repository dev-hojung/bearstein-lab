import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, type LabSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: '' }));
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.' }, { status: 500 });
  }
  if (typeof password !== 'string' || password !== expected) {
    // Constant-time-ish comparison not critical for this use case; env is server-only.
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 403 });
  }

  const session = await getIronSession<LabSession>(await cookies(), sessionOptions);
  session.isAdmin = true;
  session.issuedAt = Date.now();
  await session.save();

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getIronSession<LabSession>(await cookies(), sessionOptions);
  session.destroy();
  return NextResponse.json({ ok: true });
}
