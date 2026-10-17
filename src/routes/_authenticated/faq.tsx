import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FAQSearch } from "@/components/FAQSearch";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileText,
  GraduationCap,
  LifeBuoy,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
  UserRound,
  Users,
  Video,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/faq")({
  head: () => ({
    meta: [
      { property: "og:title", content: "FAQs — JEE Prep Hub" },
      { property: "og:description", content: "Practical answers about study resources, tests, JEE 360, focus sessions, progress, and account support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "FAQs — JEE Prep Hub" },
      { name: "twitter:description", content: "Practical answers about study resources, tests, JEE 360, focus sessions, progress, and account support." },

      { title: "FAQs — JEE Prep Hub" },
      {
        name: "description",
        content:
          "Practical answers about study resources, tests, JEE 360, focus sessions, progress, and account support.",
      },
    ],
  }),
  component: FAQPage,
});

type FAQItem = {
  category: string;
  q: string;
  a: string;
  icon: LucideIcon;
  tags: string;
};

const faqs: FAQItem[] = [
  {
    category: "Getting started",
    q: "Where should I start if I am new to JEE Prep Hub?",
    a: "After signing in, open your dashboard and choose one next action: find a resource, add or watch a lecture, or try a suitable practice set. A small task you can finish is more useful than opening every tool at once.",
    icon: Sparkles,
    tags: "beginner first login home start today dashboard",
  },
  {
    category: "Getting started",
    q: "What is the difference between the dashboard and JEE 360?",
    a: "The dashboard is a quick check-in for activity and progress available to your account. JEE 360 is a separate planning workspace for schedules, lectures, backlog, plans, reminders, and related study tools.",
    icon: Trophy,
    tags: "home analytics planner command center",
  },
  {
    category: "Getting started",
    q: "Can I use the site on a phone or tablet?",
    a: "The pages are designed to adapt to smaller screens. For a timed test, keep the page open, use a stable connection, and read the test instructions before starting; a larger screen may make long questions easier to review.",
    icon: UserRound,
    tags: "mobile responsive phone tablet device browser",
  },
  {
    category: "Getting started",
    q: "How do I find the right page quickly?",
    a: "Use Help Center to search by task or feature, and use the FAQ search for a question or error phrase. The cards and answers link back to the relevant area when a direct link is available.",
    icon: Search,
    tags: "navigation search help page find",
  },
  {
    category: "Study materials",
    q: "How do I find a Physics, Chemistry, or Mathematics resource?",
    a: "Open Materials, choose a subject and class filter, then search using the chapter name or resource type. Try a shorter keyword if no results appear, and check the resource label before opening it.",
    icon: BookOpen,
    tags: "materials library filter subject physics chemistry maths mathematics class 11 class 12 dropper",
  },
  {
    category: "Study materials",
    q: "Which kinds of study resources can I search for?",
    a: "Search for the resource type you need, such as notes, books or modules, previous-year questions (PYQs), daily practice problems (DPPs), formulas, or revision material. The exact selection depends on what is currently listed in the library.",
    icon: FileText,
    tags: "pdf notes books module pyq dpp practice formula revision resources",
  },
  {
    category: "Study materials",
    q: "Why does a resource say locked or fail to open?",
    a: "Some resources may have access requirements or use an external file link. Check the message shown on the card, confirm you are signed in, and try again in a new tab. If it still fails, report the resource title and error to support.",
    icon: ShieldCheck,
    tags: "locked access permission drive link google file unavailable",
  },
  {
    category: "Study materials",
    q: "What should I do when a materials search returns nothing?",
    a: "Clear one or more filters, check the spelling, and search with a shorter chapter or topic phrase. Try All subjects or All classes first; the library only returns items that match the current filters.",
    icon: Search,
    tags: "empty results no results filter reset query keyword",
  },
  {
    category: "Study materials",
    q: "How can I study from a resource instead of just collecting links?",
    a: "Choose one chapter, work through a small section, and note the exact concept or example you could not explain. Follow it with a few questions and record the next revision step in your plan.",
    icon: CheckCircle2,
    tags: "study routine active recall revision focus learn",
  },
  {
    category: "Lectures & notes",
    q: "How do I add a lecture to Lecture Tracker?",
    a: "Open Lecture Tracker and choose Add Lecture. Enter the subject and a recognizable title; duration and planned date help with organization. Source, lecture URL, and notes are optional fields on the form.",
    icon: FileText,
    tags: "lecture tracker add class title subject duration planned date source url notes",
  },
  {
    category: "Lectures & notes",
    q: "How do I track how much of a lecture I watched?",
    a: "Open Lecture Tracker, find the lecture, and update its status or watched progress using the controls on that item. You can filter the list by subject and status and search for a lecture title.",
    icon: Video,
    tags: "watched minutes progress pending in progress completed skipped status search",
  },
  {
    category: "Lectures & notes",
    q: "Where can I browse notes for a class or chapter?",
    a: "Open Notes and select the class, subject, and chapter pages that are available. If a chapter is not listed, use Materials to search for a related resource or ask support whether the item is currently available.",
    icon: BookOpen,
    tags: "notes chapter class subject notebook syllabus",
  },
  {
    category: "Lectures & notes",
    q: "How should I use a video lesson effectively?",
    a: "Pick a lesson that matches the chapter you are studying, keep a short list of questions while watching, and pause to work through examples yourself. Finish by writing down one takeaway and one question to practise next.",
    icon: Video,
    tags: "pulse videos lecture learning watch lesson",
  },
  {
    category: "Tests & results",
    q: "Where do I find practice tests and mock tests?",
    a: "Open Test Series. Browse the Series tab, or use Live, Saved, and History to switch between timed tests, bookmarked tests, and your earlier attempts. Use the subject and search filters to narrow the list.",
    icon: FileText,
    tags: "test series mock test cbt exam live saved history",
  },
  {
    category: "Tests & results",
    q: "What do Series, Live, Saved, and History mean?",
    a: "Series is the test catalogue. Live lists tests with an active timed window, Saved contains tests you bookmarked, and History shows your attempts. Tests labelled as practice are not treated as live timed events.",
    icon: CalendarDays,
    tags: "tabs catalogue bookmarked attempts timed window practice status",
  },
  {
    category: "Tests & results",
    q: "Why can’t I find a particular test?",
    a: "Check the selected subject, search phrase, and availability/status filters. Clear filters to browse the full catalogue. Some tests may have a scheduled window or an access requirement shown on the test card.",
    icon: Search,
    tags: "missing test no results subject filter access availability schedule",
  },
  {
    category: "Tests & results",
    q: "What should I check before starting a timed test?",
    a: "Read the instructions, duration, question count, and scoring details shown for that test. Make sure you have enough uninterrupted time and a stable connection before beginning a timed attempt.",
    icon: Timer,
    tags: "start test timed attempt duration marks instructions connection",
  },
  {
    category: "Tests & results",
    q: "How do I move between questions in an attempt?",
    a: "Use Save & Next to move forward after working on a question. Open the question palette to jump to another item, and use the on-screen navigation controls if you are on a small screen.",
    icon: ArrowRight,
    tags: "question palette next navigation save move keyboard",
  },
  {
    category: "Tests & results",
    q: "What does Mark for review do?",
    a: "It flags a question so you can find it again in the question palette before submitting. It does not mean the answer is correct; review the flagged question and your response yourself.",
    icon: CheckCircle2,
    tags: "mark flag review revisit palette",
  },
  {
    category: "Tests & results",
    q: "Can I change or clear an answer before submitting?",
    a: "The attempt screen includes Clear for the current answer and controls to move between questions. Check the question type and instructions before changing a response, especially when more than one option may be correct.",
    icon: Wrench,
    tags: "clear answer change multiple select numerical response",
  },
  {
    category: "Tests & results",
    q: "Where can I see the marks or negative marking for a question?",
    a: "The attempt screen displays the question’s marks and negative marks when those values are provided for that test. Follow the displayed scoring rules rather than assuming every test uses the same scheme.",
    icon: FileText,
    tags: "score negative marks marking scheme points",
  },
  {
    category: "Tests & results",
    q: "What if I leave a test and want to continue later?",
    a: "Open the History tab and look for an in-progress attempt with a Resume option. Whether an attempt can be resumed depends on its state and the test’s timing rules.",
    icon: Timer,
    tags: "resume continue unfinished attempt leave exit history",
  },
  {
    category: "Tests & results",
    q: "What should I do if an answer does not appear to save?",
    a: "Check your connection and wait for any saving indicator before moving away. Use the attempt’s Save & Next control, and if the issue repeats, note the test name, question, time, browser, and visible error before contacting support.",
    icon: Wrench,
    tags: "answer not saved save next autosave lost response connection error",
  },
  {
    category: "Tests & results",
    q: "How do I review a submitted test?",
    a: "Open Test Series → History and choose the submitted attempt. Review the score and the question-level analysis available for that test, then pick one topic to revisit rather than only focusing on the total score.",
    icon: Trophy,
    tags: "review result attempt analytics submitted score history",
  },
  {
    category: "JEE 360 planner",
    q: "What is JEE 360 for?",
    a: "JEE 360 is a preparation workspace with areas for Today, Schedule, Backlog, Tests, Plans, Reminders, Import, and additional study tools. Use the navigation in JEE 360 to see what is available in your current setup.",
    icon: Sparkles,
    tags: "planner command center organize study today schedule backlog",
  },
  {
    category: "JEE 360 planner",
    q: "How do I view lectures and tests planned for a day?",
    a: "Open JEE 360 → Schedule. Select a day in the week strip, use Previous week or Next week to move around, and filter the lecture list by subject if that makes the day easier to scan.",
    icon: CalendarDays,
    tags: "schedule calendar week day class tests lecture today previous next",
  },
  {
    category: "JEE 360 planner",
    q: "How do missed lectures get into my backlog?",
    a: "A lecture marked as missed on the schedule can appear in Backlog. You can also add a manual backlog item for an older chapter that is not in the uploaded planner.",
    icon: GraduationCap,
    tags: "missed lecture recovery backlog add chapter older",
  },
  {
    category: "JEE 360 planner",
    q: "How do I organize a backlog chapter?",
    a: "In Backlog, give the item a clear title and chapter, select its subject and priority, and set a catch-up date. Move it between Open, Catching up, and Cleared as appropriate.",
    icon: CheckCircle2,
    tags: "priority catch up date status open catching up cleared recovery",
  },
  {
    category: "JEE 360 planner",
    q: "How do I import a coaching timetable?",
    a: "Open JEE 360 → Import. Follow the on-page prompt and JSON example to convert the timetable, then upload a .json or .txt file or paste the JSON. Review the imported lectures afterward.",
    icon: FileText,
    tags: "upload pdf excel json coaching timetable convert import",
  },
  {
    category: "JEE 360 planner",
    q: "Should I choose Merge or Replace when importing?",
    a: "Merge adds imported planner items alongside the current planner. Replace replaces the current planner with the imported data. If you are unsure, export a JSON copy first and choose Merge only when you intend to keep existing items.",
    icon: ShieldCheck,
    tags: "merge replace overwrite existing planner import caution",
  },
  {
    category: "JEE 360 planner",
    q: "How do I make a backup of my JEE 360 planner?",
    a: "Open JEE 360 → Import and choose Export JSON. Save that file somewhere you control. To restore it later, import the file and carefully choose whether to merge it with or replace the current planner.",
    icon: ShieldCheck,
    tags: "backup export download json restore transfer copy",
  },
  {
    category: "JEE 360 planner",
    q: "Does JEE 360 planner data sync to another browser or device?",
    a: "JEE 360 planner data is stored in this browser’s local storage, so do not assume it automatically syncs across devices. Export a JSON backup before clearing browser/site data or moving to another browser.",
    icon: UserRound,
    tags: "sync cloud local storage browser device computer phone data move",
  },
  {
    category: "JEE 360 planner",
    q: "Can I replace a timetable without losing my current planner?",
    a: "Export your current planner first. Then choose Merge if you want to retain existing planner entries; Replace is intended to substitute the current planner with the imported data.",
    icon: ShieldCheck,
    tags: "replace current planner prevent data loss merge backup",
  },
  {
    category: "JEE 360 planner",
    q: "Should I use Load demo planner or Clear lectures on my real planner?",
    a: "These actions change planner data. Load demo planner replaces the active planner with sample data; Clear lectures removes imported planner items such as lectures and backlog. Export JSON first if you want to keep a copy, and only use either action when you intend to change the current planner.",
    icon: ShieldCheck,
    tags: "demo sample clear delete remove overwrite planner destructive backup export json",
  },
  {
    category: "Focus & study habits",
    q: "What timer modes are available in Focus Workspace?",
    a: "The Focus Workspace includes Pomodoro and Stopwatch modes. Pomodoro offers 15-, 25-, 50-, and 90-minute presets plus a custom countdown from 1 to 180 minutes.",
    icon: Timer,
    tags: "timer focus stopwatch pomodoro custom countdown minutes",
  },
  {
    category: "Focus & study habits",
    q: "Can I record what I worked on during a focus session?",
    a: "Yes. Choose a subject and add an optional chapter/topic note before starting. When you finish, check Session history to review saved sessions.",
    icon: FileText,
    tags: "session history record subject chapter note study block",
  },
  {
    category: "Focus & study habits",
    q: "What are Deep focus and Fullscreen for?",
    a: "Deep focus hides some surrounding controls, while Fullscreen expands the timer area. Use them when they help you concentrate, and exit either mode to return to the normal controls.",
    icon: Timer,
    tags: "deep focus fullscreen distraction mode exit",
  },
  {
    category: "Progress & certificates",
    q: "What should I look at on my dashboard?",
    a: "Use the dashboard to review the activity, test attempts, progress indicators, and recent unlocks currently shown for your account. Look for patterns over several study sessions rather than judging yourself from one result.",
    icon: Trophy,
    tags: "dashboard activity score progress xp unlocks streak analytics",
  },
  {
    category: "Progress & certificates",
    q: "Why can’t I see a certificate I expected?",
    a: "Confirm you are signed into the account that earned the achievement, then check Certificates for the award name and any eligibility information. If it is still missing, contact support with the achievement and date.",
    icon: Trophy,
    tags: "certificate missing achievement award eligibility earned account",
  },
  {
    category: "Progress & certificates",
    q: "Does a low test score mean I am not improving?",
    a: "One attempt is only a snapshot. Review the questions you missed, note whether the cause was concept knowledge, calculation, or time, and compare later attempts using similar conditions where possible.",
    icon: CheckCircle2,
    tags: "score low result improve performance mistakes revision",
  },
  {
    category: "Account & privacy",
    q: "How do I check which account I am using?",
    a: "Check the signed-in account shown in the app and review Profile or Settings if you need to confirm your details. If something looks wrong, describe the page and issue to support without sending your password or verification code.",
    icon: UserRound,
    tags: "profile settings login account email identity signed in",
  },
  {
    category: "Account & privacy",
    q: "Is my JEE 360 planner stored the same way as my account data?",
    a: "No. JEE 360 planner state uses browser local storage, while account-based app features may use your signed-in account. Keep a planner JSON backup and avoid treating local planner data as automatically synced account data.",
    icon: ShieldCheck,
    tags: "privacy storage local account sync browser",
  },
  {
    category: "Account & privacy",
    q: "What information should I never share in a post or support request?",
    a: "Do not share passwords, one-time codes, payment-card details, recovery codes, or private keys. Include only the personal information needed to explain the issue, and keep sensitive evidence out of public posts.",
    icon: ShieldCheck,
    tags: "security credentials otp password payment privacy personal data",
  },
  {
    category: "Account & privacy",
    q: "Can I safely clear browser data if the app is acting strangely?",
    a: "Before clearing site data, export your JEE 360 planner from its Import page because its data is stored in this browser. Clearing browser data may also sign you out; make sure you can access your account before doing it.",
    icon: ShieldCheck,
    tags: "clear cache cookies storage local data lost sign out reset",
  },
  {
    category: "Community & messages",
    q: "How do I ask a question that is easy to answer?",
    a: "Include the subject and chapter, show the step you tried, and ask one clear question. Remove your name, phone number, email, or other private details from any content you share.",
    icon: Users,
    tags: "community doubt discussion post ask solution",
  },
  {
    category: "Community & messages",
    q: "What should I do about abusive or suspicious activity?",
    a: "Do not share private details or continue an unsafe conversation. Use any reporting or moderation controls shown in the app; if you cannot find one, contact the team with the username and a concise description.",
    icon: ShieldCheck,
    tags: "report block abuse harassment suspicious user safety moderation",
  },
  {
    category: "Community & messages",
    q: "Is it okay to send my login details to someone helping me?",
    a: "No. Never share your password or one-time code, even with someone who says they are helping. Describe the problem instead and contact the official support route if you need account assistance.",
    icon: ShieldCheck,
    tags: "direct message dm credentials password otp fraud account takeover",
  },
  {
    category: "Troubleshooting",
    q: "A page is blank or keeps loading. What should I try?",
    a: "Check your connection, refresh once, and reopen the page from the app navigation. If the problem remains, note the page URL, time, browser/device, and any visible error, then contact support.",
    icon: Wrench,
    tags: "blank screen loading broken page refresh network connection browser",
  },
  {
    category: "Troubleshooting",
    q: "The list looks empty. Is the content gone?",
    a: "First clear the search term and reset subject, class, category, or status filters. Some lists only show items that match the selected filters or items available to your current account.",
    icon: Search,
    tags: "empty list search filter reset no content missing",
  },
  {
    category: "Troubleshooting",
    q: "I imported a timetable but it failed. What now?",
    a: "Read the import error shown on the page and compare the file with the JSON example/schema. Check that the file is readable JSON and includes the required timetable fields; try a small sample first if you are unsure.",
    icon: FileText,
    tags: "import error invalid json schema timetable upload parser",
  },
  {
    category: "Troubleshooting",
    q: "My planner looks different on another device. Why?",
    a: "JEE 360 planner data is stored in the local browser, so each browser/device can have different planner data. Export JSON from the original browser and import it into the other one if you want to move a copy.",
    icon: Wrench,
    tags: "device mismatch local data sync browser move import export",
  },
  {
    category: "Troubleshooting",
    q: "The test page or an answer is behaving unexpectedly. What details should I save?",
    a: "Note the test name, question number, what action you took, approximate time, browser/device, and exact message. Avoid repeatedly submitting; contact support with the details so the team can investigate.",
    icon: Wrench,
    tags: "test bug error answer issue screenshot question number",
  },
  {
    category: "Support",
    q: "How do I contact the JEE Prep Hub team?",
    a: "Open Contact Admin, choose the closest subject/category, and explain what happened and what you expected. Include visible error text, steps to reproduce, and the relevant page or test name.",
    icon: LifeBuoy,
    tags: "contact admin support send message help feedback",
  },
  {
    category: "Support",
    q: "Can I attach a screenshot to a support request?",
    a: "The current Contact Admin page does not accept screenshot uploads. Describe the error and include any visible error code or text instead; do not paste passwords, private credentials, or sensitive information.",
    icon: FileText,
    tags: "attach upload image screenshot file contact form error",
  },
  {
    category: "Support",
    q: "How long does a support reply usually take?",
    a: "Contact Admin lists a typical response time of within 24 hours, but actual timing can vary. You can return to Contact Admin and check My previous requests for status updates and replies.",
    icon: LifeBuoy,
    tags: "reply response time 24 hours request status history admin",
  },
  {
    category: "Support",
    q: "How do I check the status of a request I already sent?",
    a: "Open Contact Admin and scroll to My previous requests. The page lists recent requests and any available status or admin reply for your signed-in account.",
    icon: CheckCircle2,
    tags: "previous request history in progress resolved admin reply track",
  },
];

const categories = ["All", ...Array.from(new Set(faqs.map((faq) => faq.category)))];
const popularSearches = [
  "planner backup",
  "test answer",
  "find materials",
  "backlog",
  "certificate missing",
];

function FAQPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openItems, setOpenItems] = useState<string[]>([]);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return faqs.filter((faq) => {
      const text = [faq.q, faq.a, faq.category, faq.tags].join(" ").toLowerCase();
      return (
        (category === "All" || faq.category === category) &&
        terms.every((term) => text.includes(term))
      );
    });
  }, [category, normalizedQuery]);
  const allVisibleOpen = filtered.length > 0 && filtered.every((faq) => openItems.includes(faq.q));

  const toggle = (question: string) =>
    setOpenItems((previous) =>
      previous.includes(question)
        ? previous.filter((item) => item !== question)
        : [...previous, question],
    );

  const expandVisible = () =>
    setOpenItems((previous) => Array.from(new Set([...previous, ...filtered.map((faq) => faq.q)])));

  return (
    <AppShell>
      <main className="mx-auto w-full min-w-0 max-w-5xl space-y-5 overflow-x-clip px-3 py-3 [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)] sm:space-y-6 sm:px-5 sm:py-7 lg:px-8">
        <header className="relative isolate overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft sm:rounded-3xl sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 -z-10 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <CircleHelp className="h-3.5 w-3.5" /> ANSWERS & GUIDANCE
          </div>
          <h1 className="mt-4 break-words font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Clear, practical answers about studying, tests, JEE 360, focus sessions, accounts, and
            support.
          </p>
          <FAQSearch value={query} onChange={setQuery} />
          <div
            role="group"
            aria-label="Popular FAQ searches"
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <span className="mr-1 text-xs font-medium text-muted-foreground">Popular:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setQuery(term);
                  setCategory("All");
                }}
                className="min-h-9 rounded-full border border-border bg-background/70 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {term}
              </button>
            ))}
          </div>
        </header>

        <nav
          aria-label="FAQ categories"
          className="flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
        >
          {categories.map((item) => {
            const count =
              item === "All" ? faqs.length : faqs.filter((faq) => faq.category === item).length;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${category === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"}`}
              >
                {item}{" "}
                <span
                  className={category === item ? "ml-1 opacity-80" : "ml-1 text-muted-foreground"}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <section id="faq-results" aria-labelledby="faq-results-heading" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="faq-results-heading" className="text-lg font-bold sm:text-xl">
                Answers for your next step
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Search accepts several words and checks questions, answers, categories, and related
                terms.
              </p>
            </div>
            <span
              aria-live="polite"
              aria-atomic="true"
              className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium"
            >
              {filtered.length} of {faqs.length} answers
            </span>
          </div>

          {filtered.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={allVisibleOpen ? () => setOpenItems([]) : expandVisible}
                className="min-h-9 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {allVisibleOpen ? "Collapse all" : "Expand visible answers"}
              </button>
            </div>
          )}

          {filtered.length ? (
            filtered.map((item) => {
              const Icon = item.icon;
              const isOpen = openItems.includes(item.q);
              const panelId = `faq-${faqs.indexOf(item)}`;
              return (
                <article
                  key={item.q}
                  className={`overflow-hidden rounded-2xl border bg-card transition-colors ${isOpen ? "border-primary/40" : "border-border"}`}
                >
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(item.q)}
                      className="flex min-h-16 w-full min-w-0 items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words font-semibold leading-5">{item.q}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {item.category}
                        </span>
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  </h3>
                  {isOpen && (
                    <div
                      id={panelId}
                      className="border-t border-border/70 px-4 pb-5 pt-4 sm:pl-[4.75rem] sm:pr-6"
                    >
                      <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {item.a}
                      </p>
                    </div>
                  )}
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <Search aria-hidden="true" className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 font-semibold">No matching questions</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try fewer words, clear the category, or choose a popular search above.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Reset search and filters
              </button>
            </div>
          )}
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Need a step-by-step walkthrough?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Browse the searchable Help Center guides.
                </p>
              </div>
            </div>
            <a
              href="/help"
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              Open Help Center <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <LifeBuoy className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Still need a person?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Send a specific support request and track the reply.
                </p>
              </div>
            </div>
            <a
              href="/contact"
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Contact Admin <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
