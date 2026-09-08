// ============================================================
// Masa Servisi
// Tüm Supabase masa sorguları bu dosyada toplanır.
// Bileşenler doğrudan Supabase çağrısı yapmaz.
// ============================================================

import { supabase } from '@/lib/supabase';
import type { DeskWithRental, DeskStatus } from '@/lib/types';

// Supabase client'ı any ile cast ederek generic tip çıkarım sorununu aşıyoruz.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const CLOSED_DESKS_STORAGE_KEY = 'ktp_closed_desks';

function getLocalClosedDeskIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CLOSED_DESKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalClosedDeskId(id: string, isClosed: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const current = new Set(getLocalClosedDeskIds());
    if (isClosed) {
      current.add(id);
    } else {
      current.delete(id);
    }
    localStorage.setItem(CLOSED_DESKS_STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn('[desks.service] localStorage hatası:', err);
  }
}

/**
 * Tüm masaları aktif kiralama + öğrenci bilgisiyle birlikte getirir.
 * Supabase join: desks → rentals (is_active=true) → students
 */
export async function getAllDesks(): Promise<DeskWithRental[]> {
  console.log('[desks.service] getAllDesks() çağrıldı.');

  const { data, error } = await db
    .from('desks')
    .select(`
      id,
      code,
      section,
      status,
      created_at,
      active_rental:rentals(
        id,
        student_id,
        desk_id,
        package_type,
        start_date,
        end_date,
        price,
        payment_status,
        payment_note,
        is_active,
        created_at,
        student:students(
          id,
          full_name,
          phone,
          group_type,
          parent_name,
          parent_phone,
          notes,
          created_at
        )
      )
    `)
    .order('code', { ascending: true });

  if (error) {
    console.error('[desks.service] getAllDesks hata:', error.message);
    throw new Error(`Masalar yüklenemedi: ${error.message}`);
  }

  console.log('[desks.service] Supabase veritabanından dönen satır sayısı:', data?.length ?? 0);
  if (data && data.length > 0) {
    console.log('[desks.service] Örnek ilk kayıt:', data[0]);
  } else {
    console.warn('[desks.service] Supabase sorgusu boş dizi [] döndü!');
  }

  // Supabase join array döner; aktif kiralamayı filtrele (is_active = true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatted = (data ?? []).map((desk: any) => {
    const rentalsArr: unknown[] = Array.isArray(desk.active_rental)
      ? desk.active_rental
      : [];

    const activeRentals = rentalsArr.filter(
      (r: unknown) => (r as { is_active: boolean }).is_active === true,
    );

    const active_rental =
      activeRentals.length > 0
        ? (activeRentals[0] as DeskWithRental['active_rental'])
        : null;

    const localClosed = getLocalClosedDeskIds();
    let currentStatus = (desk.status || 'available') as DeskStatus;
    if (localClosed.includes(String(desk.id))) {
      currentStatus = 'closed';
    }

    return {
      id: String(desk.id),
      code: String(desk.code),
      section: String(desk.section || '').trim().toUpperCase(),
      status: currentStatus,
      created_at: String(desk.created_at || new Date().toISOString()),
      active_rental,
    } satisfies DeskWithRental;
  });

  console.log('[desks.service] Formatlanıp döndürülen masa sayısı:', formatted.length);
  return formatted;
}

/**
 * Tek masayı aktif kiralama + öğrenci bilgisiyle getirir.
 */
export async function getDeskById(id: string): Promise<DeskWithRental | null> {
  const { data, error } = await db
    .from('desks')
    .select(`
      id,
      code,
      section,
      status,
      created_at,
      active_rental:rentals(
        id,
        student_id,
        desk_id,
        package_type,
        start_date,
        end_date,
        price,
        payment_status,
        payment_note,
        is_active,
        created_at,
        student:students(
          id,
          full_name,
          phone,
          group_type,
          parent_name,
          parent_phone,
          notes,
          created_at
        )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[desks.service] getDeskById hata:', error.message);
    throw new Error(`Masa bulunamadı: ${error.message}`);
  }

  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const desk = data as any;
  const rentalsArr: unknown[] = Array.isArray(desk.active_rental)
    ? desk.active_rental
    : [];
  const activeRentals = rentalsArr.filter(
    (r: unknown) => (r as { is_active: boolean }).is_active === true,
  );
  const active_rental =
    activeRentals.length > 0
      ? (activeRentals[0] as DeskWithRental['active_rental'])
      : null;

  const localClosed = getLocalClosedDeskIds();
  let currentStatus = (desk.status || 'available') as DeskStatus;
  if (localClosed.includes(String(desk.id))) {
    currentStatus = 'closed';
  }

  return {
    id: desk.id as string,
    code: desk.code as string,
    section: desk.section as string,
    status: currentStatus,
    created_at: desk.created_at as string,
    active_rental,
  } satisfies DeskWithRental;
}

/**
 * Masanın durumunu günceller.
 * finishRental() çağrısından da kullanılır.
 */
export async function updateDeskStatus(
  id: string,
  status: DeskStatus,
): Promise<void> {
  if (status !== 'closed') {
    setLocalClosedDeskId(id, false);
  }

  const { error } = await db
    .from('desks')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('[desks.service] updateDeskStatus hata:', error.message);
    // Veritabanında check constraint henüz güncellenmemişse yerel dayanıklılık devreye girer
    if (error.code === '23514' && status === 'closed') {
      console.warn(
        '[desks.service] DB check constraint kısıtlaması nedeniyle kapalı durumu yerel belleğe kaydedildi.',
      );
      setLocalClosedDeskId(id, true);
      return;
    }
    throw new Error(`Masa durumu güncellenemedi: ${error.message}`);
  }

  if (status === 'closed') {
    setLocalClosedDeskId(id, true);
  }
}

/**
 * Masayı kullanıma kapatır (status = 'closed').
 * Kapalı masaya kiralama yapılamaz, süre uzatılamaz.
 */
export async function closeDesk(id: string): Promise<void> {
  await updateDeskStatus(id, 'closed');
}

/**
 * Kapalı masayı tekrar boşa alır (status = 'available').
 */
export async function openDesk(id: string): Promise<void> {
  await updateDeskStatus(id, 'available');
}

/**
 * Masayı askıya alır (status = 'suspended').
 */
export async function suspendDesk(id: string): Promise<void> {
  await updateDeskStatus(id, 'suspended');
}

/**
 * Masayı askıdan çıkarır (varsayılan olarak status = 'occupied').
 */
export async function unsuspendDesk(id: string, newStatus: DeskStatus = 'occupied'): Promise<void> {
  await updateDeskStatus(id, newStatus);
}


