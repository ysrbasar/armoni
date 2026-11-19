import { useState } from "react";
import { DoorOpen, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Avatar, Button, Card, CardHeader, Input, Select } from "@/components/ui";
import { roomsOf } from "@/lib/selectors";

/** Derslik listesi ve öğretmenlerin varsayılan derslikleri */
export function RoomsSettings() {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const setRooms = useStore((s) => s.setRooms);
  const updateTeacher = useStore((s) => s.updateTeacher);
  const toast = useStore((s) => s.toast);
  const inst = data.institutions.find((i) => i.id === instId)!;
  const rooms = roomsOf(inst);
  const [newRoom, setNewRoom] = useState("");
  const teachers = data.teachers.filter((t) => t.institutionId === instId);
  const lessonsIn = (r: string) => data.lessons.filter((l) => l.institutionId === instId && l.room === r && l.status === "scheduled").length;

  const rename = (from: string, to: string) => {
    const name = to.trim();
    if (!name || name === from) return;
    if (rooms.includes(name)) return toast("Bu adda bir derslik zaten var", "error");
    setRooms(rooms.map((r) => (r === from ? name : r)), { from, to: name });
    toast(`"${from}" → "${name}"`);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <CardHeader title="Derslikler" subtitle="Takvimde her derslik ayrı sütun olur; çakışma yalnızca aynı derslikte ya da aynı öğretmende aranır" icon={DoorOpen} />
        <div className="divide-y divide-line">
          {rooms.map((r) => (
            <div key={r} className="flex items-center gap-2 py-2">
              <Input key={r} defaultValue={r} onBlur={(e) => rename(r, e.target.value)} className="h-9 flex-1 font-semibold" aria-label="Derslik adı" />
              <span className="w-24 text-right text-xs text-muted">{lessonsIn(r)} planlı ders</span>
              <button
                type="button"
                disabled={rooms.length <= 1 || lessonsIn(r) > 0}
                title={lessonsIn(r) > 0 ? "Dersi olan derslik kaldırılamaz; önce dersleri başka dersliğe taşıyın" : "Dersliği kaldır"}
                onClick={() => setRooms(rooms.filter((x) => x !== r))}
                className="grid size-8 cursor-pointer place-items-center rounded-lg text-faint hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Dersliği kaldır"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = newRoom.trim();
            if (!n || rooms.includes(n)) return;
            setRooms([...rooms, n]);
            setNewRoom("");
          }}
        >
          <Input value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="ör. Piyano odası, Bateri stüdyosu" className="h-9" />
          <Button type="submit" size="sm" icon={Plus} disabled={!newRoom.trim()}>
            Ekle
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <CardHeader title="Öğretmenlerin derslikleri" subtitle="Yeni dersler öğretmenin dersliğine otomatik yazılır" icon={DoorOpen} />
        <div className="divide-y divide-line">
          {teachers.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2">
              <Avatar name={t.name} size={32} />
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{t.name}</span>
              <Select
                value={t.room ?? ""}
                onChange={(e) => updateTeacher(t.id, { room: e.target.value || undefined })}
                className="h-9 w-44"
                aria-label={`${t.name} dersliği`}
              >
                <option value="">Seçilmedi</option>
                {rooms.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Bir öğretmenin dersliğini değiştirmek mevcut dersleri taşımaz; tek bir dersi takvimden açıp dersliğini değiştirebilirsiniz.</p>
      </Card>
    </div>
  );
}
