import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { showXpRewardToast } from "@/lib/xp-toast";
import { haptic } from "@/lib/haptics";
import { useTheme } from "@/lib/theme";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { ExpandableText } from "@/components/ExpandableText";
import { toggleLike, getMyLikes, deletePost, createPost } from "@/lib/feed.functions";
import {
  listPulseItems,
  countPulseItemsSince,
  getPulseSettings,
  getPulseSuggestion,
  incrementVideoView,
  type PulseItem,
  type PulseSuggestion,
  listContinueWatching,
  getMyVideoLikes,
  toggleVideoLike,
} from "@/lib/pulse.functions";
import { PulseVideoModal } from "@/components/pulse/PulseVideoModal";
import { PulseAiCard } from "@/components/pulse/PulseAiCard";
import { PulseSquadsPanel, PulseRanksPanel, PulseProfilePanel } from "@/components/pulse/PulsePanels";
import {
  ArrowUp, Bookmark, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3,
  Flame, Heart, LayoutGrid, Loader2, MessageCircle, Moon, Play, Search, Send,
  Share2, Sparkles, Sun, Target, Trash2, Trophy, User, Users, Video, X,
  BrainCircuit, ListFilter, RotateCcw,
} from "lucide-react";

const SITE_URL = "https://jeeprephub.co.in";
const BOOKMARKS_KEY = "jph:pulse:bookmarks:v2";
const COMPLETED_KEY = "jph:pulse:completed:v2";

export const Route = createFileRoute("/pulse")({
  head: () => ({
    meta: [
      { name: "twitter:title", content: "Pulse AI — PREPWIAN" },
      { name: "twitter:description", content: "Learn, revise, track and discover with Pulse AI." },

      { title: "Pulse AI — PREPWIAN" },
      { name: "description", content: "Your intelligent JEE learning feed with lectures, community updates, AI study guidance and progress tools." },
      { property: "og:title", content: "Pulse AI — PREPWIAN" },
      { property: "og:description", content: "Learn, revise, track and discover with Pulse AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/pulse` },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { v?: string } => typeof search.v === "string" ? { v: search.v } : {},
  component: PulsePage,
});

const SUBJECT_COLOR: Record<string, string> = {
  Physics: "var(--pl-physics)",
  Chemistry: "var(--pl-chemistry)",
  Mathematics: "var(--pl-maths)",
};

const CHIPS = [
  { id: "all", label: "All" },
  { id: "Physics", label: "Physics" },
  { id: "Chemistry", label: "Chemistry" },
  { id: "Mathematics", label: "Maths" },
  { id: "community", label: "Community" },
] as const;
type ChipId = (typeof CHIPS)[number]["id"];
type PulseTab = "pulse" | "feed" | "squads" | "ranks" | "profile";

const AVATAR_PALETTE = ["#5B9EFF", "#5FCB8F", "#FFC857", "#C792EA", "#FF8A65"];
function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 100000;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}
function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}
function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
  if (dayKey(iso) === dayKey(yest.toISOString())) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
function readSet(key: string) {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return new Set<string>(Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : []);
  } catch { return new Set<string>(); }
}
function writeSet(key: string, set: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* storage can be unavailable */ }
}

const CSS = `
.pulse-scope{--pl-bg:#0b0f17;--pl-bg-elevated:#121827;--pl-card:#151c2a;--pl-card-border:#273249;--pl-text:#f4f7fb;--pl-muted:#9aa5ba;--pl-faint:#657188;--pl-physics:#66a6ff;--pl-chemistry:#55d89a;--pl-maths:#ffc857;--pl-ai:#a78bfa;--pl-danger:#ff6b78;--pl-header-bg:rgba(11,15,23,.86);background:var(--pl-bg);color:var(--pl-text);min-height:100dvh;font-family:'Inter',system-ui,sans-serif}
.pulse-scope.pl-light{--pl-bg:#f5f7fb;--pl-bg-elevated:#edf1f7;--pl-card:#fff;--pl-card-border:#e0e5ef;--pl-text:#141a26;--pl-muted:#59657a;--pl-faint:#8994a8;--pl-physics:#2563eb;--pl-chemistry:#087f50;--pl-maths:#a76500;--pl-ai:#7c3aed;--pl-danger:#dc2626;--pl-header-bg:rgba(245,247,251,.88)}
.pulse-scope .pl-head{font-family:'Space Grotesk','Inter',sans-serif}.pulse-scope .pl-mono{font-family:'JetBrains Mono',ui-monospace,monospace}.pulse-scope .pl-shell{width:100%;max-width:820px;margin:0 auto;min-height:100dvh;background:var(--pl-bg);overflow-x:clip}.pulse-scope *{box-sizing:border-box}.pulse-scope button,.pulse-scope a{-webkit-tap-highlight-color:transparent}.pulse-scope input,.pulse-scope textarea{font-size:16px}
.pulse-scope .pl-header{position:sticky;top:0;z-index:30;background:var(--pl-header-bg);backdrop-filter:blur(22px) saturate(140%);border-bottom:1px solid color-mix(in srgb,var(--pl-card-border) 78%,transparent);border-radius:0 0 26px 26px;box-shadow:0 10px 28px rgba(0,0,0,.08);padding-top:env(safe-area-inset-top)}
.pulse-scope .pl-card{background:var(--pl-card);border:1px solid color-mix(in srgb,var(--pl-card-border) 92%,transparent);border-radius:24px;box-shadow:0 10px 34px rgba(0,0,0,.12);overflow:hidden;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;min-width:0}.pulse-scope .pl-card:hover{box-shadow:0 14px 38px rgba(0,0,0,.16);border-color:color-mix(in srgb,var(--pl-maths) 18%,var(--pl-card-border))}.pulse-scope .pl-card:active{transform:scale(.992)}
.pulse-scope .pl-nav{position:fixed;left:50%;transform:translateX(-50%);bottom:0;z-index:35;width:calc(100% - 12px);max-width:808px;display:flex;background:color-mix(in srgb,var(--pl-header-bg) 94%,transparent);backdrop-filter:blur(22px) saturate(140%);border:1px solid color-mix(in srgb,var(--pl-card-border) 90%,transparent);border-radius:24px 24px 0 0;padding:5px 5px max(5px,env(safe-area-inset-bottom));box-shadow:0 -12px 34px rgba(0,0,0,.14)}
.pulse-scope .pl-nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;margin:2px;padding:9px 0 8px;border-radius:18px;color:var(--pl-muted);font-size:10px;transition:background .18s ease,color .18s ease}.pulse-scope .pl-nav button[data-active=true]{color:var(--pl-maths);background:color-mix(in srgb,var(--pl-maths) 10%,transparent)}
.pulse-scope .pl-enter{animation:pl-rise .38s ease both}.pulse-scope .pl-clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.pulse-scope button:focus-visible,.pulse-scope a:focus-visible{outline:2px solid var(--pl-maths);outline-offset:2px}
@keyframes pl-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){.pulse-scope .pl-enter{animation:none!important}}
.pulse-scope .pl-scroll::-webkit-scrollbar{display:none}.pulse-scope .pl-scroll{scrollbar-width:none}.pulse-scope .pl-gradient{background:radial-gradient(circle at 100% 0%,rgba(124,92,246,.25),transparent 34%),radial-gradient(circle at 0% 100%,rgba(255,200,87,.10),transparent 30%),linear-gradient(135deg,#171d31 0%,#111827 52%,#202b47 100%)}

/* Liquid-glass / lens interaction layer */
.pulse-scope .pl-lens{position:relative;isolation:isolate;overflow:hidden;backdrop-filter:blur(18px) saturate(155%);-webkit-backdrop-filter:blur(18px) saturate(155%);background:linear-gradient(145deg,rgba(255,255,255,.105),rgba(255,255,255,.035));border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.20),inset 0 -1px 0 rgba(255,255,255,.04),0 7px 20px rgba(0,0,0,.10)}
.pulse-scope.pl-light .pl-lens{background:linear-gradient(145deg,rgba(255,255,255,.76),rgba(255,255,255,.40));border-color:rgba(255,255,255,.72);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 -1px 0 rgba(70,80,110,.07),0 7px 20px rgba(40,50,80,.09)}
.pulse-scope .pl-lens:before{content:"";position:absolute;inset:-55% -30%;z-index:-1;pointer-events:none;background:linear-gradient(115deg,transparent 34%,rgba(255,255,255,.18) 47%,rgba(255,255,255,.05) 53%,transparent 66%);transform:translateX(-35%) rotate(8deg);transition:transform .55s ease,opacity .25s ease;opacity:.65}
.pulse-scope .pl-lens:hover:before{transform:translateX(35%) rotate(8deg);opacity:1}
.pulse-scope .pl-lens:active{transform:translateY(1px) scale(.965);box-shadow:inset 0 2px 8px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.14),0 3px 10px rgba(0,0,0,.12);transition:transform .07s ease,box-shadow .07s ease}
.pulse-scope .pl-lens[data-active="true"]{box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 -2px 8px rgba(0,0,0,.10),0 5px 18px rgba(0,0,0,.12)}
.pulse-scope .pl-lens-icon{box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 4px 12px rgba(0,0,0,.10);backdrop-filter:blur(12px) saturate(150%);-webkit-backdrop-filter:blur(12px) saturate(150%)}
.pulse-scope .pl-nav{background:rgba(18,24,39,.66)!important}
.pulse-scope.pl-light .pl-nav{background:rgba(255,255,255,.68)!important}
.pulse-scope .pl-nav button{backdrop-filter:blur(14px) saturate(150%);-webkit-backdrop-filter:blur(14px) saturate(150%)}
.pulse-scope .pl-nav button[data-active="true"]{box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 4px 14px rgba(0,0,0,.08)}
@media(prefers-reduced-motion:reduce){.pulse-scope .pl-lens:before{transition:none}.pulse-scope .pl-lens:active{transform:none}}

.pulse-scope .pl-soft{border-radius:18px}.pulse-scope .pl-pill{border-radius:999px}.pulse-scope .pl-control{border-radius:18px}.pulse-scope .pl-media{border-radius:22px 22px 0 0;overflow:hidden}.pulse-scope input::placeholder,.pulse-scope textarea::placeholder{color:var(--pl-faint)}
@media(max-width:520px){.pulse-scope .pl-card{border-radius:21px}.pulse-scope main{padding-left:10px!important;padding-right:10px!important}.pulse-scope .pl-gradient{border-radius:24px}.pulse-scope .pl-nav{width:calc(100% - 10px)}.pulse-scope .pl-nav button{min-height:54px}}
@media(max-width:767px){.pulse-scope .pl-subject-tabs{width:100%;max-width:100%;min-width:0;display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scroll-padding-inline:12px;touch-action:pan-x;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-left:12px;padding-right:12px}.pulse-scope .pl-subject-tabs::-webkit-scrollbar{display:none}.pulse-scope .pl-subject-tabs>button{flex:0 0 auto;white-space:nowrap}}
@media(min-width:768px){.pulse-scope .pl-shell{border-left:1px solid var(--pl-card-border);border-right:1px solid var(--pl-card-border);border-radius:0 0 30px 30px;box-shadow:0 0 60px rgba(0,0,0,.06)}.pulse-scope .pl-nav{border-left:1px solid color-mix(in srgb,var(--pl-card-border) 90%,transparent);border-right:1px solid color-mix(in srgb,var(--pl-card-border) 90%,transparent)}}
`;

function PulsePage() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const { isDark, toggle: toggleTheme } = useTheme();
  const light = !isDark;
  const [chip, setChip] = useState<ChipId>("all");
  const [tab, setTab] = useState<PulseTab>("pulse");
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [libraryMode, setLibraryMode] = useState<"all" | "saved" | "completed">("all");
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => readSet(BOOKMARKS_KEY));
  const [completed, setCompleted] = useState<Set<string>>(() => readSet(COMPLETED_KEY));
  const [modalVideo, setModalVideo] = useState<{ id:string;title:string;youtube_video_id:string;subject:string|null;chapter:string|null;resumeAt?:number|null }|null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => writeSet(BOOKMARKS_KEY, bookmarks), [bookmarks]);
  useEffect(() => writeSet(COMPLETED_KEY, completed), [completed]);

  const { data: continueWatching } = useQuery({ queryKey:["pulse-continue-watching"], queryFn:()=>listContinueWatching(), enabled:!!user, staleTime:60_000 });
  const resumeMap = useMemo(() => new Map((continueWatching ?? []).map(c => [c.id, c.position_seconds])), [continueWatching]);

  const search = Route.useSearch();
  const deepLinkId = search.v;
  useEffect(() => {
    if (!deepLinkId) return;
    let cancelled = false;
    (async()=>{
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.from("video_lectures").select("id,title,youtube_video_id,subject,chapter").eq("id",deepLinkId).maybeSingle();
      if (!cancelled && data) setModalVideo({...data,resumeAt:resumeMap.get(data.id) ?? null});
    })();
    return ()=>{cancelled=true};
  }, [deepLinkId,resumeMap]);

  const { data: myVideoLikes } = useQuery({ queryKey:["video-my-likes"], queryFn:()=>getMyVideoLikes(), enabled:!!user, staleTime:30_000 });
  const videoLikedSet = new Set(myVideoLikes ?? []);
  const [videoLikeOverride,setVideoLikeOverride] = useState<Record<string,{liked:boolean;delta:number}>>({});

  const effChip: ChipId = tab === "feed" ? "community" : chip;
  const subject = effChip === "Physics" || effChip === "Chemistry" || effChip === "Mathematics" ? effChip : null;
  const itemType = effChip === "community" ? "post" : null;
  const feed = useInfiniteQuery({
    queryKey:["pulse-items",subject,itemType], initialPageParam:null as string|null,
    queryFn:({pageParam})=>listPulseItems({data:{cursor:pageParam,limit:15,subject,itemType}}),
    getNextPageParam:last=>last.nextCursor, staleTime:30_000,
  });
  const items = useMemo(()=>feed.data?.pages.flatMap(p=>p.items) ?? [],[feed.data]);
  const visibleItems = useMemo(()=>{
    let result = items;
    if (libraryMode === "saved") result = result.filter(i => i.item_type === "video" && bookmarks.has(i.id));
    if (libraryMode === "completed") result = result.filter(i => i.item_type === "video" && completed.has(i.id));
    const q=searchText.trim().toLowerCase();
    if(!q) return result;
    return result.filter(i=>[i.title,i.chapter,i.subject,i.body_text,i.author_name].some(v=>String(v??"").toLowerCase().includes(q)));
  },[items,searchText,libraryMode,bookmarks,completed]);
  const videos = useMemo(()=>items.filter(i=>i.item_type==="video"),[items]);
  const completedCount = completed.size;

  const { data: myLikes } = useQuery({ queryKey:["feed-my-likes"], queryFn:()=>getMyLikes(), enabled:!!user, staleTime:30_000 });
  const likedSet = new Set(myLikes?.posts ?? []);
  const [likeOverride,setLikeOverride] = useState<Record<string,{liked:boolean;delta:number}>>({});
  const { data: settings } = useQuery({ queryKey:["pulse-settings"], queryFn:()=>getPulseSettings(), staleTime:600_000 });
  const daysToExam = settings ? Math.max(0,Math.ceil((new Date(settings.jeeMainDate).getTime()-Date.now())/86_400_000)) : null;

  useEffect(()=>{
    const el=sentinel.current;if(!el)return;
    const io=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting&&feed.hasNextPage&&!feed.isFetchingNextPage)feed.fetchNextPage()},{rootMargin:"500px"});
    io.observe(el);return()=>io.disconnect();
  },[feed.hasNextPage,feed.isFetchingNextPage,feed.fetchNextPage]);

  const newestIso=items[0]?.created_at ?? null;
  useEffect(()=>{
    if(!newestIso)return;let stop=false;
    const tick=async()=>{if(document.hidden||stop)return;try{const {count}=await countPulseItemsSince({data:{since:newestIso}});if(!stop)setNewCount(count)}catch{}}
    const t=setInterval(tick,60_000);return()=>{stop=true;clearInterval(t)};
  },[newestIso]);

  const toggleBookmark=(id:string)=>{haptic("light");setBookmarks(prev=>{const n=new Set(prev);if(n.has(id)){n.delete(id);toast.success("Removed from saved")}else{n.add(id);toast.success("Saved to Pulse")}return n})};
  const toggleCompleted=(id:string)=>{haptic("light");setCompleted(prev=>{const n=new Set(prev);if(n.has(id))n.delete(id);else{n.add(id);toast.success("Marked as completed")}return n})};

  const openVideo=useCallback((item:PulseItem|PulseSuggestion["video"],opener?:HTMLElement|null)=>{
    openerRef.current=opener??null;const v=item as any;
    setModalVideo({id:v.id,title:v.title??"Lecture",youtube_video_id:v.youtube_video_id,subject:v.subject??null,chapter:v.chapter??null,resumeAt:resumeMap.get(v.id)??null});
    incrementVideoView({data:{id:v.id}}).then((result) => {
      if (result.awarded) showXpRewardToast(4, "Watched a video lecture");
    }).catch(()=>{});
  },[resumeMap]);
  const closeVideo=useCallback(()=>{setModalVideo(null);openerRef.current?.focus?.()},[]);

  async function onVideoLike(item:PulseItem){
    if(!user){toast.error("Sign in to like lectures");return}haptic("light");const cur=videoLikeOverride[item.id];const wasLiked=cur?cur.liked:videoLikedSet.has(item.id);
    setVideoLikeOverride(m=>({...m,[item.id]:{liked:!wasLiked,delta:wasLiked?-1:1}}));try{await toggleVideoLike({data:{videoId:item.id}});qc.invalidateQueries({queryKey:["video-my-likes"]})}catch{setVideoLikeOverride(m=>{const n={...m};delete n[item.id];return n});toast.error("Couldn't save your like")}
  }
  async function onLike(item:PulseItem){
    if(!user){toast.error("Sign in to like posts");return}haptic("light");const cur=likeOverride[item.id];const wasLiked=cur?cur.liked:likedSet.has(item.id);
    setLikeOverride(m=>({...m,[item.id]:{liked:!wasLiked,delta:wasLiked?-1:1}}));try{await toggleLike({data:{targetType:"post",targetId:item.id}});qc.invalidateQueries({queryKey:["feed-my-likes"]})}catch{setLikeOverride(m=>{const n={...m};delete n[item.id];return n});toast.error("Couldn't save your like")}
  }
  async function onShare(item:PulseItem){
    const url=`${SITE_URL}/feed`;const text=(item.body_text??item.title??"PREPWIAN").slice(0,120);
    if(navigator.share){try{await navigator.share({title:"PREPWIAN",text,url});return}catch{}}
    try{await navigator.clipboard.writeText(url);toast.success("Link copied")}catch{toast.error("Couldn't share")}
  }
  async function onDelete(item:PulseItem){
    if(!window.confirm("Delete this post? This can't be undone."))return;try{await deletePost({data:{id:item.id}});qc.invalidateQueries({queryKey:["pulse-items"]});qc.invalidateQueries({queryKey:["feed-posts"]});toast.success("Post deleted")}catch{toast.error("Couldn't delete the post")}
  }

  const startStudyNow=()=>{
    const candidate=videos.find(v=>!completed.has(v.id)) ?? videos[0];
    if(candidate) openVideo(candidate); else toast.info("No lecture is available yet");
  };
  const goTab=(next:PulseTab)=>{haptic("light");setTab(next);setSearchText("");setLibraryMode("all");window.scrollTo({top:0,behavior:"smooth"})};

  let lastDay="";
  return <div className={`pulse-scope${light?" pl-light":""}`}><style>{CSS}</style><div className="pl-shell">
    <header className="pl-header">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="pl-lens grid h-10 w-10 shrink-0 place-items-center rounded-[15px] shadow-sm" style={{background:"linear-gradient(135deg,#ffc857,#ff9650)",boxShadow:"0 8px 22px rgba(255,190,70,.18)"}}>
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="#0b0f17" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-5 3 10 3-7 2 2h6"/></svg>
        </div>
        <div className="min-w-0 flex-1"><h1 className="pl-head truncate text-[18px] font-bold">Pulse AI</h1><p className="pl-mono text-[9px] uppercase tracking-[.14em]" style={{color:"var(--pl-faint)"}}>Your JEE study command center</p></div>
        <button type="button" onClick={()=>setShowSearch(v=>!v)} className="pl-lens grid h-10 w-10 place-items-center rounded-[15px]" style={{background:"var(--pl-bg-elevated)",border:"1px solid var(--pl-card-border)"}} aria-label="Search Pulse"><Search className="h-4 w-4"/></button>
        <button type="button" onClick={toggleTheme} className="pl-lens grid h-10 w-10 place-items-center rounded-[15px]" style={{background:"var(--pl-bg-elevated)",border:"1px solid var(--pl-card-border)"}} aria-label="Toggle theme">{light?<Moon className="h-4 w-4"/>:<Sun className="h-4 w-4"/>}</button>
      </div>
      {showSearch && <div className="px-4 pb-3"><div className="pl-lens flex items-center gap-2 rounded-[22px] px-3 py-2.5 shadow-sm" style={{background:"var(--pl-bg-elevated)",border:"1px solid var(--pl-card-border)"}}><Search className="h-4 w-4" style={{color:"var(--pl-muted)"}}/><input autoFocus value={searchText} onChange={e=>setSearchText(e.target.value)} placeholder="Search lectures, chapters, posts…" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/><button type="button" onClick={()=>{setSearchText("");setShowSearch(false)}} aria-label="Close search"><X className="h-4 w-4" style={{color:"var(--pl-muted)"}}/></button></div></div>}
      {tab==="pulse" && <div className="pl-subject-tabs pl-scroll flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-3">{CHIPS.map(c=><button key={c.id} type="button" onClick={()=>setChip(c.id)} aria-pressed={chip===c.id} className="pl-lens pl-mono min-h-9 shrink-0 snap-start rounded-full px-4 py-2 text-[11px] font-medium" style={{background:chip===c.id?"var(--pl-text)":"transparent",color:chip===c.id?"var(--pl-bg)":"var(--pl-muted)",border:`1px solid ${chip===c.id?"var(--pl-text)":"var(--pl-card-border)"}`}}>{c.label}</button>)}</div>}
    </header>

    <main className="px-3 pb-[calc(92px+env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-28 sm:pt-4">
      {tab==="squads" ? <PulseSquadsPanel userId={user?.id??null}/> : tab==="ranks" ? <PulseRanksPanel userId={user?.id??null}/> : tab==="profile" ? <PulseProfilePanel userId={user?.id??null}/> : <>
        {tab==="pulse" && <>
          <section className="pl-gradient pl-card relative mb-4 overflow-hidden p-4 sm:p-5">
            <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl"/><div className="absolute -bottom-20 left-16 h-36 w-36 rounded-full bg-amber-400/10 blur-3xl"/>
            <div className="relative flex min-w-0 items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-[20px]" style={{background:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.25)"}}><BrainCircuit className="h-5 w-5" style={{color:"#b9a2ff"}}/></div><div className="min-w-0 flex-1"><p className="pl-mono text-[9px] uppercase tracking-[.16em]" style={{color:"#b9a2ff"}}>AI study mode</p><h2 className="pl-head mt-1 text-[19px] font-bold">Study smarter, not randomly.</h2><p className="mt-1 text-[12px] leading-5" style={{color:"#b4bed0"}}>Pulse connects lectures, community and your study momentum in one place.</p></div></div>
            <div className="relative mt-4 grid grid-cols-3 gap-2.5"><MiniStat icon={Clock3} value={`${completedCount}`} label="completed"/><MiniStat icon={Bookmark} value={`${bookmarks.size}`} label="saved"/><MiniStat icon={Target} value={daysToExam===null?"—":`${daysToExam}d`} label="to JEE Main"/></div>
            <div className="relative mt-3 grid grid-cols-2 gap-2.5"><button type="button" onClick={startStudyNow} className="pl-lens inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-bold shadow-sm" style={{background:"var(--pl-maths)",color:"var(--pl-bg)"}}><Play className="h-3.5 w-3.5 fill-current"/>Study now</button><button type="button" onClick={()=>{setLibraryMode("saved");if(!bookmarks.size)toast.info("Save a lecture with the bookmark button to build your revision shelf")}} className="pl-lens inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-bold shadow-sm" style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",color:"var(--pl-text)"}}><Bookmark className="h-3.5 w-3.5"/>Saved</button></div>
          </section>

          {user && <PulseAiCard fetchSuggestion={()=>getPulseSuggestion()} onOpen={(video,el)=>openVideo(video as unknown as PulseItem,el)}/>}

          {continueWatching && continueWatching.length>0 && <section className="mb-4 mt-4"><SectionHeading title="Continue learning" subtitle="Pick up exactly where you left off" icon={RotateCcw}/><div className="pl-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">{continueWatching.map(c=>{const pct=c.duration_seconds?Math.min(100,Math.round(c.position_seconds/c.duration_seconds*100)):0;return <button key={c.id} type="button" onClick={e=>openVideo(c as unknown as PulseItem,e.currentTarget)} className="pl-card w-[min(78vw,210px)] shrink-0 snap-start text-left"><div className="relative"><img src={`https://img.youtube.com/vi/${c.youtube_video_id}/mqdefault.jpg`} alt="" loading="lazy" className="h-[106px] w-full object-cover" style={{borderRadius:"22px 22px 0 0"}}/><span className="absolute bottom-0 left-0 right-0 h-1" style={{background:"var(--pl-card-border)"}}><span className="block h-full" style={{width:`${pct}%`,background:"var(--pl-maths)"}}/></span><span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[9px] font-bold text-white">{pct}%</span></div><p className="pl-clamp2 p-3 text-xs font-semibold leading-4">{c.title}</p></button>})}</div></section>}

          <section className="mb-4"><SectionHeading title={libraryMode === "saved" ? "Saved lectures" : libraryMode === "completed" ? "Completed lectures" : "Quick actions"} subtitle={libraryMode === "saved" ? "Your personal revision shelf" : libraryMode === "completed" ? "Your finished learning history" : "Jump straight to what you need"}/><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"><ActionCard icon={Play} title="Study now" text="Start a lecture" onClick={startStudyNow}/><ActionCard icon={Bookmark} title="Saved" text={`${bookmarks.size} lectures`} onClick={()=>{setLibraryMode("saved");setTab("pulse");window.scrollTo({top:0,behavior:"smooth"})}}/><ActionCard icon={MessageCircle} title="Community" text="Ask & discuss" onClick={()=>goTab("feed")}/><ActionCard icon={CalendarDays} title="Progress" text="Review completed" onClick={()=>{setLibraryMode("completed");setTab("pulse");window.scrollTo({top:0,behavior:"smooth"})}}/></div></section>
        </>}

        {tab==="feed" && <div className="mb-4"><PulseComposer/></div>}

        {feed.isLoading && <FeedSkeleton/>}
        {feed.isError && <div className="pl-card p-7 text-center"><p className="text-sm" style={{color:"var(--pl-muted)"}}>Couldn't load Pulse right now.</p><button type="button" onClick={()=>feed.refetch()} className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold" style={{background:"var(--pl-maths)",color:"var(--pl-bg)"}}><RotateCcw className="h-3.5 w-3.5"/>Retry</button></div>}
        {!feed.isLoading && !feed.isError && visibleItems.length===0 && <div className="pl-card flex min-h-[300px] flex-col items-center justify-center p-8 text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl" style={{background:"var(--pl-bg-elevated)",border:"1px solid var(--pl-card-border)"}}><Search className="h-6 w-6" style={{color:"var(--pl-muted)"}}/></div><p className="mt-4 text-sm font-bold">No matching updates</p><p className="mt-1 max-w-xs text-xs leading-5" style={{color:"var(--pl-muted)"}}>Try another subject, clear the search or check back later.</p><button type="button" onClick={()=>{setSearchText("");setChip("all");setLibraryMode("all")}} className="mt-4 rounded-full border px-4 py-2 text-xs font-semibold" style={{borderColor:"var(--pl-card-border)"}}>Clear filters</button></div>}

        <div className="space-y-3">{visibleItems.map((item,idx)=>{const key=dayKey(item.created_at);const divider=key!==lastDay;lastDay=key;const style:CSSProperties=idx<8?{animationDelay:`${idx*45}ms`}:{};return <div key={`${item.item_type}-${item.id}`}>{divider&&<div className="mb-2 mt-5 flex items-center gap-2"><span className="pl-mono text-[10px] uppercase tracking-[.1em]" style={{color:"var(--pl-faint)"}}>{dayLabel(item.created_at)}</span><span className="h-px flex-1" style={{background:"var(--pl-card-border)"}}/></div>}{item.item_type==="video"?<VideoCard item={item} style={style} onOpen={openVideo} liked={videoLikeOverride[item.id]?.liked??videoLikedSet.has(item.id)} likeDelta={videoLikeOverride[item.id]?.delta??0} onLike={onVideoLike} saved={bookmarks.has(item.id)} completed={completed.has(item.id)} onBookmark={toggleBookmark} onComplete={toggleCompleted}/>:<PostCard item={item} style={style} liked={likeOverride[item.id]?.liked??likedSet.has(item.id)} likeDelta={likeOverride[item.id]?.delta??0} isAdmin={isAdmin} onLike={onLike} onShare={onShare} onDelete={onDelete}/>}</div>})}</div>
        <div ref={sentinel} className="h-10"/>{feed.isFetchingNextPage&&<p className="pl-mono py-3 text-center text-[10px]" style={{color:"var(--pl-faint)"}}>Loading more…</p>}
      </>}
    </main>

    {newCount>0&&<button type="button" onClick={()=>{window.scrollTo({top:0,behavior:"smooth"});setNewCount(0);feed.refetch()}} className="pl-mono fixed left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-[11px] font-bold shadow-xl" style={{bottom:82,background:"var(--pl-maths)",color:"var(--pl-bg)"}}><ArrowUp className="mr-1 inline h-3.5 w-3.5"/>{newCount} new update{newCount>1?"s":""}</button>}
    <nav className="pl-nav" aria-label="Pulse sections">{([{id:"pulse",label:"Pulse",Icon:LayoutGrid},{id:"feed",label:"Community",Icon:MessageCircle},{id:"squads",label:"Squads",Icon:Users},{id:"ranks",label:"Ranks",Icon:Trophy},{id:"profile",label:"You",Icon:User}] as const).map(({id,label,Icon})=><button key={id} type="button" data-active={tab===id} aria-current={tab===id?"page":undefined} onClick={()=>goTab(id)}><Icon className="h-[18px] w-[18px]"/><span className="pl-mono">{label}</span></button>)}</nav>
  </div>{modalVideo&&<PulseVideoModal video={modalVideo} currentUserId={user?.id??null} isAdmin={isAdmin} onClose={closeVideo}/>}</div>;
}

function MiniStat({icon:Icon,value,label}:{icon:typeof Clock3;value:string;label:string}){return <div className="rounded-xl p-2.5" style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)"}}><div className="flex items-center gap-1.5"><Icon className="h-3 w-3" style={{color:"#c4b5fd"}}/><span className="text-sm font-extrabold">{value}</span></div><p className="mt-0.5 text-[9px] uppercase tracking-wide" style={{color:"#8e99ad"}}>{label}</p></div>}
function SectionHeading({title,subtitle,icon:Icon=Sparkles}:{title:string;subtitle?:string;icon?:typeof Sparkles}){return <div className="mb-2.5 flex items-end justify-between gap-3"><div><h2 className="pl-head text-[15px] font-bold">{title}</h2>{subtitle&&<p className="mt-0.5 text-[10.5px]" style={{color:"var(--pl-muted)"}}>{subtitle}</p>}</div><Icon className="h-4 w-4 shrink-0" style={{color:"var(--pl-faint)"}}/></div>}
function ActionCard({icon:Icon,title,text,onClick}:{icon:typeof Play;title:string;text:string;onClick:()=>void}){return <button type="button" onClick={onClick} className="pl-card pl-lens min-w-0 p-3 text-left transition hover:-translate-y-0.5"><div className="flex items-center justify-between"><span className="pl-lens grid h-9 w-9 place-items-center rounded-xl" style={{background:"var(--pl-bg-elevated)",color:"var(--pl-maths)"}}><Icon className="h-4 w-4"/></span><ChevronRight className="h-4 w-4" style={{color:"var(--pl-faint)"}}/></div><p className="mt-3 truncate text-xs font-bold">{title}</p><p className="mt-0.5 truncate text-[10px]" style={{color:"var(--pl-muted)"}}>{text}</p></button>}
function FeedSkeleton(){return <div className="space-y-3">{[0,1,2].map(i=><div key={i} className="pl-card overflow-hidden" style={{height:280}}><div className="h-full w-full animate-pulse" style={{background:"linear-gradient(90deg,var(--pl-card),var(--pl-bg-elevated),var(--pl-card))"}}/></div>)}</div>}

function PulseComposer(){
  const qc=useQueryClient();const [body,setBody]=useState("");
  const post=useMutation({mutationFn:(b:string)=>createPost({data:{body:b}}),onSuccess:()=>{setBody("");haptic("light");toast.success("Posted to Pulse");qc.invalidateQueries({queryKey:["pulse-items"]});qc.invalidateQueries({queryKey:["feed-posts"]})},onError:(e:Error)=>toast.error(e.message||"Couldn't post that")});
  return <form className="pl-card mb-3 p-3" onSubmit={e=>{e.preventDefault();const t=body.trim();if(t)post.mutate(t)}}><div className="mb-2 flex items-center gap-2"><div className="pl-lens-icon grid h-8 w-8 place-items-center rounded-full" style={{background:"var(--pl-bg-elevated)",color:"var(--pl-maths)"}}><MessageCircle className="h-4 w-4"/></div><div><p className="text-xs font-bold">Share with the community</p><p className="text-[10px]" style={{color:"var(--pl-muted)"}}>Doubt, tip, resource or win</p></div></div><textarea aria-label="Share an update" value={body} onChange={e=>setBody(e.target.value)} placeholder="What's on your mind?" rows={3} maxLength={1000} className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none" style={{background:"var(--pl-bg-elevated)",border:"1px solid var(--pl-card-border)",color:"var(--pl-text)"}}/><div className="mt-2 flex items-center justify-between"><span className="pl-mono text-[10px]" style={{color:"var(--pl-faint)"}}>{body.length}/1000</span><button type="submit" disabled={!body.trim()||post.isPending} className="pl-lens inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold disabled:opacity-50" style={{background:"var(--pl-maths)",color:"var(--pl-bg)"}}>{post.isPending?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Send className="h-3.5 w-3.5"/>}{post.isPending?"Posting…":"Post"}</button></div></form>;
}

function VideoCard({item,style,onOpen,liked,likeDelta,onLike,saved,completed,onBookmark,onComplete}:{item:PulseItem;style?:CSSProperties;onOpen:(item:PulseItem,el?:HTMLElement|null)=>void;liked:boolean;likeDelta:number;onLike:(item:PulseItem)=>void;saved:boolean;completed:boolean;onBookmark:(id:string)=>void;onComplete:(id:string)=>void}){
  const [imgFailed,setImgFailed]=useState(false);const color=SUBJECT_COLOR[item.subject??""]??"var(--pl-maths)";const btn=useRef<HTMLButtonElement|null>(null);const likes=Math.max(0,item.like_count+likeDelta);
  return <article className="pl-card pl-enter w-full" style={{borderTop:`3px solid ${color}`,...style}}><button ref={btn} type="button" onClick={()=>onOpen(item,btn.current)} aria-label={`Play lecture: ${item.title??""}`} className="block w-full text-left"><span className="relative block w-full" style={{aspectRatio:"16 / 9",background:"var(--pl-bg-elevated)"}}>{!imgFailed?<img src={`https://img.youtube.com/vi/${item.youtube_video_id}/hqdefault.jpg`} alt="" loading="lazy" onError={()=>setImgFailed(true)} className="h-full w-full object-cover" style={{borderRadius:"22px 22px 0 0"}}/>:<span className="grid h-full w-full place-items-center"><Video className="h-8 w-8" style={{color:"var(--pl-faint)"}}/></span>}<span className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 shadow-xl"><Play className="h-5 w-5 fill-white text-white"/></span></span>{completed&&<span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[9px] font-bold text-white"><CheckCircle2 className="h-3 w-3"/>Done</span>}</span><span className="block p-3.5"><span className="flex items-center gap-2"><span className="pl-mono max-w-[55%] truncate rounded px-1.5 py-0.5 text-[9px] uppercase" style={{color,background:`color-mix(in srgb, ${color} 15%, transparent)`}}>{item.subject??"JEE"}</span><span className="pl-mono text-[10px]" style={{color:"var(--pl-faint)"}}>{timeAgo(item.created_at)}</span></span><span className="pl-head pl-clamp2 mt-2 block text-[15px] font-semibold leading-[1.3]">{item.title}</span>{item.chapter&&<span className="mt-1 block truncate text-[11.5px]" style={{color:"var(--pl-muted)"}}>{item.chapter}</span>}</span></button><div className="flex flex-wrap items-center gap-1 border-t px-2.5 py-2.5" style={{borderColor:"var(--pl-card-border)"}}><button type="button" onClick={()=>onLike(item)} className="pl-lens inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs" style={{color:liked?"var(--pl-danger)":"var(--pl-muted)"}} aria-label={liked?"Unlike lecture":"Like lecture"}><Heart className="h-4 w-4" fill={liked?"currentColor":"none"}/>{likes}</button><button type="button" onClick={()=>onOpen(item,btn.current)} className="pl-lens inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs" style={{color:"var(--pl-muted)"}} aria-label="Open lecture comments"><MessageCircle className="h-4 w-4"/>{item.comment_count}</button><button type="button" onClick={()=>onComplete(item.id)} className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs" style={{color:completed?"var(--pl-chemistry)":"var(--pl-muted)"}} aria-label={completed?"Mark incomplete":"Mark completed"}><Check className="h-4 w-4"/>{completed?"Done":"Done"}</button><button type="button" onClick={()=>onBookmark(item.id)} className="pl-lens grid h-9 w-9 place-items-center rounded-xl" style={{color:saved?"var(--pl-maths)":"var(--pl-muted)",background:saved?"color-mix(in srgb, var(--pl-maths) 12%, transparent)":"transparent"}} aria-label={saved?"Remove bookmark":"Save lecture"} aria-pressed={saved}><Bookmark className="h-4 w-4" fill={saved?"currentColor":"none"}/></button></div></article>;
}

function PostCard({item,style,liked,likeDelta,isAdmin,onLike,onShare,onDelete}:{item:PulseItem;style?:CSSProperties;liked:boolean;likeDelta:number;isAdmin:boolean;onLike:(i:PulseItem)=>void;onShare:(i:PulseItem)=>void;onDelete:(i:PulseItem)=>void}){
  const name=item.author_name??"Aspirant";const color=avatarColor(item.author_id??name);const likes=Math.max(0,item.like_count+likeDelta);
  return <article className="pl-card pl-enter relative w-full" style={{borderLeft:"3px solid var(--pl-maths)",...style}}>{isAdmin&&<button type="button" aria-label="Delete post" onClick={()=>onDelete(item)} className="absolute right-2 top-2 rounded-full p-1.5" style={{color:"var(--pl-faint)"}}><Trash2 className="h-3.5 w-3.5"/></button>}<div className="flex items-center gap-2.5 p-3.5 pb-2">{item.author_avatar_url?<img src={item.author_avatar_url} alt="" loading="lazy" className="h-9 w-9 rounded-full object-cover"/>:<span className="pl-head grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{background:color,color:"#10131C",fontWeight:700,fontSize:13}}>{name.slice(0,1).toUpperCase()}</span>}<div className="min-w-0"><div className="pl-head truncate text-[13.5px] font-semibold">{name}</div><div className="pl-mono text-[10px]" style={{color:"var(--pl-faint)"}}>{timeAgo(item.created_at)}</div></div></div>{item.body_text&&<div className="px-3.5 text-sm leading-[1.5]"><ExpandableText text={item.body_text} chars={260} className="pulse-post-body"/></div>}{item.image_url&&<img src={item.image_url} alt="" loading="lazy" className="mt-3 max-h-[340px] w-full object-cover" style={{borderRadius:"20px"}}/>}<div className="flex items-center gap-2 border-t px-3.5 py-2.5" style={{borderColor:"var(--pl-card-border)"}}><button type="button" onClick={()=>onLike(item)} className="pl-lens inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs" style={{color:liked?"var(--pl-danger)":"var(--pl-muted)"}}><Heart className="h-4 w-4" fill={liked?"currentColor":"none"}/>{likes}</button><Link to="/feed" className="pl-lens inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs" style={{color:"var(--pl-muted)"}}><MessageCircle className="h-4 w-4"/>{item.comment_count}</Link><button type="button" onClick={()=>onShare(item)} className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs" style={{color:"var(--pl-muted)"}}><Share2 className="h-4 w-4"/>Share</button></div></article>;
}
