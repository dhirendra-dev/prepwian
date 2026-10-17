/* Generated from src/routes at dev/build time. Do not edit by hand. */
export type SearchRouteEntry = {
  id: string; path: string; href: string; title: string; description: string; keywords: string;
  requiresAuth: boolean; requiresAdmin: boolean;
};
export const ROUTE_REGISTRY: SearchRouteEntry[] = [
  {
    "id": "index",
    "path": "/",
    "href": "/",
    "title": "JEE Prep Hub — Crack JEE Together",
    "description": "Curated materials, Pomodoro timer, leaderboard, live chat, and a focused community of JEE Class 11 & 12 aspirants.",
    "keywords": "index",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "about",
    "path": "/about",
    "href": "/about",
    "title": "About",
    "description": "About on JEE Prep Hub.",
    "keywords": "about about",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/admin.index",
    "path": "/admin",
    "href": "/admin",
    "title": "Admin Center",
    "description": "Admin Center on JEE Prep Hub.",
    "keywords": "admin admin index",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.appeals",
    "path": "/admin/appeals",
    "href": "/admin/appeals",
    "title": "Appeals — Admin",
    "description": "Appeals — Admin on JEE Prep Hub.",
    "keywords": "admin appeals admin appeals",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.audit",
    "path": "/admin/audit",
    "href": "/admin/audit",
    "title": "Admin · Audit Log",
    "description": "Admin · Audit Log on JEE Prep Hub.",
    "keywords": "admin audit admin audit",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.certificates",
    "path": "/admin/certificates",
    "href": "/admin/certificates",
    "title": "Admin · Certificates",
    "description": "Admin · Certificates on JEE Prep Hub.",
    "keywords": "admin certificates admin certificates",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.community",
    "path": "/admin/community",
    "href": "/admin/community",
    "title": "Admin · Community",
    "description": "Admin · Community on JEE Prep Hub.",
    "keywords": "admin community admin community",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.consent-settings",
    "path": "/admin/consent-settings",
    "href": "/admin/consent-settings",
    "title": "Consent Settings — Admin",
    "description": "Consent Settings — Admin on JEE Prep Hub.",
    "keywords": "admin consent-settings admin consent settings",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.consents",
    "path": "/admin/consents",
    "href": "/admin/consents",
    "title": "Verification Center — Admin",
    "description": "Verification Center — Admin on JEE Prep Hub.",
    "keywords": "admin consents admin consents",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.contact",
    "path": "/admin/contact",
    "href": "/admin/contact",
    "title": "Contact Inbox — Admin",
    "description": "Contact Inbox — Admin on JEE Prep Hub.",
    "keywords": "admin contact admin contact",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.developer-access",
    "path": "/admin/developer-access",
    "href": "/admin/developer-access",
    "title": "Developer Access Requests — Admin",
    "description": "Developer Access Requests — Admin on JEE Prep Hub.",
    "keywords": "admin developer-access admin developer access",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.email",
    "path": "/admin/email",
    "href": "/admin/email",
    "title": "Admin · Email Center",
    "description": "Admin · Email Center on JEE Prep Hub.",
    "keywords": "admin email admin email",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.feedback",
    "path": "/admin/feedback",
    "href": "/admin/feedback",
    "title": "Feedback Console",
    "description": "Feedback Console on JEE Prep Hub.",
    "keywords": "admin feedback admin feedback",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.materials",
    "path": "/admin/materials",
    "href": "/admin/materials",
    "title": "Admin · Materials",
    "description": "Admin · Materials on JEE Prep Hub.",
    "keywords": "admin materials admin materials",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.moderators",
    "path": "/admin/moderators",
    "href": "/admin/moderators",
    "title": "Admin · Moderators",
    "description": "Admin · Moderators on JEE Prep Hub.",
    "keywords": "admin moderators admin moderators",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.notes",
    "path": "/admin/notes",
    "href": "/admin/notes",
    "title": "Admin · Notes",
    "description": "Admin · Notes on JEE Prep Hub.",
    "keywords": "admin notes admin notes",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.notices",
    "path": "/admin/notices",
    "href": "/admin/notices",
    "title": "Admin · Notice Board",
    "description": "Admin · Notice Board on JEE Prep Hub.",
    "keywords": "admin notices admin notices",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.notifications",
    "path": "/admin/notifications",
    "href": "/admin/notifications",
    "title": "Admin · Notifications",
    "description": "Admin · Notifications on JEE Prep Hub.",
    "keywords": "admin notifications admin notifications",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.nta",
    "path": "/admin/nta",
    "href": "/admin/nta",
    "title": "Admin · NTA Sync",
    "description": "Admin · NTA Sync on JEE Prep Hub.",
    "keywords": "admin nta admin nta",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.pro",
    "path": "/admin/pro",
    "href": "/admin/pro",
    "title": "Admin · Pro Members",
    "description": "Admin · Pro Members on JEE Prep Hub.",
    "keywords": "admin pro admin pro",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.scheduled-tests",
    "path": "/admin/scheduled-tests",
    "href": "/admin/scheduled-tests",
    "title": "Scheduled Test Runs — Admin",
    "description": "Monitor automated AI test generation runs, inspect failures, retry, reschedule or pause upcoming CBT releases.",
    "keywords": "admin scheduled-tests admin scheduled tests",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.search-analytics",
    "path": "/admin/search-analytics",
    "href": "/admin/search-analytics",
    "title": "Search Analytics — Admin",
    "description": "Search Analytics — Admin on JEE Prep Hub.",
    "keywords": "admin search-analytics admin search analytics",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.security",
    "path": "/admin/security",
    "href": "/admin/security",
    "title": "Admin · Security",
    "description": "Admin · Security on JEE Prep Hub.",
    "keywords": "admin security admin security",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.system",
    "path": "/admin/system",
    "href": "/admin/system",
    "title": "System Control Center",
    "description": "System Control Center on JEE Prep Hub.",
    "keywords": "admin system admin system",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.tests.$testId.import",
    "path": "/admin/tests/$testId/import",
    "href": "/admin/tests",
    "title": "Import PDF — Admin",
    "description": "Import PDF — Admin on JEE Prep Hub.",
    "keywords": "admin tests import admin tests $testId import",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.tests.$testId.index",
    "path": "/admin/tests/$testId",
    "href": "/admin/tests",
    "title": "Edit Test",
    "description": "Edit Test on JEE Prep Hub.",
    "keywords": "admin tests admin tests $testId index",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.tests.index",
    "path": "/admin/tests",
    "href": "/admin/tests",
    "title": "Admin — Tests",
    "description": "Admin — Tests on JEE Prep Hub.",
    "keywords": "admin tests admin tests index",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.tests.approvals",
    "path": "/admin/tests/approvals",
    "href": "/admin/tests/approvals",
    "title": "Admin — CBT Approvals",
    "description": "Admin — CBT Approvals on JEE Prep Hub.",
    "keywords": "admin tests approvals admin tests approvals",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.toppers",
    "path": "/admin/toppers",
    "href": "/admin/toppers",
    "title": "Admin · Toppers",
    "description": "Admin · Toppers on JEE Prep Hub.",
    "keywords": "admin toppers admin toppers",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.users",
    "path": "/admin/users",
    "href": "/admin/users",
    "title": "Admin · Users",
    "description": "Admin · Users on JEE Prep Hub.",
    "keywords": "admin users admin users",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.verification",
    "path": "/admin/verification",
    "href": "/admin/verification",
    "title": "Admin · Account Verification",
    "description": "Admin · Account Verification on JEE Prep Hub.",
    "keywords": "admin verification admin verification",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "_authenticated/admin.videos",
    "path": "/admin/videos",
    "href": "/admin/videos",
    "title": "Video Lectures — Admin",
    "description": "Add, publish and manage the YouTube video lectures that appear in the Pulse feed.",
    "keywords": "admin videos admin videos",
    "requiresAuth": true,
    "requiresAdmin": true
  },
  {
    "id": "ai-chat",
    "path": "/ai-chat",
    "href": "/ai-chat",
    "title": "AI Study Chat",
    "description": "Ask an AI study tutor anything about JEE Main, JEE Advanced and NEET — concepts, derivations, doubts and practice questions, with step-by-step answers.",
    "keywords": "ai-chat ai chat",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "app",
    "path": "/app",
    "href": "/app",
    "title": "JEE Prep Hub — The JEE Preparation Ecosystem",
    "description": "Explore JEE Prep Hub: a connected ecosystem for planning, learning, practice, analysis, focus, AI, resources and community.",
    "keywords": "app app",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/appeal",
    "path": "/appeal",
    "href": "/appeal",
    "title": "Appeal My Account",
    "description": "Submit an appeal about your JEE Prep Hub account.",
    "keywords": "appeal appeal",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "articles",
    "path": "/articles",
    "href": "/articles",
    "title": "Articles",
    "description": "Articles on JEE Prep Hub.",
    "keywords": "articles articles",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "articles.$slug",
    "path": "/articles/$slug",
    "href": "/articles",
    "title": "Articles",
    "description": "Read ${titleFromSlug(params.slug)}: a JEE preparation article from the JEE Prep Hub community.",
    "keywords": "articles articles $slug",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "articles.index",
    "path": "/articles",
    "href": "/articles",
    "title": "Articles",
    "description": "Explore JEE concept explainers, exam strategies and student-written insights.",
    "keywords": "articles articles index",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "auth",
    "path": "/auth",
    "href": "/auth",
    "title": "Sign in to JEE Prep Hub — Join the JEE 2028 Community",
    "description": "Sign in or create your free JEE Prep Hub account to access curated study materials, focus timer, study squads, leaderboard and a community of Class 11 & 12 aspirants.",
    "keywords": "auth auth",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "birthday",
    "path": "/birthday",
    "href": "/birthday",
    "title": "Birthday Hub",
    "description": "Celebrate the JEE Prep Hub community with birthday wishes and a year of new possibilities.",
    "keywords": "birthday birthday",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/certificates",
    "path": "/certificates",
    "href": "/certificates",
    "title": "Certificates",
    "description": "Explore your JEE Prep Hub certificates and achievements.",
    "keywords": "certificates certificates",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "certificates.verify.$code",
    "path": "/certificates/verify/$code",
    "href": "/certificates/verify",
    "title": "Certificate · ${loaderData?.type?.name ?? loaderData?.certificate?.custom_title ??",
    "description": "Verified certificate awarded to ${loaderData?.recipientName ?? ",
    "keywords": "certificates verify certificates verify $code",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "community",
    "path": "/community",
    "href": "/community",
    "title": "Community Chat",
    "description": "Live JEE community chat: talk to fellow aspirants, ask subject doubts with AI help, and read official notices — all in one room.",
    "keywords": "community community",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/consent",
    "path": "/consent",
    "href": "/consent",
    "title": "Restricted Account Verification",
    "description": "Review verification requirements for your restricted account.",
    "keywords": "consent consent",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/contact",
    "path": "/contact",
    "href": "/contact",
    "title": "Contact Admin",
    "description": "Get help from the JEE Prep Hub support team.",
    "keywords": "contact contact",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/dashboard",
    "path": "/dashboard",
    "href": "/dashboard",
    "title": "Dashboard",
    "description": "Your personal JEE prep dashboard: study hours, rank, daily checklist, focus timer, tests, lectures and community activity.",
    "keywords": "dashboard dashboard",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/developer",
    "path": "/developer",
    "href": "/developer",
    "title": "Developer Portal",
    "description": "Manage approved development access for JEE Prep Hub.",
    "keywords": "developer developer",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "donate",
    "path": "/donate",
    "href": "/donate",
    "title": "Support JEE Prep Hub",
    "description": "Support JEE Prep Hub and help keep its study tools and community available to aspirants.",
    "keywords": "donate donate",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "engineering",
    "path": "/engineering",
    "href": "/engineering",
    "title": "The Future of Engineering",
    "description": "Explore every engineering branch, coding, AI, emerging technologies, careers and the future through the JEE Prep Hub Engineering Journal.",
    "keywords": "engineering engineering",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/faq",
    "path": "/faq",
    "href": "/faq",
    "title": "FAQs",
    "description": "Practical answers about study resources, tests, JEE 360, focus sessions, progress, and account support.",
    "keywords": "faq faq",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "feed",
    "path": "/feed",
    "href": "/feed",
    "title": "Community Feed",
    "description": "Share doubts, notes and study updates with JEE aspirants, and get useful answers from the community.",
    "keywords": "feed feed",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "feedback",
    "path": "/feedback",
    "href": "/feedback",
    "title": "Feedback Hub",
    "description": "Share suggestions, report bugs and send feedback about JEE Prep Hub.",
    "keywords": "feedback feedback",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "focus",
    "path": "/focus",
    "href": "/focus",
    "title": "Focus Zone — Deep work suite for JEE aspirants",
    "description": "A private, offline-first study workspace for focused JEE preparation.",
    "keywords": "focus focus",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "focus.index",
    "path": "/focus",
    "href": "/focus",
    "title": "Focus Zone Dashboard — timer & today",
    "description": "Run a deep-work timer, see today",
    "keywords": "focus focus index",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "focus.block",
    "path": "/focus/block",
    "href": "/focus/block",
    "title": "Distraction Block — Focus Zone",
    "description": "Pick the sites that derail your study sessions and switch focus lock on so Focus Zone reminds you the moment you drift.",
    "keywords": "focus block focus block",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "focus.create",
    "path": "/focus/create",
    "href": "/focus/create",
    "title": "Create a todo — Focus Zone",
    "description": "Add a study todo with a deadline, time estimate, group and tags so Focus Zone can time your deep work.",
    "keywords": "focus create focus create",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "focus.friends",
    "path": "/focus/friends",
    "href": "/focus/friends",
    "title": "Friends — Focus Zone",
    "description": "Keep a private accountability list: friends",
    "keywords": "focus friends focus friends",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "focus.groups",
    "path": "/focus/groups",
    "href": "/focus/groups",
    "title": "Groups — Focus Zone",
    "description": "Set a shared study goal, track logged hours against it and keep a member list — all offline in Focus Zone groups.",
    "keywords": "focus groups focus groups",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "focus.habits",
    "path": "/focus/habits",
    "href": "/focus/habits",
    "title": "Habits — Focus Zone",
    "description": "Build daily and weekly study habits in Focus Zone with a 7-day streak strip and weekly completion rate.",
    "keywords": "focus habits focus habits",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "focus.stats",
    "path": "/focus/stats",
    "href": "/focus/stats",
    "title": "Stats — Focus Zone",
    "description": "See how much you actually focused: daily minutes, weekly totals, best day and completed todos across 7, 14 or 28 days.",
    "keywords": "focus stats focus stats",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "focus.todos",
    "path": "/focus/todos",
    "href": "/focus/todos",
    "title": "Todos — Focus Zone",
    "description": "Every Focus Zone todo in one place: filter by status, start the timer, mark done or drop what no longer matters.",
    "keywords": "focus todos focus todos",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/follow-channel",
    "path": "/follow-channel",
    "href": "/follow-channel",
    "title": "Follow WhatsApp Channel",
    "description": "Follow the JEE Prep Hub WhatsApp channel for community updates.",
    "keywords": "follow-channel follow channel",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/forum",
    "path": "/forum",
    "href": "/forum",
    "title": "Threads",
    "description": "Discuss JEE preparation, share questions and explore community threads.",
    "keywords": "forum forum",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/friends",
    "path": "/friends",
    "href": "/friends",
    "title": "Friends",
    "description": "Connect with fellow JEE aspirants and manage your study circle.",
    "keywords": "friends friends",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/groups",
    "path": "/groups",
    "href": "/groups",
    "title": "Communities & Groups",
    "description": "Every JEE Prep Hub community group in one place — subject rooms, goal squads, batch chats and social groups.",
    "keywords": "groups groups",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/help",
    "path": "/help",
    "href": "/help",
    "title": "Help Center",
    "description": "Step-by-step guides for study materials, tests, JEE 360 planning, focus, and account support.",
    "keywords": "help help",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "home",
    "path": "/home",
    "href": "/home",
    "title": "JEE Prep Hub — Crack JEE Together",
    "description": "Explore JEE Prep Hub study resources, focus sessions, community updates and preparation tools.",
    "keywords": "home home",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee-advanced-chemistry-problems",
    "path": "/jee-advanced-chemistry-problems",
    "href": "/jee-advanced-chemistry-problems",
    "title": "${TITLE}",
    "description": "Practice JEE Advanced chemistry problems with curated previous year questions, physical, organic and inorganic chemistry books and notes for Class 11 & 12 aspirants.",
    "keywords": "jee-advanced-chemistry-problems jee advanced chemistry problems",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee-advanced-math-problems",
    "path": "/jee-advanced-math-problems",
    "href": "/jee-advanced-math-problems",
    "title": "JEE Advanced Math Problems — Free PYQs, Books & Notes",
    "description": "Master JEE Advanced math problems with curated previous year questions, topic-wise books, calculus notes, coordinate geometry and functions resources for Class 11 & 12 aspirants.",
    "keywords": "jee-advanced-math-problems jee advanced math problems",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee-advanced-physics-problems",
    "path": "/jee-advanced-physics-problems",
    "href": "/jee-advanced-physics-problems",
    "title": "JEE Advanced Physics Problems — Free PYQs, Books & Notes",
    "description": "Master JEE Advanced physics problems with curated previous year questions, topic-wise books, mechanics, electromagnetism, optics and modern physics notes for Class 11 & 12 aspirants.",
    "keywords": "jee-advanced-physics-problems jee advanced physics problems",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor",
    "path": "/jee-predictor",
    "href": "/jee-predictor",
    "title": "JEE Predictor",
    "description": "Estimate your JEE Main rank from your NTA percentile and explore your preparation targets.",
    "keywords": "jee-predictor jee predictor",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/admission-fit",
    "path": "/jee-predictor/admission-fit",
    "href": "/jee-predictor/admission-fit",
    "title": "Admission Fit Analyzer",
    "description": "Admission Fit Analyzer on JEE Prep Hub.",
    "keywords": "jee-predictor admission-fit admission fit",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/advanced",
    "path": "/jee-predictor/advanced",
    "href": "/jee-predictor/advanced",
    "title": "JEE Advanced Rank Estimator",
    "description": "JEE Advanced Rank Estimator on JEE Prep Hub.",
    "keywords": "jee-predictor advanced advanced",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/backlog",
    "path": "/jee-predictor/backlog",
    "href": "/jee-predictor/backlog",
    "title": "JEE Backlog Manager",
    "description": "JEE Backlog Manager on JEE Prep Hub.",
    "keywords": "jee-predictor backlog backlog",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/branch-demand",
    "path": "/jee-predictor/branch-demand",
    "href": "/jee-predictor/branch-demand",
    "title": "Branch Demand & Rank Movement",
    "description": "Branch Demand & Rank Movement on JEE Prep Hub.",
    "keywords": "jee-predictor branch-demand branch demand",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/branches",
    "path": "/jee-predictor/branches",
    "href": "/jee-predictor/branches",
    "title": "Branch Explorer",
    "description": "Branch Explorer on JEE Prep Hub.",
    "keywords": "jee-predictor branches branches",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/campus",
    "path": "/jee-predictor/campus",
    "href": "/jee-predictor/campus",
    "title": "College Location & Campus Explorer",
    "description": "College Location & Campus Explorer on JEE Prep Hub.",
    "keywords": "jee-predictor campus campus",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/choice-filling",
    "path": "/jee-predictor/choice-filling",
    "href": "/jee-predictor/choice-filling",
    "title": "Choice Filling Assistant",
    "description": "Choice Filling Assistant on JEE Prep Hub.",
    "keywords": "jee-predictor choice-filling choice filling",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/college",
    "path": "/jee-predictor/college",
    "href": "/jee-predictor/college",
    "title": "JEE College Predictor",
    "description": "Explore JEE college and branch possibilities using rank and historical JoSAA cutoff data.",
    "keywords": "jee-predictor college college",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/college-comparison",
    "path": "/jee-predictor/college-comparison",
    "href": "/jee-predictor/college-comparison",
    "title": "College Comparison",
    "description": "College Comparison on JEE Prep Hub.",
    "keywords": "jee-predictor college-comparison college comparison",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/compare",
    "path": "/jee-predictor/compare",
    "href": "/jee-predictor/compare",
    "title": "Branch Comparison",
    "description": "Branch Comparison on JEE Prep Hub.",
    "keywords": "jee-predictor compare compare",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/comparison-360",
    "path": "/jee-predictor/comparison-360",
    "href": "/jee-predictor/comparison-360",
    "title": "College Comparison 360°",
    "description": "College Comparison 360° on JEE Prep Hub.",
    "keywords": "jee-predictor comparison-360 comparison 360",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/concept-map",
    "path": "/jee-predictor/concept-map",
    "href": "/jee-predictor/concept-map",
    "title": "Concept Dependency Map",
    "description": "Concept Dependency Map on JEE Prep Hub.",
    "keywords": "jee-predictor concept-map concept map",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/counselling-checklist",
    "path": "/jee-predictor/counselling-checklist",
    "href": "/jee-predictor/counselling-checklist",
    "title": "JEE Counselling Checklist",
    "description": "JEE Counselling Checklist on JEE Prep Hub.",
    "keywords": "jee-predictor counselling-checklist counselling checklist",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/cutoff-tracker",
    "path": "/jee-predictor/cutoff-tracker",
    "href": "/jee-predictor/cutoff-tracker",
    "title": "Previous-Year Cutoff Tracker",
    "description": "Previous-Year Cutoff Tracker on JEE Prep Hub.",
    "keywords": "jee-predictor cutoff-tracker cutoff tracker",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/cutoffs",
    "path": "/jee-predictor/cutoffs",
    "href": "/jee-predictor/cutoffs",
    "title": "Cutoff Explorer",
    "description": "Cutoff Explorer on JEE Prep Hub.",
    "keywords": "jee-predictor cutoffs cutoffs",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/daily-practice",
    "path": "/jee-predictor/daily-practice",
    "href": "/jee-predictor/daily-practice",
    "title": "Daily JEE Practice",
    "description": "Daily JEE Practice on JEE Prep Hub.",
    "keywords": "jee-predictor daily-practice daily practice",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/documents",
    "path": "/jee-predictor/documents",
    "href": "/jee-predictor/documents",
    "title": "JEE Documents Checklist",
    "description": "JEE Documents Checklist on JEE Prep Hub.",
    "keywords": "jee-predictor documents documents",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/dpp-tracker",
    "path": "/jee-predictor/dpp-tracker",
    "href": "/jee-predictor/dpp-tracker",
    "title": "DPP Tracker",
    "description": "DPP Tracker on JEE Prep Hub.",
    "keywords": "jee-predictor dpp-tracker dpp tracker",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/fees",
    "path": "/jee-predictor/fees",
    "href": "/jee-predictor/fees",
    "title": "College Cost & Fee Explorer",
    "description": "College Cost & Fee Explorer on JEE Prep Hub.",
    "keywords": "jee-predictor fees fees",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/heatmap",
    "path": "/jee-predictor/heatmap",
    "href": "/jee-predictor/heatmap",
    "title": "Syllabus Heatmap",
    "description": "Syllabus Heatmap on JEE Prep Hub.",
    "keywords": "jee-predictor heatmap heatmap",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/institutes",
    "path": "/jee-predictor/institutes",
    "href": "/jee-predictor/institutes",
    "title": "IIT, NIT, IIIT & GFTI Directory",
    "description": "IIT, NIT, IIIT & GFTI Directory on JEE Prep Hub.",
    "keywords": "jee-predictor institutes institutes",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/living-costs",
    "path": "/jee-predictor/living-costs",
    "href": "/jee-predictor/living-costs",
    "title": "Hostel & Living Cost Explorer",
    "description": "Hostel & Living Cost Explorer on JEE Prep Hub.",
    "keywords": "jee-predictor living-costs living costs",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/marks-percentile",
    "path": "/jee-predictor/marks-percentile",
    "href": "/jee-predictor/marks-percentile",
    "title": "Percentile ↔ Marks Analyzer",
    "description": "Percentile ↔ Marks Analyzer on JEE Prep Hub.",
    "keywords": "jee-predictor marks-percentile marks percentile",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/marks-rank",
    "path": "/jee-predictor/marks-rank",
    "href": "/jee-predictor/marks-rank",
    "title": "Marks ↔ Rank Analyzer",
    "description": "Marks ↔ Rank Analyzer on JEE Prep Hub.",
    "keywords": "jee-predictor marks-rank marks rank",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/mistake-book",
    "path": "/jee-predictor/mistake-book",
    "href": "/jee-predictor/mistake-book",
    "title": "Mistake Book",
    "description": "Mistake Book on JEE Prep Hub.",
    "keywords": "jee-predictor mistake-book mistake book",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/mock-analysis",
    "path": "/jee-predictor/mock-analysis",
    "href": "/jee-predictor/mock-analysis",
    "title": "Mock Test Analysis",
    "description": "Mock Test Analysis on JEE Prep Hub.",
    "keywords": "jee-predictor mock-analysis mock analysis",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/nit-iiit-gfti",
    "path": "/jee-predictor/nit-iiit-gfti",
    "href": "/jee-predictor/nit-iiit-gfti",
    "title": "NIT / IIIT / GFTI Predictor",
    "description": "NIT / IIIT / GFTI Predictor on JEE Prep Hub.",
    "keywords": "jee-predictor nit-iiit-gfti nit iiit gfti",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/placements",
    "path": "/jee-predictor/placements",
    "href": "/jee-predictor/placements",
    "title": "College ROI & Placement Explorer",
    "description": "College ROI & Placement Explorer on JEE Prep Hub.",
    "keywords": "jee-predictor placements placements",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/preference-optimizer",
    "path": "/jee-predictor/preference-optimizer",
    "href": "/jee-predictor/preference-optimizer",
    "title": "JEE Preference Optimizer",
    "description": "JEE Preference Optimizer on JEE Prep Hub.",
    "keywords": "jee-predictor preference-optimizer preference optimizer",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/preferences",
    "path": "/jee-predictor/preferences",
    "href": "/jee-predictor/preferences",
    "title": "JEE Preference List Builder",
    "description": "JEE Preference List Builder on JEE Prep Hub.",
    "keywords": "jee-predictor preferences preferences",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/programs",
    "path": "/jee-predictor/programs",
    "href": "/jee-predictor/programs",
    "title": "Academic Program Explorer",
    "description": "Academic Program Explorer on JEE Prep Hub.",
    "keywords": "jee-predictor programs programs",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/pyq",
    "path": "/jee-predictor/pyq",
    "href": "/jee-predictor/pyq",
    "title": "JEE PYQ Practice",
    "description": "JEE PYQ Practice on JEE Prep Hub.",
    "keywords": "jee-predictor pyq pyq",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/range-explorer",
    "path": "/jee-predictor/range-explorer",
    "href": "/jee-predictor/range-explorer",
    "title": "Cutoff & College Range Explorer",
    "description": "Cutoff & College Range Explorer on JEE Prep Hub.",
    "keywords": "jee-predictor range-explorer range explorer",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/rank-trends",
    "path": "/jee-predictor/rank-trends",
    "href": "/jee-predictor/rank-trends",
    "title": "JEE Rank Trends",
    "description": "JEE Rank Trends on JEE Prep Hub.",
    "keywords": "jee-predictor rank-trends rank trends",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/recommendations",
    "path": "/jee-predictor/recommendations",
    "href": "/jee-predictor/recommendations",
    "title": "College & Branch Recommendations",
    "description": "College & Branch Recommendations on JEE Prep Hub.",
    "keywords": "jee-predictor recommendations recommendations",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/revision",
    "path": "/jee-predictor/revision",
    "href": "/jee-predictor/revision",
    "title": "Revision System",
    "description": "Revision System on JEE Prep Hub.",
    "keywords": "jee-predictor revision revision",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/roi",
    "path": "/jee-predictor/roi",
    "href": "/jee-predictor/roi",
    "title": "College ROI Calculator",
    "description": "College ROI Calculator on JEE Prep Hub.",
    "keywords": "jee-predictor roi roi",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/scholarship-checker",
    "path": "/jee-predictor/scholarship-checker",
    "href": "/jee-predictor/scholarship-checker",
    "title": "JEE Scholarship Eligibility Checker",
    "description": "JEE Scholarship Eligibility Checker on JEE Prep Hub.",
    "keywords": "jee-predictor scholarship-checker scholarship checker",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/scholarships",
    "path": "/jee-predictor/scholarships",
    "href": "/jee-predictor/scholarships",
    "title": "Scholarships & Fee Waivers",
    "description": "Scholarships & Fee Waivers on JEE Prep Hub.",
    "keywords": "jee-predictor scholarships scholarships",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/seat-matrix",
    "path": "/jee-predictor/seat-matrix",
    "href": "/jee-predictor/seat-matrix",
    "title": "Seat Matrix Explorer",
    "description": "Seat Matrix Explorer on JEE Prep Hub.",
    "keywords": "jee-predictor seat-matrix seat matrix",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/shortlist",
    "path": "/jee-predictor/shortlist",
    "href": "/jee-predictor/shortlist",
    "title": "My College Shortlist",
    "description": "My College Shortlist on JEE Prep Hub.",
    "keywords": "jee-predictor shortlist shortlist",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/smart-revision",
    "path": "/jee-predictor/smart-revision",
    "href": "/jee-predictor/smart-revision",
    "title": "Smart Revision",
    "description": "Smart Revision on JEE Prep Hub.",
    "keywords": "jee-predictor smart-revision smart revision",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/study-now",
    "path": "/jee-predictor/study-now",
    "href": "/jee-predictor/study-now",
    "title": "What Should I Study Now?",
    "description": "What Should I Study Now? on JEE Prep Hub.",
    "keywords": "jee-predictor study-now study now",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/study-planner",
    "path": "/jee-predictor/study-planner",
    "href": "/jee-predictor/study-planner",
    "title": "Daily Study Plan",
    "description": "Daily Study Plan on JEE Prep Hub.",
    "keywords": "jee-predictor study-planner study planner",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/syllabus",
    "path": "/jee-predictor/syllabus",
    "href": "/jee-predictor/syllabus",
    "title": "JEE Syllabus Tracker",
    "description": "JEE Syllabus Tracker on JEE Prep Hub.",
    "keywords": "jee-predictor syllabus syllabus",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/jee-predictor/weak-chapters",
    "path": "/jee-predictor/weak-chapters",
    "href": "/jee-predictor/weak-chapters",
    "title": "Weak Chapter Detector",
    "description": "Weak Chapter Detector on JEE Prep Hub.",
    "keywords": "jee-predictor weak-chapters weak chapters",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "jee360",
    "path": "/jee360",
    "href": "/jee360",
    "title": "JEE 360 — Lecture Planner, Backlog & Test Command Centre",
    "description": "JEE 360 keeps your coaching lectures, backlog, mock tests, revision cards and focus sessions in one offline planner inside JEE Prep Hub.",
    "keywords": "jee360 jee360",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.index",
    "path": "/jee360",
    "href": "/jee360",
    "title": "Study Overview — JEE 360",
    "description": "Review lectures, backlog and mock-test progress in your local JEE 360 workspace.",
    "keywords": "jee360 jee360 index",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.backlog",
    "path": "/jee360/backlog",
    "href": "/jee360/backlog",
    "title": "Lecture Backlog — JEE 360",
    "description": "Track pending lectures and organize your JEE study backlog.",
    "keywords": "jee360 backlog jee360 backlog",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.coach",
    "path": "/jee360/coach",
    "href": "/jee360/coach",
    "title": "Study Coach — JEE 360",
    "description": "Work on doubts and revision plans with the JEE 360 study coach.",
    "keywords": "jee360 coach jee360 coach",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.errors",
    "path": "/jee360/errors",
    "href": "/jee360/errors",
    "title": "Mistake Book — JEE 360",
    "description": "Record practice mistakes and plan targeted JEE revision.",
    "keywords": "jee360 errors jee360 errors",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.focus",
    "path": "/jee360/focus",
    "href": "/jee360/focus",
    "title": "Focus Sessions — JEE 360",
    "description": "Run focused study sessions within your JEE 360 planner.",
    "keywords": "jee360 focus jee360 focus",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.lab",
    "path": "/jee360/lab",
    "href": "/jee360/lab",
    "title": "Study Lab — JEE 360",
    "description": "Explore JEE 360 preparation tools and study experiments.",
    "keywords": "jee360 lab jee360 lab",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.memory",
    "path": "/jee360/memory",
    "href": "/jee360/memory",
    "title": "Revision Cards — JEE 360",
    "description": "Review study cards using spaced repetition in JEE 360.",
    "keywords": "jee360 memory jee360 memory",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.plans",
    "path": "/jee360/plans",
    "href": "/jee360/plans",
    "title": "Study Plans — JEE 360",
    "description": "Organize JEE preparation with lecture and revision plans.",
    "keywords": "jee360 plans jee360 plans",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.rank",
    "path": "/jee360/rank",
    "href": "/jee360/rank",
    "title": "Rank Estimates — JEE 360",
    "description": "Explore rank estimates from the mock tests recorded in JEE 360.",
    "keywords": "jee360 rank jee360 rank",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.reminders",
    "path": "/jee360/reminders",
    "href": "/jee360/reminders",
    "title": "Study Reminders — JEE 360",
    "description": "Manage reminders for your JEE study plans and revision.",
    "keywords": "jee360 reminders jee360 reminders",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.schedule",
    "path": "/jee360/schedule",
    "href": "/jee360/schedule",
    "title": "Lecture Schedule — JEE 360",
    "description": "Organize upcoming lectures and study sessions in JEE 360.",
    "keywords": "jee360 schedule jee360 schedule",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.sprint",
    "path": "/jee360/sprint",
    "href": "/jee360/sprint",
    "title": "Study Sprint — JEE 360",
    "description": "Work through a timed JEE 360 study sprint.",
    "keywords": "jee360 sprint jee360 sprint",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.tests",
    "path": "/jee360/tests",
    "href": "/jee360/tests",
    "title": "Mock Test Log — JEE 360",
    "description": "Record mock tests and review your JEE 360 performance.",
    "keywords": "jee360 tests jee360 tests",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "jee360.upload",
    "path": "/jee360/upload",
    "href": "/jee360/upload",
    "title": "Import Study Data — JEE 360",
    "description": "Import your study records into your local JEE 360 workspace.",
    "keywords": "jee360 upload jee360 upload",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/leaderboard",
    "path": "/leaderboard",
    "href": "/leaderboard",
    "title": "Leaderboard",
    "description": "Compare weekly study rankings and leaderboard achievements.",
    "keywords": "leaderboard leaderboard",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/lecture-tracker",
    "path": "/lecture-tracker",
    "href": "/lecture-tracker",
    "title": "Lecture Tracker",
    "description": "Organize lectures, update watched minutes and track daily study targets.",
    "keywords": "lecture-tracker lecture tracker",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "legal.$docId",
    "path": "/legal/$docId",
    "href": "/legal",
    "title": "Policy not found",
    "description": "Policy not found on JEE Prep Hub.",
    "keywords": "legal legal $docId",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "legal.index",
    "path": "/legal",
    "href": "/legal",
    "title": "Policies & Community Rules",
    "description": "Policies & Community Rules on JEE Prep Hub.",
    "keywords": "legal legal index",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "lovable/email/queue/process",
    "path": "/lovable/email/queue/process",
    "href": "/lovable/email/queue/process",
    "title": "Process",
    "description": "Process on JEE Prep Hub.",
    "keywords": "lovable email queue process process",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "materials",
    "path": "/materials",
    "href": "/materials",
    "title": "Study Material",
    "description": "JEE Prep Hub study material library for Physics, Chemistry, Mathematics and more.",
    "keywords": "materials materials",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/messages.$peerId",
    "path": "/messages/$peerId",
    "href": "/messages",
    "title": "Private Chat",
    "description": "Continue a private study conversation with another JEE Prep Hub member.",
    "keywords": "messages messages $peerId",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/messages.index",
    "path": "/messages",
    "href": "/messages",
    "title": "Squad",
    "description": "Your direct messages and joined study groups in one place.",
    "keywords": "messages messages index",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/my-activity",
    "path": "/my-activity",
    "href": "/my-activity",
    "title": "My Activity",
    "description": "Review your personal study and community activity.",
    "keywords": "my-activity my activity",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/notes.$classId.$subject",
    "path": "/notes/$classId/$subject",
    "href": "/notes",
    "title": "Class ${params.classId} ${params.subject} Notes",
    "description": "Chapter-wise Class ${params.classId} ${params.subject} notes, NCERT, summaries, formulas, questions and solutions.",
    "keywords": "notes notes $classId $subject",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/notes.index",
    "path": "/notes",
    "href": "/notes",
    "title": "Notes & NCERT",
    "description": "Chapter-wise notes, summaries, formula sheets, questions and solutions for Class 11 and 12 Physics, Chemistry, Mathematics and Biology.",
    "keywords": "notes notes index",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/notes.chapter.$chapterId",
    "path": "/notes/chapter/$chapterId",
    "href": "/notes/chapter",
    "title": "Chapter Notes",
    "description": "Study chapter notes, formulas, summaries and practice questions.",
    "keywords": "notes chapter notes chapter $chapterId",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "notices",
    "path": "/notices",
    "href": "/notices",
    "title": "Notice Board",
    "description": "Official announcements, exam updates, results, events and important updates from JEE Prep Hub.",
    "keywords": "notices notices",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "notifications",
    "path": "/notifications",
    "href": "/notifications",
    "title": "Notifications",
    "description": "Read your JEE Prep Hub notifications and community updates.",
    "keywords": "notifications notifications",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/nta",
    "path": "/nta",
    "href": "/nta",
    "title": "NTA JEE Main",
    "description": "Official JEE Main notices, question papers, answer keys and information bulletins.",
    "keywords": "nta nta",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "official",
    "path": "/official",
    "href": "/official",
    "title": "Official Website",
    "description": "Verify the official JEE Prep Hub website. The only official domain is jeeprephub.co.in.",
    "keywords": "official official",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/planner",
    "path": "/planner",
    "href": "/planner",
    "title": "Study Planner",
    "description": "Plan every study day subject by subject: Physics, Chemistry, Maths and more, with a weekly day strip and tick-off tasks.",
    "keywords": "planner planner",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "prep-lab",
    "path": "/prep-lab",
    "href": "/prep-lab",
    "title": "Prep Lab — Adaptive JEE & NEET Practice",
    "description": "Build targeted JEE Main, JEE Advanced and NEET UG practice sessions from a 2,000-question original generated practice bank.",
    "keywords": "prep-lab prep lab",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "pricing",
    "path": "/pricing",
    "href": "/pricing",
    "title": "Earn JEE Prep Hub Pro — Weekly Leaderboard",
    "description": "JEE Prep Hub Pro is earned, not purchased. Finish #1 on the live weekly study leaderboard to unlock Pro.",
    "keywords": "pricing pricing",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/pro",
    "path": "/pro",
    "href": "/pro",
    "title": "Pro",
    "description": "Pro on JEE Prep Hub.",
    "keywords": "pro pro",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/profile",
    "path": "/profile",
    "href": "/profile",
    "title": "Profile",
    "description": "Manage your JEE Prep Hub member profile.",
    "keywords": "profile profile",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/progress",
    "path": "/progress",
    "href": "/progress",
    "title": "Progress Tracker — Rating, Tiers & Badges",
    "description": "Track your JEE Prep Hub rating, climb Bronze to Diamond tiers, review subject-wise and test-wise performance, and unlock achievement badges.",
    "keywords": "progress progress",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "pulse",
    "path": "/pulse",
    "href": "/pulse",
    "title": "Pulse AI",
    "description": "Your intelligent JEE learning feed with lectures, community updates, AI study guidance and progress tools.",
    "keywords": "pulse pulse",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "quiz",
    "path": "/quiz",
    "href": "/quiz",
    "title": "Quiz",
    "description": "Quiz on JEE Prep Hub.",
    "keywords": "quiz quiz",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "quiz.index",
    "path": "/quiz",
    "href": "/quiz",
    "title": "Quiz Arena — Daily Challenge & Battles",
    "description": "Compete in the JEE Prep Hub Quiz Arena with daily challenges, timed practice battles, XP, streaks and real performance results.",
    "keywords": "quiz quiz index",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "quiz.battle.$battleId",
    "path": "/quiz/battle/$battleId",
    "href": "/quiz/battle",
    "title": "Live Quiz Battle",
    "description": "Face another JEE aspirant in a live quiz battle.",
    "keywords": "quiz battle quiz battle $battleId",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/sahai",
    "path": "/sahai",
    "href": "/sahai",
    "title": "SahAI — your AI study buddy",
    "description": "SahAI is the shared AI study buddy for every JEE Prep Hub student — doubts, revision plans and motivation, any time.",
    "keywords": "sahai sahai",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "searches",
    "path": "/searches",
    "href": "/searches",
    "title": "Search JEE Resources",
    "description": "Search notes, PYQs, articles, lectures, questions and study resources for JEE preparation.",
    "keywords": "searches searches",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/settings",
    "path": "/settings",
    "href": "/settings",
    "title": "Account Settings",
    "description": "Manage your account and study preferences.",
    "keywords": "settings settings",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/squad.$groupId",
    "path": "/squad/$groupId",
    "href": "/squad",
    "title": "Squad Chat",
    "description": "Connect with your study squad in a shared group conversation.",
    "keywords": "squad squad $groupId",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/squad.join.$code",
    "path": "/squad/join/$code",
    "href": "/squad/join",
    "title": "Join Squad",
    "description": "Join a JEE Prep Hub study squad using its invitation link.",
    "keywords": "squad join squad join $code",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "start",
    "path": "/start",
    "href": "/start",
    "title": "Choose your next step",
    "description": "Choose resources, practice tests, focus tools or community spaces for your next study session.",
    "keywords": "start start",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "tests",
    "path": "/tests",
    "href": "/tests",
    "title": "Tests",
    "description": "Tests on JEE Prep Hub.",
    "keywords": "tests tests",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "tests.$testId",
    "path": "/tests/$testId",
    "href": "/tests",
    "title": "Test Details",
    "description": "Full CBT test details, instructions, and start options.",
    "keywords": "tests tests $testId",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "tests.index",
    "path": "/tests",
    "href": "/tests",
    "title": "JEE Test Series — Practice CBT Mock Tests",
    "description": "Attempt JEE Main, Advanced and NEET style CBT mock tests with real exam interface, timer, and detailed analytics.",
    "keywords": "tests tests index",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "tests.attempt.$attemptId",
    "path": "/tests/attempt/$attemptId",
    "href": "/tests/attempt",
    "title": "CBT Test — In Progress",
    "description": "Live JEE CBT attempt.",
    "keywords": "tests attempt tests attempt $attemptId",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "tests.create",
    "path": "/tests/create",
    "href": "/tests/create",
    "title": "Create a CBT Test",
    "description": "Upload your coaching test paper and answer key PDFs and turn them into a JEE-style CBT test for the whole community.",
    "keywords": "tests create tests create",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "tests.jee-hub",
    "path": "/tests/jee-hub",
    "href": "/tests/jee-hub",
    "title": "JEEHub Paper Archive — Test Series",
    "description": "Practice repository-backed JEE, NEET, BITSAT, COMEDK, and MHT-CET question sets.",
    "keywords": "tests jee-hub tests jee hub",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "tests.leaderboard.$testId",
    "path": "/tests/leaderboard/$testId",
    "href": "/tests/leaderboard",
    "title": "Test Leaderboard",
    "description": "Compare scores, accuracy and standings for this CBT test.",
    "keywords": "tests leaderboard tests leaderboard $testId",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "tests.leaderboard.index",
    "path": "/tests/leaderboard",
    "href": "/tests/leaderboard",
    "title": "Test Series Ranking — Points Leaderboard",
    "description": "Overall Test Series ranking for JEE Prep Hub: total points earned across every CBT mock test, tests attempted and average accuracy.",
    "keywords": "tests leaderboard tests leaderboard index",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "tests.result.$attemptId",
    "path": "/tests/result/$attemptId",
    "href": "/tests/result",
    "title": "Test Result",
    "description": "Review your CBT score, saved responses and question analysis.",
    "keywords": "tests result tests result $attemptId",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/timer",
    "path": "/timer",
    "href": "/timer",
    "title": "Focus Timer — Pomodoro, Stopwatch & Analytics for JEE Aspirants",
    "description": "Deep-focus workspace: Pomodoro, stopwatch, custom countdown, fullscreen mode, ambient sounds, and detailed daily/weekly/monthly study analytics.",
    "keywords": "timer timer",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "toppers",
    "path": "/toppers",
    "href": "/toppers",
    "title": "Toppers Hall of Fame",
    "description": "Celebrate Class 10, Class 11, Class 12, JEE Advanced, JEE Main and NEET toppers. Explore ranks, scores and stories from outstanding students.",
    "keywords": "toppers toppers",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "u.$userId",
    "path": "/u/$userId",
    "href": "/u",
    "title": "Member profile",
    "description": "View a JEE Prep Hub community member",
    "keywords": "u u $userId",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "updates",
    "path": "/updates",
    "href": "/updates",
    "title": "Updates & Change History",
    "description": "Recorded JEE Prep Hub changes, grouped by day — new features, improvements, fixes, security work and design updates.",
    "keywords": "updates updates",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "verified",
    "path": "/verified",
    "href": "/verified",
    "title": "How to get the Blue Tick",
    "description": "Learn how to earn the verified blue tick on JEE Prep Hub by staying active, consistent, and helpful.",
    "keywords": "verified verified",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/verify-account",
    "path": "/verify-account",
    "href": "/verify-account",
    "title": "Verify Account",
    "description": "Complete your JEE Prep Hub account verification.",
    "keywords": "verify-account verify account",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/watch",
    "path": "/watch",
    "href": "/watch",
    "title": "Watch",
    "description": "Watch on JEE Prep Hub.",
    "keywords": "watch watch",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/watch.$roomId",
    "path": "/watch/$roomId",
    "href": "/watch",
    "title": "Study Watch Party",
    "description": "Watch lectures together and discuss them with fellow JEE aspirants.",
    "keywords": "watch watch $roomId",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/watch.index",
    "path": "/watch",
    "href": "/watch",
    "title": "Watch Party Lobby",
    "description": "Discover shared lecture sessions and create a watch party with fellow students.",
    "keywords": "watch watch index",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/watch-history",
    "path": "/watch-history",
    "href": "/watch-history",
    "title": "Watch History",
    "description": "Every lecture you have watched on Pulse, with how far you got and quick links to resume.",
    "keywords": "watch-history watch history",
    "requiresAuth": true,
    "requiresAdmin": false
  },
  {
    "id": "welcome",
    "path": "/welcome",
    "href": "/welcome",
    "title": "Welcome to JEE Prep Hub",
    "description": "A calmer, smarter starting point for JEE Main, JEE Advanced and NEET preparation.",
    "keywords": "welcome welcome",
    "requiresAuth": false,
    "requiresAdmin": false
  },
  {
    "id": "_authenticated/youtube-checklist",
    "path": "/youtube-checklist",
    "href": "/youtube-checklist",
    "title": "YouTube Study Checklist",
    "description": "Import YouTube playlists and track lecture completion with personal study checklists.",
    "keywords": "youtube-checklist youtube checklist",
    "requiresAuth": true,
    "requiresAdmin": false
  }
];
