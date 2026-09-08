'use client';

import { Navbar } from '@/components/Navbar';
import {
  LogIn,
  BookOpen,
  Clock,
  BarChart3,
  QrCode,
  Database,
  ShieldCheck,
  ChevronRight,
  Mail,
} from 'lucide-react';

interface GuideSection {
  id: number;
  icon: React.ElementType;
  title: string;
  lines: string[];
  iconColor: string;
  iconBg: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 1,
    icon: LogIn,
    title: 'Sisteme Giriş & Yetkilendirme',
    iconColor: 'text-slate-700',
    iconBg: 'bg-slate-100',
    lines: [
      'Tarayıcınız üzerinden panel adresini açın; kurumunuz tarafından tanımlanan kurumsal e-posta ve şifrenizle saniyeler içinde giriş yapın.',
      'Yönetici (Admin) hesabı; kat planından finansal raporlara, Wi-Fi ayarlarından veri yedeklemeye kadar tüm sisteme tam kontrol yetkisiyle erişir.',
      'Personel (Staff) hesabı; kütüphane içi günlük operasyonel akışı hızlandırmak adına kat planı, masa kiralama ve süre uzatma ekranlarına odaklanır.',
    ],
  },
  {
    id: 2,
    icon: BookOpen,
    title: 'Masa Kiralama & Kayıt İşlemleri',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    lines: [
      'İnteraktif kat planında yeşil renkli boş masalardan birine tıkladığınızda, sağ tarafta detay paneli anında hazır hale gelir.',
      '"Kiralama Oluştur" butonuyla öğrenci adı-soyadı, iletişim numarası, veli telefonu ve haftalık/aylık/yıllık paket seçimini doldurun.',
      'Kaydet\'e bastığınız anda masa haritada anında doluya döner; öğrenci kaydı, doluluk oranları ve gelir tablosu eşzamanlı güncellenir.',
    ],
  },
  {
    id: 3,
    icon: Clock,
    title: 'Süre Uzatma & Askıya Alma',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    lines: [
      'Süresi yaklaşan masaya tıklayarak veya Kiralama Yönetimi listesindeki saat simgesine basarak süre uzatma penceresine ulaşabilirsiniz.',
      '1 Hafta, 1 Ay veya 1 Yıl paketlerinden birini belirleyin ve tahsil edilen tutarı girin; bitiş tarihi otomatik ötelenir ve bağımsız bir finans kaydı açılır.',
      'Geçici olarak ara veren öğrencilerin masasını "Askıya Al" ile dondurabilir; geri döndüklerinde "Askıdan Çıkar" ile saniyeler içinde tekrar aktifleştirebilirsiniz.',
    ],
  },
  {
    id: 4,
    icon: BarChart3,
    title: 'Gelir, Doluluk & Finansal Raporlar',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    lines: [
      'Yalnızca yöneticilere açık olan Raporlar sayfasından anlık ciro, net tahsilat, bölge performansı ve paket dağılım metriklerini canlı takip edin.',
      'Tarih ve salon filtreleriyle dönemsel analizler yapın; verilerinizi tek tıkla Excel (.xls) veya CSV formatında bilgisayarınıza aktarın.',
      'Excel raporları; optimize edilmiş sütun genişlikleri ve metin koruma biçimi sayesinde "#####" gibi taşma hataları olmaksızın kusursuz arşivleme sunar.',
    ],
  },
  {
    id: 5,
    icon: QrCode,
    title: 'Akıllı Wi-Fi & Masa QR Kodları',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
    lines: [
      'Kütüphanemizdeki 50 masanın tamamı için internete hızlı ve şifresiz bağlanmayı sağlayan dinamik Wi-Fi QR kodları otomatik üretilir.',
      'İhtiyacınıza göre doğrudan "Sadece QR" veya kurum başlığı ve masa numarasını içeren şık "Etiketli QR" formatlarından birini seçerek indirebilirsiniz.',
      'Masaları tek tek indirebileceğiniz gibi, tek bir tıkla 50 masanın tamamını yüksek çözünürlüklü organize bir ZIP arşivi olarak alabilirsiniz.',
    ],
  },
  {
    id: 6,
    icon: Database,
    title: 'Güvenli Veri Yedekleme & Arşiv',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    lines: [
      'Yedekleme merkezinden tüm veritabanı kayıtlarını (öğrenciler, sözleşmeler, finans hareketleri, masalar ve ayarlar) tek dokunuşla indirin.',
      'Sistem kurtarma ve taşıma senaryoları için JSON, ofis analizleri ve fiziki arşiv için ise Excel ve CSV seçeneklerinden yararlanın.',
      'Alınan her yedekleme adımı zaman damgası ve yönetici bilgisiyle sistem günlüğüne kaydedilir; veri güvenliğiniz daima güvence altındadır.',
    ],
  },
  {
    id: 7,
    icon: ShieldCheck,
    title: 'Kurumsal Ayarlar & Güvenlik Altyapısı',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    lines: [
      'Ayarlar ekranından kütüphane unvanı, iletişim numaraları, paket fiyat tarifeleri ve Wi-Fi ağ bilgileri yönetici tarafından kolayca güncellenir.',
      'Wi-Fi adı veya şifresi değiştirildiğinde QR kodlar sistemde anında güncellenir; herhangi bir karmaşık yapılandırmaya gerek kalmaz.',
      'Tüm kullanıcı oturumları ve veri iletişimleri Supabase Auth 256-bit şifreleme ve rol bazlı erişim denetimi (RBAC) ile korunmaktadır.',
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Navbar />

      <main className="mx-auto max-w-screen-lg px-4 py-10 sm:px-6 lg:px-8">
        {/* Başlık */}
        <div className="mb-10 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md mb-4">
            <BookOpen className="h-7 w-7 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Kullanım Rehberi & İpuçları
          </h1>
          <p className="mt-3 text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Kariyer Evi VIP Kütüphane yönetim sistemini hızlı, verimli ve profesyonel şekilde kullanabilmeniz için hazırlanan pratik adımlar ve ipuçları.
          </p>
        </div>

        {/* Bölümler */}
        <div className="space-y-4">
          {GUIDE_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-slate-300"
              >
                <div className="flex items-start gap-4">
                  {/* İkon */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${section.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${section.iconColor}`} />
                  </div>

                  {/* İçerik */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {section.id < 10 ? `0${section.id}` : section.id}
                      </span>
                      <h2 className="text-base font-bold text-slate-900">
                        {section.title}
                      </h2>
                    </div>
                    <ul className="space-y-2.5">
                      {section.lines.map((line, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                          <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* İletişim ve Destek Kutusu */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-center sm:px-10">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-400 backdrop-blur-sm mb-3">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white sm:text-xl">
              Sorularınız ve Teknik Destek İçin
            </h3>
            <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Sistem işleyişi, özel talepleriniz veya karşılaştığınız her türlü durum için doğrudan iletişime geçebilirsiniz.
            </p>
            <div className="mt-5 flex justify-center">
              <a
                href="mailto:akyasan.6178@gmail.com"
                className="inline-flex items-center gap-2.5 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg hover:bg-slate-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Mail className="h-4 w-4 text-emerald-600" />
                <span>akyasan.6178@gmail.com</span>
              </a>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 text-center border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500">
              Kariyer Evi VIP Kütüphane &bull; Yönetim ve Otomasyon Sistemi
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
