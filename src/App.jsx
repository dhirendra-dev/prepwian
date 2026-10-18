import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, Atom, BookOpen, BrainCircuit, CalendarDays, Check,
  ChevronDown, ChevronRight, Code2, Command, FileText, FlaskConical,
  GraduationCap, LayoutDashboard, Library, Menu, Play, Plus, Search,
  ShieldCheck, Terminal, Timer, Target, Trash2, X, Zap, Map, NotebookPen, CircleDot
} from "lucide-react";

const seedTasks = [
  { id: 1, title: "Define today's learning objective", subject: "PLANNING", minutes: 15, complete: false },
  { id: 2, title: "Practise one difficult concept", subject: "PRACTICE", minutes: 35, complete: false },
  { id: 3, title: "Recall yesterday's key ideas", subject: "REVISION", minutes: 20, complete: true }
];
const modules = [
  { code: "PHY", name: "Physics", topics: 0, icon: Atom },
  { code: "CHM", name: "Chemistry", topics: 0, icon: FlaskConical },
  { code: "MAT", name: "Mathematics", topics: 0, icon: BrainCircuit },
  { code: "BIO", name: "Biology", topics: 0, icon: Activity }
];
const pages = [["Overview", LayoutDashboard], ["Daily plan", CalendarDays], ["Concept atlas", Map], ["Review journal", NotebookPen], ["Practice lab", Target], ["Resource shelf", Library], ["Progress", Activity]];
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

function Bar({ value }) { return <div className="bar"><span style={{ width: `${value}%` }} /></div>; }
function Heading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
function Tasks({ items, toggle, remove }) {
  if (!items.length) return <div className="empty">No tasks here. Add a small, achievable next step.</div>;
  return <div className="task-list">{items.map(task => <div className={`task ${task.complete ? "completed" : ""}`} key={task.id}>
    <button className={`check ${task.complete ? "checked" : ""}`} onClick={() => toggle(task.id)} aria-label="Toggle task">{task.complete && <Check size={13}/>}</button>
    <div className="task-info"><b>{task.title}</b><small>{task.subject} <i>·</i> {task.minutes} MIN</small></div>
    {remove && <button className="small-button" onClick={() => remove(task.id)} aria-label="Remove task"><Trash2 size={14}/></button>}
  </div>)}</div>;
}

export default function App() {
  const [page, setPage] = useState("Overview");
  const [exam, setExam] = useState("JEE Main");
  const [tasks, setTasks] = useState(() => read("pw-independent-tasks", seedTasks));
  const [resources, setResources] = useState(() => read("pw-independent-resources", []));
  const [concepts, setConcepts] = useState(() => read("prepwian-concepts-v1", []));
  const [reviews, setReviews] = useState(() => read("prepwian-reviews-v1", []));
  const [conceptTitle, setConceptTitle] = useState("");
  const [conceptSubject, setConceptSubject] = useState("Physics");
  const [reviewText, setReviewText] = useState("");
  const [reviewMood, setReviewMood] = useState("Steady");
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [timerMode, setTimerMode] = useState("FOCUS");
  const [seconds, setSeconds] = useState(1500);
  const [running, setRunning] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [terminal, setTerminal] = useState("");
  const [questionOpen, setQuestionOpen] = useState(false);
  const [answer, setAnswer] = useState(null);

  useEffect(() => localStorage.setItem("pw-independent-tasks", JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem("pw-independent-resources", JSON.stringify(resources)), [resources]);
  useEffect(() => localStorage.setItem("prepwian-concepts-v1", JSON.stringify(concepts)), [concepts]);
  useEffect(() => localStorage.setItem("prepwian-reviews-v1", JSON.stringify(reviews)), [reviews]);
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setSeconds(current => {
      if (current <= 1) { setRunning(false); setNotice("Timer finished. Take a short break."); return 0; }
      return current - 1;
    }), 1000);
    return () => clearInterval(interval);
  }, [running]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 2600);
    return () => clearTimeout(timeout);
  }, [notice]);

  const completeCount = tasks.filter(task => task.complete).length;
  const remainingMinutes = tasks.filter(task => !task.complete).reduce((sum, task) => sum + task.minutes, 0);
  const formatTime = value => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  const filteredResources = useMemo(() => resources.filter(item => `${item.title} ${item.subject}`.toLowerCase().includes(query.toLowerCase())), [resources, query]);
  const toggleTask = id => setTasks(current => current.map(task => task.id === id ? { ...task, complete: !task.complete } : task));
  const addTask = event => {
    event.preventDefault();
    if (!newTask.trim()) return;
    setTasks(current => [...current, { id: Date.now(), title: newTask.trim(), subject: "PERSONAL", minutes: 25, complete: false }]);
    setNewTask(""); setAdding(false); setNotice("Task added to your daily plan.");
  };
  const switchTimer = mode => { setTimerMode(mode); setRunning(false); setSeconds(mode === "FOCUS" ? 1500 : 300); };
  const execute = event => {
    event.preventDefault();
    const command = terminal.trim().toLowerCase();
    const targets = { overview: "Overview", plan: "Daily plan", atlas: "Concept atlas", journal: "Review journal", practice: "Practice lab", resources: "Resource shelf", progress: "Progress" };
    if (targets[command]) setPage(targets[command]);
    else if (command === "help") setNotice("Commands: overview, plan, practice, resources, progress");
    else setNotice("Unknown command. Type help to view available commands.");
    setTerminal("");
  };
  const addResource = () => {
    const title = window.prompt("Resource title");
    if (!title?.trim()) return;
    const subject = window.prompt("Subject or category", "General") || "General";
    setResources(current => [...current, { id: Date.now(), title: title.trim(), subject: subject.trim(), createdAt: new Date().toISOString() }]);
    setNotice("Resource entry created.");
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "visible" : ""}`}>
      <div className="brand"><div className="brand-mark"><Terminal size={20}/></div><div><b>prepwian<span>.core</span></b><small>THE PERSONAL LEARNING FIELD GUIDE</small></div><button className="small-button mobile-close" onClick={() => setMobileMenu(false)}><X size={16}/></button></div>
      <div className="session-line"><span/> YOUR STUDY FIELD GUIDE <b>01</b></div>
      <div className="nav-label">NAVIGATION / 01</div>
      <nav>{pages.map(([label, Icon], index) => <button key={label} className={page === label ? "active" : ""} onClick={() => { setPage(label); setMobileMenu(false); }}><Icon size={17}/><span>{label}</span><small>{String(index + 1).padStart(2, "0")}</small></button>)}</nav>
      <div className="sidebar-bottom"><div className="side-module"><div className="eyebrow">ACTIVE OBJECTIVE</div><b>Consistency over intensity<span>.</span></b><Bar value={42}/><small>WEEKLY ROUTINE · DEMO</small></div><div className="profile"><div className="profile-icon">P</div><div><b>Personal workspace</b><small>Data stored in this browser</small></div></div></div>
    </aside>
    {mobileMenu && <button className="scrim" onClick={() => setMobileMenu(false)} aria-label="Close menu"/>}
    <main>
      <header><div className="header-path"><button className="small-button mobile-menu" onClick={() => setMobileMenu(true)}><Menu size={18}/></button><span>field guide</span><ChevronRight size={13}/><b>{page.toLowerCase().replaceAll(" ", "_")}</b></div><div className="header-actions"><span className="local-status"><i/> PRIVATE · THIS DEVICE</span><div className="exam-select"><GraduationCap size={15}/><select value={exam} onChange={event => setExam(event.target.value)}><option>JEE Main</option><option>JEE Advanced</option><option>NEET UG</option></select><ChevronDown size={12}/></div></div></header>
      <div className="content">
        {page === "Overview" && <>
          <section className="welcome"><div><div className="eyebrow"><span className="pulse"/> SYSTEM READY / LEARNING MODE</div><h1>Study with <em>intention.</em></h1><p>A personal field guide for turning confusing topics into clear next steps—one honest session at a time.</p></div><div className="target-box"><small>ACTIVE EXAM</small><b>{exam.toUpperCase()}</b><span>PROFILE / LOCAL</span></div></section>
          <section className="hero"><div className="hero-top"><span><Terminal size={13}/> prepwian://workspace</span><span>● RUNNING LOCALLY</span></div><div className="hero-body"><div><div className="code-line">01 <span>// YOUR PREPARATION, YOUR PROCESS</span></div><div className="code-line">02 <span>// DEFINE → PRACTISE → REVIEW</span></div><h2><i>&gt;_</i> Build your next <em>breakthrough.</em></h2><p>A new workspace for exam preparation. Start with a plan you can finish, then iterate using what you learn.</p><div className="actions"><button className="primary" onClick={() => setPage("Daily plan")}><Play size={13}/> OPEN DAILY PLAN</button><button className="secondary" onClick={() => setPage("Practice lab")}><Code2 size={14}/> ENTER PRACTICE LAB</button></div></div><div className="visual"><div className="visual-ring r1"/><div className="visual-ring r2"/><div className="visual-ring r3"/><div className="visual-core"><Terminal size={28}/><span>PW / 01</span></div><div className="float f-a">PLAN <b>→</b></div><div className="float f-b">REVIEW <b>↻</b></div></div></div><div className="hero-foot"><span><i/> STORAGE: LOCAL</span><span>AUTH: NOT CONFIGURED</span><span>BUILD 0.1.0</span></div></section>
          <section className="metrics">{[[Target,"TASKS COMPLETED",`${completeCount}/${tasks.length}`,"Current daily plan"],[Timer,"TIME REMAINING",`${Math.floor(remainingMinutes/60)}h ${remainingMinutes%60}m`,"Estimated unfinished work"],[Activity,"FOCUS TIMER",formatTime(seconds),running?"Session active":"Ready to start"],[ShieldCheck,"EXAM TARGET",exam,"Selected locally"]].map(([Icon, label, value, hint]) => <article className="metric" key={label}><div><Icon size={17}/></div><small>{label}</small><b>{value}</b><span>{hint}</span></article>)}</section>
          <section className="dashboard-grid"><article className="panel"><div className="panel-heading"><div><div className="eyebrow">QUEUE / 01</div><h2>Today's tasks</h2></div><button className="text-action" onClick={() => setPage("Daily plan")}>OPEN QUEUE <ArrowRight size={13}/></button></div><Tasks items={tasks.slice(0, 4)} toggle={toggleTask}/><button className="add-action" onClick={() => { setPage("Daily plan"); setAdding(true); }}><Plus size={14}/> ADD TASK</button></article>
          <article className="panel timer-panel"><div className="panel-heading"><div><div className="eyebrow">FOCUS ENGINE / 02</div><h2>Attention timer</h2></div><span className="ready">● READY</span></div><div className="timer-modes"><button className={timerMode === "FOCUS" ? "active" : ""} onClick={() => switchTimer("FOCUS")}>FOCUS / 25M</button><button className={timerMode === "BREAK" ? "active" : ""} onClick={() => switchTimer("BREAK")}>BREAK / 05M</button></div><div className="timer-face"><svg viewBox="0 0 180 180"><circle cx="90" cy="90" r="78" className="timer-track"/><circle cx="90" cy="90" r="78" className="timer-progress" strokeDasharray="490" strokeDashoffset={490 * (1 - seconds / (timerMode === "FOCUS" ? 1500 : 300))}/></svg><div><b>{formatTime(seconds)}</b><small>MINUTES : SECONDS</small></div></div><div className="timer-actions"><button className="primary" onClick={() => { if (!seconds) switchTimer(timerMode); else setRunning(value => !value); }}><Play size={13}/>{running ? "PAUSE TIMER" : "START TIMER"}</button><button className="secondary square" onClick={() => { setRunning(false); setSeconds(timerMode === "FOCUS" ? 1500 : 300); }}>↻</button></div></article></section>
          <section className="module-section"><div className="panel-heading"><div><div className="eyebrow">SUBJECT MODULES / 03</div><h2>Choose a learning area</h2></div><button className="text-action" onClick={() => setPage("Progress")}>VIEW PROGRESS <ArrowRight size={13}/></button></div><div className="modules">{modules.map(module => <button className="module" key={module.code} onClick={() => { setQuery(module.name); setPage("Resource shelf"); }}><div className="module-icon"><module.icon size={18}/></div><small>/{module.code.toLowerCase()}</small><h3>{module.name}</h3><p>Build your own topic list and study resources.</p><div className="module-bottom"><span>TOPICS CONFIGURED</span><b>{module.topics}</b></div></button>)}</div></section>
          <form className="command" onSubmit={execute}><Command size={15}/><label htmlFor="command-input">COMMAND</label><input id="command-input" value={terminal} onChange={event => setTerminal(event.target.value)} placeholder="Try help, plan, atlas, journal, practice…"/><button>RUN <ArrowRight size={13}/></button></form>
        </>}
        {page === "Daily plan" && <><Heading eyebrow="MISSION CONTROL / 01" title={<>Daily <em>plan.</em></>} description="Create a realistic list of steps and update it as you go." action={<button className="primary" onClick={() => setAdding(value => !value)}><Plus size={14}/> NEW TASK</button>}/>{adding && <form className="add-form" onSubmit={addTask}><input value={newTask} onChange={event => setNewTask(event.target.value)} placeholder="Describe a task or topic…"/><button className="primary">ADD TO PLAN</button><button type="button" className="small-button" onClick={() => setAdding(false)}><X size={15}/></button></form>}<article className="panel plan-summary"><div><div className="eyebrow">COMPLETION</div><b>{completeCount} / {tasks.length} <span>tasks</span></b></div><Bar value={tasks.length ? completeCount / tasks.length * 100 : 0}/><small>{remainingMinutes} MINUTES ESTIMATED</small></article><article className="panel"><div className="panel-heading"><div><div className="eyebrow">PERSONAL QUEUE</div><h2>All tasks</h2></div></div><Tasks items={tasks} toggle={toggleTask} remove={id => setTasks(current => current.filter(task => task.id !== id))}/></article></>}
        {page === "Concept atlas" && <>
          <Heading eyebrow="YOUR KNOWLEDGE MAP / 02" title={<>Concept <em>atlas.</em></>} description="Build your own map of topics. Mark what feels clear, what needs another pass, and what is still unfamiliar." action={<span className="atlas-count">{concepts.length} PERSONAL CONCEPTS</span>}/>
          <form className="add-form atlas-form" onSubmit={event => { event.preventDefault(); if (!conceptTitle.trim()) return; setConcepts(current => [{id: Date.now(), title: conceptTitle.trim(), subject: conceptSubject, level: "Unseen", createdAt: new Date().toISOString()}, ...current]); setConceptTitle(""); setNotice("Concept added to your atlas."); }}>
            <input value={conceptTitle} onChange={event => setConceptTitle(event.target.value)} placeholder="Add a concept, e.g. Newton's laws…" aria-label="Concept name"/>
            <select value={conceptSubject} onChange={event => setConceptSubject(event.target.value)}><option>Physics</option><option>Chemistry</option><option>Mathematics</option><option>Biology</option><option>General</option></select>
            <button className="primary"><Plus size={14}/> MAP CONCEPT</button>
          </form>
          <div className="atlas-legend"><span><i className="dot unseen"/> Unseen</span><span><i className="dot learning"/> Learning</span><span><i className="dot clear"/> Clear for now</span></div>
          {concepts.length ? <div className="concept-grid">{concepts.map(item => <article className={`concept-card level-${item.level.toLowerCase().replaceAll(" ", "-")}`} key={item.id}><div className="concept-orbit"><CircleDot size={17}/></div><small>{item.subject.toUpperCase()}</small><h3>{item.title}</h3><label>STATUS</label><select value={item.level} onChange={event => setConcepts(current => current.map(concept => concept.id === item.id ? {...concept, level: event.target.value} : concept))}><option>Unseen</option><option>Learning</option><option>Clear for now</option></select><button className="small-button concept-delete" onClick={() => setConcepts(current => current.filter(concept => concept.id !== item.id))} aria-label="Delete concept"><Trash2 size={14}/></button></article>)}</div> : <div className="empty atlas-empty"><Map size={24}/><b>Your map starts with one concept.</b><span>Add a topic you are studying today. This atlas is personal, editable, and stored on this device.</span></div>}
          <p className="note-text">“Clear for now” is a self-check, not proof of mastery. Use practice questions to test whether the idea holds up.</p>
        </>}
        {page === "Review journal" && <>
          <Heading eyebrow="END-OF-SESSION NOTES / 03" title={<>Review <em>journal.</em></>} description="Capture what changed in your understanding, not just how long you studied."/>
          <form className="panel review-compose" onSubmit={event => { event.preventDefault(); if (!reviewText.trim()) return; setReviews(current => [{id: Date.now(), text: reviewText.trim(), mood: reviewMood, date: new Date().toISOString()}, ...current]); setReviewText(""); setNotice("Reflection saved privately on this device."); }}>
            <div className="panel-heading"><div><div className="eyebrow">FIELD NOTE / NEW ENTRY</div><h2>What did you learn today?</h2></div><NotebookPen size={20}/></div>
            <label className="field-label">SESSION FEEL</label><div className="mood-options">{["Tough","Steady","Breakthrough"].map(mood => <button type="button" key={mood} className={reviewMood === mood ? "selected" : ""} onClick={() => setReviewMood(mood)}>{mood}</button>)}</div>
            <textarea value={reviewText} onChange={event => setReviewText(event.target.value)} placeholder="A concept that clicked, a mistake I understand now, or the first thing to revisit next time…" rows={4}/>
            <button className="primary"><NotebookPen size={14}/> SAVE FIELD NOTE</button>
          </form>
          <div className="review-list">{reviews.map(note => <article className="review-card" key={note.id}><div className="review-meta"><span>{note.mood.toUpperCase()}</span><time>{new Date(note.date).toLocaleDateString()}</time><button className="small-button" onClick={() => setReviews(current => current.filter(item => item.id !== note.id))} aria-label="Delete note"><Trash2 size={14}/></button></div><p>{note.text}</p></article>)}</div>
          {!reviews.length && <div className="empty">Your journal is intentionally blank until you write the first note.</div>}
        </>}
        {page === "Practice lab" && <><Heading eyebrow="RECALL / 02" title={<>Practice <em>lab.</em></>} description="An interaction prototype for the future question engine."/><article className="practice-card"><div className="eyebrow">DEMO QUESTION / PHYSICS</div><h2>Test one concept at a time.</h2><p>A body starts from rest and accelerates uniformly at 2 m/s². What is its speed after 5 seconds?</p><button className="primary" onClick={() => { setQuestionOpen(true); setAnswer(null); }}>START SAMPLE QUESTION <ArrowRight size={13}/></button></article>{questionOpen && <div className="modal-backdrop" onClick={() => setQuestionOpen(false)}><div className="question-modal" onClick={event => event.stopPropagation()}><button className="modal-x" onClick={() => setQuestionOpen(false)}><X size={17}/></button><div className="eyebrow">SAMPLE / PHYSICS / 001</div><h2>A body starts from rest and accelerates uniformly at 2 m/s². What is its speed after 5 seconds?</h2>{["5 m/s","10 m/s","2.5 m/s","25 m/s"].map((option, index) => <button className={`answer ${answer === index ? "chosen" : ""} ${answer !== null && index === 1 ? "correct" : ""}`} key={option} onClick={() => setAnswer(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}{answer !== null && <p className="feedback">{answer === 1 ? "Correct: v = u + at = 0 + 2 × 5 = 10 m/s." : "Review: use v = u + at, with initial speed 0 m/s."}</p>}<small className="disclaimer">DEMO CONTENT — NOT AN OFFICIAL EXAM QUESTION</small></div></div>}</>}
        {page === "Resource shelf" && <><Heading eyebrow="PERSONAL INDEX / 03" title={<>Resource <em>shelf.</em></>} description="Create a searchable index of the resources you want to revisit." action={<button className="primary" onClick={addResource}><Plus size={14}/> ADD RESOURCE</button>}/><div className="resource-search"><Search size={15}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search your own resource index…"/></div><div className="resources">{filteredResources.map(resource => <article className="resource-card" key={resource.id}><FileText size={19}/><div><small>{resource.subject}</small><b>{resource.title}</b><span>Added {new Date(resource.createdAt).toLocaleDateString()}</span></div><button className="small-button" onClick={() => setResources(current => current.filter(item => item.id !== resource.id))}><Trash2 size={14}/></button></article>)}</div>{!filteredResources.length && <div className="empty">Your resource index is empty. Add your first item; no sample resources are preloaded.</div>}</>}
        {page === "Progress" && <><Heading eyebrow="OBSERVABILITY / 04" title={<>Progress <em>report.</em></>} description="View the data currently available in this browser."/><section className="metrics">{[[Check,"TASKS COMPLETED",completeCount,"Recorded in your plan"],[CalendarDays,"TASKS TOTAL",tasks.length,"Current task list"],[BookOpen,"RESOURCES",resources.length,"Personal resource entries"],[GraduationCap,"EXAM TARGET",exam,"Selected locally"]].map(([Icon, label, value, hint]) => <article className="metric" key={label}><div><Icon size={17}/></div><small>{label}</small><b>{value}</b><span>{hint}</span></article>)}</section><article className="panel"><div className="panel-heading"><div><div className="eyebrow">DATA QUALITY</div><h2>What these numbers mean</h2></div></div><p className="note-text">This report only reflects tasks and resources saved in this browser. It does not estimate chapter mastery, test accuracy or exam rank. Those metrics will require real chapter data and recorded assessments.</p></article></>}
        <footer><b>PREPWIAN / CORE</b><span>INDEPENDENT FRONTEND FOUNDATION</span><span>LOCAL BUILD · 0.1.0</span></footer>
      </div>
    </main>
    {notice && <div className="toast"><Check size={14}/>{notice}</div>}
  </div>;
}
