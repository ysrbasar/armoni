import { PIECES, SKILLS, instrumentById } from "./catalog";
import type {
  Activity,
  Assignment,
  AssignmentStatus,
  Attendance,
  DemoData,
  Institution,
  InstrumentId,
  Lesson,
  Level,
  Parent,
  Payment,
  PaymentMethod,
  Student,
  StudentPiece,
  Teacher,
  TeacherAbsence,
} from "./types";
import { addDays, dayIndex, fromMinutes, toMinutes, todayISO } from "@/lib/date";
import { TENANT } from "@/lib/tenant";

/** Deterministik rastgele: her kurulumda aynı demo verisi */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const INSTITUTIONS: Institution[] = [
  {
    id: "armoni",
    name: "Armoni Müzik Akademisi",
    short: "Armoni",
    city: "İzmir",
    founded: 2014,
    plan: "Kurumsal",
    accent: "#5b4bdb",
    adminName: "Hande Uslu",
    fee: 3200,
    courseIds: ["piano", "guitar", "violin", "baglama", "voice", "flute", "theory"],
    branches: [
      { id: "armoni-alsancak", name: "Alsancak Şubesi", address: "Kıbrıs Şehitleri Cad. No: 112, Alsancak / Konak", rooms: 8 },
      { id: "armoni-karsiyaka", name: "Karşıyaka Şubesi", address: "Cemal Gürsel Cad. No: 340, Karşıyaka", rooms: 5 },
    ],
  },
  {
    id: "nota",
    name: "Nota Sanat Merkezi",
    short: "Nota",
    city: "İzmir",
    founded: 2018,
    plan: "Profesyonel",
    accent: "#14a38b",
    adminName: "Okan Tezcan",
    fee: 2800,
    courseIds: ["piano", "violin", "baglama", "flute", "voice", "theory"],
    branches: [
      { id: "nota-bornova", name: "Bornova Merkez", address: "Kazımdirik Mah. 372 Sk. No: 8, Bornova", rooms: 6 },
      { id: "nota-buca", name: "Buca Şubesi", address: "Menderes Cad. No: 210, Buca", rooms: 4 },
    ],
  },
  {
    id: "ritim",
    name: "Ritim Atölyesi",
    short: "Ritim",
    city: "İzmir",
    founded: 2021,
    plan: "Başlangıç",
    accent: "#e0a126",
    adminName: "Sena Karaman",
    fee: 2500,
    courseIds: ["drums", "guitar", "baglama", "voice"],
    branches: [
      { id: "ritim-goztepe", name: "Göztepe Stüdyo", address: "Mithatpaşa Cad. No: 905, Göztepe / Konak", rooms: 4 },
      { id: "ritim-bostanli", name: "Bostanlı Stüdyo", address: "Cemal Gürsel Cad. No: 520, Bostanlı / Karşıyaka", rooms: 3 },
    ],
  },
];

type TeacherSeed = [
  id: string,
  inst: string,
  name: string,
  title: string,
  specialties: InstrumentId[],
  levels: Level[],
  school: string,
  degree: string,
  gradYear: number,
  years: number,
  capacity: number,
];

const TEACHER_SEEDS: TeacherSeed[] = [
  ["t1", "armoni", "Deniz Kaya", "Piyano ve Teori Eğitmeni", ["piano", "theory"], [0, 1, 2, 3, 4], "MSGSÜ Devlet Konservatuvarı", "Piyano Lisans", 2011, 13, 8],
  ["t2", "armoni", "Selin Arslan", "Keman Eğitmeni", ["violin"], [0, 1, 2, 3], "İTÜ TMDK", "Keman Lisans", 2015, 9, 6],
  ["t3", "armoni", "Mert Yılmaz", "Gitar Eğitmeni", ["guitar"], [0, 1, 2, 3, 4], "Berklee College of Music", "Performance B.M.", 2012, 12, 7],
  ["t4", "armoni", "Zeynep Ertürk", "Şan Eğitmeni", ["voice"], [1, 2, 3, 4], "Hacettepe Ankara Devlet Konservatuvarı", "Opera Yüksek Lisans", 2013, 11, 6],
  ["t5", "armoni", "Can Özdemir", "Flüt ve Solfej Eğitmeni", ["flute", "theory"], [0, 1, 2, 3], "DEÜ Devlet Konservatuvarı", "Flüt Lisans", 2017, 7, 6],
  ["t6", "armoni", "Ece Tunç", "Piyano Eğitmeni (Çocuk)", ["piano"], [0, 1, 2], "Marmara Üniversitesi", "Müzik Öğretmenliği", 2019, 5, 6],
  ["t14", "armoni", "Hüseyin Kılınç", "Bağlama Eğitmeni", ["baglama"], [0, 1, 2, 3, 4], "İTÜ TMDK", "Türk Halk Müziği Yüksek Lisans", 2009, 15, 7],
  ["t7", "nota", "Burak Şahin", "Bağlama Eğitmeni", ["baglama"], [0, 1, 2, 3, 4], "İTÜ TMDK", "Türk Halk Müziği Lisans", 2010, 14, 7],
  ["t8", "nota", "Aylin Demir", "Piyano Eğitmeni", ["piano"], [0, 1, 2, 3, 4], "Bilkent Üniversitesi", "Piyano Yüksek Lisans", 2014, 10, 7],
  ["t9", "nota", "Kerem Aksoy", "Keman ve Teori Eğitmeni", ["violin", "theory"], [0, 1, 2, 3], "Gazi Üniversitesi", "Müzik Eğitimi Lisans", 2016, 8, 6],
  ["t10", "nota", "Gizem Yurt", "Flüt ve Şan Eğitmeni", ["flute", "voice"], [0, 1, 2, 3], "Anadolu Üniversitesi", "Flüt Lisans", 2018, 6, 6],
  ["t11", "ritim", "Onur Çelik", "Bateri Eğitmeni", ["drums"], [0, 1, 2, 3, 4], "Musicians Institute", "Drum Performance", 2013, 11, 7],
  ["t12", "ritim", "Melis Kara", "Gitar ve Bağlama Eğitmeni", ["guitar", "baglama"], [0, 1, 2, 3], "Ege Üniversitesi", "Müzik Bölümü", 2017, 7, 6],
  ["t13", "ritim", "Efe Doğan", "Bateri ve Şan Eğitmeni", ["drums", "voice"], [0, 1, 2, 3], "DEÜ Devlet Konservatuvarı", "Ses Eğitimi Lisans", 2019, 5, 5],
];

const CERTS: Record<InstrumentId, string[]> = {
  piano: ["ABRSM Grade 8 Piyano", "Dalcroze Ritmik Eğitim Sertifikası"],
  guitar: ["Trinity Rock & Pop Gitar Eğitmenliği", "Klasik Gitar Pedagojisi"],
  violin: ["Suzuki Metodu Eğitmenliği (Kitap 1-4)", "ABRSM Grade 8 Keman"],
  baglama: ["THM Ses ve Saz Sanatçılığı Belgesi", "Makam Teorisi Sertifikası"],
  drums: ["Rockschool Drums Grade 8", "Rudiment Pedagojisi Atölyesi"],
  voice: ["Estill Voice Training Level 1", "Koro Şefliği Sertifikası"],
  flute: ["ABRSM Grade 8 Flüt", "Barok Flüt Atölyesi"],
  theory: ["Orff-Schulwerk Seviye 1", "Kodály Kulak Eğitimi"],
};

type StudentSeed = [id: string, inst: string, branch: number, name: string, age: number, instrument: InstrumentId, teacher: string, level: Level];

const STUDENT_SEEDS: StudentSeed[] = [
  ["s1", "armoni", 0, "Ada Yıldız", 11, "piano", "t1", 2],
  ["s2", "armoni", 0, "Kuzey Yıldız", 14, "baglama", "t14", 1],
  ["s3", "armoni", 0, "Elif Şen", 9, "piano", "t1", 0],
  ["s4", "armoni", 1, "Arda Koç", 16, "piano", "t1", 3],
  ["s5", "armoni", 0, "Defne Aydın", 12, "violin", "t2", 1],
  ["s6", "armoni", 1, "Emir Polat", 15, "violin", "t2", 3],
  ["s7", "armoni", 0, "Nehir Uçar", 10, "guitar", "t3", 0],
  ["s8", "armoni", 1, "Yiğit Bulut", 17, "guitar", "t3", 4],
  ["s9", "armoni", 0, "Lara Erdem", 19, "voice", "t4", 2],
  ["s10", "armoni", 1, "Mina Karaca", 22, "voice", "t4", 3],
  ["s11", "armoni", 0, "Aras Tekin", 13, "flute", "t5", 1],
  ["s12", "armoni", 0, "Duru Önal", 8, "theory", "t5", 0],
  ["s13", "armoni", 1, "Can Bilgin", 13, "theory", "t1", 2],
  ["s14", "armoni", 0, "İpek Sezer", 10, "piano", "t6", 1],
  ["s15", "armoni", 1, "Ozan Akın", 7, "piano", "t6", 0],
  ["s16", "armoni", 0, "Asya Güneş", 14, "guitar", "t3", 2],
  ["s17", "nota", 0, "Bora Ateş", 18, "baglama", "t7", 3],
  ["s18", "nota", 0, "Ela Tan", 12, "baglama", "t7", 1],
  ["s19", "nota", 0, "Kaan Uysal", 25, "baglama", "t7", 4],
  ["s20", "nota", 0, "Su Kılıç", 9, "piano", "t8", 0],
  ["s21", "nota", 0, "Deren Okur", 13, "piano", "t8", 2],
  ["s22", "nota", 0, "Tuna Eren", 16, "piano", "t8", 3],
  ["s23", "nota", 0, "Zeren Aksu", 11, "violin", "t9", 1],
  ["s24", "nota", 0, "Poyraz Işık", 14, "violin", "t9", 2],
  ["s25", "nota", 0, "Ilgın Sarı", 15, "theory", "t9", 1],
  ["s26", "nota", 0, "Ecrin Duman", 10, "flute", "t10", 0],
  ["s27", "nota", 0, "Alp Gök", 20, "voice", "t10", 2],
  ["s28", "nota", 0, "Nil Coşkun", 12, "flute", "t10", 1],
  ["s29", "ritim", 0, "Rüzgar Oral", 15, "drums", "t11", 2],
  ["s30", "ritim", 1, "Atlas Kurt", 12, "drums", "t11", 0],
  ["s31", "ritim", 0, "Derin Acar", 19, "drums", "t11", 3],
  ["s32", "ritim", 0, "Ömer Sevim", 24, "drums", "t11", 4],
  ["s33", "ritim", 1, "Beren Aydemir", 14, "guitar", "t12", 1],
  ["s34", "ritim", 0, "Toprak Yalın", 17, "guitar", "t12", 2],
  ["s35", "ritim", 1, "Mira Ekinci", 13, "baglama", "t12", 1],
  ["s36", "ritim", 0, "Eylül Çınar", 21, "voice", "t13", 3],
  ["s37", "ritim", 1, "Batu Oktay", 11, "drums", "t13", 0],
  ["s38", "ritim", 0, "Lina Ay", 16, "voice", "t13", 2],
  ["s39", "armoni", 1, "Zeynep Arslan", 15, "baglama", "t14", 2],
  ["s40", "armoni", 0, "Mert Demirtaş", 19, "baglama", "t14", 3],
  ["s41", "armoni", 1, "Elanur Çelik", 10, "baglama", "t14", 0],
  ["s42", "nota", 1, "Deniz Akbulut", 13, "baglama", "t7", 2],
  ["s43", "ritim", 1, "Yusuf Tekin", 16, "baglama", "t12", 2],
];

const PARENTS: Parent[] = [
  { id: "p1", name: "Selin Yıldız", childIds: ["s1", "s2"] },
  { id: "p2", name: "Murat Şen", childIds: ["s3"] },
  { id: "p3", name: "Gülşen Tan", childIds: ["s18"] },
];

const EVAL_TEXTS = [
  "Ritim duygusu belirgin şekilde gelişti. Evde metronomla çalışmaya devam etmeli.",
  "Teknik olarak sağlam ilerliyor; dinamik farklara daha çok özen göstermeli.",
  "Derse hazırlıklı geliyor. Cümle sonlarında acele etme eğilimini birlikte düzeltiyoruz.",
  "Parçayı ezberden çalabiliyor. Bir sonraki hedef: yorum ve ifade.",
  "Duruş ve el pozisyonu düzeldi. Günlük kısa ama düzenli çalışma çok iyi sonuç verdi.",
  "Okuma hızı arttı. Zorlandığı pasajları yavaş tempoda tekrar etmeli.",
];

const LESSON_NOTES = [
  "Isınma çalışmalarıyla başladık; zor pasajları yavaş tempoda ayrı ayrı çalıştık.",
  "Geçen haftanın ödevi kontrol edildi, ritmik hatalar düzeltildi.",
  "Yeni bölüme geçtik. Parmak numaraları ve nefes yerleri işaretlendi.",
  "Ezber çalışması yapıldı, sahne provası niteliğinde baştan sona çalındı.",
  "Teknik egzersizlere ağırlık verildi. Öğrenci odaklı ve motiveydi.",
];

const TOPIC_BY_STAGE = ["Temel duruş ve ilk sesler", "Teknik egzersiz ve gam", "Parça çalışması", "Yorum ve teknik derinleşme", "Repertuvar ve sahne hazırlığı"];

const ASSIGNMENT_TEMPLATES = [
  { title: "Metronomla yavaş tempo çalışması", desc: "Zor ölçüleri ayrı ayrı, metronomla yavaş tempoda çalış. Her gün en az 15 dakika.", minutes: 15 },
  { title: "Bölüm ezberi", desc: "Parçanın ilk bölümünü ezberle ve kaydını getir.", minutes: 20 },
  { title: "Teknik egzersiz", desc: "Isınma egzersizlerini temiz ve eşit çal. Hız değil temizlik önemli.", minutes: 10 },
  { title: "Dinleme ve analiz", desc: "Parçanın iki farklı yorumunu dinle, aradaki farkları not et.", minutes: 20 },
  { title: "Baştan sona çalış", desc: "Parçayı durmadan baştan sona üç kez çal, hata yaptığın yerleri işaretle.", minutes: 25 },
];

const BAGLAMA_TEMPLATES = [
  { title: "Tezene çalışması", desc: "Alt telde aşağı-yukarı tezeneyi metronomla 70 BPM'de eşit vuruşla çal. Bileğini gevşek tut.", minutes: 15 },
  { title: "Uşşak dizisi", desc: "Uşşak dizisini çıkıcı ve inici olarak çal; segâh perdesinin yerine dikkat et.", minutes: 10 },
  { title: "9/8 usul çalışması", desc: "Parçayı 2+2+2+3 düzeninde sayarak çal, aksak vuruşu belirgin hissettir.", minutes: 15 },
  { title: "Türküyü çalarak söyle", desc: "İlk kıtayı hem çal hem söyle; sözle tezeneyi birlikte oturt.", minutes: 20 },
  { title: "Giriş sazı ezberi", desc: "Türkünün giriş sazını ezberle, çarpma ve süslemeleri yavaş tempoda temizle.", minutes: 20 },
];

const BAGLAMA_NOTES = [
  "Tezene vuruşları eşitlendi; üst telde perde geçişleri yavaş tempoda çalışıldı.",
  "Uşşak dizisi ve karakteristik çeşniler tekrar edildi, türkünün ağız bölümüne geçildi.",
  "Aksak usul sayılarak çalındı; 9/8'de son vuruşun acele edilmemesi üzerinde duruldu.",
];

export function createSeed(): DemoData {
  // Kuruma özel kurulum: tek kurum, örnek kayıt yok; katalog (parçalar, kazanımlar) hazır gelir
  if (TENANT) {
    return {
      instruments: [],
      curricula: [],
      institutions: [TENANT.institution],
      teachers: [],
      students: [],
      parents: [],
      pieces: [],
      studentPieces: [],
      skills: [],
      assignments: [],
      lessons: [],
      activities: [],
      payments: [],
      teacherAbsences: [],
    };
  }
  const r = rng(20261014);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const between = (a: number, b: number) => Math.round(a + r() * (b - a));
  const today = todayISO();

  const teachers: Teacher[] = TEACHER_SEEDS.map(
    ([id, institutionId, name, title, specialties, levels, school, degree, gradYear, years, capacity]) => {
      const first = name.split(" ")[0].toLocaleLowerCase("tr");
      return {
        id,
        institutionId,
        name,
        title,
        specialties,
        levels,
        capacity,
        experienceYears: years,
        email: `${first.replace(/ç/g, "c").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ı/g, "i")}@${institutionId}.armoni.app`,
        bio: `${years} yıllık eğitmenlik deneyimiyle ${specialties.map((s) => instrumentById[s].name.toLocaleLowerCase("tr")).join(" ve ")} alanında her yaştan öğrenciyle çalışıyor. Ders yaklaşımında teknik temeli, müzikal ifade ve düzenli çalışma alışkanlığıyla dengeliyor.`,
        education: [
          { school, degree, year: gradYear },
          ...(years > 9 ? [{ school: "Pedagojik Formasyon Programı", degree: "Sertifika", year: gradYear + 2 }] : []),
        ],
        certificates: specialties.flatMap((s) => CERTS[s]).slice(0, 3),
        experience: [
          { role: title, place: INSTITUTIONS.find((i) => i.id === institutionId)!.name, years: `${2026 - Math.min(years, 6)} – Günümüz` },
          { role: "Özel ders eğitmeni", place: "Serbest", years: `${2026 - years} – ${2026 - Math.min(years, 6)}` },
          ...(years > 10 ? [{ role: "Orkestra / topluluk müzisyeni", place: "Şehir Gençlik Orkestrası", years: `${2026 - years - 3} – ${2026 - years}` }] : []),
        ],
      };
    },
  );

  const students: Student[] = STUDENT_SEEDS.map(([id, institutionId, branchIdx, name, age, instrument, teacherId, level]) => {
    const inst = INSTITUTIONS.find((i) => i.id === institutionId)!;
    const instSkills = SKILLS.filter((s) => s.instrument === instrument);
    const current = instSkills.filter((s) => s.stage === level);
    const doneCount = level === 4 ? between(1, 2) : between(0, 2);
    const skillsDone = [...instSkills.filter((s) => s.stage < level).map((s) => s.id), ...current.slice(0, doneCount).map((s) => s.id)];
    const nextSkill = current[doneCount] ?? current[current.length - 1];
    const monthsIn = level * 5 + between(2, 6);
    const joinedAt = addDays(today, -monthsIn * 30);
    const goal = pick([20, 30, 30, 45]);
    const parent = PARENTS.find((p) => p.childIds.includes(id));
    return {
      id,
      institutionId,
      branchId: inst.branches[branchIdx].id,
      name,
      age,
      instrument,
      teacherId,
      level,
      joinedAt,
      parentId: parent?.id,
      streak: id === "s1" ? 9 : between(0, 16),
      dailyGoal: id === "s1" ? 30 : goal,
      practiceWeek: Array.from({ length: 7 }, (_, d) => (d > dayIndex(today) || (d > 4 && r() < 0.3) ? 0 : between(Math.round(goal * 0.4), Math.round(goal * 1.4)))),
      lastPractice: addDays(today, -between(0, 3)),
      nextGoal: nextSkill.title,
      skillsDone,
      levelHistory: Array.from({ length: level + 1 }, (_, l) => ({
        level: l as Level,
        date: addDays(joinedAt, l * 150),
        approvedBy: teacherId,
        note: l === 0 ? "Kayıt ve seviye belirleme" : "Öğretmen değerlendirmesiyle onaylandı",
      })),
      evaluations: [0, 1].map((k) => ({
        id: `${id}-ev${k}`,
        date: addDays(today, -(k * 21 + between(2, 9))),
        teacherId,
        text: pick(EVAL_TEXTS),
        rating: (k === 0 ? between(4, 5) : between(3, 5)) as 1 | 2 | 3 | 4 | 5,
      })),
    };
  });

  // Öğrenci–parça ilişkileri
  const studentPieces: StudentPiece[] = [];
  for (const s of students) {
    const pool = PIECES.filter((p) => p.instrument === s.instrument && p.level <= s.level + 1).sort((a, b) => a.level - b.level);
    let alt = 0;
    for (const p of pool.slice(0, 5)) {
      let status: StudentPiece["status"] = "learning";
      if (p.level < s.level) status = "done";
      else if (p.level === s.level) status = alt++ % 2 === 0 ? "practice" : "review";
      const target = p.tempo;
      studentPieces.push({
        id: `${s.id}-${p.id}`,
        studentId: s.id,
        pieceId: p.id,
        status,
        goal:
          status === "done"
            ? "Repertuvarda tut, ayda bir tekrar et."
            : status === "learning"
              ? "Bölüm bölüm, eller ayrı ve yavaş tempoda öğren."
              : status === "practice"
                ? "Hedef tempoya kademeli olarak ulaş; geçişleri temizle."
                : "Kaydını öğretmenine gönder, değerlendirme bekleniyor.",
        teacherNote: pick([
          "Giriş bölümünü acele etmeden çal.",
          "Geçiş ölçülerinde parmak numaralarına dikkat.",
          "Dinamikleri abartmaktan korkma.",
          "Cümle sonlarında nefes al, müziği konuştur.",
        ]),
        targetTempo: target,
        currentTempo: status === "done" ? target : Math.round(target * (status === "learning" ? 0.6 : 0.8)),
        completedAt: status === "done" ? addDays(today, -between(20, 160)) : undefined,
      });
    }
  }

  // Dersler: her öğrencinin haftalık sabit dersi, geçen hafta / bu hafta / gelecek hafta
  const lessons: Lesson[] = [];
  const STUDIOS = ["Stüdyo A", "Stüdyo B", "Stüdyo C", "Stüdyo D", "Stüdyo E", "Stüdyo F"];
  const OFFSETS = [0, 2, 0, 1, 3, -1, 4, -2, 5];
  const START_HOURS = [14, 10, 16, 12, 17, 11];
  const byTeacher = new Map<string, Student[]>();
  students.forEach((s) => byTeacher.set(s.teacherId, [...(byTeacher.get(s.teacherId) ?? []), s]));
  let lc = 0;
  teachers.forEach((t, ti) => {
    const roster = byTeacher.get(t.id) ?? [];
    const slotByDay = new Map<number, number>();
    const room = `Stüdyo ${String.fromCharCode(65 + (ti % 6))}`;
    roster.forEach((s, i) => {
      const offset = OFFSETS[(i + ti) % OFFSETS.length];
      const n = slotByDay.get(offset) ?? 0;
      slotByDay.set(offset, n + 1);
      const duration = s.instrument === "theory" ? 60 : 45;
      const start = fromMinutes(START_HOURS[ti % START_HOURS.length] * 60 + n * 60 + (ti % 2) * 30);
      const pieces = studentPieces.filter((sp) => sp.studentId === s.id && sp.status !== "done").map((sp) => sp.pieceId);
      const stageSkills = SKILLS.filter((k) => k.instrument === s.instrument && k.stage === s.level);
      // Öğrenciye özgü devam profili: çoğu düzenli, bazıları sık devamsız
      const pAbsent = i % 4 === 3 ? 0.18 + r() * 0.12 : r() * 0.08;
      const pLate = 0.04 + r() * 0.08;
      for (const w of [-56, -49, -42, -35, -28, -21, -14, -7, 0, 7]) {
        const date = addDays(today, offset + w);
        const past = date < today;
        const x = r();
        const att: Attendance = x < pAbsent ? "absent" : x < pAbsent + pLate ? "late" : "present";
        lessons.push({
          id: `l${++lc}`,
          institutionId: s.institutionId,
          teacherId: t.id,
          studentId: s.id,
          instrument: s.instrument,
          date,
          start,
          duration,
          room,
          topic: TOPIC_BY_STAGE[s.level],
          status: past ? "completed" : "scheduled",
          pieceIds: pieces.slice(0, 2),
          gains: past && att !== "absent" ? stageSkills.slice(0, 2).map((k) => k.title) : [],
          notes: past ? (att === "absent" ? "Öğrenci derse katılmadı." : pick(s.instrument === "baglama" ? BAGLAMA_NOTES : LESSON_NOTES)) : "",
          attendance: past ? att : undefined,
          nextGoal: s.nextGoal,
        });
      }
    });
  });
  // Takvimde gösterilecek bilinçli bir çakışma: topluluk provası
  const asya = students.find((s) => s.id === "s16")!;
  const kuzeyToday = lessons.find((l) => l.studentId === "s2" && l.date === today);
  lessons.push({
    id: `l${++lc}`,
    institutionId: "armoni",
    teacherId: "t3",
    studentId: asya.id,
    instrument: "guitar",
    date: today,
    start: kuzeyToday ? fromMinutes(toMinutes(kuzeyToday.start) + 15) : "15:00",
    duration: 45,
    room: "Stüdyo C",
    topic: "Topluluk provası (telafi)",
    status: "scheduled",
    pieceIds: ["p10"],
    gains: [],
    notes: "",
    nextGoal: asya.nextGoal,
  });

  // Ödevler
  const assignments: Assignment[] = [];
  let ac = 0;
  const STATUSES: AssignmentStatus[] = ["assigned", "in_progress", "submitted", "done"];
  for (const s of students) {
    const sp = studentPieces.filter((x) => x.studentId === s.id && x.status !== "done");
    const activeSkill = SKILLS.find((k) => k.instrument === s.instrument && k.stage === s.level && !s.skillsDone.includes(k.id));
    const count = s.id === "s1" ? 4 : s.id === "s2" ? 4 : s.instrument === "baglama" ? between(2, 3) : between(1, 2);
    for (let k = 0; k < count; k++) {
      const pool = s.instrument === "baglama" ? BAGLAMA_TEMPLATES : ASSIGNMENT_TEMPLATES;
      const tpl = pool[(k + Number(s.id.slice(1))) % pool.length];
      const piece = sp[k % Math.max(sp.length, 1)];
      const status = s.id === "s1" || s.id === "s2" ? STATUSES[k % 4] : pick(STATUSES);
      const pieceInfo = piece ? PIECES.find((p) => p.id === piece.pieceId) : undefined;
      assignments.push({
        id: `a${++ac}`,
        studentId: s.id,
        teacherId: s.teacherId,
        title: pieceInfo ? `${pieceInfo.title}: ${tpl.title.toLocaleLowerCase("tr")}` : tpl.title,
        description: tpl.desc,
        pieceId: piece?.pieceId,
        skillId: activeSkill?.id,
        dueDate: addDays(today, status === "done" ? -between(2, 10) : between(-1, 8)),
        tempo: pieceInfo ? Math.round(pieceInfo.tempo * 0.8) : undefined,
        reps: between(3, 6),
        minutes: tpl.minutes,
        status,
        requiresApproval: k % 2 === 0,
        feedback: status === "done" ? pick(["Çok temiz, eline sağlık!", "Tempo oturmuş, şimdi dinamiklere odaklan.", "Harika ilerleme, bir sonraki bölüme geçebiliriz."]) : undefined,
        createdAt: addDays(today, -between(3, 12)),
      });
    }
  }

  // Öğretmen devamsızlıkları: o günkü dersler iptal edilir
  const teacherAbsences: TeacherAbsence[] = [];
  const ABS_TYPES: TeacherAbsence["type"][] = ["izin", "rapor", "izin", "gelmedi"];
  const ABS_NOTES: Record<TeacherAbsence["type"], string> = {
    izin: "Yıllık izin",
    rapor: "Sağlık raporu",
    gelmedi: "Habersiz gelmedi",
  };
  teachers.forEach((t, ti) => {
    const pastDates = Array.from(new Set(lessons.filter((l) => l.teacherId === t.id && l.date < today).map((l) => l.date))).sort();
    const n = ti % 3 === 0 ? 2 : ti % 3 === 1 ? 1 : 0;
    for (let k = 0; k < n && pastDates.length; k++) {
      const date = pastDates[(ti * 3 + k * 5) % pastDates.length];
      if (teacherAbsences.some((a) => a.teacherId === t.id && a.date === date)) continue;
      const type = ABS_TYPES[(ti + k) % ABS_TYPES.length];
      teacherAbsences.push({ id: `ta${teacherAbsences.length + 1}`, institutionId: t.institutionId, teacherId: t.id, date, type, note: ABS_NOTES[type] });
      lessons.forEach((l) => {
        if (l.teacherId === t.id && l.date === date) {
          l.status = "cancelled";
          l.attendance = undefined;
          l.gains = [];
          l.notes = `Öğretmen devamsızlığı: ${ABS_NOTES[type].toLocaleLowerCase("tr")}`;
        }
      });
    }
  });

  // Ödemeler: son 3 ay + bu ay, ayın 5'i son ödeme günü
  const payments: Payment[] = [];
  const [ty, tm] = today.split("-").map(Number);
  for (const s of students) {
    const inst = INSTITUTIONS.find((i) => i.id === s.institutionId)!;
    const amount = Math.round((inst.fee * (s.instrument === "theory" ? 0.7 : 1)) / 50) * 50;
    const lateProne = Number(s.id.slice(1)) % 7 === 3;
    for (let back = 3; back >= 0; back--) {
      const d = new Date(ty, tm - 1 - back, 5);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      let dueDate = `${period}-05`;
      if (s.joinedAt > dueDate && back > 0) continue;
      const paid = back === 0 ? r() < 0.5 : lateProne && back === 1 ? false : r() < 0.96;
      // Bu ayın ödenmemiş kayıtlarının çoğu henüz vadesi gelmemiş (bekliyor) olsun
      if (back === 0 && !paid && !lateProne) dueDate = addDays(today, between(2, 9));
      payments.push({
        id: `pay-${s.id}-${period}`,
        institutionId: s.institutionId,
        studentId: s.id,
        period,
        amount,
        dueDate,
        paidAt: paid ? addDays(dueDate, between(-4, 3)) : undefined,
        method: paid ? pick<PaymentMethod>(["Kredi kartı", "Kredi kartı", "Havale/EFT", "Nakit"]) : undefined,
      });
    }
  }

  // Aktiviteler
  const now = Date.now();
  const ago = (min: number) => new Date(now - min * 60_000).toISOString();
  const sName = (id: string) => students.find((s) => s.id === id)!.name;
  const tName = (id: string) => teachers.find((t) => t.id === id)!.name;
  const activities: Activity[] = [
    { id: "ac0", institutionId: "armoni", kind: "assignment", text: `${tName("t14")} ${sName("s2")} için "Uşşak dizisi" ödevini verdi`, at: ago(9), actor: tName("t14") },
    { id: "ac00", institutionId: "armoni", kind: "piece", text: `${sName("s40")} "Kara Toprak" türküsünü tamamladı`, at: ago(95), actor: sName("s40") },
    { id: "ac1", institutionId: "armoni", kind: "assignment", text: `${sName("s1")} "Menüet Sol Majör" ödevini teslim etti`, at: ago(18), actor: sName("s1") },
    { id: "ac2", institutionId: "armoni", kind: "lesson", text: `${tName("t3")} ${sName("s8")} ile dersi tamamladı`, at: ago(42), actor: tName("t3") },
    { id: "ac3", institutionId: "nota", kind: "level", text: `${sName("s19")} İleri seviyeye geçti`, at: ago(75), actor: tName("t7") },
    { id: "ac4", institutionId: "ritim", kind: "student", text: `${sName("s37")} Bateri kursuna kaydoldu`, at: ago(110), actor: "Sena Karaman" },
    { id: "ac5", institutionId: "armoni", kind: "piece", text: `${sName("s4")} "Gymnopédie No. 1" parçasını tamamladı`, at: ago(160), actor: sName("s4") },
    { id: "ac6", institutionId: "nota", kind: "assignment", text: `${tName("t8")} ${sName("s21")} için yeni ödev oluşturdu`, at: ago(210), actor: tName("t8") },
    { id: "ac7", institutionId: "ritim", kind: "practice", text: `${sName("s29")} 14 günlük çalışma serisine ulaştı`, at: ago(260), actor: sName("s29") },
    { id: "ac8", institutionId: "armoni", kind: "teacher", text: `${tName("t6")} kurum ekibine katıldı`, at: ago(60 * 7), actor: "Hande Uslu" },
    { id: "ac9", institutionId: "nota", kind: "lesson", text: `${tName("t9")} haftalık programı güncelledi`, at: ago(60 * 9), actor: tName("t9") },
    { id: "ac10", institutionId: "ritim", kind: "piece", text: `${sName("s32")} "Take Five" parçasını tamamladı`, at: ago(60 * 20), actor: sName("s32") },
    { id: "ac11", institutionId: "armoni", kind: "practice", text: `${sName("s1")} günlük çalışma hedefine ulaştı`, at: ago(60 * 22), actor: sName("s1") },
    { id: "ac12", institutionId: "nota", kind: "institution", text: "Nota Sanat Merkezi Profesyonel plana geçti", at: ago(60 * 30), actor: "Platform" },
    { id: "ac13", institutionId: "ritim", kind: "lesson", text: `${tName("t11")} ${sName("s30")} ile ilk dersini yaptı`, at: ago(60 * 34), actor: tName("t11") },
    { id: "ac14", institutionId: "armoni", kind: "level", text: `${sName("s10")} Orta seviyeye geçti`, at: ago(60 * 50), actor: tName("t4") },
  ];

  return {
    instruments: [],
    curricula: [],
    // Demo dersleri "Stüdyo A–F" odalarında; takvim sütunları bu adlarla açılır
    institutions: INSTITUTIONS.map((i) => ({ ...i, rooms: STUDIOS })),
    teachers: teachers.map((t, ti) => ({ ...t, room: STUDIOS[ti % 6] })),
    students,
    parents: PARENTS,
    pieces: [],
    studentPieces,
    skills: [],
    assignments,
    lessons,
    activities,
    payments,
    teacherAbsences,
  };
}

