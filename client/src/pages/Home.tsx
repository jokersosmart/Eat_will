import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarCheck2,
  Check,
  ChevronRight,
  CircleUserRound,
  CircleHelp,
  Compass,
  ExternalLink,
  Lightbulb,
  Loader2,
  LogOut,
  Save,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";

type View = "plan" | "roles" | "topics" | "library" | "records";
type GuestCount = "2人" | "3-4人" | "5-8人" | "10人以上";
type Cuisine = "中式合菜" | "西餐" | "日式" | "火鍋";
type TimeSlot = "早餐" | "午餐" | "下午茶" | "晚餐" | "宵夜";
type Stage = "破冰" | "探索" | "推進" | "成交" | "關係";

const guestCounts: GuestCount[] = ["2人", "3-4人", "5-8人", "10人以上"];
const cuisines: Cuisine[] = ["中式合菜", "西餐", "日式", "火鍋"];
const timeSlots: TimeSlot[] = ["早餐", "午餐", "下午茶", "晚餐", "宵夜"];
const stages: Stage[] = ["破冰", "探索", "推進", "成交", "關係"];
const sections = ["目標與框架", "人物與角色", "場景", "時機", "話題與五局", "實戰與長期養成"] as const;

export const stageStarterHints: Record<Stage, string> = {
  "破冰": "第一次見面、彼此仍在客氣，或還不知道對方願不願意多聊時，先選這裡。",
  "探索": "已經聊開，現在想理解對方的目標、需求、資源或真正在意的事時，選這裡。",
  "推進": "雙方已經找到共同點，準備把交流收束成一次具體後續行動時，選這裡。",
  "成交": "已進到合作條件、決策方式或明確承諾的討論時，才選這裡。",
  "關係": "這場局的重點是維繫長期信任、安排後續互動或讓關係自然延續時，選這裡。",
};

export const layerStarterHints: Record<number, { title: string; description: string }> = {
  1: { title: "先不要急著推", description: "還在暖場或不確定對方意願時，選第 1 層；先讓對話舒服地開始。" },
  2: { title: "開始看見線索", description: "對方已願意分享經驗、目標或困難時，選第 2 層；把話題往真正關注的事帶。" },
  3: { title: "只推進一小步", description: "雙方已出現共鳴或明確意願時，選第 3 層；確認可延續的下一步，不必一次談完。" },
};

type DinnerExample = {
  id: string;
  label: string;
  title: string;
  guestCount: GuestCount;
  cuisine: Cuisine;
  timeSlot: TimeSlot;
  stage: Stage;
  layer: number;
  objective: string;
  personContext: string;
  route: string;
};

export const dinnerExamples: DinnerExample[] = [
  {
    id: "first-meeting",
    label: "第一次認識",
    title: "先建立信任，不急著談合作",
    guestCount: "5-8人",
    cuisine: "中式合菜",
    timeSlot: "晚餐",
    stage: "破冰",
    layer: 1,
    objective: "先建立信任，並確認下一次深入討論的可能性。",
    personContext: "由共同朋友主揪，桌上有一位可能認識目標對象很久的橋接人；先觀察誰會主動延伸彼此的話題。",
    route: "破冰第 1 層 → 破冰第 2 層 → 約下一次深入討論",
  },
  {
    id: "resource-introduction",
    label: "朋友引介資源人",
    title: "先理解對方在意什麼，再尋找連結點",
    guestCount: "3-4人",
    cuisine: "西餐",
    timeSlot: "晚餐",
    stage: "探索",
    layer: 1,
    objective: "理解對方目前關注的方向，找出我能提供價值的切入點。",
    personContext: "主揪人認識目標對象，也知道我正在做的計畫；這次的目標不是提出完整提案，而是確認對方願不願意再聊。",
    route: "破冰第 2 層 → 探索第 1 層 → 確認後續交流窗口",
  },
  {
    id: "follow-up-collaboration",
    label: "二次合作會面",
    title: "把已有共識，收束成下一個小行動",
    guestCount: "2人",
    cuisine: "日式",
    timeSlot: "午餐",
    stage: "推進",
    layer: 1,
    objective: "確認雙方能先合作驗證的一小步，以及後續負責與聯絡方式。",
    personContext: "前次已聊過共同方向，對方曾主動追問細節；這次需避免一次把所有條件談死，先找可執行的下一步。",
    route: "探索第 3 層 → 推進第 1 層 → 約定下一個具體行動",
  },
];

export function getExampleFormValues(example: DinnerExample) {
  return {
    guestCount: example.guestCount,
    cuisine: example.cuisine,
    timeSlot: example.timeSlot,
    stage: example.stage,
    layer: example.layer,
    objective: example.objective,
    personContext: example.personContext,
  };
}

const viewMeta: Array<{ id: View; label: string; icon: typeof Compass }> = [
  { id: "plan", label: "局前規劃", icon: Compass },
  { id: "roles", label: "角色識別", icon: CircleUserRound },
  { id: "topics", label: "五局話題", icon: Lightbulb },
  { id: "library", label: "知識庫", icon: BookOpen },
  { id: "records", label: "我的紀錄", icon: CalendarCheck2 },
];

function getInitialView(): View {
  if (typeof window === "undefined") return "plan";
  const requestedView = new URLSearchParams(window.location.search).get("view");
  return viewMeta.some((item) => item.id === requestedView) ? requestedView as View : "plan";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-[11px] font-bold tracking-[0.16em] text-[#667085] uppercase">{children}</label>;
}

function SelectField<T extends string>({ value, onChange, options }: { value: T; onChange: (value: T) => void; options: readonly T[] }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value as T)} className="gold-select w-full rounded-xl border border-[#d8cfae] bg-[#fffdf6] px-3.5 py-3 text-sm font-semibold text-[#102a43] outline-none">
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-dashed border-[#d8cfae] bg-[#fffdf6]/70 p-8 text-center"><p className="font-serif text-xl text-[#102a43]">{title}</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667085]">{description}</p></div>;
}

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [view, setView] = useState<View>(getInitialView);
  const [guestCount, setGuestCount] = useState<GuestCount>("5-8人");
  const [cuisine, setCuisine] = useState<Cuisine>("中式合菜");
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("晚餐");
  const [stage, setStage] = useState<Stage>("破冰");
  const [layer, setLayer] = useState(1);
  const [objective, setObjective] = useState("");
  const [personContext, setPersonContext] = useState("");
  const [reflectionNotes, setReflectionNotes] = useState("");
  const [recordTitle, setRecordTitle] = useState("本次飯局規劃");
  const [recordMessage, setRecordMessage] = useState("");
  const [librarySection, setLibrarySection] = useState<string>("全部");
  const [libraryCategory, setLibraryCategory] = useState<string>("全部");
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null);

  const planningQuery = useMemo(() => ({ guestCount, cuisine, timeSlot }), [guestCount, cuisine, timeSlot]);
  const libraryQueryInput = useMemo(() => ({
    section: librarySection === "全部" ? undefined : librarySection as (typeof sections)[number],
    category: libraryCategory === "全部" ? undefined : libraryCategory,
  }), [libraryCategory, librarySection]);

  const planningEntries = trpc.knowledge.list.useQuery(planningQuery);
  const roles = trpc.knowledge.roles.useQuery();
  const stageRows = trpc.knowledge.stages.useQuery();
  const libraryMeta = trpc.knowledge.sections.useQuery();
  const libraryEntries = trpc.knowledge.list.useQuery(libraryQueryInput);
  const records = trpc.dinner.records.useQuery(undefined, { enabled: isAuthenticated });
  const preferences = trpc.dinner.preferences.useQuery(undefined, { enabled: isAuthenticated });
  const adviceMutation = trpc.advice.generate.useMutation();
  const scenarioMutation = trpc.advice.assessScenario.useMutation();
  const preferencesApplied = useRef(false);
  const [preferencesMessage, setPreferencesMessage] = useState("");
  const saveRecordMutation = trpc.dinner.saveRecord.useMutation({
    onSuccess: () => {
      setRecordMessage("已儲存至你的飯局紀錄。");
      records.refetch();
    },
    onError: (error) => setRecordMessage(error.message),
  });
  const savePreferencesMutation = trpc.dinner.savePreferences.useMutation({
    onSuccess: () => {
      setPreferencesMessage("已更新你的局前預設。下一場規劃會沿用這組條件。");
      preferences.refetch();
    },
    onError: (error) => setPreferencesMessage(error.message),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      preferencesApplied.current = false;
      return;
    }
    if (!preferences.data || preferencesApplied.current) return;
    setGuestCount(preferences.data.defaultGuestCount as GuestCount);
    setCuisine(preferences.data.defaultCuisine as Cuisine);
    setTimeSlot(preferences.data.defaultTimeSlot as TimeSlot);
    preferencesApplied.current = true;
  }, [isAuthenticated, preferences.data]);

  const activeStageRows = (stageRows.data ?? []).filter((item) => item.stage === stage);
  const selectedLayerRow = activeStageRows.find((item) => item.layer === layer);
  const currentView = viewMeta.find((item) => item.id === view) ?? viewMeta[0];

  const applyExample = (example: DinnerExample) => {
    const values = getExampleFormValues(example);
    setGuestCount(values.guestCount);
    setCuisine(values.cuisine);
    setTimeSlot(values.timeSlot);
    setStage(values.stage);
    setLayer(values.layer);
    setObjective(values.objective);
    setPersonContext(values.personContext);
    setSelectedExampleId(example.id);
    setRecordMessage(`已套用「${example.label}」範例。你可以直接取得建議，或先把內容改成自己的情境。`);
  };

  const generateAdvice = () => {
    if (!objective.trim()) {
      setRecordMessage("請先填寫本次飯局目標，再取得智慧建議。");
      return;
    }
    setRecordMessage("");
    adviceMutation.mutate({ guestCount, cuisine, timeSlot, stage, layer, objective, personContext, reflectionNotes });
  };

  const assessScenario = () => {
    setRecordMessage("");
    scenarioMutation.mutate({ guestCount, cuisine, timeSlot, stage, layer, objective, personContext });
  };

  const applyClarificationQuestion = (question: string, field: "objective" | "personContext") => {
    const prompt = `待確認：${question}`;
    if (field === "objective") {
      setObjective((current) => current.trim() ? `${current}\n${prompt}` : prompt);
      setRecordMessage("已帶入飯局目標欄。請把問題改寫成你自己的答案或行動。" );
      return;
    }
    setPersonContext((current) => current.trim() ? `${current}\n${prompt}` : prompt);
    setRecordMessage("已帶入人物背景欄。請補上已知事實，並保留不確定之處。" );
  };

  const saveCurrentRecord = () => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (!objective.trim()) {
      setRecordMessage("請先填寫本次飯局目標，才能儲存紀錄。");
      return;
    }
    saveRecordMutation.mutate({
      title: recordTitle.trim() || "本次飯局規劃",
      guestCount,
      cuisine,
      timeSlot,
      objective,
      stage,
      layer,
      context: personContext || undefined,
      reflection: reflectionNotes || undefined,
      aiAdvice: adviceMutation.data ? JSON.stringify(adviceMutation.data) : undefined,
    });
  };

  const savePreferences = () => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    setPreferencesMessage("");
    savePreferencesMutation.mutate({ defaultGuestCount: guestCount, defaultCuisine: cuisine, defaultTimeSlot: timeSlot });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f1e3] text-[#102a43]">
      <div className="sacred-grid" aria-hidden="true" />
      <header className="sticky top-0 z-30 border-b border-[#d8cfae]/70 bg-[#f7f1e3]/90 backdrop-blur-md">
        <div className="container flex h-[72px] items-center justify-between gap-3">
          <button onClick={() => setView("plan")} className="group flex items-center gap-3 text-left" aria-label="回到局前規劃">
            <span className="relative grid h-10 w-10 place-items-center rounded-full border border-[#b9994d] bg-[#102a43] text-[#f7d785] shadow-[0_0_0_4px_rgba(185,153,77,.12)]"><Utensils size={18} /><span className="absolute inset-1 rounded-full border border-[#f7d785]/30" /></span>
            <span className="hidden sm:block"><span className="block text-[10px] font-bold tracking-[.24em] text-[#ad8330]">DINNER INTELLIGENCE</span><span className="mt-0.5 block text-base font-extrabold tracking-tight">阿是要不要好好吃飯</span></span>
          </button>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="主要功能">
            {viewMeta.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return <button key={item.id} onClick={() => setView(item.id)} className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${view === item.id ? "bg-[#102a43] text-[#fff8e8]" : "text-[#52657a] hover:bg-[#eadfc5]"}`}><span className="inline-flex items-center gap-1.5"><Icon size={15} />{item.label}</span></button>;
            })}
          </nav>
          <div className="flex items-center gap-2">
            {authLoading ? <Loader2 className="animate-spin text-[#ad8330]" size={18} /> : isAuthenticated ? <><button onClick={() => setView("records")} className="hidden rounded-full bg-[#eadfc5] px-3 py-2 text-xs font-bold text-[#102a43] sm:block">{user?.name || "我的紀錄"}</button><Button onClick={() => logout()} variant="ghost" size="icon" className="text-[#52657a]" aria-label="登出"><LogOut size={17} /></Button></> : <Button onClick={() => startLogin()} className="rounded-full bg-[#102a43] px-4 text-xs font-bold text-[#fff8e8] hover:bg-[#163a5b]">登入儲存</Button>}
          </div>
        </div>
      </header>

      <main className="relative z-10 container pb-16 pt-7 lg:pt-12">
        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-[#ddcca1] bg-[#fffaf0]/85 px-6 py-10 shadow-[0_24px_70px_-44px_rgba(16,42,67,.65)] sm:px-10 lg:px-14 lg:py-12">
          <div className="hero-orbit hero-orbit-one" aria-hidden="true" /><div className="hero-orbit hero-orbit-two" aria-hidden="true" />
          <div className="relative max-w-3xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[.19em] text-[#ad8330]"><Sparkles size={14} />飯局不是應酬，是可被設計的策略場</p>
            <h1 className="font-serif text-4xl font-bold leading-[1.1] tracking-tight text-[#102a43] sm:text-5xl">在每一張餐桌上，<br /><span className="text-[#ad8330]">把關係走得更深一層。</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#52657a]">以課程知識為準繩，協助你從局前配置、角色辨識到話題推進，為每一場關鍵飯局保留判斷與餘裕。</p>
            <div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => setView("plan")} className="rounded-full bg-[#102a43] px-5 font-bold text-[#fff8e8] hover:bg-[#163a5b]">開始局前規劃 <ArrowRight size={16} /></Button><button onClick={() => setView("library")} className="rounded-full border border-[#caae66] px-5 py-2 text-sm font-bold text-[#7a5a1d] transition hover:bg-[#f4e8cd]">瀏覽六大部分</button></div>
          </div>
        </section>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden" aria-label="行動版功能導覽">
          {viewMeta.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setView(item.id)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${view === item.id ? "bg-[#102a43] text-white" : "bg-[#fffaf0] text-[#52657a] border border-[#ded2b5]"}`}><span className="flex items-center gap-1.5"><Icon size={14} />{item.label}</span></button>; })}
        </div>

        <div className="mb-6 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eadfc5] text-[#8c6821]"><currentView.icon size={18} /></span><div><p className="text-[10px] font-bold tracking-[.16em] text-[#ad8330]">智慧飯局工具</p><h2 className="font-serif text-2xl font-bold">{currentView.label}</h2></div></div>

        {view === "plan" && <section className="grid gap-6 xl:grid-cols-[.92fr_1.08fr]">
          <div className="rounded-[1.5rem] border border-[#ddcca1] bg-[#fffaf0]/90 p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold tracking-[.15em] text-[#ad8330]">PRE-DINNER CANVAS</p><h3 className="mt-1 font-serif text-2xl font-bold">畫出這一局的輪廓</h3></div><span className="grid h-10 w-10 place-items-center rounded-full border border-[#d8cfae] text-[#ad8330]"><Compass size={18} /></span></div>
            <details open className="mb-6 rounded-2xl border border-[#dfd0aa] bg-[#f4e8cd]/60 p-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-[#7a5a1d]"><CircleHelp size={17} />第一次用？30 秒選擇指南</summary>
              <div className="mt-3 grid gap-2 text-xs leading-5 text-[#52657a] sm:grid-cols-3"><p><strong className="text-[#102a43]">1. 先選情境</strong><br />人數、菜系和時段會幫你找出相符策略。</p><p><strong className="text-[#102a43]">2. 再選局別</strong><br />不知道目前在哪一局時，先從「破冰」開始最安全。</p><p><strong className="text-[#102a43]">3. 層次先選第 1 層</strong><br />只有在對方已主動分享或出現共鳴時，才往第 2、3 層走。</p></div>
            </details>
            <div className="grid gap-4 sm:grid-cols-3"><div><FieldLabel>飯局人數</FieldLabel><SelectField value={guestCount} onChange={setGuestCount} options={guestCounts} /></div><div><FieldLabel>菜系</FieldLabel><SelectField value={cuisine} onChange={setCuisine} options={cuisines} /></div><div><FieldLabel>時段</FieldLabel><SelectField value={timeSlot} onChange={setTimeSlot} options={timeSlots} /></div></div>
            <div className="mt-5"><FieldLabel>當前局別</FieldLabel><div className="grid grid-cols-5 rounded-xl border border-[#d8cfae] bg-[#f7f1e3] p-1">{stages.map((item) => <button key={item} onClick={() => { setStage(item); setLayer(1); setSelectedExampleId(null); }} className={`rounded-lg px-1 py-2 text-xs font-bold transition sm:text-sm ${stage === item ? "bg-[#102a43] text-[#fff8e8] shadow" : "text-[#667085] hover:bg-white"}`}>{item}</button>)}</div><p className="mt-2 text-xs leading-5 text-[#667085]"><strong className="text-[#7a5a1d]">選擇提示：</strong>{stageStarterHints[stage]}</p></div>
            <div className="mt-5"><FieldLabel>對話推進深度（原：目前層次）</FieldLabel><div className="flex gap-2">{[1, 2, 3].map((item) => <button key={item} onClick={() => { setLayer(item); setSelectedExampleId(null); }} className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${layer === item ? "border-[#ad8330] bg-[#f4e8cd] text-[#102a43]" : "border-[#d8cfae] bg-[#fffdf6] text-[#667085] hover:border-[#b9994d]"}`}>第 {item} 層</button>)}</div><div className="mt-2 rounded-xl bg-[#f7f1e3] px-3.5 py-3 text-xs leading-5 text-[#52657a]"><strong className="text-[#7a5a1d]">第 {layer} 層：{layerStarterHints[layer].title}。</strong>{layerStarterHints[layer].description}{selectedLayerRow && <span className="mt-1 block text-[#667085]">本局課程方向：{selectedLayerRow.coreFocus}。</span>}</div></div>
            <div className="mt-5"><FieldLabel>本次飯局目標</FieldLabel><textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={3} placeholder="例如：認識對方的決策考量，並確認下一次深入討論的可能性。" className="gold-select w-full resize-none rounded-xl border border-[#d8cfae] bg-[#fffdf6] px-3.5 py-3 text-sm leading-6 text-[#102a43] outline-none placeholder:text-[#98a2b3]" /></div>
            <div className="mt-4"><FieldLabel>人物背景與關係線索（選填）</FieldLabel><textarea value={personContext} onChange={(event) => setPersonContext(event.target.value)} rows={3} placeholder="例如：主揪人、已知與會者、誰可能是橋接人，以及彼此關係。" className="gold-select w-full resize-none rounded-xl border border-[#d8cfae] bg-[#fffdf6] px-3.5 py-3 text-sm leading-6 text-[#102a43] outline-none placeholder:text-[#98a2b3]" /></div>
            <section className="mt-5 rounded-2xl border border-[#d8cfae] bg-[#fffdf6]/80 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[10px] font-bold tracking-[.15em] text-[#ad8330]">TRY A SCENARIO</p><h4 className="mt-1 font-serif text-lg font-bold">不確定怎麼填？先套用一個模擬例子</h4></div><span className="rounded-full bg-[#eadfc5] px-2.5 py-1 text-[10px] font-bold text-[#7a5a1d]">可再修改</span></div><div className="mt-3 grid gap-2">{dinnerExamples.map((example) => <button key={example.id} onClick={() => applyExample(example)} className={`rounded-xl border p-3 text-left transition ${selectedExampleId === example.id ? "border-[#ad8330] bg-[#f4e8cd]" : "border-[#e3d6b6] bg-white hover:border-[#b9994d] hover:bg-[#fffaf0]"}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold text-[#102a43]">{example.label}：{example.title}</span><span className="text-[10px] font-bold text-[#ad8330]">一鍵套用</span></div><p className="mt-1 text-xs leading-5 text-[#667085]">範例路徑：{example.route}</p></button>)}</div></section>
            <div className="mt-5 flex flex-wrap gap-3"><Button onClick={assessScenario} disabled={scenarioMutation.isPending} variant="outline" className="rounded-full border-[#b9994d] bg-[#fffdf6] font-bold text-[#7a5a1d] hover:bg-[#f4e8cd]">{scenarioMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <CircleHelp size={16} />}{preferences.data ? "用我的預設先釐清" : "先釐清這一局"}</Button><Button onClick={generateAdvice} disabled={adviceMutation.isPending} className="rounded-full bg-[#ad8330] px-5 font-bold text-white hover:bg-[#8d681d]">{adviceMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} />}取得知識庫智慧建議</Button><Button onClick={saveCurrentRecord} disabled={saveRecordMutation.isPending} variant="outline" className="rounded-full border-[#b9994d] bg-transparent font-bold text-[#7a5a1d] hover:bg-[#f4e8cd]">{saveRecordMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}{isAuthenticated ? "儲存這一局" : "登入後儲存"}</Button></div>
            {recordMessage && <p className="mt-4 text-sm font-medium text-[#8c6821]">{recordMessage}</p>}
          </div>

          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-[#102a43] bg-[#102a43] p-5 text-[#fff8e8] shadow-[0_24px_50px_-38px_rgba(16,42,67,.9)] sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[.16em] text-[#f7d785]">MATCHED KNOWLEDGE</p><h3 className="mt-1 font-serif text-2xl font-bold">此局的策略底稿</h3></div><span className="grid h-10 w-10 place-items-center rounded-full border border-[#f7d785]/50"><BookOpen size={18} /></span></div><div className="mt-5 space-y-3">{planningEntries.isLoading ? <Loader2 className="animate-spin text-[#f7d785]" /> : (planningEntries.data ?? []).slice(0, 4).map((entry) => <article key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-3.5"><p className="text-[10px] font-bold tracking-[.13em] text-[#f7d785]">{entry.section} · {entry.category}</p><h4 className="mt-1 font-bold">{entry.title}</h4><p className="mt-1.5 text-sm leading-6 text-[#dce6ef] line-clamp-3">{entry.content}</p></article>)}{!planningEntries.isLoading && (planningEntries.data ?? []).length === 0 && <p className="text-sm text-[#dce6ef]">這個情境暫無相符條目，請改選條件或閱讀完整知識庫。</p>}</div><button onClick={() => setView("library")} className="mt-5 flex items-center gap-1 text-sm font-bold text-[#f7d785] hover:text-white">查看所有相符條目 <ChevronRight size={16} /></button></div>
            {scenarioMutation.isPending && <section className="rounded-[1.5rem] border border-[#d8cfae] bg-[#fffaf0]/95 p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3 text-[#7a5a1d]"><Loader2 className="animate-spin" size={18} /><p className="font-semibold">正在依目前條件整理待確認事項…</p></div></section>}
            {scenarioMutation.data && <section className="rounded-[1.5rem] border border-[#caa75b] bg-[#fffaf0]/95 p-5 shadow-sm sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[.15em] text-[#ad8330]">SCENARIO CHECK</p><h3 className="mt-1 font-serif text-2xl font-bold">先釐清，再推進</h3></div><CircleHelp className="text-[#ad8330]" /></div><p className="mt-3 text-sm leading-6 text-[#52657a]">以下以你按下按鈕時的預設與表單條件為準；「假設」並非事實，修改條件後請重新釐清。</p><div className="mt-5 rounded-xl bg-[#f7f1e3] p-4"><p className="text-[10px] font-bold tracking-[.14em] text-[#7a5a1d]">已知條件</p><ul className="mt-2 space-y-1.5">{scenarioMutation.data.knownContext.map((item, index) => <li key={index} className="text-xs leading-5 text-[#52657a]">{item}</li>)}</ul></div><div className="mt-4"><p className="text-[10px] font-bold tracking-[.14em] text-[#ad8330]">可修正的情境假設</p><div className="mt-2 space-y-2">{scenarioMutation.data.assumptions.map((item, index) => <article key={index} className="rounded-xl border border-[#e3d6b6] bg-[#fffdf6] p-3 text-xs leading-5 text-[#52657a]"><span className="font-bold text-[#7a5a1d]">假設 {index + 1}：</span>{item}</article>)}</div></div><div className="mt-5"><p className="text-[10px] font-bold tracking-[.14em] text-[#ad8330]">先回答這幾題</p><div className="mt-2 space-y-2">{scenarioMutation.data.clarificationQuestions.map((item, index) => <article key={`${item.question}-${index}`} className="rounded-xl border border-[#dfd3b8] bg-white p-3.5"><p className="text-sm font-semibold leading-6 text-[#102a43]">{index + 1}. {item.question}</p><p className="mt-1 text-xs leading-5 text-[#667085]">為什麼要問：{item.reason}</p><button onClick={() => applyClarificationQuestion(item.question, item.field)} className="mt-2 rounded-full border border-[#caa75b] px-3 py-1.5 text-xs font-bold text-[#7a5a1d] transition hover:bg-[#f4e8cd]">帶入{item.field === "objective" ? "飯局目標" : "人物背景"}欄</button></article>)}</div></div><div className="mt-5 rounded-xl border border-[#d8cfae] bg-[#f4e8cd]/65 p-4"><p className="text-[10px] font-bold tracking-[.14em] text-[#7a5a1d]">注意事項</p><ul className="mt-2 space-y-1.5">{scenarioMutation.data.attentionPoints.map((item, index) => <li key={index} className="text-xs leading-5 text-[#52657a]">• {item}</li>)}</ul><p className="mt-3 border-t border-[#dfd0aa] pt-3 text-sm font-semibold leading-6 text-[#334e68]">下一步：{scenarioMutation.data.nextStep}</p></div><p className="mt-4 text-xs leading-5 text-[#667085]">依據條目：{scenarioMutation.data.sourceTitles.join("、")}</p></section>}
            {scenarioMutation.error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{scenarioMutation.error.message}</div>}
            {adviceMutation.data && (
              <section className="rounded-[1.5rem] border border-[#ddcca1] bg-[#fffaf0]/95 p-5 shadow-sm sm:p-7">
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[.15em] text-[#ad8330]">KNOWLEDGE-BOUND ADVICE</p><h3 className="mt-1 font-serif text-2xl font-bold">智慧建議</h3></div><ShieldCheck className="text-[#ad8330]" /></div>
                <p className="mt-4 border-l-2 border-[#caa75b] pl-4 text-sm leading-7 text-[#334e68]">{adviceMutation.data.executiveSummary}</p>
                <div className="mt-5 grid gap-3">{adviceMutation.data.suggestedTopics.map((topic, index) => <article key={`${topic.title}-${index}`} className="rounded-xl bg-[#f7f1e3] p-4"><p className="font-bold text-[#102a43]">{topic.title}</p><p className="mt-1 text-sm font-medium leading-6 text-[#7a5a1d]">「{topic.question}」</p><p className="mt-1 text-xs leading-5 text-[#667085]">依據：{topic.reasoning}</p></article>)}</div>
                <div className="mt-5 grid gap-3 lg:grid-cols-2"><article className="rounded-xl border border-[#e3d6b6] bg-[#fffdf6] p-4"><p className="text-[10px] font-bold tracking-[.14em] text-[#ad8330]">角色應對</p><div className="mt-2 space-y-2">{adviceMutation.data.roleStrategy.map((item) => <p key={item.role} className="text-xs leading-5 text-[#52657a]"><strong className="text-[#102a43]">{item.role}</strong>：{item.action}</p>)}</div></article><article className="rounded-xl border border-[#e3d6b6] bg-[#fffdf6] p-4"><p className="text-[10px] font-bold tracking-[.14em] text-[#ad8330]">風險提醒</p><ul className="mt-2 space-y-2">{adviceMutation.data.riskWatch.map((item, index) => <li key={index} className="text-xs leading-5 text-[#52657a]">• {item}</li>)}</ul></article></div>
                <article className="mt-5 rounded-xl border border-[#caa75b] bg-[#f4e8cd]/70 p-4"><p className="text-[10px] font-bold tracking-[.14em] text-[#7a5a1d]">局後復盤摘要</p><p className="mt-2 text-sm leading-6 text-[#334e68]">{adviceMutation.data.postDinnerSummary}</p><p className="mt-4 text-[10px] font-bold tracking-[.14em] text-[#7a5a1d]">復盤問題</p><ul className="mt-2 space-y-1.5">{adviceMutation.data.reflectionPrompts.map((item, index) => <li key={index} className="text-xs leading-5 text-[#52657a]">{index + 1}. {item}</li>)}</ul></article>
                {(adviceMutation.data.sourceReferences ?? []).some((reference) => reference.sourceName) && <article className="mt-5 rounded-xl border border-[#dfd3b8] bg-[#f7f1e3]/75 p-4"><p className="text-[10px] font-bold tracking-[.14em] text-[#7a5a1d]">本次研究補充來源</p><div className="mt-3 space-y-3">{adviceMutation.data.sourceReferences.filter((reference) => reference.sourceName).map((reference) => <div key={`${reference.title}-${reference.sourceUrl ?? "research"}`} className="border-l-2 border-[#caa75b] pl-3 text-xs leading-5 text-[#52657a]"><p className="font-semibold text-[#102a43]">{reference.title}</p>{reference.sourceUrl ? <a href={reference.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline break-words font-semibold text-[#7a5a1d] underline decoration-[#caa75b] underline-offset-2 hover:text-[#ad8330]">{reference.sourceName}<ExternalLink className="ml-1 inline-block align-text-bottom" size={12} /></a> : <p className="mt-1 font-semibold text-[#7a5a1d]">{reference.sourceName}</p>}{reference.sourceScope && <p className="mt-1 text-[#667085]">使用邊界：{reference.sourceScope}</p>}</div>)}</div></article>}
                <p className="mt-4 text-xs leading-5 text-[#667085]">依據條目：{adviceMutation.data.sourceTitles.join("、")}</p>
              </section>
            )}
            {adviceMutation.error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{adviceMutation.error.message}</div>}
          </div>
        </section>}

        {view === "roles" && <section><p className="mb-6 max-w-2xl text-sm leading-7 text-[#52657a]">先判讀場上每個人的位置與目的，再決定自己該走近、橋接、承接或退回觀察。以下只採用課程定義的七種角色。</p>{roles.isLoading ? <Loader2 className="animate-spin text-[#ad8330]" /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(roles.data ?? []).map((role) => <article key={role.id} className="group rounded-[1.35rem] border border-[#ddcca1] bg-[#fffaf0]/85 p-5 transition hover:-translate-y-0.5 hover:border-[#b9994d] hover:shadow-lg"><div className="flex items-start justify-between"><span className="font-serif text-2xl font-bold text-[#102a43]">{role.name}</span><span className="grid h-8 w-8 place-items-center rounded-full bg-[#eadfc5] text-[#8c6821]"><CircleUserRound size={15} /></span></div><p className="mt-3 text-sm leading-6 text-[#52657a]">{role.definition}</p><div className="mt-4 border-t border-[#e7dcc3] pt-4"><p className="text-[10px] font-bold tracking-[.14em] text-[#ad8330]">辨識訊號</p><p className="mt-1.5 text-sm leading-6 text-[#334e68]">{role.signals}</p></div><div className="mt-4 rounded-xl bg-[#102a43] p-3.5 text-[#fff8e8]"><p className="text-[10px] font-bold tracking-[.14em] text-[#f7d785]">應對策略</p><p className="mt-1.5 text-sm leading-6 text-[#e7edf2]">{role.strategy}</p></div></article>)}</div>}</section>}

        {view === "topics" && <section><div className="rounded-[1.5rem] border border-[#ddcca1] bg-[#fffaf0]/90 p-5 sm:p-7"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-[10px] font-bold tracking-[.15em] text-[#ad8330]">FIVE DINNER STAGES · FIFTEEN LAYERS</p><h3 className="mt-1 font-serif text-3xl font-bold">依當下局別，選對話題的深度</h3><p className="mt-2 max-w-xl text-sm leading-6 text-[#52657a]">不是每一局都要談得更深；先確認該局的層次，再選擇能推進而不失速的話題。</p></div><div className="w-full lg:w-56"><FieldLabel>選擇局別</FieldLabel><SelectField value={stage} onChange={(value) => { setStage(value); setLayer(1); }} options={stages} /></div></div><div className="mt-7 grid gap-4 lg:grid-cols-3">{activeStageRows.map((item) => <button key={item.id} onClick={() => setLayer(item.layer)} className={`rounded-[1.25rem] border p-5 text-left transition ${layer === item.layer ? "border-[#ad8330] bg-[#f4e8cd] shadow-sm" : "border-[#e2d8c1] bg-[#fffdf6] hover:border-[#b9994d]"}`}><p className="text-[10px] font-bold tracking-[.15em] text-[#ad8330]">第 {item.layer} 層</p><h4 className="mt-1 font-serif text-xl font-bold">{item.coreFocus}</h4><p className="mt-3 text-sm leading-6 text-[#52657a]">{item.topicGuidance}</p><div className="mt-4 border-t border-[#dfd3b8] pt-3"><p className="text-xs font-bold text-[#7a5a1d]">注意：{item.cautions}</p></div></button>)}</div></div><div className="mt-6 rounded-[1.5rem] border border-[#102a43] bg-[#102a43] p-6 text-[#fff8e8]"><div className="flex items-center gap-3"><Lightbulb className="text-[#f7d785]" /><div><p className="text-[10px] font-bold tracking-[.15em] text-[#f7d785]">目前選擇</p><h3 className="font-serif text-2xl font-bold">{stage} · 第 {layer} 層</h3></div></div>{activeStageRows.filter((item) => item.layer === layer).map((item) => <div key={item.id} className="mt-5 grid gap-4 md:grid-cols-2"><div><p className="text-xs font-bold text-[#f7d785]">話題方向</p><p className="mt-2 text-sm leading-7 text-[#e7edf2]">{item.topicGuidance}</p></div><div className="rounded-xl bg-white/10 p-4"><p className="text-xs font-bold text-[#f7d785]">注意事項</p><p className="mt-2 text-sm leading-7 text-[#e7edf2]">{item.cautions}</p></div></div>)}</div></section>}

        {view === "library" && (
          <section>
            <div className="rounded-[1.5rem] border border-[#ddcca1] bg-[#fffaf0]/90 p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div>
                  <p className="text-[10px] font-bold tracking-[.15em] text-[#ad8330]">SIX-PART KNOWLEDGE LIBRARY</p>
                  <h3 className="mt-1 font-serif text-3xl font-bold">把底層邏輯留在桌上</h3>
                  <p className="mt-2 text-sm leading-6 text-[#52657a]">六大部分、課程原始類別與可追溯的研究補充，均可在這裡查閱。</p>
                </div>
                <span className="rounded-full bg-[#eadfc5] px-4 py-2 text-xs font-bold text-[#7a5a1d]">{libraryMeta.data?.total ?? 32} 筆策略條目</span>
              </div>
              <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
                {["全部", ...sections].map((item) => <button key={item} onClick={() => setLibrarySection(item)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${librarySection === item ? "bg-[#102a43] text-white" : "border border-[#d8cfae] bg-[#fffdf6] text-[#52657a] hover:bg-[#f4e8cd]"}`}>{item}</button>)}
              </div>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                {["全部", ...(libraryMeta.data?.categories ?? [])].map((item) => <button key={item} onClick={() => setLibraryCategory(item)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${libraryCategory === item ? "bg-[#f4e8cd] text-[#7a5a1d]" : "text-[#667085] hover:text-[#102a43]"}`}>{item}</button>)}
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {libraryEntries.isLoading ? <Loader2 className="animate-spin text-[#ad8330]" /> : (libraryEntries.data ?? []).map((entry) => (
                <article key={entry.id} className="rounded-[1.25rem] border border-[#ded3ba] bg-[#fffdf6]/90 p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#eadfc5] px-2.5 py-1 text-[10px] font-bold tracking-[.1em] text-[#7a5a1d]">{entry.section}</span>
                    <span className="rounded-full border border-[#e2d8c1] px-2.5 py-1 text-[10px] font-bold text-[#667085]">{entry.category}</span>
                  </div>
                  <h4 className="mt-3 font-serif text-xl font-bold text-[#102a43]">{entry.title}</h4>
                  <p className="mt-3 text-sm leading-7 text-[#52657a]">{entry.content}</p>
                  {entry.sourceName && (
                    <aside className="mt-4 rounded-xl border border-[#dfd3b8] bg-[#f7f1e3]/80 p-3 text-xs leading-5 text-[#52657a]">
                      <p className="font-bold text-[#7a5a1d]">研究來源</p>
                      {entry.sourceUrl ? <a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline break-words font-semibold text-[#102a43] underline decoration-[#caa75b] underline-offset-2 hover:text-[#ad8330]">{entry.sourceName}<ExternalLink className="ml-1 inline-block align-text-bottom" size={12} /></a> : <p className="mt-1 font-semibold text-[#102a43]">{entry.sourceName}</p>}
                      {entry.sourceScope && <p className="mt-2 border-t border-[#dfd3b8] pt-2 text-[#667085]">使用邊界：{entry.sourceScope}</p>}
                    </aside>
                  )}
                  <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-semibold text-[#8c6821]">
                    <span className="rounded bg-[#f7f1e3] px-2 py-1">{entry.peopleTags}</span><span className="rounded bg-[#f7f1e3] px-2 py-1">{entry.cuisineTags}</span><span className="rounded bg-[#f7f1e3] px-2 py-1">{entry.timeTags}</span>
                  </div>
                </article>
              ))}
              {!libraryEntries.isLoading && (libraryEntries.data ?? []).length === 0 && <EmptyState title="目前沒有相符條目" description="請改選另一個六大部分或類別查看。" />}
            </div>
          </section>
        )}

        {view === "records" && <section>{!isAuthenticated ? <EmptyState title="登入後，讓每一局成為下一局的底稿" description="使用 Manus OAuth 登入後，才能保存你在局前建立的策略、AI 建議與局後復盤筆記。" /> : <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><div className="space-y-5"><div className="rounded-[1.5rem] border border-[#ddcca1] bg-[#fffaf0]/90 p-5 sm:p-7"><p className="text-[10px] font-bold tracking-[.15em] text-[#ad8330]">SAVE YOUR PRACTICE</p><h3 className="mt-1 font-serif text-2xl font-bold">留下一份可復用的紀錄</h3><p className="mt-2 text-sm leading-6 text-[#52657a]">回到局前規劃填寫情境後，這裡會保存你的飯局策略。你也可以在飯後補上復盤筆記。</p><div className="mt-5"><FieldLabel>紀錄名稱</FieldLabel><input value={recordTitle} onChange={(event) => setRecordTitle(event.target.value)} className="gold-select w-full rounded-xl border border-[#d8cfae] bg-[#fffdf6] px-3.5 py-3 text-sm font-semibold text-[#102a43] outline-none" /></div><div className="mt-4"><FieldLabel>局後復盤筆記</FieldLabel><textarea value={reflectionNotes} onChange={(event) => setReflectionNotes(event.target.value)} rows={4} placeholder="例如：誰在何時轉換角色、哪些問題有效、下一次如何調整？" className="gold-select w-full resize-none rounded-xl border border-[#d8cfae] bg-[#fffdf6] px-3.5 py-3 text-sm leading-6 text-[#102a43] outline-none" /></div><Button onClick={saveCurrentRecord} disabled={saveRecordMutation.isPending} className="mt-5 rounded-full bg-[#102a43] font-bold text-[#fff8e8] hover:bg-[#163a5b]"><Save size={16} />儲存目前規劃</Button></div><div className="rounded-[1.5rem] border border-[#ddcca1] bg-[#fffaf0]/90 p-5"><p className="text-[10px] font-bold tracking-[.15em] text-[#ad8330]">PERSONAL DEFAULTS</p><h3 className="mt-1 font-serif text-xl font-bold">我的局前預設</h3><p className="mt-2 text-sm leading-6 text-[#52657a]">儲存後，登入時會優先帶入常用的飯局條件。</p><div className="mt-4 grid gap-3"><div><FieldLabel>常用人數</FieldLabel><SelectField value={guestCount} onChange={setGuestCount} options={guestCounts} /></div><div><FieldLabel>常用菜系</FieldLabel><SelectField value={cuisine} onChange={setCuisine} options={cuisines} /></div><div><FieldLabel>常用時段</FieldLabel><SelectField value={timeSlot} onChange={setTimeSlot} options={timeSlots} /></div></div><Button onClick={savePreferences} disabled={savePreferencesMutation.isPending || preferences.isLoading} variant="outline" className="mt-4 rounded-full border-[#b9994d] bg-transparent font-bold text-[#7a5a1d] hover:bg-[#f4e8cd]">{savePreferencesMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}儲存局前預設</Button>{preferencesMessage && <p className="mt-3 text-xs leading-5 text-[#7a5a1d]">{preferencesMessage}</p>}</div></div><div>{records.isLoading ? <Loader2 className="animate-spin text-[#ad8330]" /> : (records.data ?? []).length === 0 ? <EmptyState title="還沒有儲存的飯局紀錄" description="先從局前規劃建立你的第一份策略，登入後即可保存。" /> : <div className="space-y-3">{records.data?.map((record) => <article key={record.id} className="rounded-[1.25rem] border border-[#ded3ba] bg-[#fffdf6]/90 p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-serif text-xl font-bold">{record.title}</p><p className="mt-1 text-xs font-bold text-[#ad8330]">{record.guestCount} · {record.cuisine} · {record.timeSlot} · {record.stage}第{record.layer}層</p></div><Check className="text-[#ad8330]" size={18} /></div><p className="mt-3 text-sm leading-6 text-[#52657a]">{record.objective}</p>{record.reflection && <p className="mt-3 rounded-lg bg-[#f7f1e3] p-3 text-xs leading-5 text-[#52657a]">局後筆記：{record.reflection}</p>}<p className="mt-3 text-xs text-[#98a2b3]">{new Date(record.createdAt).toLocaleString("zh-TW")}</p></article>)}</div>}</div></div>}</section>}
      </main>
      <footer className="relative z-10 border-t border-[#d8cfae] bg-[#fffaf0]/70"><div className="container flex flex-col gap-2 py-7 text-xs text-[#667085] sm:flex-row sm:items-center sm:justify-between"><p className="font-bold tracking-[.12em] text-[#7a5a1d]">阿是要不要好好吃飯 · DINNER INTELLIGENCE</p><p>所有智慧建議均以平台飯局知識庫為依據。</p></div></footer>
    </div>
  );
}
