// ============================================================
// Supabase Database Tip Tanımları
// Supabase CLI ile otomatik üretilebilir:
//   npx supabase gen types typescript --project-id <id> > lib/database.types.ts
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      desks: {
        Row: {
          id: string;
          code: string;
          section: string;
          status: 'available' | 'occupied' | 'suspended' | 'expiring';
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          section: string;
          status?: 'available' | 'occupied' | 'suspended' | 'expiring';
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          section?: string;
          status?: 'available' | 'occupied' | 'suspended' | 'expiring';
          created_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          group_type: string;
          parent_name: string;
          parent_phone: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          group_type: string;
          parent_name: string;
          parent_phone: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          group_type?: string;
          parent_name?: string;
          parent_phone?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      rentals: {
        Row: {
          id: string;
          student_id: string;
          desk_id: string;
          package_type: 'weekly' | 'monthly' | 'yearly';
          start_date: string;
          end_date: string;
          price: number;
          payment_status: 'pending' | 'deposit' | 'paid';
          payment_note: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          desk_id: string;
          package_type: 'weekly' | 'monthly' | 'yearly';
          start_date: string;
          end_date: string;
          price: number;
          payment_status?: 'pending' | 'deposit' | 'paid';
          payment_note?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          desk_id?: string;
          package_type?: 'weekly' | 'monthly' | 'yearly';
          start_date?: string;
          end_date?: string;
          price?: number;
          payment_status?: 'pending' | 'deposit' | 'paid';
          payment_note?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
