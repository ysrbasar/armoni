import { useEffect, type ReactNode } from "react";
import { Compass } from "lucide-react";
import { useStore } from "@/store/useStore";
import { navigate, segments, usePath } from "@/lib/router";
import { ROLE_META } from "@/lib/nav";
import { checkLocalReminders, remindersFor, syncReminders } from "@/lib/notifications";
import type { Role } from "@/data/types";
import { Button, EmptyState, Toaster } from "@/components/ui";
import { AdminShell } from "@/components/layout/AdminShell";
import { ParentShell, StudentShell } from "@/components/layout/LearnerShells";
import Login from "@/pages/Login";

import PlatformOverview from "@/pages/platform/Overview";
import PlatformInstitutions, { InstitutionDetail } from "@/pages/platform/Institutions";
import PlatformUsers from "@/pages/platform/Users";
import PlatformCategories from "@/pages/platform/Categories";
import PlatformActivity from "@/pages/platform/ActivityPage";

import InstOverview from "@/pages/inst/Overview";
import InstStudents from "@/pages/inst/Students";
import StudentProfile from "@/pages/inst/StudentProfile";
import InstTeachers from "@/pages/inst/Teachers";
import TeacherProfile from "@/pages/inst/TeacherProfile";
import InstCourses, { CourseDetail } from "@/pages/inst/Courses";
import CalendarPage from "@/pages/inst/Calendar";
import Reports from "@/pages/inst/Reports";
import Settings from "@/pages/inst/Settings";
import Payments from "@/pages/inst/Payments";
import Accounts from "@/pages/inst/Accounts";
import CurriculumPage from "@/pages/inst/Curriculum";
import Tasks from "@/pages/Tasks";

import TeacherHome from "@/pages/teacher/Home";
import TeacherStudents from "@/pages/teacher/MyStudents";
import TeacherLessons, { LessonDetail } from "@/pages/teacher/Lessons";
import TeacherAssignments from "@/pages/teacher/Assignments";

import StudentHome from "@/pages/student/Home";
import Journey from "@/pages/student/Journey";
import Pieces from "@/pages/student/Pieces";
import StudentAssignments from "@/pages/student/Assignments";
import Achievements from "@/pages/student/Achievements";

import ParentOverview from "@/pages/parent/Overview";
import ParentProgress from "@/pages/parent/Progress";
import ParentAssignments from "@/pages/parent/Assignments";
import ParentLessons from "@/pages/parent/Lessons";

import MusicLab from "@/pages/lab/MusicLab";

function NotFound({ role }: { role: Role }) {
  return (
    <EmptyState
      icon={Compass}
      title="Bu sayfa bulunamadı"
      text="Aradığınız ekran taşınmış ya da bu rol için tanımlı değil."
      action={<Button onClick={() => navigate(ROLE_META[role].home)}>Ana sayfaya dön</Button>}
      className="py-24"
    />
  );
}

function resolve(role: Role, seg: string[]): ReactNode {
  const [page = "", id] = seg;
  switch (role) {
    case "platform":
      if (page === "") return <PlatformOverview />;
      if (page === "institutions") return id ? <InstitutionDetail id={id} /> : <PlatformInstitutions />;
      if (page === "users") return <PlatformUsers />;
      if (page === "categories") return <PlatformCategories />;
      if (page === "activity") return <PlatformActivity />;
      break;
    case "inst":
      if (page === "") return <InstOverview />;
      if (page === "students") return id ? <StudentProfile id={id} back="/inst/students" /> : <InstStudents />;
      if (page === "teachers") return id ? <TeacherProfile id={id} /> : <InstTeachers />;
      if (page === "courses") return id ? <CourseDetail id={id} /> : <InstCourses />;
      if (page === "calendar") return <CalendarPage />;
      if (page === "reports") return <Reports />;
      if (page === "payments") return <Payments />;
      if (page === "settings") return <Settings />;
      if (page === "accounts") return <Accounts />;
      if (page === "curriculum") return <CurriculumPage />;
      if (page === "tasks") return <Tasks />;
      break;
    case "teacher":
      if (page === "") return <TeacherHome />;
      if (page === "students") return id ? <StudentProfile id={id} back="/teacher/students" asTeacher /> : <TeacherStudents />;
      if (page === "lessons") return id ? <LessonDetail id={id} /> : <TeacherLessons />;
      if (page === "assignments") return <TeacherAssignments />;
      if (page === "curriculum") return <CurriculumPage teacherMode />;
      if (page === "tasks") return <Tasks />;
      if (page === "lab") return <MusicLab initial={id} />;
      break;
    case "student":
      if (page === "") return <StudentHome />;
      if (page === "journey") return <Journey />;
      if (page === "pieces") return <Pieces />;
      if (page === "assignments") return <StudentAssignments />;
      if (page === "achievements") return <Achievements />;
      if (page === "lab") return <MusicLab initial={id} />;
      break;
    case "parent":
      if (page === "") return <ParentOverview />;
      if (page === "progress") return <ParentProgress />;
      if (page === "assignments") return <ParentAssignments />;
      if (page === "lessons") return <ParentLessons />;
      break;
  }
  return <NotFound role={role} />;
}

const PREFIX: Record<string, Role> = { platform: "platform", inst: "inst", teacher: "teacher", student: "student", parent: "parent" };

export default function App() {
  const path = usePath();
  const role = useStore((s) => s.session.role);
  const toast = useStore((s) => s.toast);
  const seg = segments(path);
  const target = PREFIX[seg[0] ?? ""];

  // Açılışta sunucudaki oturumu ve veriyi yükle
  const booted = useStore((s) => s.booted);
  useEffect(() => {
    void useStore.getState().boot();
  }, []);

  // Arayüz düzeyinde erişim sınırı: her rol yalnızca kendi alanını görür
  useEffect(() => {
    if (!booted) return;
    if (!target) {
      if (role) navigate(ROLE_META[role].home);
      return;
    }
    if (!role) navigate("/");
    else if (target !== role) {
      toast(`${ROLE_META[target].label} alanına bu rolle erişilemez`, "error");
      navigate(ROLE_META[role].home);
    }
  }, [target, role, toast, booted]);

  // Ders hatırlatmaları: veriler değiştikçe sunucuyla eşitle, yerel modda zamanı geleni göster
  const data = useStore((s) => s.data);
  const session = useStore((s) => s.session);
  useEffect(() => {
    if (!role) return;
    const reminders = remindersFor(data, session);
    syncReminders(reminders);
    checkLocalReminders(reminders);
    const t = setInterval(() => checkLocalReminders(remindersFor(useStore.getState().data, useStore.getState().session)), 5 * 60_000);
    return () => clearInterval(t);
  }, [data, session, role]);

  let content: ReactNode;
  if (!target || !role || target !== role) content = <Login />;
  else {
    const page = resolve(role, seg.slice(1));
    const Shell = role === "student" ? StudentShell : role === "parent" ? ParentShell : AdminShell;
    content = (
      <Shell>
        <div key={path} className="animate-fade-in">
          {page}
        </div>
      </Shell>
    );
  }

  return (
    <>
      {content}
      <Toaster />
    </>
  );
}
