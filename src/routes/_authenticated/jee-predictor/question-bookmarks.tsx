import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Bookmark, CheckCircle2, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type BookmarkRow={id:string;question_id:string;note:string|null;status:string;created_at:string};

export default function QuestionBookmarksPage(){
 const [items,setItems]=useState<BookmarkRow[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const load=async()=>{setLoading(true);const {data,error:e}=await (supabase as any).rpc("get_jee_question_bookmarks",{_status:null});if(e)setError(e.message);else setItems((data?.bookmarks??[]) as BookmarkRow[]);setLoading(false)};
 useEffect(()=>{void load()},[]);
 const review=async(id:string)=>{const {error:e}=await (supabase as any).rpc("update_jee_question_bookmark",{_id:id,_status:"REVIEWED",_note:null});if(e)setError(e.message);else await load()};
 const remove=async(id:string)=>{const {error:e}=await (supabase as any).rpc("delete_jee_question_bookmark",{_id:id});if(e)setError(e.message);else await load()};
 return <div className="min-h-screen bg-background"><div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
  <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" asChild><Link to="/jee-predictor"><ArrowLeft className="h-5 w-5"/></Link></Button><div><div className="flex items-center gap-2"><Bookmark className="h-5 w-5"/><h1 className="text-2xl font-bold">Question Review Queue</h1></div><p className="text-sm text-muted-foreground">Keep important PYQs bookmarked for later review.</p></div></div><Button variant="outline" onClick={()=>void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading?"animate-spin":""}`}/>Refresh</Button></div>
  {error&&<Card><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card>}
  <Card><CardHeader><CardTitle>{items.length} bookmarked questions</CardTitle></CardHeader><CardContent className="space-y-3">
   {items.map(x=><div key={x.id} className="flex items-center justify-between gap-4 rounded-xl border p-4"><div><div className="flex items-center gap-2"><span className="font-medium">Question {x.question_id.slice(0,8)}…</span><Badge variant={x.status==="REVIEWED"?"secondary":"default"}>{x.status}</Badge></div>{x.note&&<p className="mt-1 text-sm text-muted-foreground">{x.note}</p>}</div><div className="flex gap-2">{x.status!=="REVIEWED"&&<Button size="sm" variant="outline" onClick={()=>void review(x.id)}><CheckCircle2 className="mr-2 h-4 w-4"/>Reviewed</Button>}<Button size="icon" variant="ghost" onClick={()=>void remove(x.id)}><Trash2 className="h-4 w-4"/></Button></div></div>)}
   {!loading&&!items.length&&<div className="py-12 text-center text-sm text-muted-foreground">No bookmarked questions yet. Bookmark questions from the PYQ/question experience to build your review queue.</div>}
  </CardContent></Card>
 </div></div>
}
