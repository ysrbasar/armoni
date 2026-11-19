/**
 * Müfredat şablonları
 *
 * Bir program iki parçadan üretilir:
 *   1. Çerçeve (framework): seviyelerin adı ve her seviyede neye odaklanıldığı (ör. ABRSM tipi sınav sistemi, MEB GSL)
 *   2. Enstrüman ailesi şablonu: o aileye özgü teknik kazanımlar (ör. yaylılarda yay tutuşu, üflemelilerde nefes)
 *
 * Bu yüzden yeni bir enstrüman eklemek için yalnızca ailesini seçmek yeter; istenen çerçeveyle programı
 * otomatik oluşur, sonra kurum her kazanımı ve parçayı serbestçe düzenler.
 *
 * Not: Çerçeveler, bilinen eğitim sistemlerinin seviye yapısını ve genel odaklarını özetleyen kurum
 * şablonlarıdır; resmi sınav programlarının kopyası değildir. Resmi sınava hazırlanan öğrenci için
 * ilgili kurumun güncel programı ayrıca takip edilmelidir.
 */
import type { Curriculum, Instrument, InstrumentFamily, InstrumentId, Level, Piece, Skill } from "./types";
import { BUILTIN_PIECES, BUILTIN_SKILLS } from "./catalog";

type Def = [title: string, description: string];

export interface Framework {
  id: string;
  name: string;
  region: "Dünya" | "Türkiye" | "Kurum";
  /** Kısa açıklama: ne tür bir sistem, kimler için */
  description: string;
  /** Uygulamadaki 5 seviyenin bu sistemdeki karşılığı */
  levelLabels: [string, string, string, string, string];
  /** Her seviyeye eklenen, sisteme özgü kazanımlar */
  focus: [Def[], Def[], Def[], Def[], Def[]];
  /** Önerildiği aileler (boşsa hepsi) */
  families?: InstrumentFamily[];
}

export const FAMILIES: { id: InstrumentFamily; name: string; examples: string }[] = [
  { id: "klavye", name: "Klavyeli", examples: "piyano, org, akordeon, klavsen" },
  { id: "telli", name: "Telli / mızraplı", examples: "gitar, bağlama, ud, kanun, mandolin, elektro gitar, bas" },
  { id: "yayli", name: "Yaylı", examples: "keman, viyola, çello, kontrbas, kemençe" },
  { id: "uflemeli", name: "Üflemeli", examples: "flüt, ney, klarnet, saksafon, trompet, mey, zurna" },
  { id: "vurmali", name: "Vurmalı", examples: "bateri, darbuka, perküsyon, bendir, marimba" },
  { id: "ses", name: "Ses (şan)", examples: "klasik şan, pop/caz vokal, Türk müziği ses eğitimi, koro" },
  { id: "kuram", name: "Kuram", examples: "solfej, armoni, müzik teorisi, kulak eğitimi" },
];

/* ───────────── Aile şablonları: seviye başına 3 teknik kazanım ───────────── */

export const FAMILY_TEMPLATES: Record<InstrumentFamily, [Def[], Def[], Def[], Def[], Def[]]> = {
  klavye: [
    [["Oturuş ve el pozisyonu", "Gevşek omuz, yuvarlak parmaklar, doğru yükseklik."], ["Klavyede yön bulma", "Tuş gruplarından notaları bulma."], ["Beş parmak pozisyonu", "Tek elle kısa ezgiler."]],
    [["İlk gamlar", "Bir oktav, eller ayrı, doğru parmak geçişi."], ["Bağlı ve kesik çalış", "Legato ve staccato dokunuşu."], ["İki elle basit parça", "Sağ el ezgi, sol el tek ses eşlik."]],
    [["Eller birlikte gam ve arpej", "İki oktav, düzenli tempo."], ["Dinamik ve cümle", "p–f arası nüans, nefesli cümleleme."], ["Pedal başlangıcı", "Temiz pedal değişimi."]],
    [["Çok sesli yapı", "İki bağımsız sesi dengeli duyurma."], ["Teknik etütler", "Hız ve eşitlik için etüt çalışması."], ["Üslup farkları", "Barok, klasik, romantik dönem dokunuşları."]],
    [["İleri teknik", "Oktav, çift ses, hızlı pasajlar."], ["Konser programı", "Farklı dönemlerden dengeli bir program."], ["Bağımsız yorum", "Kendi yorum kararlarını gerekçelendirme."]],
  ],
  telli: [
    [["Tutuş ve duruş", "Çalgıyı ve mızrabı/tırnakları doğru tutma."], ["Boş tel ve ilk perdeler", "Temiz ses, gereksiz tel sesi olmadan."], ["Düzenli vuruş", "Metronomla aşağı-yukarı vuruş."]],
    [["Sol el konumu", "Parmak numaraları ve ilk konum."], ["Temel akor/düzen", "İlk akorlar ya da düzende temel ezgiler."], ["Basit ritim kalıpları", "İkilik, dörtlük, sekizlik vuruşlar."]],
    [["Pozisyon geçişleri", "Konumlar arası temiz kayma."], ["Süsleme teknikleri", "Çekme, hammer-on/pull-off, tremolo vb."], ["Eşlik ve ezgi birlikte", "Şarkıya eşlik ederken ezgiyi koruma."]],
    [["Hız ve temizlik", "Hızlı pasajlarda eşit ses."], ["Farklı düzen/akort", "Alternatif akort ya da düzenlerde çalma."], ["Üsluba özgü teknik", "Türün karakterine uygun icra (ör. şelpe, fingerstyle)."]],
    [["İleri icra teknikleri", "Türün ileri tekniklerini repertuvarda kullanma."], ["Doğaçlama / taksim", "Verilen dizi ya da makamda kısa doğaçlama."], ["Konser repertuvarı", "Sahneye hazır, ezberden program."]],
  ],
  yayli: [
    [["Çalgı ve yay tutuşu", "Gevşek bilek, doğru yay ağırlığı."], ["Boş tellerde düz yay", "Uçtan uca eşit ses."], ["Duruş", "Omuz ve çene yerleşimi, gevşek gövde."]],
    [["İlk konumda parmaklar", "Doğru entonasyon için parmak aralıkları."], ["Detaşe ve legato", "Ayrık ve bağlı yay."], ["Basit gamlar", "Bir oktav, temiz entonasyon."]],
    [["Pozisyon değiştirme", "Üçüncü konuma temiz geçiş."], ["Yay bölümleri", "Yayın farklı bölgelerinde ton kontrolü."], ["Dinamikler", "Yay hızı ve basıncıyla nüans."]],
    [["Vibrato", "Kol ya da bilek vibratosu, düzenli hız."], ["Çift ses", "Altılı ve üçlü aralıklar."], ["Spiccato başlangıcı", "Sıçrayan yay tekniği."]],
    [["İleri pozisyonlar", "Yüksek konumlarda entonasyon."], ["İleri yay teknikleri", "Sautillé, ricochet vb."], ["Konser repertuvarı", "Konçerto bölümü ya da sonat."]],
  ],
  uflemeli: [
    [["Nefes ve duruş", "Diyafram nefesi, rahat omuz."], ["Ağızlık / dudak yapısı", "Temiz ilk ses."], ["Uzun sesler", "Eşit, titremeyen uzun sesler."]],
    [["İlk dizi", "Bir oktav, temiz geçişler."], ["Dil vuruşu", "Notaları dille başlatma ve ayırma."], ["Nefes yerleri", "Cümle sonlarında doğru nefes."]],
    [["Oktav geçişi", "Hava hızıyla ikinci oktava geçiş."], ["Bağlı ve ayrık", "Artikülasyon çeşitleri."], ["Ton rengi", "Farklı dinamiklerde ton kalitesi."]],
    [["Çift dil / hızlı artikülasyon", "Hızlı pasajlarda dil teknikleri."], ["Vibrato", "Düzenli ve kontrollü vibrato."], ["Geniş ses alanı", "Tiz ve pes bölgede kontrol."]],
    [["İleri teknik", "Üçlü dil, çok sesli ya da genişletilmiş teknikler."], ["Üsluba özgü icra", "Türün süsleme ve nefes geleneği."], ["Konser repertuvarı", "Sahneye hazır solo program."]],
  ],
  vurmali: [
    [["Baget / el tutuşu", "Gevşek bilek, doğru tutuş."], ["Düz vuruşlar", "Eşit sağ-sol vuruşlar, metronomla."], ["Puls hissi", "Sabit tempoda saymak ve çalmak."]],
    [["Temel ritimler", "4/4'te temel kalıplar."], ["Rudiment başlangıcı", "Tek ve çift vuruş dizileri."], ["Koordinasyon", "El ve ayak bağımsızlığına giriş."]],
    [["Dolgular (fill)", "Ölçü sonlarında geçişler."], ["Farklı türler", "Rock, pop, Latin ve Türk ritimleri."], ["Dinamik kontrol", "Hafif ve güçlü vuruşları dengeleme."]],
    [["Aksak ritimler", "5/8, 7/8, 9/8 gibi ölçüler."], ["İleri rudimentler", "Paradiddle, flam ve drag çeşitleri."], ["Okuma", "Davul notası okuyarak çalma."]],
    [["Doğaçlama", "Türe uygun solo ve dolgular."], ["Grup içinde çalma", "Topluluğa liderlik eden ritim."], ["Konser repertuvarı", "Sahneye hazır program."]],
  ],
  ses: [
    [["Nefes ve duruş", "Diyafram nefesi, dik ve rahat gövde."], ["Isınma", "Dudak titreşimi, sirenler, hafif vokalizler."], ["Doğru ses verme", "Zorlamadan, rahat ses üretimi."]],
    [["Entonasyon", "Piyano ile aralıkları doğru basma."], ["Ses alanı", "Rahat ses aralığını genişletme."], ["Diksiyon", "Anlaşılır sesli ve sessiz harfler."]],
    [["Rezonans", "Göğüs ve kafa sesini dengeleme."], ["Cümle ve nefes planı", "Uzun cümlelerde nefes yönetimi."], ["İlk eserler", "Kısa şarkı ya da türkü."]],
    [["Geçiş bölgeleri", "Kırılmadan register geçişi."], ["Dinamik ve renk", "Yorum için ses rengi kullanma."], ["Üsluba özgü teknik", "Türün süsleme ve vibrato geleneği."]],
    [["İleri repertuvar", "Zorlu eserlerde teknik kontrol."], ["Sahne ve yorum", "Mikrofon, sahne duruşu, yorum."], ["Konser programı", "Farklı türlerden program."]],
  ],
  kuram: [
    [["Porte ve anahtarlar", "Sol ve Fa anahtarında okuma."], ["Nota değerleri", "Birlikten on altılığa."], ["Puls ve ölçü", "Basit ölçülerde sayma."]],
    [["Aralıklar", "İkiliden sekizliye."], ["Diziler", "Majör ve minör dizi yapısı."], ["Ritim dikte", "Kısa ritim kalıplarını yazma."]],
    [["Akorlar", "Üç sesliler ve çevrimleri."], ["Melodik dikte", "Kısa ezgileri yazma."], ["Tonalite", "Diyezli ve bemollü tonlar."]],
    [["Dört sesliler", "Yedili akorlar."], ["Kadanslar", "Kadans türleri ve kullanımı."], ["Solfej", "Prima vista ezgi okuma."]],
    [["Armoni yazımı", "Dört partili yazı."], ["Form analizi", "Temel müzik formları."], ["Modülasyon", "Komşu tonlara geçiş."]],
  ],
};

/* ───────────── Çerçeveler: dünyada ve Türkiye'de yaygın sistemler ───────────── */

export const FRAMEWORKS: Framework[] = [
  {
    id: "temel",
    name: "Kurum temel şablonu",
    region: "Kurum",
    description: "Yalnızca enstrüman ailesinin teknik kazanımlarıyla sade, 5 seviyeli başlangıç programı. Kurum kendi müfredatını bunun üzerine kurar.",
    levelLabels: ["Başlangıç", "Temel", "Gelişen", "Orta", "İleri"],
    focus: [[], [], [], [], []],
  },
  {
    id: "abrsm",
    name: "ABRSM tipi derece sistemi",
    region: "Dünya",
    description: "İngiltere kökenli, dünyada en yaygın derece (Grade) sınavı yapısı. Her derecede parçalar, gam/arpej, deşifre ve kulak testleri.",
    levelLabels: ["Prep / Initial", "Grade 1–2", "Grade 3–4", "Grade 5–6", "Grade 7–8"],
    focus: [
      [["Hazırlık sınavı becerileri", "Kısa parçaları ve temel becerileri bir dinleyiciye sunma."]],
      [["Derece parçaları", "Farklı karakterde üç kısa parça."], ["Gam ve arpej listesi", "Derecenin istediği gamları ezbere çalma."]],
      [["Deşifre", "Seviyesine uygun kısa bir parçayı ilk görüşte çalma."], ["Kulak testleri", "Ezgi tekrarı, ritim çırpma, özellik tanıma."]],
      [["Teori desteği", "Üst derecelere geçiş için gereken kuram bilgisi (Grade 5 teori)."], ["Program dengesi", "Farklı dönem ve üsluplardan parça seçimi."]],
      [["İleri derece programı", "Uzun ve teknik açıdan zorlu üç parça."], ["Sahne güveni", "Sınav ve resital koşullarında icra."]],
    ],
  },
  {
    id: "trinity",
    name: "Trinity College tipi derece sistemi",
    region: "Dünya",
    description: "İngiltere kökenli derece sistemi. Parçaların yanında teknik çalışma ve öğrencinin seçebildiği destekleyici testler (doğaçlama, kulak, müzik bilgisi).",
    levelLabels: ["Initial", "Grade 1–2", "Grade 3–4", "Grade 5–6", "Grade 7–8"],
    focus: [
      [["Kısa program", "Üç kısa parçayı sunma."]],
      [["Teknik çalışma", "Gam, arpej ya da teknik egzersiz seti."], ["Müzik bilgisi", "Çalınan parça hakkında sorulara cevap verme."]],
      [["Doğaçlama", "Verilen bir başlangıçla kısa doğaçlama."], ["Kulak testleri", "Dinlenen ezgiyi ve ritmi tanıma."]],
      [["Seçmeli testler", "Deşifre, doğaçlama ya da kulak testlerinden ikisi."], ["Kendi bestesi", "İstenirse kısa bir kendi parçası."]],
      [["İleri program", "Teknik ve yorum açısından zorlu program."], ["Bağımsız hazırlık", "Parçayı öğretmen yardımı az olarak hazırlama."]],
    ],
  },
  {
    id: "rcm",
    name: "RCM Certificate Program tipi",
    region: "Dünya",
    description: "Kanada kökenli kapsamlı program. Repertuvar, etüt, teknik gereksinimler, kulak eğitimi, deşifre ve teori birlikte ilerler.",
    levelLabels: ["Preparatory", "Level 1–3", "Level 4–6", "Level 7–8", "Level 9–10"],
    focus: [
      [["Repertuvar ve etüt", "Kısa parçalar ve hazırlık etütleri."]],
      [["Teknik gereksinimler", "Seviyenin gam, akor ve arpej listesi."], ["Kulak eğitimi", "Aralık ve akor tanıma."]],
      [["Etüt çalışması", "Teknik bir sorunu çözen etütler."], ["Deşifre ve ritim", "İlk görüşte okuma ve ritim çırpma."]],
      [["Teori eşleştirmesi", "Seviyeye denk teori/armoni bilgisi."], ["Liste dengesi", "Farklı dönemlerden repertuvar listesi."]],
      [["İleri repertuvar", "Sonat, konçerto ya da büyük formdan eser."], ["Diploma hazırlığı", "Uzun program ve sözlü değerlendirme."]],
    ],
  },
  {
    id: "suzuki",
    name: "Suzuki yöntemi",
    region: "Dünya",
    description: "Japonya kökenli, erken yaşta dinleyerek öğrenmeye dayanan yöntem. Veli katılımı, tekrar ve grup dersleri öne çıkar; nota okuma sonradan eklenir.",
    levelLabels: ["Ön hazırlık", "Kitap 1", "Kitap 2–3", "Kitap 4–5", "Kitap 6+"],
    families: ["klavye", "telli", "yayli", "uflemeli", "ses"],
    focus: [
      [["Dinleyerek öğrenme", "Kayıtları her gün dinleme alışkanlığı."], ["Veli ile çalışma", "Evde veli eşliğinde kısa günlük çalışma."]],
      [["Kulaktan çalma", "Dinlenen parçaları ezbere çalma."], ["Gözden geçirme", "Eski parçaları düzenli tekrar."]],
      [["Grup dersi", "Diğer öğrencilerle birlikte çalma."], ["Nota okumaya geçiş", "Bilinen parçaların notasını takip etme."]],
      [["Ton ve yorum", "Güzel ton ve müzikal ifade."], ["Mezuniyet parçası", "Kitap sonu mezuniyet kaydı ya da konseri."]],
      [["İleri repertuvar", "Klasik repertuvardan uzun eserler."], ["Liderlik", "Grup derslerinde küçük öğrencilere örnek olma."]],
    ],
  },
  {
    id: "rockschool",
    name: "Rockschool (RSL) tipi modern müzik",
    region: "Dünya",
    description: "Pop, rock ve caz odaklı derece sistemi. Eşlik kaydıyla çalma, teknik, hızlı öğrenme (quick study) ve kulak testleri.",
    levelLabels: ["Debut", "Grade 1–2", "Grade 3–4", "Grade 5–6", "Grade 7–8"],
    families: ["telli", "vurmali", "ses", "klavye"],
    focus: [
      [["Eşlik kaydıyla çalma", "Hazır eşlik kaydına uyumlu çalma."]],
      [["Tür parçaları", "Rock, pop, funk gibi farklı türlerden parçalar."], ["Teknik bölüm", "Gam, akor ve ritim kalıpları."]],
      [["Hızlı öğrenme", "Kısa bir bölümü dinleyip/okuyup hemen çalma."], ["Kulak testleri", "Ritim ve ezgiyi kulaktan tekrar etme."]],
      [["Doğaçlama", "Akor yürüyüşü üzerine kısa solo."], ["Stüdyo/sahne alışkanlığı", "Tıklama (click) ile ve grupla çalma."]],
      [["İleri performans", "Teknik açıdan zorlu tür parçaları."], ["Kendi yorumu", "Parçaya kendi dolgu ve süslemelerini ekleme."]],
    ],
  },
  {
    id: "meb-gsl",
    name: "MEB Güzel Sanatlar Lisesi çalgı eğitimi",
    region: "Türkiye",
    description: "Güzel Sanatlar Liselerinde 9–12. sınıf bireysel çalgı eğitimi yapısı. Batı ve Türk müziği çalgılarında teknik, etüt, eser ve sahne çalışması.",
    levelLabels: ["Hazırlık", "9. sınıf", "10. sınıf", "11. sınıf", "12. sınıf"],
    focus: [
      [["Lise giriş hazırlığı", "Çalgıyı tanıma, temel duruş ve ses üretimi."]],
      [["Temel teknik", "Doğru tutuş, temel diziler ve etütler."], ["Nota okuma", "Okuyarak çalma alışkanlığı."]],
      [["Etüt ve eser", "Seviyeye uygun etütler ve kısa eserler."], ["Türk müziği örnekleri", "Türkü ve basit makamsal eserler."]],
      [["Dönem ve üslup", "Farklı dönemlerden eser çalışması."], ["Toplu çalma", "Oda müziği ya da orkestra/topluluk deneyimi."]],
      [["Mezuniyet programı", "Sınav ve konsere hazır eser programı."], ["Konservatuvar hazırlığı", "Yetenek sınavına yönelik program."]],
    ],
  },
  {
    id: "konservatuvar",
    name: "Konservatuvar yetenek sınavı hazırlığı",
    region: "Türkiye",
    description: "Türkiye'deki konservatuvar ve müzik bölümlerinin özel yetenek sınavlarına hazırlık. Müzikal işitme, ritim ve ezgi tekrarı, solfej ve çalgı performansı.",
    levelLabels: ["Ön hazırlık", "Hazırlık 1", "Hazırlık 2", "Sınav öncesi", "Sınav dönemi"],
    focus: [
      [["Müzikal işitme", "Tek ve iki sesi ayırt etme, ezgiyi tekrar etme."]],
      [["Ritim tekrarı", "Dinlenen ritmi çırparak tekrar etme."], ["Ezgi tekrarı", "Dinlenen kısa ezgiyi sesle tekrar etme."]],
      [["Solfej", "Prima vista solfej okuma."], ["Çok ses işitme", "Akordaki sesleri ayırt etme."]],
      [["Sınav programı", "Sınavda çalınacak eserlerin seçimi ve çalışması."], ["Deneme sınavları", "Jüri önünde deneme performansı."]],
      [["Sınav provası", "Tam program, sınav koşullarında."], ["Sınav stresi yönetimi", "Nefes, hazırlık rutini, sahne güveni."]],
    ],
  },
  {
    id: "tsm-mesk",
    name: "Türk müziği meşk ve makam programı",
    region: "Türkiye",
    description: "Geleneksel meşk usulüne dayanan, usul ve makam bilgisiyle ilerleyen program. Bağlama, ud, ney, kanun, kemençe ve Türk müziği ses eğitimi için.",
    levelLabels: ["Temel", "Usul ve düzen", "Makam I", "Makam II", "Repertuvar ve icra"],
    families: ["telli", "uflemeli", "yayli", "ses", "vurmali"],
    focus: [
      [["Kulaktan meşk", "Hocadan dinleyerek kısa ezgi öğrenme."]],
      [["Usuller", "Sofyan, semai, aksak gibi temel usulleri vurma."], ["Düzen/akort", "Çalgının geleneksel düzenleri (ör. bağlama düzeni)."]],
      [["Temel makamlar", "Rast, uşşak, hüseyni gibi makamlarda seyir."], ["Türkü repertuvarı", "Yöresel türküler ve tavırları."]],
      [["Geçki ve çeşni", "Makamlar arası geçişler."], ["Peşrev ve saz semaisi", "Saz eserleri formları."]],
      [["Taksim", "Makamda doğaçlama taksim."], ["Fasıl ve konser", "Fasıl düzeninde ya da konser programında icra."]],
    ],
  },
  {
    id: "orff",
    name: "Erken çocukluk (Orff / Kodály esinli)",
    region: "Dünya",
    description: "4–8 yaş için oyun, hareket, şarkı ve ritimle müzik temeli. Enstrümana geçmeden önce ya da enstrümanla birlikte kullanılır.",
    levelLabels: ["Keşif", "Ritim ve hareket", "Şarkı ve oyun", "İlk çalgı", "Topluluk"],
    families: ["klavye", "vurmali", "ses", "kuram", "uflemeli"],
    focus: [
      [["Ses keşfi", "Yüksek-pes, uzun-kısa, hızlı-yavaş."]],
      [["Beden perküsyonu", "El çırpma, dize vurma ile ritim."]],
      [["Şarkıyla öğrenme", "Çocuk şarkılarıyla ezgi ve ritim."], ["El işaretleri", "Kodály el işaretleriyle ses yüksekliği."]],
      [["Orff çalgıları", "Ksilofon, metalofon ve küçük perküsyon."]],
      [["Topluluk", "Grup içinde sırayla ve birlikte çalma."], ["Küçük gösteri", "Velilere kısa sunum."]],
    ],
  },
];

export const frameworkById = Object.fromEntries(FRAMEWORKS.map((f) => [f.id, f])) as Record<string, Framework>;

export const isRecommended = (f: Framework, family?: InstrumentFamily) => !f.families || !family || f.families.includes(family);

/* ───────────── Program üretimi ───────────── */

const rid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * Bir enstrüman için çerçeveden program üretir: aile şablonundaki teknik kazanımlar + çerçevenin odakları.
 * Hazır enstrümanlarda Armoni programındaki parçalar da kopyalanır (sonra serbestçe düzenlenir).
 */
export function generateCurriculum(instrument: Instrument, frameworkId: string): { curriculum: Curriculum; skills: Skill[]; pieces: Piece[] } {
  const f = frameworkById[frameworkId];
  const family = instrument.family ?? "telli";
  const cid = rid(`cur-${frameworkId}-`);
  const curriculum: Curriculum = {
    id: cid,
    instrument: instrument.id,
    name: `${f.name} · ${instrument.name}`,
    frameworkId,
    region: f.region,
    description: f.description,
    levelLabels: [...f.levelLabels],
    createdAt: new Date().toISOString(),
  };
  const skills: Skill[] = [];
  ([0, 1, 2, 3, 4] as Level[]).forEach((stage) => {
    const defs = [...FAMILY_TEMPLATES[family][stage], ...f.focus[stage]];
    defs.forEach(([title, description], i) => skills.push({ id: `${cid}-k${stage}${i}`, instrument: instrument.id, stage, title, description, curriculumId: cid }));
  });
  const pieces: Piece[] = BUILTIN_PIECES.filter((p) => p.instrument === instrument.id).map((p, i) => ({ ...p, id: `${cid}-p${i}`, curriculumId: cid }));
  return { curriculum, skills, pieces };
}

/** Mevcut bir programı aynı enstrüman için düzenlenebilir kopyaya çevirir */
export function copyCurriculum(src: Curriculum, srcSkills: Skill[], srcPieces: Piece[], name: string) {
  const cid = rid("cur-copy-");
  return {
    curriculum: { ...src, id: cid, name, createdAt: new Date().toISOString(), hidden: false },
    skills: srcSkills.map((s, i) => ({ ...s, id: `${cid}-k${s.stage}${i}`, curriculumId: cid })),
    pieces: srcPieces.map((p, i) => ({ ...p, id: `${cid}-p${i}`, curriculumId: cid })),
  };
}

/** Yeni enstrüman için renk çiftleri (açık zemin, koyu vurgu) */
export const INSTRUMENT_COLORS: [string, string][] = [
  ["#efecff", "#5b4bdb"],
  ["#e6f6f1", "#0f8a75"],
  ["#fdf3e1", "#b97f12"],
  ["#fdeef1", "#c43d62"],
  ["#e3eefc", "#2672bd"],
  ["#f1f5e4", "#5f7d16"],
  ["#f6ebfa", "#8a3fb0"],
  ["#eef0f4", "#4b5068"],
];

export const slugify = (s: string) =>
  s.toLocaleLowerCase("tr").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Hazır kazanımların tümü: kopyalama için */
export const builtinSkillsOf = (instrument: InstrumentId) => BUILTIN_SKILLS.filter((s) => s.instrument === instrument);
