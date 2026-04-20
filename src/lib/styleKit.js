import { supabase, isSupabaseConfigured } from './supabase';

// No auth yet — every session shares one logical user. Swap when auth lands.
const USER_ID = 'default';

function assertClient(op) {
  if (!isSupabaseConfigured || !supabase) {
    const err = new Error(
      'Supabase client not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
    console.error(`[supabase] ${op} blocked:`, err.message);
    throw err;
  }
}

// SELECT — plain select('*') scoped by user_id.
export async function fetchStyleKit() {
  console.log('[supabase] fetching style kit for user:', USER_ID);
  assertClient('fetchStyleKit');

  const { data, error } = await supabase
    .from('style_kit')
    .select('*')
    .eq('user_id', USER_ID);

  console.log('[supabase] FETCH DATA:', data);
  console.log('[supabase] FETCH ERROR:', error);
  if (error) throw error;

  const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (!row || !row.profile) return { profile: null, sampleText: '' };

  // sampleText is stored inside the profile JSON so the table stays a
  // simple (user_id, profile) schema.
  const { sampleText = '', ...rest } = row.profile || {};
  return { profile: rest, sampleText };
}

// INSERT — bare-minimum payload matching spec: [{ user_id, profile }].
// No existing-row check. No upsert. No on_conflict. If the row already
// exists the INSERT ERROR log will show a 23505 unique-violation and we
// fall through to a plain UPDATE keyed on user_id.
export async function saveStyleKit({ profile, sampleText }) {
  assertClient('saveStyleKit');

  // Guarantee a non-empty, valid JSON object — never undefined, never {}.
  const profileData = {
    ...(profile && typeof profile === 'object' ? profile : {}),
    sampleText: typeof sampleText === 'string' ? sampleText : '',
  };
  if (Object.keys(profileData).length === 0) profileData.empty = false;

  const row = { user_id: USER_ID, profile: profileData };
  console.log('[supabase] INSERT PAYLOAD:', JSON.stringify(row));

  const { data, error } = await supabase
    .from('style_kit')
    .insert([row])
    .select();

  console.log('INSERT DATA:', data);
  console.log('INSERT ERROR:', error);

  if (!error) return data;

  // Fallback: row already exists for this user_id → update it.
  // 23505 = unique_violation, 409 = REST-layer duplicate.
  const isDuplicate = error.code === '23505' || error.status === 409;
  if (!isDuplicate) {
    console.log('INSERT ERROR (not duplicate, rethrowing):', error);
    throw error;
  }
  console.log('[supabase] row exists, switching to UPDATE');

  const { data: updated, error: updateError } = await supabase
    .from('style_kit')
    .update({ profile: profileData })
    .eq('user_id', USER_ID)
    .select();

  console.log('UPDATE DATA:', updated);
  console.log('UPDATE ERROR:', updateError);
  if (updateError) throw updateError;
  return updated;
}
