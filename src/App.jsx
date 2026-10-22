import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, X, Users, Gauge, Trophy, AlertTriangle, ImagePlus, Download, LayoutDashboard, UserRound } from "lucide-react";

const KEY = "staffpulse.employees.v1";
const DEPTS = ["Sales", "Customer Support", "Inventory", "Delivery", "Accounts"];
const TINTS = ["bg-indigo-100 text-indigo-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700", "bg-emerald-100 text-emerald-700", "bg-sky-100 text-sky-700"];
// Weights: Tasks 35%, Quality 25%, Attendance 20%, Manager rating 20%
const score = (e) => Math.round(((e.assigned ? e.done / e.assigned : 0) * 100 * 35 + e.quality * 25 + e.attendance * 20 + (e.rating / 5) * 100 * 20) / 100);
const tier = (s) =>
  s >= 85 ? ["Outstanding", "bg-emerald-100 text-emerald-700", "#059669"]
  : s >= 70 ? ["On track", "bg-sky-100 text-sky-700", "#0284c7"]
  : s >= 55 ? ["Needs improvement", "bg-amber-100 text-amber-700", "#d97706"]
  : ["At risk", "bg-rose-100 text-rose-700", "#e11d48"];
const mk = (id, name, role, dept, assigned, done, quality, attendance, rating, notes, trend, goals) => ({ id, name, role, dept, assigned, done, quality, attendance, rating, notes, trend, goals: goals.map(([t, p], i) => ({ id: i + 1, t, p })), image: "" });
const SEED = [
  mk(1, "Ayesha Khan", "Senior Sales Associate", "Sales", 40, 38, 92, 98, 5, "Handles walk-in customers very well and upsells without pressure.", [78, 81, 84, 86, 90, 94], [["Reach 25 lakh monthly sales", 80], ["Train 2 new staff", 50]]),
  mk(2, "Bilal Ahmed", "Sales Associate", "Sales", 40, 30, 78, 90, 3, "Good with regular customers. Needs to follow up on pending orders faster.", [66, 70, 68, 72, 74, 73], [["Follow up all pending orders within 24h", 40]]),
  mk(3, "Hina Malik", "Support Lead", "Customer Support", 60, 55, 88, 95, 4, "Calm under pressure. Complaint resolution time improved this quarter.", [72, 75, 80, 82, 85, 87], [["Resolve complaints in under 24h", 75]]),
  mk(4, "Usman Tariq", "Stock Keeper", "Inventory", 30, 27, 85, 92, 4, "Stock count mismatches are down. Keeps the storeroom organised.", [70, 72, 77, 79, 80, 84], [["Zero count mismatches for 3 months", 60]]),
  mk(5, "Sana Riaz", "Delivery Coordinator", "Delivery", 50, 33, 70, 82, 3, "Late deliveries went up during the sale week. Route planning needs work.", [74, 71, 69, 66, 64, 66], [["Cut late deliveries to under 5%", 30]]),
  mk(6, "Hamza Ali", "Delivery Rider", "Delivery", 45, 25, 58, 70, 2, "Absent several times this month. Customers reported damaged parcels.", [62, 60, 57, 55, 52, 50], [["Attendance above 90%", 20]]),
  mk(7, "Maryam Iqbal", "Accounts Officer", "Accounts", 25, 24, 95, 100, 5, "Daily cash reports are always accurate and on time.", [88, 89, 91, 92, 94, 96], [["Automate monthly tax report", 85]]),
  mk(8, "Zain Abbas", "Support Executive", "Customer Support", 55, 38, 66, 85, 3, "Improving, but still needs coaching on product knowledge.", [60, 62, 63, 66, 68, 69], [["Complete product training", 55]]),
];
const EMPTY = { name: "", role: "", dept: DEPTS[0], assigned: "", done: "", quality: "", attendance: "", rating: 3, notes: "", image: "" };
const inp = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
const ini = (n) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const r = Math.min(1, 320 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * r);
        c.height = Math.round(img.height * r);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const load = () => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(s) ? s : SEED;
  } catch {
    return SEED;
  }
};

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl ${wide ? "max-w-xl" : "max-w-md"}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const Avatar = ({ e, size = "h-12 w-12 text-sm" }) => (
  <div className={`grid shrink-0 place-items-center overflow-hidden rounded-full font-bold ${size} ${TINTS[e.id % TINTS.length]}`}>
    {e.image ? <img src={e.image} alt={e.name} className="h-full w-full object-cover" /> : ini(e.name)}
  </div>
);

function Ring({ s, size = 56 }) {
  const r = size / 2 - 5, C = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tier(s)[2]} strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - s / 100)} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-bold tabular-nums">{s}</span>
    </div>
  );
}

const Bar = ({ label, v, color = "bg-indigo-500" }) => (
  <div>
    <div className="mb-1 flex justify-between text-xs text-slate-500">
      <span>{label}</span>
      <span className="font-semibold tabular-nums text-slate-700">{v}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${v}%` }} />
    </div>
  </div>
);

function Spark({ data }) {
  if (data.length < 2) return <p className="text-xs text-slate-400">Trend appears after the next review.</p>;
  const lo = Math.min(...data) - 5, hi = Math.max(...data) + 5;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 240},${60 - ((v - lo) / (hi - lo)) * 56}`).join(" ");
  const up = data[data.length - 1] >= data[0];
  return (
    <svg viewBox="0 0 240 64" className="h-16 w-full" preserveAspectRatio="none" role="img" aria-label="Score trend over recent months">
      <polyline points={pts} fill="none" stroke={up ? "#059669" : "#e11d48"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function App() {
  const [items, setItems] = useState(load);
  const [view, setView] = useState("overview");
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [sort, setSort] = useState("top");
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const [selId, setSelId] = useState(null);
  const [imgErr, setImgErr] = useState("");
  const [full, setFull] = useState(false);
  const [goal, setGoal] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
      setFull(false);
    } catch {
      setFull(true);
    }
  }, [items]);

  const scored = useMemo(() => items.map((e) => ({ ...e, s: score(e) })), [items]);
  const ranked = useMemo(() => [...scored].sort((a, b) => b.s - a.s), [scored]);
  const avg = scored.length ? Math.round(scored.reduce((a, e) => a + e.s, 0) / scored.length) : 0;
  const attention = scored.filter((e) => e.s < 70);
  const sel = scored.find((e) => e.id === selId);

  const list = useMemo(() => {
    const f = scored.filter((e) => (dept === "All" || e.dept === dept) && (e.name + e.role).toLowerCase().includes(q.trim().toLowerCase()));
    return f.sort((a, b) => (sort === "top" ? b.s - a.s : sort === "low" ? a.s - b.s : a.name.localeCompare(b.name)));
  }, [scored, q, dept, sort]);

  const byDept = DEPTS.map((d) => {
    const m = scored.filter((e) => e.dept === d);
    return { d, n: m.length, a: m.length ? Math.round(m.reduce((x, e) => x + e.s, 0) / m.length) : 0 };
  }).filter((x) => x.n);

  const stats = [
    { label: "Total employees", value: items.length, icon: Users, c: "bg-indigo-100 text-indigo-600" },
    { label: "Average score", value: `${avg}/100`, icon: Gauge, c: "bg-sky-100 text-sky-600" },
    { label: "Outstanding performers", value: scored.filter((e) => e.s >= 85).length, icon: Trophy, c: "bg-emerald-100 text-emerald-600" },
    { label: "Need attention", value: attention.length, icon: AlertTriangle, c: "bg-amber-100 text-amber-600" },
  ];

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const closeForm = () => { setForm(null); setImgErr(""); };
  const patch = (id, fn) => setItems((prev) => prev.map((x) => (x.id === id ? fn(x) : x)));

  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const image = await toDataUrl(f);
      setImgErr("");
      setForm((cur) => ({ ...cur, image }));
    } catch {
      setImgErr("This image could not be read. Try a JPG or PNG file.");
    }
  };

  const save = (e) => {
    e.preventDefault();
    const assigned = Math.max(1, Number(form.assigned) || 1);
    const p = { ...form, name: form.name.trim(), role: form.role.trim(), assigned, done: Math.min(assigned, Math.max(0, Number(form.done) || 0)), quality: clamp(form.quality), attendance: clamp(form.attendance), rating: Number(form.rating) };
    const sc = score(p);
    if (p.id) patch(p.id, (old) => ({ ...p, trend: [...old.trend.slice(0, -1), sc] }));
    else setItems((prev) => [{ ...p, id: Date.now(), trend: [sc], goals: [] }, ...prev]);
    closeForm();
  };

  const remove = () => {
    setItems((prev) => prev.filter((x) => x.id !== del.id));
    setDel(null);
    setSelId(null);
  };

  const addGoal = (e) => {
    e.preventDefault();
    if (!goal.trim()) return;
    patch(sel.id, (x) => ({ ...x, goals: [...x.goals, { id: Date.now(), t: goal.trim(), p: 0 }] }));
    setGoal("");
  };

  const exportCsv = () => {
    const rows = [["Name", "Role", "Department", "Tasks done", "Tasks assigned", "Quality %", "Attendance %", "Manager rating", "Score", "Status"], ...ranked.map((e) => [e.name, e.role, e.dept, e.done, e.assigned, e.quality, e.attendance, e.rating, e.s, tier(e.s)[0]])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "employee-performance.csv";
    a.click();
  };

  const tab = (id, label, Icon) => (
    <button key={id} onClick={() => setView(id)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${view === id ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-800"}`}>
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white"><Gauge size={20} /></div>
              <div>
                <h1 className="text-lg font-bold leading-tight">StaffPulse</h1>
                <p className="text-xs text-slate-500">Employee performance</p>
              </div>
            </div>
            <nav className="flex gap-1">{[tab("overview", "Overview", LayoutDashboard), tab("team", "Team", UserRound)]}</nav>
          </div>
          <button onClick={() => setForm(EMPTY)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95">
            <Plus size={18} /> Add employee
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {full && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Browser storage is full, so your latest changes are not saved. Remove a few profile photos to continue.</div>}

        {view === "overview" && (
          <>
            <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${s.c}`}><s.icon size={20} /></div>
                  <p className="truncate text-xl font-bold tabular-nums sm:text-2xl">{s.value}</p>
                  <p className="text-xs text-slate-500 sm:text-sm">{s.label}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-4 lg:grid-cols-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-3">
                <h2 className="font-bold">Department performance</h2>
                <p className="mb-4 text-sm text-slate-500">Average score per team</p>
                <div className="space-y-4">
                  {byDept.map((x) => (
                    <div key={x.d}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{x.d} <span className="text-slate-400">({x.n})</span></span>
                        <span className="font-bold tabular-nums">{x.a}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${x.a}%`, background: tier(x.a)[2] }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
                <h2 className="font-bold">Top performers</h2>
                <p className="mb-3 text-sm text-slate-500">Highest overall score</p>
                <ol className="space-y-1">
                  {ranked.slice(0, 5).map((e, i) => (
                    <li key={e.id}>
                      <button onClick={() => setSelId(e.id)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50">
                        <span className="w-5 text-center text-sm font-bold text-slate-400">{i + 1}</span>
                        <Avatar e={e} size="h-9 w-9 text-xs" />
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{e.name}</span><span className="block truncate text-xs text-slate-500">{e.dept}</span></span>
                        <span className="font-bold tabular-nums">{e.s}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold">Needs attention</h2>
              <p className="mb-3 text-sm text-slate-500">Employees scoring below 70. Plan a coaching conversation.</p>
              {attention.length === 0 ? (
                <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">Everyone is on track right now.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {attention.sort((a, b) => a.s - b.s).map((e) => (
                    <button key={e.id} onClick={() => setSelId(e.id)} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-indigo-300">
                      <Avatar e={e} size="h-10 w-10 text-xs" />
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{e.name}</span><span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tier(e.s)[1]}`}>{tier(e.s)[0]}</span></span>
                      <span className="font-bold tabular-nums">{e.s}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {view === "team" && (
          <>
            <section className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or role" className={`${inp} pl-10`} />
                </div>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${inp} !w-auto`} aria-label="Sort employees">
                  <option value="top">Highest score</option>
                  <option value="low">Lowest score</option>
                  <option value="name">Name A-Z</option>
                </select>
                <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold hover:bg-slate-50"><Download size={16} /><span className="hidden sm:inline">Export CSV</span></button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {["All", ...DEPTS].map((c) => (
                  <button key={c} onClick={() => setDept(c)} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${dept === c ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"}`}>{c}</button>
                ))}
              </div>
            </section>

            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                <p className="font-semibold">No employees found</p>
                <p className="mt-1 text-sm text-slate-500">Change your search or add a new employee.</p>
                <button onClick={() => setForm(EMPTY)} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Add employee</button>
              </div>
            ) : (
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((e) => {
                  const [label, cls] = tier(e.s);
                  return (
                    <article key={e.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-lg hover:shadow-indigo-100">
                      <button onClick={() => setSelId(e.id)} className="flex w-full items-center gap-3 text-left">
                        <Avatar e={e} />
                        <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{e.name}</span><span className="block truncate text-xs text-slate-500">{e.role} - {e.dept}</span></span>
                        <Ring s={e.s} />
                      </button>
                      <span className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>
                      <div className="mt-3 space-y-2.5">
                        <Bar label={`Tasks (${e.done}/${e.assigned})`} v={Math.round((e.done / e.assigned) * 100)} />
                        <Bar label="Quality" v={e.quality} color="bg-sky-500" />
                        <Bar label="Attendance" v={e.attendance} color="bg-emerald-500" />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button onClick={() => setForm(e)} className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-50 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"><Pencil size={15} /> Edit</button>
                        <button onClick={() => setDel(e)} className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100"><Trash2 size={15} /> Delete</button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>

      {sel && (
        <Modal title="Performance review" onClose={() => setSelId(null)} wide>
          <div className="flex items-center gap-4">
            <Avatar e={sel} size="h-16 w-16 text-lg" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold">{sel.name}</h3>
              <p className="truncate text-sm text-slate-500">{sel.role} - {sel.dept}</p>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${tier(sel.s)[1]}`}>{tier(sel.s)[0]}</span>
            </div>
            <Ring s={sel.s} size={72} />
          </div>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="mb-1 text-sm font-semibold">Score trend <span className="font-normal text-slate-400">(last {sel.trend.length} months)</span></p>
            <Spark data={sel.trend} />
          </div>
          <div className="mt-5 space-y-3">
            <Bar label={`Task completion (${sel.done} of ${sel.assigned})`} v={Math.round((sel.done / sel.assigned) * 100)} />
            <Bar label="Work quality" v={sel.quality} color="bg-sky-500" />
            <Bar label="Attendance" v={sel.attendance} color="bg-emerald-500" />
            <Bar label={`Manager rating (${sel.rating}/5)`} v={sel.rating * 20} color="bg-amber-500" />
          </div>
          {sel.notes && (
            <div className="mt-5">
              <p className="mb-1 text-sm font-semibold">Manager feedback</p>
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{sel.notes}</p>
            </div>
          )}
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold">Goals</p>
            <div className="space-y-3">
              {sel.goals.length === 0 && <p className="text-sm text-slate-400">No goals yet. Add one below.</p>}
              {sel.goals.map((g) => (
                <div key={g.id}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{g.t}</span>
                    <span className="flex items-center gap-2"><span className="font-semibold tabular-nums">{g.p}%</span>
                      <button aria-label="Remove goal" onClick={() => patch(sel.id, (x) => ({ ...x, goals: x.goals.filter((y) => y.id !== g.id) }))} className="text-slate-300 hover:text-rose-500"><X size={14} /></button>
                    </span>
                  </div>
                  <input type="range" min="0" max="100" step="5" value={g.p} aria-label={`Progress for ${g.t}`} onChange={(e) => patch(sel.id, (x) => ({ ...x, goals: x.goals.map((y) => (y.id === g.id ? { ...y, p: Number(e.target.value) } : y)) }))} className="w-full accent-indigo-600" />
                </div>
              ))}
            </div>
            <form onSubmit={addGoal} className="mt-3 flex gap-2">
              <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Reduce billing errors" className={inp} />
              <button className="shrink-0 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">Add goal</button>
            </form>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => { setForm(sel); setSelId(null); }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50">Edit details</button>
            <button onClick={() => setSelId(null)} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Done</button>
          </div>
        </Modal>
      )}

      {form && (
        <Modal title={form.id ? "Edit employee" : "Add employee"} onClose={closeForm}>
          <form onSubmit={save} className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar e={{ id: form.id || 0, name: form.name || "New Employee", image: form.image }} size="h-16 w-16 text-lg" />
              <div className="flex flex-col items-start gap-1.5">
                <label className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
                  <ImagePlus size={16} /> {form.image ? "Change photo" : "Choose photo"}
                  <input type="file" accept="image/*" onChange={pick} className="hidden" />
                </label>
                {form.image && <button type="button" onClick={() => setForm({ ...form, image: "" })} className="text-sm font-medium text-rose-600 hover:underline">Remove photo</button>}
              </div>
            </div>
            {imgErr && <p className="text-sm text-rose-600">{imgErr}</p>}
            <label className="block text-sm font-medium">Full name<input required value={form.name} onChange={set("name")} placeholder="e.g. Ali Raza" className={`${inp} mt-1.5`} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">Job title<input required value={form.role} onChange={set("role")} placeholder="e.g. Cashier" className={`${inp} mt-1.5`} /></label>
              <label className="block text-sm font-medium">Department
                <select value={form.dept} onChange={set("dept")} className={`${inp} mt-1.5`}>{DEPTS.map((c) => <option key={c}>{c}</option>)}</select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">Tasks assigned<input required type="number" min="1" value={form.assigned} onChange={set("assigned")} className={`${inp} mt-1.5`} /></label>
              <label className="block text-sm font-medium">Tasks completed<input required type="number" min="0" max={form.assigned || undefined} value={form.done} onChange={set("done")} className={`${inp} mt-1.5`} /></label>
              <label className="block text-sm font-medium">Quality (0-100)<input required type="number" min="0" max="100" value={form.quality} onChange={set("quality")} className={`${inp} mt-1.5`} /></label>
              <label className="block text-sm font-medium">Attendance % (0-100)<input required type="number" min="0" max="100" value={form.attendance} onChange={set("attendance")} className={`${inp} mt-1.5`} /></label>
            </div>
            <label className="block text-sm font-medium">Manager rating
              <select value={form.rating} onChange={set("rating")} className={`${inp} mt-1.5`}>
                {[[5, "5 - Excellent"], [4, "4 - Good"], [3, "3 - Average"], [2, "2 - Below average"], [1, "1 - Poor"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">Manager feedback<textarea rows="3" value={form.notes} onChange={set("notes")} placeholder="Strengths and what to improve" className={`${inp} mt-1.5 resize-none`} /></label>
            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Score = tasks 35% + quality 25% + attendance 20% + manager rating 20%.</p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={closeForm} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50">Cancel</button>
              <button type="submit" className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">{form.id ? "Save changes" : "Add employee"}</button>
            </div>
          </form>
        </Modal>
      )}

      {del && (
        <Modal title="Delete employee?" onClose={() => setDel(null)}>
          <p className="text-sm text-slate-600"><span className="font-semibold">{del.name}</span> and their performance history will be removed. This cannot be undone.</p>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setDel(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50">Keep employee</button>
            <button onClick={remove} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
