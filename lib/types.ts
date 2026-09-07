// ============================================================
// Uygulama Tip Tanımları
// Supabase şemasıyla 1:1 eşleşen temiz tipler.
// ============================================================

import type { Database } from './database.types';

// ── Temel satır tipleri (Supabase tablosundan direkt) ────────
export type DbDesk = Database['public']['Tables']['desks']['Row'];
export type DbStudent = Database['public']['Tables']['students']['Row'];
export type DbRental = Database['public']['Tables']['rentals']['Row'];

// ── Enum tipleri ─────────────────────────────────────────────
export type DeskStatus = DbDesk['status'];
// 'available' | 'occupied' | 'suspended' | 'expiring'

export type PaymentStatus = DbRental['payment_status'];
// 'pending' | 'deposit' | 'paid'

export type PackageType = DbRental['package_type'];
// 'weekly' | 'monthly' | 'yearly'

// ── Süre Uzatma Tablo Tipi (rental_extensions) ───────────────
export interface DbRentalExtension {
  id: string;
  rental_id: string;
  extension_type: string;
  amount: number;
  payment_status: PaymentStatus;
  payment_note: string | null;
  old_end_date: string;
  new_end_date: string;
  created_at: string;
}

export type RentalExtensionInsert = Omit<DbRentalExtension, 'id' | 'created_at'>;

// ── Toplam Gelir Özeti ───────────────────────────────────────
export interface RentalRevenueSummary {
  initialPrice: number;
  extensionsTotal: number;
  totalRevenue: number;
  paidTotal: number;
  pendingTotal: number;
  extensions: DbRentalExtension[];
}

// ── Join tipleri – Masa + Aktif Kiralama + Öğrenci ───────────
// Service katmanından dönen zengin tipler; bileşenler bunu kullanır.
export interface ActiveRental extends DbRental {
  student: DbStudent;
}

export interface DeskWithRental extends DbDesk {
  active_rental: ActiveRental | null;
}

// ── Detaylı Kiralama Tipi (Rentals yönetim sayfası için) ───────
export interface RentalDetailed extends DbRental {
  desk: DbDesk;
  student: DbStudent;
}

// ── İstatistik özeti ─────────────────────────────────────────
export interface LibraryStats {
  total: number;
  available: number;
  occupied: number;
  suspended: number;
  expiring: number;
  depositCount: number;
  expiredCount: number;
}

// ── Insert / Update yardımcı tipleri ─────────────────────────
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];

export type RentalInsert = Database['public']['Tables']['rentals']['Insert'];
export type RentalUpdate = Database['public']['Tables']['rentals']['Update'];

export type DeskUpdate = Database['public']['Tables']['desks']['Update'];

// ── Ayarlar Tablosu Tipi (settings) ───────────────────────────
export interface DbSettings {
  id: string;
  library_name: string;
  phone: string;
  address: string;
  wifi_name: string;
  wifi_password: string;
  weekly_price: number;
  monthly_price: number;
  yearly_price: number;
  updated_at: string;
}

export type SettingsUpdate = Partial<Omit<DbSettings, 'id' | 'updated_at'>>;

// ── Auth & Profil Tipleri (profiles) ──────────────────────────
export type UserRole = 'admin' | 'staff';

export interface DbProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

// ── Yedekleme Tipleri (backup_logs) ───────────────────────────
export type BackupFileType = 'json' | 'csv' | 'excel';

export interface DbBackupLog {
  id: string;
  created_at: string;
  file_type: BackupFileType;
  file_size: string;
  created_by: string;
  status: 'success' | 'failed';
  record_count: number;
}

export interface FullBackupPayload {
  version: string;
  timestamp: string;
  created_by: string;
  counts: {
    students: number;
    rentals: number;
    rental_extensions: number;
    desks: number;
    settings: number;
    profiles: number;
    total: number;
  };
  tables: {
    students: any[];
    rentals: any[];
    rental_extensions: any[];
    desks: any[];
    settings: any[];
    profiles: any[];
  };
}
