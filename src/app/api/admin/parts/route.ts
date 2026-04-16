import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSupabaseAdmin, PARTS_BUCKET } from '@/lib/supabase/server';
import { sessionOptions, type LabSession } from '@/lib/session';

async function requireAdmin() {
  const session = await getIronSession<LabSession>(await cookies(), sessionOptions);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

const ALLOWED_CATS = new Set(['head', 'body', 'arm', 'leg']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const form = await req.formData();
  const file = form.get('file');
  const name = (form.get('name') || '').toString().trim();
  const cat = (form.get('cat') || '').toString().trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file 누락' }, { status: 400 });
  }
  if (!ALLOWED_CATS.has(cat)) {
    return NextResponse.json({ error: 'cat은 head/body/arm/leg 중 하나' }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: 'name 필수' }, { status: 400 });
  }
  const ALLOWED_TYPES = new Set(['image/png', 'image/svg+xml']);
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'PNG 또는 SVG만 허용' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: '5MB 이하만 허용' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ext = file.type === 'image/svg+xml' ? 'svg' : 'png';
  const filename = `${cat}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PARTS_BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });
  if (uploadError) {
    return NextResponse.json({ error: 'Storage 업로드 실패: ' + uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from(PARTS_BUCKET).getPublicUrl(filename);
  const publicUrl = publicUrlData.publicUrl;

  // Determine next sort_order for this category
  const { data: latest } = await supabase
    .from('parts')
    .select('sort_order')
    .eq('cat', cat)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (latest?.sort_order ?? -1) + 1;

  const { data: inserted, error: insertError } = await supabase
    .from('parts')
    .insert({
      name,
      cat,
      url: publicUrl,
      uploaded_by: 'admin',
      sort_order: nextOrder,
      is_active: true,
    })
    .select()
    .single();
  if (insertError) {
    // Rollback storage upload (best effort)
    await supabase.storage.from(PARTS_BUCKET).remove([filename]);
    return NextResponse.json({ error: 'DB 삽입 실패: ' + insertError.message }, { status: 500 });
  }

  return NextResponse.json({ part: inserted });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: row, error: fetchErr } = await supabase
    .from('parts')
    .select('url')
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Remove storage object if it's in our bucket
  try {
    const marker = `/${PARTS_BUCKET}/`;
    const idx = row.url.indexOf(marker);
    if (idx >= 0) {
      const path = row.url.slice(idx + marker.length);
      await supabase.storage.from(PARTS_BUCKET).remove([path]);
    }
  } catch {
    /* best effort */
  }

  const { error: delErr } = await supabase.from('parts').delete().eq('id', id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
