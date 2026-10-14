import type { Instrument, InstrumentId, Level, Piece, Skill } from "./types";

export const LEVELS: { id: Level; name: string; stage: string }[] = [
  { id: 0, name: "Başlangıç", stage: "Başlangıç" },
  { id: 1, name: "Temel", stage: "Temel teknikler" },
  { id: 2, name: "Gelişen", stage: "İlk parçalar" },
  { id: 3, name: "Orta", stage: "Orta seviye" },
  { id: 4, name: "İleri", stage: "İleri teknikler" },
];

export const levelName = (l: Level) => LEVELS[l].name;

export const INSTRUMENTS: Instrument[] = [
  {
    id: "piano",
    name: "Piyano",
    short: "Piyano",
    tint: "#efecff",
    tone: "#5b4bdb",
    goals: ["İki elin bağımsız çalışması", "Doğru parmak numaralandırma", "Pedal ve dinamik kontrolü", "Prima vista okuma"],
  },
  {
    id: "guitar",
    name: "Gitar",
    short: "Gitar",
    tint: "#fdf3e1",
    tone: "#b97f12",
    goals: ["Temiz akor geçişleri", "Ritim kalıplarında süreklilik", "Arpej ve parmak tekniği", "Tablatura ve nota okuma"],
  },
  {
    id: "violin",
    name: "Keman",
    short: "Keman",
    tint: "#fdeef1",
    tone: "#c43d62",
    goals: ["Doğru duruş ve yay tutuşu", "Temiz entonasyon", "Pozisyon geçişleri", "Vibrato ve ton kalitesi"],
  },
  {
    id: "baglama",
    name: "Bağlama",
    short: "Bağlama",
    tint: "#e6f6f1",
    tone: "#0f8a75",
    goals: ["Tezene tekniği", "Perde sistemi ve makamlar", "Şelpe tekniğine giriş", "Türkü repertuvarı"],
  },
  {
    id: "drums",
    name: "Bateri",
    short: "Bateri",
    tint: "#e8f1fc",
    tone: "#2672bd",
    goals: ["Sabit tempo ve groove", "Rudiment'ler", "Bağımsız uzuv koordinasyonu", "Fill ve geçişler"],
  },
  {
    id: "voice",
    name: "Şan",
    short: "Şan",
    tint: "#f6ecfb",
    tone: "#9445b4",
    goals: ["Diyafram nefesi", "Rezonans ve ses yerleşimi", "Entonasyon ve kulak", "Repertuvar yorumu"],
  },
  {
    id: "flute",
    name: "Flüt",
    short: "Flüt",
    tint: "#e4f5f7",
    tone: "#1a8597",
    goals: ["Ağızlık ve nefes kontrolü", "Uzun ses çalışmaları", "Parmak çevikliği", "Ton rengi ve dinamik"],
  },
  {
    id: "theory",
    name: "Müzik Teorisi",
    short: "Teori",
    tint: "#eef0f4",
    tone: "#475069",
    goals: ["Nota ve ritim okuma", "Aralık ve akor bilgisi", "Kulak eğitimi", "Armoni temelleri"],
  },
];

export const instrumentById = Object.fromEntries(INSTRUMENTS.map((i) => [i.id, i])) as Record<InstrumentId, Instrument>;

type SkillDef = [string, string];

const SKILL_DEFS: Record<InstrumentId, SkillDef[][]> = {
  piano: [
    [["Doğru oturuş ve el pozisyonu", "Bilek, dirsek ve omuz gevşek; parmaklar yuvarlak."], ["Beş parmak pozisyonu", "Do pozisyonunda 1-5 parmaklarla ezgi çalma."], ["Klavyede yön bulma", "Do ve Fa notalarını siyah tuş gruplarından bulma."]],
    [["Do majör gamı", "Tek oktav, iki el ayrı, doğru parmak geçişiyle."], ["Legato ve staccato", "Bağlı ve kesik çalışın tuş dokunuşunu ayırt etme."], ["Basit ritim kalıpları", "Dörtlük, ikilik ve sekizlik değerleri eşit tempoda."]],
    [["İki elle eşlik", "Sol elde temel akorlarla basit eşlik."], ["Dinamik farkları", "p, mf ve f dinamiklerini parçada uygulama."], ["İlk menüet", "Kısa bir barok parçayı baştan sona çalma."]],
    [["Pedal kullanımı", "Senkop pedal tekniğiyle temiz armoni geçişleri."], ["Arpej teknikleri", "İki oktav, iki el birlikte arpejler."], ["Prima vista okuma", "Daha önce görülmemiş 8 ölçüyü durmadan okuma."]],
    [["Çift ses ve oktav", "Bilek esnekliğiyle hızlı oktav pasajları."], ["Polifonik çalış", "İki bağımsız sesi aynı anda dengeli duyurma."], ["Yorum ve stil", "Barok, klasik ve romantik üslup farkları."]],
  ],
  guitar: [
    [["Gitar tutuşu ve duruş", "Sırt dik, gitar gövdeye yaslı, sol el başparmak sapın arkasında."], ["Açık teller", "Altı açık teli isimleriyle temiz çalma."], ["Pena tutuşu", "Aşağı-yukarı pena hareketiyle düzenli vuruş."]],
    [["İlk açık akorlar", "Mi minör, La minör ve Re majör akorları."], ["Akor geçişleri", "Dakikada 30 temiz geçiş hedefi."], ["Dörtlük ritim", "Metronomla 4/4 düz vuruş."]],
    [["Ritim kalıpları", "Aşağı-aşağı-yukarı-yukarı-aşağı-yukarı kalıbı."], ["Arpej", "p-i-m-a parmak düzeniyle arpej."], ["İlk şarkı", "Bir pop şarkısını eşlikli çalma."]],
    [["Barre akorlar", "Fa majör ve Si minör barre akorları."], ["Pentatonik gam", "Birinci pozisyonda minör pentatonik."], ["Klasik etüt", "Carcassi veya Sor etüdü."]],
    [["Fingerstyle", "Bas ve ezgiyi aynı anda çalma."], ["Doğaçlama", "Pentatonik üzerinde 12 ölçülük blues doğaçlaması."], ["Sahne repertuvarı", "Üç parçalık bir program hazırlama."]],
  ],
  violin: [
    [["Keman ve yay tutuşu", "Gevşek sağ el, esnek başparmak."], ["Açık tellerde yay", "Düz ve paralel yay hareketi."], ["Pizzicato", "Açık tellerde ritmik pizzicato."]],
    [["Birinci pozisyon parmakları", "La ve Mi tellerinde 1-2-3 parmaklar."], ["Detaşe", "Eşit ve ayrık yay vuruşları."], ["Re majör gamı", "Tek oktav, temiz entonasyon."]],
    [["Bağlı yay", "Tek yayda iki ve dört nota bağlama."], ["Dinamik", "Yay hızı ve basıncıyla nüans."], ["İlk sonatin", "Kısa bir sonatin bölümü."]],
    [["Üçüncü pozisyon", "Pozisyon geçişlerinde kayma tekniği."], ["Spiccato", "Zıplayan yay tekniğine giriş."], ["Vibrato", "Bilek vibratosunun temelleri."]],
    [["Çift ses", "Altılı ve üçlü çift sesler."], ["Konçerto hazırlığı", "Bir konçerto bölümünün çalışılması."], ["Oda müziği", "Dörtlü veya üçlü içinde çalma."]],
  ],
  baglama: [
    [["Bağlama tutuşu", "Gövde, sap ve tezene tutuşu."], ["Tellerin düzeni", "Bağlama düzeninde alt, orta ve üst teller."], ["Aşağı tezene", "Düzenli aşağı vuruş."]],
    [["Aşağı-yukarı tezene", "Sürekli ve eşit tezene."], ["Perde sistemi", "Ana perdeler ve koma perdeleri."], ["Basit ezgiler", "Tek telde kısa ezgiler."]],
    [["Uşşak makamı", "Uşşak dizisi ve karakteristik çeşniler."], ["Usul bilgisi", "2/4, 7/8 ve 9/8 usuller."], ["İlk türküler", "İki türküyü sözleriyle çalma."]],
    [["Hüseyni ve Hicaz", "Makam dizileri ve geçişler."], ["Süsleme", "Çarpma ve hammaratlar."], ["Bozlak çalışması", "Serbest ritimli icra."]],
    [["Şelpe tekniği", "Parmaklarla tezenesiz çalış."], ["Zeybek ve aksak usuller", "9/8 zeybek repertuvarı."], ["Sahne repertuvarı", "Yöresel bir program hazırlama."]],
  ],
  drums: [
    [["Baget tutuşu", "Matched grip ile dengeli tutuş."], ["Setin parçaları", "Kick, snare, hi-hat ve tom'ları tanıma."], ["Dörtlük vuruş", "Metronomla sabit tempo."]],
    [["Single stroke", "Sağ-sol dönüşümlü vuruşlar."], ["Basit rock groove", "Kick 1-3, snare 2-4, hi-hat sekizlik."], ["Sayma", "Sekizlikleri yüksek sesle sayarak çalma."]],
    [["Double stroke", "RRLL rudiment'i."], ["Fill'ler", "Dört vuruşluk tom fill'leri."], ["İlk şarkı", "Bir şarkıya baştan sona eşlik."]],
    [["Paradiddle", "RLRR LRLL ve uygulamaları."], ["Ghost note", "Snare'de vurgusuz notalar."], ["Shuffle", "Üçleme hissiyle shuffle groove."]],
    [["Bağımsız koordinasyon", "Dört uzvun bağımsız çalışması."], ["Tek ve çift bas", "Hızlı kick kalıpları."], ["Solo yapısı", "16 ölçülük yapılandırılmış solo."]],
  ],
  voice: [
    [["Nefes farkındalığı", "Diyafram nefesinin temelleri."], ["Duruş", "Rahat omuz, dik omurga."], ["Isınma rutini", "Dudak titreşimi ve mırıldanma."]],
    [["Ses yerleşimi", "Maskede rezonans hissi."], ["Majör dizi", "Do majör diziyi temiz söyleme."], ["Uzun sesler", "8 saniye sabit ses."]],
    [["Göğüs ve kafa sesi", "İki register arasında geçiş."], ["Aralık söyleme", "Üçlü ve beşli aralıklar."], ["İlk şarkı", "Basit bir şarkıyı yorumla söyleme."]],
    [["Mix ses", "Registerlar arası dengeli geçiş."], ["Diksiyon", "Ünlü ve ünsüzlerin netliği."], ["Arya / pop ballad", "Orta zorlukta repertuvar."]],
    [["Sahne yorumu", "Duygu ve beden dili."], ["Çok sesli koro", "Kendi partisini koruma."], ["Resital programı", "Dört eserlik program."]],
  ],
  flute: [
    [["Ağızlık pozisyonu", "Dudak açıklığı ve hava yönü."], ["İlk ses", "Ağızlıkla temiz ses."], ["Flüt tutuşu", "Denge noktaları ve duruş."]],
    [["Si-La-Sol notaları", "Temiz ve sürekli sesler."], ["Dil vuruşu", "Tu-tu dil tekniği."], ["Uzun ses", "Nefes kontrolüyle 6 saniye."]],
    [["Fa majör gamı", "Tek oktav, legato."], ["Nefes yerleri", "Cümle sonlarında doğru nefes."], ["İlk ezgi", "Kısa bir halk ezgisi."]],
    [["İkinci oktav", "Hava hızıyla oktav geçişi."], ["Çift dil", "Tu-ku tekniği."], ["Barok sonat", "Bir bölümün çalışılması."]],
    [["Vibrato", "Diyafram vibratosu."], ["Üçüncü oktav", "Tiz seslerde ton kontrolü."], ["Konser repertuvarı", "Solo program."]],
  ],
  theory: [
    [["Porte ve anahtarlar", "Sol ve Fa anahtarı."], ["Nota isimleri", "Porte üzerindeki notaları tanıma."], ["Nota değerleri", "Birlik'ten sekizliğe."]],
    [["Ölçü sayıları", "2/4, 3/4 ve 4/4."], ["Aralıklar", "İkili'den sekizli'ye."], ["Majör dizi yapısı", "Tam ve yarım ses düzeni."]],
    [["Akorlar", "Majör ve minör üç sesliler."], ["Kulak dikte", "İki ölçülük ritim dikte."], ["Tonalite", "Diyez ve bemollü tonlar."]],
    [["Dört sesliler", "Yedili akorlar."], ["Kadanslar", "Tam, yarım ve aldatıcı kadans."], ["Melodik dikte", "Dört ölçülük ezgi dikte."]],
    [["Armoni yazımı", "Dört partili koral."], ["Modülasyon", "Komşu tonlara geçiş."], ["Form analizi", "Sonat ve rondo formları."]],
  ],
};

export const SKILLS: Skill[] = INSTRUMENTS.flatMap((ins) =>
  SKILL_DEFS[ins.id].flatMap((stage, s) =>
    stage.map(([title, description], i) => ({
      id: `${ins.id}-k${s}${i}`,
      instrument: ins.id,
      stage: s as Level,
      title,
      description,
    })),
  ),
);

export const skillById = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<string, Skill>;

export const PIECES: Piece[] = [
  { id: "p01", title: "Ode to Joy", composer: "L. v. Beethoven", instrument: "piano", level: 0, tempo: 80 },
  { id: "p02", title: "Menüet Sol Majör", composer: "J. S. Bach", instrument: "piano", level: 2, tempo: 96 },
  { id: "p03", title: "Für Elise", composer: "L. v. Beethoven", instrument: "piano", level: 3, tempo: 120 },
  { id: "p04", title: "Gymnopédie No. 1", composer: "E. Satie", instrument: "piano", level: 3, tempo: 72 },
  { id: "p05", title: "Arabesque No. 1", composer: "C. Debussy", instrument: "piano", level: 4, tempo: 108 },
  { id: "p06", title: "Sonatin Op. 36 No. 1", composer: "M. Clementi", instrument: "piano", level: 2, tempo: 100 },
  { id: "p07", title: "Romanza", composer: "Anonim", instrument: "guitar", level: 3, tempo: 84 },
  { id: "p08", title: "Knockin' on Heaven's Door", composer: "B. Dylan", instrument: "guitar", level: 1, tempo: 70 },
  { id: "p09", title: "Etüt Op. 60 No. 7", composer: "M. Carcassi", instrument: "guitar", level: 3, tempo: 90 },
  { id: "p10", title: "Leyla", composer: "Geleneksel", instrument: "guitar", level: 2, tempo: 96 },
  { id: "p11", title: "Konçerto La Minör, 1. Bölüm", composer: "A. Vivaldi", instrument: "violin", level: 3, tempo: 104 },
  { id: "p12", title: "Gavotte", composer: "F. J. Gossec", instrument: "violin", level: 2, tempo: 112 },
  { id: "p13", title: "Twinkle Varyasyonları", composer: "S. Suzuki", instrument: "violin", level: 0, tempo: 88 },
  { id: "p14", title: "Uzun İnce Bir Yoldayım", composer: "Âşık Veysel", instrument: "baglama", level: 2, tempo: 76 },
  { id: "p15", title: "Çanakkale Türküsü", composer: "Anonim", instrument: "baglama", level: 1, tempo: 70 },
  { id: "p16", title: "Harmandalı Zeybeği", composer: "Anonim", instrument: "baglama", level: 4, tempo: 60 },
  { id: "p17", title: "Back in Black", composer: "AC/DC", instrument: "drums", level: 2, tempo: 94 },
  { id: "p18", title: "Billie Jean Groove", composer: "M. Jackson", instrument: "drums", level: 1, tempo: 117 },
  { id: "p19", title: "Take Five", composer: "D. Brubeck", instrument: "drums", level: 4, tempo: 172 },
  { id: "p20", title: "Caro Mio Ben", composer: "G. Giordani", instrument: "voice", level: 2, tempo: 66 },
  { id: "p21", title: "Ah Bu Şarkıların Gözü Kör Olsun", composer: "H. Saadettin Arel", instrument: "voice", level: 3, tempo: 72 },
  { id: "p22", title: "Hallelujah", composer: "L. Cohen", instrument: "voice", level: 1, tempo: 56 },
  { id: "p23", title: "Syrinx", composer: "C. Debussy", instrument: "flute", level: 4, tempo: 60 },
  { id: "p24", title: "Greensleeves", composer: "Geleneksel", instrument: "flute", level: 1, tempo: 84 },
  { id: "p27", title: "Bir Of Çeksem", composer: "Neşet Ertaş", instrument: "baglama", level: 3, tempo: 72 },
  { id: "p28", title: "Ankara'nın Taşına Bak", composer: "Anonim", instrument: "baglama", level: 1, tempo: 88 },
  { id: "p29", title: "Kara Toprak", composer: "Âşık Veysel", instrument: "baglama", level: 2, tempo: 70 },
  { id: "p30", title: "Sarı Gelin", composer: "Anonim", instrument: "baglama", level: 2, tempo: 76 },
  { id: "p31", title: "Hekimoğlu", composer: "Anonim", instrument: "baglama", level: 3, tempo: 120 },
  { id: "p32", title: "Gesi Bağları", composer: "Anonim", instrument: "baglama", level: 0, tempo: 80 },
  { id: "p25", title: "Ritim Okuma Seti 1", composer: "Armoni Atölye", instrument: "theory", level: 0, tempo: 70 },
  { id: "p26", title: "Bach Koralleri Analizi", composer: "J. S. Bach", instrument: "theory", level: 3, tempo: 60 },
];

export const pieceById = Object.fromEntries(PIECES.map((p) => [p.id, p])) as Record<string, Piece>;
