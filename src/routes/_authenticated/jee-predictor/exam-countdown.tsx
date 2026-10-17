import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, Plus, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Milestone={id:string;title:string;exam:string;exam_date:string;notes:string|null};

function daysLeft(date:string){
 const today=new Date(); today.setHours(0,0,0,0);
 const d=new Date(`${date}T00:00:00`);
 return Math.ceil((d.getTime()-today.getTime())/86400000);
}

export default function ExamCountdownPage(){
 const [items,setItems]=useState<Milestone[]>([]),[title,setTitle]=useState(""),[date,setDate]=useState(""),[exam,setExam]=useState("JEE_MAIN"),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const load=async()=>{setLoading(true);const {data,error:e}=await (supabase as any).rpc("get_jee_exam_milestones");if(e)setError(e.message);else setItems((data?.milestones??[]) as Milestone[]);setLoading(false)};
 useEffect(()=>{void load()},[]);
 const next=useMemo(()=>items.filter(x=>daysLeft(x.exam_date)>=0).sort((a,b)=>daysLeft(a.exam_date)-daysLeft(b.exam_date))[0], [items]);
 const add=async()=>{if(!title.trim()||!date)return;setSaving(true);setError("");const {error:e}=await (supabase as any).rpc("add_jee_exam_milestone",{_title:title.trim(),_exam:exam,_exam_date:date,_notes:null});if(e)setError(e.message);else{setTitle("");setDate("");await load()}setSaving(false)};
 const remove=async(id:string)=>{const {error:e}=await (supabase as any).rpc("delete_jee_exam_milestone",{_id:id});if(e)setError(e.message);else await load()};
 return <div className="min-h-screen bg-background"><div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
  <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" asChild><Link to="/jee-predictor"><ArrowLeft className="h-5 w-5"/></Link></Button><div><div className="flex items-center gap-2"><CalendarClock className="h-5 w-5"/><h1 className="text-2xl font-bold">Exam Countdown</h1></div><p className="text-sm text-muted-foreground">Keep important JEE and academic dates in one place.</p></div></div><Button variant="outline" onClick={()=>void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading?"animate-spin":""}`}/>Refresh</Button></div>
  {error&&<Card><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card>}
  {next&&<Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">Next milestone</div><div className="mt-1 flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{next.title}</h2><Badge>{next.exam.replace("_"," ")}</Badge></div><div className="mt-4 text-4xl font-bold">{daysLeft(next.exam_date)} <span className="text-base font-normal text-muted-foreground">days remaining</span></div><p className="mt-1 text-sm text-muted-foreground">{new Date(`${next.exam_date}T00:00:00`).toLocaleDateString(undefined,{day:"numeric",month:"long",year:"numeric"})}</p></CardContent></Card>}
  <Card><CardHeader><CardTitle>Add milestone</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]"><Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="JEE Main 2027"/><Select value={exam} onValueChange={setExam}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="JEE_MAIN">JEE Main</SelectItem><SelectItem value="JEE_ADVANCED">JEE Advanced</SelectItem><SelectItem value="BOARDS">Boards</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select><Input type="date" value={date} onChange={e=>setDate(e.target.value)}/><Button onClick={()=>void add()} disabled={saving||!title.trim()||!date}><Plus className="mr-2 h-4 w-4"/>Add</Button></CardContent></Card>
  <div className="space-y-3">{items.map(x=>{const d=daysLeft(x.exam_date);return <Card key={x.id}><CardContent className="flex items-center justify-between gap-4 p-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{x.title}</h3><Badge variant="secondary">{x.exam.replace("_"," ")}</Badge></div><p className="text-sm text-muted-foreground">{new Date(`${x.exam_date}T00:00:00`).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}</p></div><div className="flex items-center gap-3"><span className={`text-sm font-semibold ${d<0?"text-muted-foreground":""}`}>{d<0?"Passed":`${d} days`}</span><Button variant="ghost" size="icon" onClick={()=>void remove(x.id)}><Trash2 className="h-4 w-4"/></Button></div></CardContent></Card>})}</div>
  {!loading&&!items.length&&<Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No exam milestones added yet.</CardContent></Card>}
 </div></div>
}
