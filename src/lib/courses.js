import { supabase, isSupabaseConfigured } from './supabase';

function rethrow(op, error) {
  console.error(`[supabase] ${op} error:`, error);
  throw error;
}

function assertClient(op) {
  if (!isSupabaseConfigured || !supabase) {
    const err = new Error(
      'Supabase client not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
    console.error(`[supabase] ${op} blocked:`, err.message);
    throw err;
  }
}

export async function listCourses() {
  assertClient('listCourses');
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, created_at, updated_at')
    .order('updated_at', { ascending: false });
  if (error) rethrow('listCourses', error);
  return data || [];
}

export async function getCourse(id) {
  assertClient('getCourse');
  const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();
  if (error) rethrow('getCourse', error);
  return data;
}

export async function createCourse({ title, content }) {
  assertClient('createCourse');
  const { data, error } = await supabase
    .from('courses')
    .insert({ title, content })
    .select()
    .single();
  if (error) rethrow('createCourse', error);
  return data;
}

export async function updateCourse(id, { title, content }) {
  assertClient('updateCourse');
  const { data, error } = await supabase
    .from('courses')
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) rethrow('updateCourse', error);
  return data;
}

export async function deleteCourse(id) {
  assertClient('deleteCourse');
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) rethrow('deleteCourse', error);
}

export async function renameCourse(id, title) {
  assertClient('renameCourse');
  const { data, error } = await supabase
    .from('courses')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) rethrow('renameCourse', error);
  return data;
}

export async function duplicateCourse(id) {
  const source = await getCourse(id);
  const copyTitle = `${source.title || 'Untitled course'} (Copy)`;
  return createCourse({ title: copyTitle, content: source.content || {} });
}
