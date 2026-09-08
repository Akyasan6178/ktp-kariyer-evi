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
    title: 'Sisteme Giriş',
    iconColor: 'text-slate-600',
    iconBg: 'bg-slate-100',
    lines: [
      'Tarayıcınızda sistemin adresini açın ve size verilen e-posta ile şifreyi girin.',
      'Yönetici (Admin) rolüyle giriş yaparsanız tüm menülere erişebilirsiniz.',
      'Personel (Staff) rolüyle yalnızca Kat Planı ve Kiralama Yönetimi sayfalarını görebilirsiniz.',
    ],
  },
  {
    id: 2,
    icon: BookOpen,
    title: 'Masa Kiralama',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    lines: [
      'Ana sayfadaki kat planında yeşil (boş) bir masaya tıklayın; sağdan bir panel açılır.',
      '"Kiralama Oluştur" butonuna basın, öğrenci bilgilerini ve paket seçimini doldurun.',
      'Kaydet\'e tıklayınca masa anında dolu olarak işaretlenir ve öğrenci kaydedilir.',
    ],
  },
  {
    id: 3,
    icon: Clock,
    title: 'Süre Uzatma',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    lines: [
      'Masaya tıklayıp detay panelini açın veya Kiralama Yönetimi listesindeki saat ikonunu kullanın.',
      '"Süre Uzat" butonuyla 1 Hafta, 1 Ay veya 1 Yıl seçeneğinden birini seçin ve alınan ücreti girin.',
      'İlk kiralama fiyatı değişmez; uzatma ayrı bir finansal kayıt olarak tutulur.',
    ],
  },
  {
    id: 4,
    icon: BarChart3,
    title: 'Raporları Görüntüleme',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    lines: [
      'Üst menüden "Raporlar" sayfasına gidin (yalnızca yönetici erişebilir).',
      'Gelir özetleri, doluluk oranları ve öğrenci dağılımlarını buradan takip edebilirsiniz.',
      'Tarihe göre filtreleme yaparak belirli dönemlere ait verileri inceleyebilirsiniz.',
    ],
  },
  {
    id: 5,
    icon: QrCode,
    title: 'QR Kodları Kullanma',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
    lines: [
      '"QR Kodlar" sayfasından 50 masanın tümü için Wi-Fi QR kodları oluşturulur.',
      'Kodları tek tek PNG olarak veya tümünü ZIP arşivi olarak indirebilirsiniz.',
      'Öğrenciler masadaki QR kodu telefon kameralarıyla okutarak şifresiz internete bağlanır.',
    ],
  },
  {
    id: 6,
    icon: Database,
    title: 'Yedek Alma',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
    lines: [
      '"Yedekleme" sayfasından tüm veritabanını JSON, Excel veya CSV formatında dışa aktarabilirsiniz.',
      'JSON formatı sistem geri yüklemesi için, Excel formatı ofis kullanımı için önerilir.',
      'Her yedek işlemi otomatik olarak loglanır; geçmiş yedekler listede görünür.',
    ],
  },
  {
    id: 7,
    icon: ShieldCheck,
    title: 'Yetki Rolleri',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    lines: [
      'Sistemde iki rol vardır: Yönetici (Admin) ve Personel (Staff).',
      'Personel yalnızca kat planını görüntüleyebilir ve kiralama işlemi yapabilir.',
      'Yönetici; raporlara, ayarlara, yedeklemeye ve QR yönetimine tam erişime sahiptir.',
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
            <BookOpen className="h-7 w-7 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Nasıl Kullanılır?
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
            Kütüphane yönetim sistemini hızlıca öğrenmek için aşağıdaki kısa rehberi okuyun.
            Her bölüm birkaç cümleyle anlatılmıştır.
          </p>
        </div>

        {/* Bölümler */}
        <div className="space-y-4">
          {GUIDE_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
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
                    <ul className="space-y-2">
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

        {/* Alt bilgi */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-900 p-6 text-center">
          <p className="text-sm text-slate-400">
            Sorularınız için sistem yöneticisine danışın.
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            Kütüphane Yönetim Sistemi · Yasin Hoca Çalışma Merkezi
          </p>
        </div>
      </main>
    </div>
  );
}
