// ============================================================
// KTP-018C: Teslim Öncesi Güvenli Veri Temizleme Scripti
// ============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://temseabgxqzgrvdmwmip.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_eGm6TCitMLWPdgDTU2Fnwg_I-cPc1i0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runCleanup() {
  console.log('====================================================');
  console.log('KTP-018C TESLİM ÖNCESİ VERİ TEMİZLİĞİ BAŞLATILIYOR');
  console.log('====================================================');

  // 1. ÖNCE: Mevcut Durum Kontrolü
  console.log('\n--- 1. TEMİZLİK ÖNCESİ MEVCUT DURUM ---');
  const countBefore = async (table) => {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) console.error(`[${table}] Sayım hatası:`, error.message);
    return count ?? 0;
  };

  const extBefore = await countBefore('rental_extensions');
  const rentalsBefore = await countBefore('rentals');
  const studentsBefore = await countBefore('students');
  const logsBefore = await countBefore('backup_logs');
  const desksBefore = await countBefore('desks');
  const settingsBefore = await countBefore('settings');
  const profilesBefore = await countBefore('profiles');

  console.log(`rental_extensions: ${extBefore}`);
  console.log(`rentals:           ${rentalsBefore}`);
  console.log(`students:          ${studentsBefore}`);
  console.log(`backup_logs:       ${logsBefore}`);
  console.log(`desks:             ${desksBefore}`);
  console.log(`settings:          ${settingsBefore}`);
  console.log(`profiles:          ${profilesBefore}`);

  // 2. GÜVENLİ TEMİZLEME İŞLEMLERİ (Sıralı)
  console.log('\n--- 2. GÜVENLİ TEMİZLEME İŞLEMLERİ ---');

  // Adım 1: rental_extensions sil
  console.log('Adım 1: rental_extensions tablosu temizleniyor...');
  const { error: errExt } = await supabase
    .from('rental_extensions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (errExt) {
    console.error('rental_extensions silme hatası:', errExt.message);
  } else {
    console.log('✓ rental_extensions başarıyla temizlendi.');
  }

  // Adım 2: rentals sil
  console.log('Adım 2: rentals tablosu temizleniyor...');
  const { error: errRentals } = await supabase
    .from('rentals')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (errRentals) {
    console.error('rentals silme hatası:', errRentals.message);
  } else {
    console.log('✓ rentals başarıyla temizlendi.');
  }

  // Adım 3: students sil
  console.log('Adım 3: students tablosu temizleniyor...');
  const { error: errStudents } = await supabase
    .from('students')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (errStudents) {
    console.error('students silme hatası:', errStudents.message);
  } else {
    console.log('✓ students başarıyla temizlendi.');
  }

  // Adım 4: backup_logs sil
  console.log('Adım 4: backup_logs tablosu temizleniyor...');
  const { error: errLogs } = await supabase
    .from('backup_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (errLogs) {
    console.error('backup_logs silme hatası:', errLogs.message);
  } else {
    console.log('✓ backup_logs başarıyla temizlendi.');
  }

  // Adım 5: Tüm masaları 'available' yap
  console.log('Adım 5: Tüm 50 masa "available" (Boş) durumuna sıfırlanıyor...');
  const { error: errDesks } = await supabase
    .from('desks')
    .update({ status: 'available' })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (errDesks) {
    console.error('desks güncelleme hatası:', errDesks.message);
  } else {
    console.log('✓ Tüm masalar "available" yapıldı.');
  }

  // 3. SONRA: Temizlik Sonrası Doğrulama
  console.log('\n--- 3. TEMİZLİK SONRASI DOĞRULANAN METRİKLER ---');
  const extAfter = await countBefore('rental_extensions');
  const rentalsAfter = await countBefore('rentals');
  const studentsAfter = await countBefore('students');
  const logsAfter = await countBefore('backup_logs');
  const desksAfter = await countBefore('desks');
  const settingsAfter = await countBefore('settings');
  const profilesAfter = await countBefore('profiles');

  // Aktif kiralamalar
  const { count: activeRentalsCount } = await supabase
    .from('rentals')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Masalar durum dökümü
  const { data: desksList } = await supabase.from('desks').select('status');
  const statusSummary = {};
  for (const d of desksList || []) {
    statusSummary[d.status] = (statusSummary[d.status] || 0) + 1;
  }

  console.log(`Aktif Öğrenci Sayısı:  ${studentsAfter}`);
  console.log(`Aktif Kiralama Sayısı: ${activeRentalsCount ?? 0}`);
  console.log(`Toplam Kiralama:       ${rentalsAfter}`);
  console.log(`Uzatma Sayısı:         ${extAfter}`);
  console.log(`Yedekleme Günlükleri:  ${logsAfter}`);
  console.log(`Toplam Masa:           ${desksAfter}`);
  console.log(`Masa Durum Dağılımı:   `, statusSummary);
  console.log(`Ayarlar (Settings):    ${settingsAfter} (Korundu)`);
  console.log(`Profiller (Admin):     ${profilesAfter} (Korundu)`);

  const isSuccess =
    studentsAfter === 0 &&
    rentalsAfter === 0 &&
    extAfter === 0 &&
    logsAfter === 0 &&
    desksAfter === 50 &&
    statusSummary['available'] === 50 &&
    settingsAfter === 1 &&
    profilesAfter === 2;

  console.log('\n====================================================');
  if (isSuccess) {
    console.log('✓ BAŞARILI: Sistem sıfır demo verisiyle tertemiz teslimata hazır!');
  } else {
    console.error('⚠️ UYARI: Bazı metrikler hedeflenen değerlerle uyuşmuyor.');
  }
  console.log('====================================================');
}

runCleanup();
