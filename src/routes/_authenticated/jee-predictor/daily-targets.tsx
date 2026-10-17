import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, RefreshCw, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type Target={study_minutes:number;questions_target:number;questions_done:number;revision_target:number;revision_done:number;tests_target:number;tests_done:number};

export default function DailyTargetsPage(){
 const [data,setData]=useState<Target|null>(null),[minutes,setMinutes]=useState("180"),[questions,setQuestions]=useState("30"),[revision,setRevision]=useState("2"),[tests,setTests]=useState("1"),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const date=new Date().toISOString().slice(0,10);
 const load=async()=>{setLoading(true);const {data:r,error:e}=await (supabase as any).rpc("get_jee_daily_target",{_date:date});if(e)setError(e.message);else if(r?.target){setData(r.target);setMinutes(String(r.target.study_minutes));setQuestions(String(r.target.questions_target));setRevision(String(r.target.revision_target));setTests(String(r.target.tests_target));}setLoading(false)};
 useEffect(()=>{void load()},[]);
 const save=async()=>{setSaving(true);const {data:r,error:e}=await (supabase as any).rpc("upsert_jee_daily_target",{_date:date,_study_minutes:+minutes||0,_questions_target:+questions||0,_revision_target:+revision||0,_tests_target:+tests||0,_notes:null});if(e)setError(e.message);else setData(r?.target??null);setSaving(false)};
 const progress=useMemo(()=>{if(!data)return 0;const parts=[data.study_minutes?Math.min(1,data.study_minutes/Math.max(1,+minutes)):0,data.questions_target?Math.min(1,data.questions_done/data.questions_target):0,data.revision_target?Math.min(1,data.revision_done/data.revision_target):0,data.tests_target?Math.min(1,data.tests_done/data.tests_target):0].filter(x=>x>0);return parts.length?Math.round(parts.reduce((a,b)=>a+b,0)/parts.length*100):0},[data,minutes]);
 const bump=async(field:"questions_done"|"revision_done"|"tests_done")=>{if(!data)return;const next={questions_done:data.questions_done,revision_done:data.revision_done,tests_done:data.tests_done};next[field]++;const {error:e}=await (supabase as any).rpc("update_jee_daily_target_progress",{_date:date,_study_minutes:data.study_minutes,_questions_done:next.questions_done,_revision_done:next.revision_done,_tests_done:next.tests_done});if(e)setError(e.message);else await load()};
 return <div className="min-h-screen bg-background"><div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" asChild><Link to="/jee-predictor"><ArrowLeft className="h-5 w-5"/></Link></Button><div><div className="flex items-center gap-2"><Target className="h-5 w-5"/><h1 className="text-2xl font-bold">Daily Targets</h1></div><p className="text-sm text-muted-foreground">Set today's measurable JEE study targets.</p></div></div><Button variant="outline" onClick={()=>void load()}><RefreshCw className="mr-2 h-4 w-4"/>Refresh</Button></div>
  {error&&<Card><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card>}
  <Card><CardHeader><CardTitle>Today's target</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-4"><Input type="number" min="0" value={minutes} onChange={e=>setMinutes(e.target.value)} placeholder="Study minutes"/><Input type="number" min="0" value={questions} onChange={e=>setQuestions(e.target.value)} placeholder="Questions"/><Input type="number" min="0" value={revision} onChange={e=>setRevision(e.target.value)} placeholder="Revisions"/><Input type="number" min="0" value={tests} onChange={e=>setTests(e.target.value)} placeholder="Tests"/><Button className="sm:col-span-4" onClick={()=>void save()} disabled={saving}>Save Today's Targets</Button></CardContent></Card>
  <Card><CardContent className="space-y-4 p-5"><div className="flex justify-between"><span className="font-medium">Today's progress</span><span className="font-bold">{progress}%</span></div><Progress value={progress}/></CardContent></Card>
  <div className="grid gap-4 md:grid-cols-3">{[["Questions",data?.questions_done??0,data?.questions_target??+questions,"questions_done"],["Revisions",data?.revision_done??0,data?.revision_target??+revision,"revision_done"],["Tests",data?.tests_done??0,data?.tests_target??+tests,"tests_done"]].map(([label,done,target,key])=><Card key={String(key)}><CardContent className="p-5"><div className="text-sm text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-bold">{done} / {target}</div><Button className="mt-4 w-full" variant="outline" onClick={()=>void bump(key as any)} disabled={Number(done)>=Number(target)}><CheckCircle2 className="mr-2 h-4 w-4"/>Mark +1</Button></CardContent></Card>)}</div>
 </div></div>
}
