import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { sessionOptions, type LabSession } from '@/lib/session';

export async function GET() {
  const session = await getIronSession<LabSession>(await cookies(), sessionOptions);
  if (!session.phone && !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('parts')
    .select('id,name,cat,cat_v2,url,sort_order')
    .eq('is_active', true)
    .order('cat', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by v1 cat (head/body/arm/leg) so the shelf resolver can still
  // look parts up by the v1 bucket, while carrying cat_v2 through for
  // v2-aware filtering + cart de-duplication.
  type Row = {
    id: string;
    name: string;
    cat: string;
    cat_v2: string | null;
    url: string;
    sort_order: number;
  };
  type OutPart = {
    id: string;
    name: string;
    cat: string;
    catV2?: string;
    url: string;
  };
  const grouped: Record<string, OutPart[]> = {
    head: [],
    body: [],
    arm: [],
    leg: [],
  };
  for (const row of (data ?? []) as Row[]) {
    if (!grouped[row.cat]) continue;
    grouped[row.cat].push({
      id: row.id,
      name: row.name,
      cat: row.cat,
      ...(row.cat_v2 ? { catV2: row.cat_v2 } : {}),
      url: row.url,
    });
  }
  return NextResponse.json({ parts: grouped });
}
