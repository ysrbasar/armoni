# Armoni — Müzik ve Sanat Eğitim Platformu (Demo)

Çok kurumlu müzik okulları ve sanat merkezleri için etkileşimli, sunuma hazır ön yüz demosu.
Backend gerektirmez; tüm veriler merkezi bir mock veri katmanından gelir ve tarayıcıda (`localStorage`) saklanır.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tip denetimi + üretim derlemesi (dist/)
npm run preview    # derlenmiş sürümü önizleme
```

Profil menüsündeki **Demo verilerini sıfırla** ile başlangıç verilerine dönülür.

## Netlify'a yükleme (yeni proje)

1. Netlify → **Add new project → Import an existing project → GitHub** → `ysrbasar/armoni` deposunu seçin.
2. **Branch to deploy:** `main`. Derleme komutu, yayın klasörü (`dist`) ve fonksiyonlar `netlify.toml` dosyasından otomatik okunur.
3. **Deploy** — ek ortam değişkeni gerekmez. Push bildirimleri için VAPID anahtarları ilk istekte otomatik üretilip Netlify Blobs'ta saklanır
   (isterseniz `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` ortam değişkenleriyle kendi anahtarlarınızı verebilirsiniz).

> Zamanlanmış fonksiyonlar (ders hatırlatıcısı) yalnızca **production** yayınında (`main`) çalışır.

## Mobil uygulama (PWA) ve bildirimler

- Android/Chrome: giriş ekranındaki **Uygulamayı telefona yükle** veya tarayıcı menüsü → *Uygulamayı yükle*.
- iPhone (Safari): Paylaş → **Ana Ekrana Ekle**. iOS'ta bildirimler yalnızca ana ekrana eklenmiş uygulamada çalışır (iOS 16.4+).
- Öğrenci, veli ve öğretmen; üst bardaki zil (veya *Daha → Ders hatırlatmaları*) ile hatırlatmaları açar.
  Her dersten **24 saat önce** bildirim gelir: `netlify/functions/push-reminders.mts` 15 dakikada bir zamanı gelen hatırlatmaları Web Push ile gönderir.
  Sunucuya ulaşılamazsa (ör. yerel geliştirme) uygulama açıldığında yerel bildirim gösterilir. *Test bildirimi gönder* ile anında denenebilir.
- Uygulama kabuğu service worker ile önbelleğe alınır; internet yokken de açılır.

## Roller

| Rol | Alan |
| --- | --- |
| Platform yöneticisi | (Giriş ekranında gösterilmez, kod içinde korunur) Kontrol merkezi, kurumlar ve kurum detayı, kullanıcılar, kurs kategorileri, sistem aktiviteleri |
| Kurum yöneticisi | Genel bakış, öğrenciler (ekle/düzenle/öğretmen ata, devamsızlık), öğretmenler (profil, devamsızlık/izin/rapor), kurslar, haftalık/günlük takvim, ödeme takibi, raporlar, kurum ayarları |
| Öğretmen | Bugünkü dersler, öğrencilerim, ders işleme, ödev oluşturma/inceleme, kazanım ve seviye onayı, Müzik Lab |
| Öğrenci | Bugün, öğrenme yolculuğu haritası, parçalarım, ödevlerim, başarılar, Müzik Lab |
| Veli | Çocuk değiştirici, genel bakış, gelişim, ödev durumları, ders özetleri |

## Müzik Laboratuvarı

Web Audio API ile tamamen tarayıcıda çalışır: sanal piyano (fare/dokunma/klavye), metronom (tap tempo, ölçü, vurgu),
16 adımlı ritim laboratuvarı ve porte üzerinde nota bulma oyunu.

## Yapı

```
src/
  data/       tipler, katalog (enstrüman, kazanım, parça), deterministik seed
  store/      zustand + persist: tüm demo işlemleri tek yerde
  lib/        tarih, seçiciler, rol navigasyonu, hash router, ses motoru
  components/ UI temel bileşenleri, grafikler, alan bileşenleri, kabuklar
  pages/      platform · inst · teacher · student · parent · lab
public/       manifest, service worker, uygulama ikonları
netlify/      push bildirimi fonksiyonları (abonelik, test, zamanlanmış hatırlatıcı)
```

Teknolojiler: React 19, TypeScript, Vite, Tailwind CSS 4, Recharts, Lucide, Zustand.
