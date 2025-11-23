import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TaskDetail {
  expr: string;
  user: string;
  check: string;
  correct: number;
}

export interface ResultRandom {
  id?: string;
  run_id: string;
  name: string;
  tasks: number;
  correct: number;
  seconds: number;
  finished: boolean;
  timestamp: string;
  op_name: string;
  a_start: string;
  a_end: string;
  b_start: string;
  b_end: string;
  int_only: boolean;
  tasks_detail: TaskDetail[];
}

export interface ResultTTable {
  id?: string;
  run_id: string;
  name: string;
  tasks: number;
  correct: number;
  seconds: number;
  finished: boolean;
  timestamp: string;
  bases: number[];
  max_for: Record<string, string>;
  tasks_detail: TaskDetail[];
}

export async function saveResultRandom(result: Omit<ResultRandom, 'id'>) {
  const { data, error } = await supabase
    .from('results_random')
    .insert(result)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveResultTTable(result: Omit<ResultTTable, 'id'>) {
  const { data, error } = await supabase
    .from('results_ttable')
    .insert(result)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getResultsRandom() {
  const { data, error } = await supabase
    .from('results_random')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data as ResultRandom[];
}

export async function getResultsTTable() {
  const { data, error } = await supabase
    .from('results_ttable')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data as ResultTTable[];
}

export async function getAllNames(): Promise<string[]> {
  const [randomResults, ttableResults] = await Promise.all([
    getResultsRandom(),
    getResultsTTable(),
  ]);

  const names = new Set<string>();
  randomResults.forEach((r) => r.name && names.add(r.name));
  ttableResults.forEach((r) => r.name && names.add(r.name));

  return Array.from(names).sort();
}

export async function deleteAllResultsRandom() {
  const { data: allRows, error: fetchError } = await supabase.from('results_random').select('id');
  if (fetchError) {
    console.error('Fetch error:', fetchError);
    throw fetchError;
  }

  if (allRows && allRows.length > 0) {
    console.log(`Deleting ${allRows.length} rows from results_random`);
    const ids = allRows.map(row => row.id);
    const { error, data } = await supabase.from('results_random').delete().in('id', ids).select();
    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
    console.log(`Deleted ${data?.length || 0} rows`);
  }
}

export async function deleteAllResultsTTable() {
  const { data: allRows, error: fetchError } = await supabase.from('results_ttable').select('id');
  if (fetchError) {
    console.error('Fetch error:', fetchError);
    throw fetchError;
  }

  if (allRows && allRows.length > 0) {
    console.log(`Deleting ${allRows.length} rows from results_ttable`);
    const ids = allRows.map(row => row.id);
    const { error, data } = await supabase.from('results_ttable').delete().in('id', ids).select();
    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
    console.log(`Deleted ${data?.length || 0} rows`);
  }
}

export function generateRunId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
