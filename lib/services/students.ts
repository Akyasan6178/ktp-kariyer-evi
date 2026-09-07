// ============================================================
// Öğrenci Servisi
// Tüm Supabase öğrenci sorguları bu dosyada toplanır.
// ============================================================

import { supabase } from '@/lib/supabase';
import type { DbStudent, StudentInsert, StudentUpdate } from '@/lib/types';

// Supabase client'ı any ile cast ederek generic tip çıkarım sorununu aşıyoruz.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Tüm öğrencileri ada göre sıralı getirir.
 */
export async function getStudents(): Promise<DbStudent[]> {
  const { data, error } = await db
    .from('students')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('[students.service] getStudents hata:', error.message);
    throw new Error(`Öğrenciler yüklenemedi: ${error.message}`);
  }

  return (data ?? []) as DbStudent[];
}

/**
 * Tek öğrenciyi id ile getirir.
 */
export async function getStudentById(id: string): Promise<DbStudent | null> {
  const { data, error } = await db
    .from('students')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[students.service] getStudentById hata:', error.message);
    throw new Error(`Öğrenci bulunamadı: ${error.message}`);
  }

  return (data ?? null) as DbStudent | null;
}

/**
 * Yeni öğrenci oluşturur.
 * id ve created_at Supabase tarafından otomatik atanır.
 */
export async function createStudent(
  payload: Omit<StudentInsert, 'id' | 'created_at'>,
): Promise<DbStudent> {
  const { data, error } = await db
    .from('students')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[students.service] createStudent hata:', error.message);
    throw new Error(`Öğrenci oluşturulamadı: ${error.message}`);
  }

  return data as DbStudent;
}

/**
 * Mevcut öğrenci bilgilerini günceller.
 */
export async function updateStudent(
  id: string,
  payload: StudentUpdate,
): Promise<DbStudent> {
  const { data, error } = await db
    .from('students')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[students.service] updateStudent hata:', error.message);
    throw new Error(`Öğrenci güncellenemedi: ${error.message}`);
  }

  return data as DbStudent;
}
