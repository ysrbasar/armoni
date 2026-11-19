import { useEffect, useState } from "react";
import { ArrowRight, Check, ListChecks, RotateCcw } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Button, Card, ProgressBar, cn } from "@/components/ui";
import { navigate } from "@/lib/router";
import { TENANT } from "@/lib/tenant";

/**
 * Görev simülasyonu: sistemi baştan sona tanımak için sırayla yapılacak işler.
 * İşaretler bu tarayıcıda kullanıcıya özel saklanır.
 */

interface Task {
  id: string;
  title: string;
  how: string;
  to?: string;
  /** Yalnızca gerçek kurumda (giriş hesapları, şifreler) */
  live?: true;
  /** Demo sürümünde gösterilecek açıklama */
  demo?: string;
}
interface Stage {
  title: string;
  tasks: Task[];
}

const INST: Stage[] = [
  {
    title: "1. Tanışma",
    tasks: [
      { id: "i-home", title: "Genel bakış ekranını inceleyin", how: "Öğrenci, öğretmen, bugünkü ders ve çakışma kutularına bakın; her kutuya tıklayınca ilgili sayfa açılır.", to: "/inst" },
      { id: "i-menu", title: "Sol menüdeki tüm bölümleri bir kez açın", how: "Öğrenciler, Öğretmenler, Kurslar, Müfredat, Ders takvimi, Ödemeler, Raporlar, Giriş hesapları, Kurum ayarları.", demo: "Öğrenciler, Öğretmenler, Kurslar, Müfredat, Ders takvimi, Ödemeler, Raporlar, Kurum ayarları." },
      { id: "i-pass", title: "Kendi şifrenizi değiştirin", how: "Sağ üstte adınıza tıklayın → Şifremi değiştir.", live: true },
    ],
  },
  {
    title: "2. Kurumu hazırlama",
    tasks: [
      { id: "i-rooms", title: "Derslikleri gerçek odalara göre adlandırın", how: "Kurum ayarları → Derslikler. Adın üzerine tıklayıp değiştirin; eksik odayı ekleyin.", to: "/inst/settings" },
      { id: "i-trooms", title: "Her öğretmene dersliğini atayın", how: "Aynı sekmenin sağında öğretmen başına derslik seçin. Yeni dersler bu dersliğe yazılır.", to: "/inst/settings" },
      { id: "i-tinfo", title: "Öğretmen bilgilerini tamamlayın", how: "Öğretmenler → bir öğretmen → Bilgileri düzenle. Branş, unvan, telefon ve derslik alanlarını değiştirip kaydedin.", to: "/inst/teachers" },
      { id: "i-tdel", title: "Öğretmen silme kuralını görün", how: "Deneme bir öğretmen ekleyip kartındaki kırmızı Sil ile silin. Öğrencisi olan öğretmen silinmez; önce öğrencileri başka öğretmene atanır.", to: "/inst/teachers" },
      { id: "i-fee", title: "Kursları kontrol edin", how: "Kurslar sayfasında her branşın öğrenci sayısına bakın.", to: "/inst/courses" },
    ],
  },
  {
    title: "3. Öğrenciler",
    tasks: [
      { id: "i-branch", live: true, title: "Branşı belirtilmemiş bir öğrencinin branşını seçin", how: "Öğrenciler → listede \"Branş belirtilmemiş\" yazan bir öğrenci → Düzenle → Kurs / enstrüman.", to: "/inst/students" },
      { id: "i-profile", title: "Bir öğrencinin profilini baştan sona inceleyin", how: "Kazanımlar, parçalar, ödevler, devam ve veli bilgileri sekmelerine bakın.", to: "/inst/students" },
      { id: "i-add", title: "Deneme öğrencisini ders programıyla ekleyin", how: "Öğrenci ekle → kurs ve seviye; önerilen öğretmene bakın. Altta \"Ders programını şimdi oluştur\": ilk ders, saat, süre, derslik, ardından Haftada bir / İki haftada bir / Ayda bir ve bitiş tarihi. Önizlemedeki ders sayısını kontrol edip ekleyin; dersler takvime işlenir.", to: "/inst/students" },
      { id: "i-assign", title: "Bir öğrenciye öğretmen atayın", how: "Öğrenci profili → Öğretmen ata. Gelecek dersler ve açık ödevler yeni öğretmene geçer." },
      { id: "i-parent", live: true, title: "Bir öğrenciye veli ekleyin", how: "Giriş hesapları → öğrencinin altında Veli ekle.", to: "/inst/accounts" },
      { id: "i-sdel", title: "Deneme öğrencisini silin", how: "Öğrenciler listesinde satırın sonundaki kırmızı Sil. Dersleri, ödevleri, ödemeleri ve giriş hesabı da silinir; geri alınamaz. Gerçek öğrencide yalnızca kurumdan ayrıldığında kullanın.", to: "/inst/students" },
    ],
  },
  {
    title: "4. Ders takvimi",
    tasks: [
      { id: "i-cal-day", title: "Günlük görünümde derslikleri inceleyin", how: "Her sütun bir derslik; kutuda saat, öğrenci, öğretmen ve enstrüman yazar. Öğretmene göre görünüme de geçin.", to: "/inst/calendar" },
      { id: "i-cal-conf", title: "Bir çakışmanın nedenini bulun", how: "Kırmızı çerçeveli derse gelin; açıklama aynı derslik mi aynı öğretmen mi olduğunu söyler.", to: "/inst/calendar" },
      { id: "i-cal-add", title: "Boş bir saate tıklayıp ders ekleyin", how: "Derslik sütununda boş saate tıklayın; derslik otomatik gelir.", to: "/inst/calendar" },
      { id: "i-cal-repeat", title: "Tekrarlı ders ekleyin", how: "Ders ekle → öğrenci, tarih ve saat → Tekrar: Haftada bir / İki haftada bir / Ayda bir ve bitiş tarihi. Ayda bir, ayın aynı sıradaki günüdür (ör. her ayın 3. Perşembesi).", to: "/inst/calendar" },
      { id: "i-cal-series", title: "Serideki dersleri birlikte değiştirin", how: "Tekrarlı bir derse tıklayın → saati ya da dersliği değiştirin → \"Serideki sonraki derslere de uygula\" → Kaydet. Önceki dersler değişmez.", to: "/inst/calendar" },
      { id: "i-cal-del", title: "Seriden ders silin", how: "Derse tıklayın → kırmızı Sil. İlk soruda Tamam: bu ve sonraki dersler silinir; İptal: yalnızca bu ders.", to: "/inst/calendar" },
      { id: "i-cal-move", title: "Bir dersin dersliğini ya da saatini değiştirin", how: "Derse tıklayın → Derslik veya saat → Kaydet.", to: "/inst/calendar" },
      { id: "i-cal-week", title: "Haftalık görünümde öğretmen filtresi uygulayın", how: "Haftalık → Tüm öğretmenler yerine bir öğretmen seçin.", to: "/inst/calendar" },
    ],
  },
  {
    title: "5. Müfredat",
    tasks: [
      { id: "i-cur-look", title: "Bir enstrümanın programını inceleyin", how: "Müfredat → enstrüman seçin → seviyelerdeki kazanım ve parçalara bakın.", to: "/inst/curriculum" },
      { id: "i-cur-add", title: "Dünya ya da Türkiye programı ekleyin", how: "Dünya / Türkiye programı ekle → örn. MEB Güzel Sanatlar Lisesi ya da ABRSM tipi.", to: "/inst/curriculum" },
      { id: "i-cur-edit", title: "Bir kazanımı düzenleyin ve yeni kazanım ekleyin", how: "Kazanım adına tıklayıp değiştirin; Kazanım ekle ile yeni satır açın.", to: "/inst/curriculum" },
      { id: "i-cur-active", title: "Programı aktif yapın", how: "Aktif program öğretmen ve öğrenci ekranlarındaki kazanımları belirler.", to: "/inst/curriculum" },
    ],
  },
  {
    title: "6. Hesaplar ve ödemeler",
    tasks: [
      { id: "i-acc-t", live: true, title: "Bir öğretmenin giriş hesabını açın", how: "Giriş hesapları → Hesap aç → Mesajı kopyala ile WhatsApp'a yapıştırın.", to: "/inst/accounts" },
      { id: "i-acc-s", live: true, title: "Bir öğrenci ve bir veli hesabı açın", how: "Öğrencide kullanıcı adı olarak TC önerilir.", to: "/inst/accounts" },
      { id: "i-acc-r", live: true, title: "Şifre sıfırlamayı deneyin", how: "Hesabı olan bir kişide Şifre sıfırla → yeni geçici şifre üretilir, eski oturumlar kapanır.", to: "/inst/accounts" },
      { id: "i-pay", title: "Ödemeler sayfasını inceleyin", how: "Durumlar, ödeme alma ve hatırlatma; ders ücreti girildikçe dolar.", to: "/inst/payments" },
      { id: "i-rep", title: "Raporlarda kurs filtresi uygulayın", how: "Grafik ve tablo görünümleri arasında geçin.", to: "/inst/reports" },
    ],
  },
  {
    title: "7. Diğer gözden kontrol",
    tasks: [
      { id: "i-as-teacher", live: true, title: "Başka bir cihazda öğretmen hesabıyla girin", how: "Öğretmenin yalnızca kendi öğrencilerini gördüğünü, ödemeleri ve TC'leri görmediğini doğrulayın." },
      { id: "i-as-parent", live: true, title: "Veli hesabıyla girin", how: "Velinin yalnızca kendi çocuğunu gördüğünü doğrulayın." },
    ],
  },
];

const TEACHER: Stage[] = [
  {
    title: "1. Başlangıç",
    tasks: [
      { id: "t-first", live: true, title: "Geçici şifreyle girip kendi şifrenizi belirleyin", how: "Kurumdan gelen mesajdaki kullanıcı adı ve geçici şifreyle girin." },
      { id: "t-home", title: "Ana sayfanızı inceleyin", how: "Bugünkü dersler, bekleyen değerlendirmeler ve yaklaşan dersler.", to: "/teacher" },
      { id: "t-notif", title: "Ders hatırlatmalarını açın", how: "Üst bardaki zil simgesi → Hatırlatmaları aç. Telefona yüklediyseniz bildirim gelir." },
    ],
  },
  {
    title: "2. Öğrencilerim",
    tasks: [
      { id: "t-list", title: "Öğrenci listenizi inceleyin", how: "Seviyeye göre filtreleyin, ilerleme yüzdelerine bakın.", to: "/teacher/students" },
      { id: "t-skill", title: "Bir öğrencinin kazanımını onaylayın", how: "Öğrenci profili → Kazanımlar → bir kazanımı işaretleyin.", to: "/teacher/students" },
      { id: "t-eval", title: "Değerlendirme yazın", how: "Öğrenci profili → Değerlendirme ekle → yıldız ve kısa not.", to: "/teacher/students" },
      { id: "t-piece", title: "Bir parçanın durumunu güncelleyin", how: "Öğrenci profili → Parçalar → çalışılıyor / tekrar / tamamlandı.", to: "/teacher/students" },
      { id: "t-level", title: "Seviye geçişini inceleyin", how: "Seviyenin kazanımları tamamlanınca seviye onayı açılır.", to: "/teacher/students" },
    ],
  },
  {
    title: "3. Dersler",
    tasks: [
      { id: "t-lesson-open", title: "Bir dersi açın", how: "Derslerim → Yaklaşan ya da Bugün.", to: "/teacher/lessons" },
      { id: "t-lesson-save", title: "Ders notu ekleyip Kaydet'e basın", how: "Kaydet dersi açık bırakır; daha sonra devam edebilirsiniz.", to: "/teacher/lessons" },
      { id: "t-lesson-done", title: "Dersi tamamlayın ve devam durumunu işaretleyin", how: "Dersi tamamla → geldi / geç kaldı / gelmedi.", to: "/teacher/lessons" },
    ],
  },
  {
    title: "4. Ödevler",
    tasks: [
      { id: "t-asg-new", title: "Yeni ödev verin", how: "Ödevler → Yeni ödev → parça ya da kazanım, son tarih, tempo/tekrar.", to: "/teacher/assignments" },
      { id: "t-asg-review", title: "Teslim edilen bir ödevi onaylayın", how: "Onay bekleyen sekmesi → geri bildirim yazıp onaylayın.", to: "/teacher/assignments" },
    ],
  },
  {
    title: "5. Müfredat",
    tasks: [
      { id: "t-cur-look", title: "Branşınızın programını inceleyin", how: "Müfredat → seviye seviye kazanım ve parçalar.", to: "/teacher/curriculum" },
      { id: "t-cur-edit", title: "Bir kazanım ya da parça ekleyin", how: "Seviyenin altındaki Kazanım ekle / Parça ekle.", to: "/teacher/curriculum" },
      { id: "t-cur-prog", title: "Dünya ya da Türkiye programı ekleyip karşılaştırın", how: "Dünya / Türkiye programı ekle; uygun olanı Aktif yap. Öğrencilerinizin kazanım listesi buna göre değişir.", to: "/teacher/curriculum" },
    ],
  },
  {
    title: "6. Müzik Lab",
    tasks: [
      { id: "t-lab", title: "Müzik Lab araçlarını deneyin", how: "Sanal piyano, metronom, ritim laboratuvarı ve nota oyunu; telefonu yan çevirince yatay görünüm.", to: "/teacher/lab" },
    ],
  },
];

export default function Tasks() {
  const role = useStore((s) => s.session.role);
  const username = useStore((s) => s.user?.username ?? "misafir");
  // Demoda hesap görevleri çıkar, kuruma özel açıklamalar genel haliyle gösterilir
  const stages = (role === "teacher" ? TEACHER : INST)
    .map((st) => ({ ...st, tasks: st.tasks.filter((t) => TENANT || !t.live).map((t) => (!TENANT && t.demo ? { ...t, how: t.demo } : t)) }))
    .filter((st) => st.tasks.length > 0);
  const key = `armoni-gorevler-${username}`;
  const [done, setDone] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(done));
    } catch {
      /* gizli pencere: işaretler yalnızca bu oturumda kalır */
    }
  }, [done, key]);

  const all = stages.flatMap((s) => s.tasks);
  const count = all.filter((t) => done.includes(t.id)).length;
  const toggle = (id: string) => setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  return (
    <>
      <PageHeader
        title="Görevler"
        subtitle={role === "teacher" ? "Sistemi öğretmen olarak tanımak için sırayla yapın ve işaretleyin." : "Sistemi kurum yöneticisi olarak baştan sona tanımak için sırayla yapın ve işaretleyin."}
        actions={
          count > 0 && (
            <Button variant="ghost" icon={RotateCcw} onClick={() => confirm("Tüm işaretler kaldırılsın mı?") && setDone([])}>
              Sıfırla
            </Button>
          )
        }
      />
      <Card className="mb-5 flex items-center gap-4 p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <ListChecks size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {count} / {all.length} görev tamamlandı
          </p>
          <ProgressBar value={(count / all.length) * 100} className="mt-2" />
        </div>
      </Card>

      <div className="space-y-5">
        {stages.map((st) => {
          const n = st.tasks.filter((t) => done.includes(t.id)).length;
          return (
            <Card key={st.title} className="p-5">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-[15px] font-bold">{st.title}</h2>
                <span className={cn("text-xs font-semibold", n === st.tasks.length ? "text-mint-700" : "text-muted")}>
                  {n}/{st.tasks.length}
                </span>
              </div>
              <div className="divide-y divide-line">
                {st.tasks.map((t) => {
                  const ok = done.includes(t.id);
                  return (
                    <div key={t.id} className="flex items-start gap-3 py-3">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={ok}
                        aria-label={t.title}
                        onClick={() => toggle(t.id)}
                        className={cn(
                          "mt-0.5 grid size-6 shrink-0 cursor-pointer place-items-center rounded-lg border-2 transition",
                          ok ? "border-mint-600 bg-mint-600 text-white" : "border-line-strong hover:border-brand-400",
                        )}
                      >
                        {ok && <Check size={15} strokeWidth={3} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[14px] font-semibold", ok && "text-muted line-through")}>{t.title}</p>
                        <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{t.how}</p>
                      </div>
                      {t.to && (
                        <Button size="sm" variant="ghost" iconRight={ArrowRight} onClick={() => navigate(t.to!)}>
                          Git
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
