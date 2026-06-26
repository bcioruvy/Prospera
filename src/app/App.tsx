import { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard, ArrowLeftRight, BarChart3, Target, PiggyBank,
  FileText, Settings, ChevronLeft, ChevronRight, Sun, Moon, LogOut,
  Plus, Search, ArrowUpRight, ArrowDownRight, Eye, EyeOff, X,
  Edit2, Trash2, Download, User, AlertTriangle, Calendar,
  Filter, Zap, Shield, Star, Bell, Check, Wallet, TrendingUp,
  Plane, Home, Laptop, DollarSign, Mail, Lock, CreditCard,
  RefreshCw, ChevronDown, MoreHorizontal, Banknote, Building2,
  Globe, Camera, Leaf, CheckCircle2, Circle,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Progress } from "./components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { cn } from "./components/ui/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "dashboard" | "transactions" | "analytics" | "budgets" | "goals" | "reports" | "settings";

interface Transaction {
  id: string; type: "income" | "expense"; category: string;
  amount: number; date: string; notes: string;
  tags: string[]; paymentMethod: string; account: string;
}
interface Budget { id: string; category: string; limit: number; spent: number; }
interface Goal { id: string; name: string; targetAmount: number; currentAmount: number; deadline: string; color: string; icon: string; }
interface TxForm { type: "income" | "expense"; category: string; amount: string; date: string; notes: string; tags: string; paymentMethod: string; account: string; }
interface BudgetForm { category: string; limit: string; }
interface GoalForm { name: string; targetAmount: string; currentAmount: string; deadline: string; color: string; icon: string; }

// ─── Constants ────────────────────────────────────────────────────────────────

const INCOME_CATS = ["Salary","Bonus","Overtime","Freelance","Investment Returns","Rental Income","Gift Received","Refund","Other Income"];
const EXPENSE_CATS = ["Food & Dining","Groceries","Transportation","Fuel","Utilities","Internet","Mobile Package","Rent","Mortgage","Healthcare","Insurance","Education","Clothing","Entertainment","Subscriptions","Travel","Family Support","Charity","Personal Care","Shopping","Fitness","Emergency","Miscellaneous"];
const PAYMENT_METHODS = ["Cash","Bank Transfer","Credit Card","Debit Card","Digital Wallet","Direct Deposit"];
const ACCOUNTS_LIST = ["Cash","Bank Account","Savings Account","Wallet","Credit Card"];
const GOAL_ICONS = ["shield","plane","laptop","home","star","zap"];
const GOAL_COLORS = ["#10b981","#6366f1","#f59e0b","#ec4899","#3b82f6","#f97316"];

const CAT_COLORS: Record<string, string> = {
  "Food & Dining":"#f97316","Groceries":"#84cc16","Transportation":"#3b82f6","Fuel":"#facc15",
  "Utilities":"#8b5cf6","Internet":"#60a5fa","Rent":"#ec4899","Healthcare":"#ef4444",
  "Education":"#fb923c","Entertainment":"#f59e0b","Shopping":"#06b6d4","Subscriptions":"#e879f9",
  "Fitness":"#22d3ee","Personal Care":"#a78bfa","Salary":"#10b981","Freelance":"#6366f1",
  "Investment Returns":"#14b8a6","Refund":"#34d399","Bonus":"#4ade80","Travel":"#38bdf8",
  "Mortgage":"#f43f5e","Insurance":"#a3e635","Emergency":"#ff6b6b","Miscellaneous":"#94a3b8",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INIT_TX: Transaction[] = [
  {id:"1",type:"income",category:"Salary",amount:5500,date:"2026-06-01",notes:"Monthly salary — June 2026",tags:["work"],paymentMethod:"Direct Deposit",account:"Bank Account"},
  {id:"2",type:"expense",category:"Rent",amount:1200,date:"2026-06-02",notes:"June rent payment",tags:["housing"],paymentMethod:"Bank Transfer",account:"Bank Account"},
  {id:"3",type:"expense",category:"Groceries",amount:187.5,date:"2026-06-03",notes:"Weekly groceries — Whole Foods",tags:["food"],paymentMethod:"Debit Card",account:"Bank Account"},
  {id:"4",type:"expense",category:"Food & Dining",amount:64.2,date:"2026-06-05",notes:"Dinner with friends",tags:["social"],paymentMethod:"Credit Card",account:"Credit Card"},
  {id:"5",type:"expense",category:"Transportation",amount:89,date:"2026-06-06",notes:"Monthly subway pass",tags:["commute"],paymentMethod:"Digital Wallet",account:"Wallet"},
  {id:"6",type:"expense",category:"Subscriptions",amount:45.97,date:"2026-06-07",notes:"Netflix, Spotify, Adobe CC",tags:["subscriptions"],paymentMethod:"Credit Card",account:"Credit Card"},
  {id:"7",type:"income",category:"Freelance",amount:800,date:"2026-06-08",notes:"UI design project — Acme Corp",tags:["freelance"],paymentMethod:"Bank Transfer",account:"Bank Account"},
  {id:"8",type:"expense",category:"Healthcare",amount:125,date:"2026-06-10",notes:"Annual checkup co-pay",tags:["health"],paymentMethod:"Credit Card",account:"Credit Card"},
  {id:"9",type:"expense",category:"Utilities",amount:142.33,date:"2026-06-11",notes:"Electricity + water bill",tags:["utilities"],paymentMethod:"Bank Transfer",account:"Bank Account"},
  {id:"10",type:"expense",category:"Internet",amount:79.99,date:"2026-06-12",notes:"Fiber internet — monthly",tags:["utilities"],paymentMethod:"Bank Transfer",account:"Bank Account"},
  {id:"11",type:"expense",category:"Shopping",amount:215.4,date:"2026-06-14",notes:"New running shoes — Nike",tags:["shopping"],paymentMethod:"Credit Card",account:"Credit Card"},
  {id:"12",type:"expense",category:"Fitness",amount:55,date:"2026-06-15",notes:"Gym membership — June",tags:["health"],paymentMethod:"Bank Transfer",account:"Bank Account"},
  {id:"13",type:"income",category:"Investment Returns",amount:320,date:"2026-06-17",notes:"ETF dividend payout Q2",tags:["investment"],paymentMethod:"Direct Deposit",account:"Savings Account"},
  {id:"14",type:"expense",category:"Education",amount:49,date:"2026-06-18",notes:"Udemy — TypeScript Advanced",tags:["learning"],paymentMethod:"Credit Card",account:"Credit Card"},
  {id:"15",type:"expense",category:"Food & Dining",amount:38.75,date:"2026-06-20",notes:"Team lunch meeting",tags:["work"],paymentMethod:"Cash",account:"Cash"},
  {id:"16",type:"expense",category:"Personal Care",amount:82,date:"2026-06-21",notes:"Haircut + grooming products",tags:["personal"],paymentMethod:"Cash",account:"Cash"},
  {id:"17",type:"expense",category:"Entertainment",amount:96,date:"2026-06-22",notes:"Concert tickets — The National",tags:["entertainment"],paymentMethod:"Credit Card",account:"Credit Card"},
  {id:"18",type:"income",category:"Refund",amount:45,date:"2026-06-23",notes:"Amazon return — HDMI cable",tags:["refund"],paymentMethod:"Direct Deposit",account:"Bank Account"},
  {id:"19",type:"expense",category:"Groceries",amount:203.18,date:"2026-06-24",notes:"Weekly groceries + household",tags:["food"],paymentMethod:"Debit Card",account:"Bank Account"},
  {id:"20",type:"expense",category:"Fuel",amount:68.5,date:"2026-06-25",notes:"Gas station — full tank",tags:["transport"],paymentMethod:"Credit Card",account:"Credit Card"},
];

const INIT_BUDGETS: Budget[] = [
  {id:"1",category:"Food & Dining",limit:300,spent:102.95},
  {id:"2",category:"Groceries",limit:500,spent:390.68},
  {id:"3",category:"Transportation",limit:200,spent:157.5},
  {id:"4",category:"Entertainment",limit:150,spent:96},
  {id:"5",category:"Shopping",limit:200,spent:215.4},
  {id:"6",category:"Subscriptions",limit:60,spent:45.97},
  {id:"7",category:"Fitness",limit:100,spent:55},
  {id:"8",category:"Healthcare",limit:200,spent:125},
];

const INIT_GOALS: Goal[] = [
  {id:"1",name:"Emergency Fund",targetAmount:15000,currentAmount:8750,deadline:"2026-12-31",color:"#10b981",icon:"shield"},
  {id:"2",name:"Vacation to Japan",targetAmount:5000,currentAmount:1850,deadline:"2027-03-01",color:"#6366f1",icon:"plane"},
  {id:"3",name:"New MacBook Pro",targetAmount:3500,currentAmount:2100,deadline:"2026-09-01",color:"#f59e0b",icon:"laptop"},
  {id:"4",name:"House Down Payment",targetAmount:50000,currentAmount:12400,deadline:"2029-01-01",color:"#ec4899",icon:"home"},
];

const MONTHLY_DATA = [
  {month:"Jan",income:5500,expenses:3850,savings:1650},
  {month:"Feb",income:5500,expenses:3200,savings:2300},
  {month:"Mar",income:6300,expenses:4100,savings:2200},
  {month:"Apr",income:5500,expenses:3650,savings:1850},
  {month:"May",income:6100,expenses:3900,savings:2200},
  {month:"Jun",income:6665,expenses:3041,savings:3624},
];

const SPENDING_DATA = [
  {name:"Rent",value:1200},{name:"Groceries",value:390.68},{name:"Shopping",value:215.4},
  {name:"Utilities",value:222.32},{name:"Food & Dining",value:102.95},{name:"Transportation",value:157.5},
  {name:"Entertainment",value:96},{name:"Other",value:651.6},
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CURRENCIES: Record<string, {code:string, locale:string}> = {
  USD:{code:"USD",locale:"en-US"}, EUR:{code:"EUR",locale:"de-DE"},
  GBP:{code:"GBP",locale:"en-GB"}, JPY:{code:"JPY",locale:"ja-JP"},
  CAD:{code:"CAD",locale:"en-CA"}, AUD:{code:"AUD",locale:"en-AU"},
  PKR:{code:"PKR",locale:"en-PK"},
};
let activeCurrency = "PKR";
const fmt = (n: number) => { const c=CURRENCIES[activeCurrency]; return new Intl.NumberFormat(c.locale,{style:"currency",currency:c.code,maximumFractionDigits:0}).format(n); };
const fmtD = (n: number) => { const c=CURRENCIES[activeCurrency]; return new Intl.NumberFormat(c.locale,{style:"currency",currency:c.code,minimumFractionDigits:2,maximumFractionDigits:2}).format(n); };

const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
const uid = () => Math.random().toString(36).slice(2,10);
const catColor = (c: string) => CAT_COLORS[c] || "#94a3b8";

const emptyTxForm = (): TxForm => ({
  type:"expense", category:"", amount:"",
  date: new Date().toISOString().split("T")[0],
  notes:"", tags:"", paymentMethod:"Bank Transfer", account:"Bank Account",
});

// ─── Micro-components ─────────────────────────────────────────────────────────

const ChartTip = ({active,payload,label}:any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#111c2d] border border-black/10 dark:border-white/10 rounded-xl p-3 shadow-xl text-sm min-w-[160px]">
      {label && <p className="font-semibold text-[#0d1b2e] dark:text-slate-100 mb-2">{label}</p>}
      {payload.map((p:any,i:number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:p.color||p.fill}}/>
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-semibold font-mono text-[#0d1b2e] dark:text-slate-100">{fmtD(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const PieTip = ({active,payload}:any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const total = SPENDING_DATA.reduce((s,d)=>s+d.value,0);
  return (
    <div className="bg-white dark:bg-[#111c2d] border border-black/10 dark:border-white/10 rounded-xl p-3 shadow-xl text-sm">
      <p className="font-semibold text-[#0d1b2e] dark:text-slate-100">{p.name}</p>
      <p className="font-mono text-lg font-semibold" style={{color:p.payload.fill}}>{fmtD(p.value)}</p>
      <p className="text-slate-400 text-xs">{((p.value/total)*100).toFixed(1)}% of spending</p>
    </div>
  );
};

function GoalIcon({icon,size=18}:{icon:string;size?:number}) {
  const map:Record<string,any> = {shield:Shield,plane:Plane,laptop:Laptop,home:Home,star:Star,zap:Zap};
  const I = map[icon]||Star;
  return <I size={size}/>;
}

function StatCard({label,value,sub,icon:Icon,trend,iconBg}:{label:string;value:string;sub?:string;icon:any;trend?:number;iconBg:string}) {
  return (
    <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:iconBg}}>
          <Icon size={17} className="text-white"/>
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight font-mono" style={{fontFamily:"'DM Mono',monospace"}}>{value}</div>
        {sub && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</div>}
      </div>
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 text-xs font-semibold", trend >= 0 ? "text-emerald-500" : "text-red-500")}>
          {trend >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────

function AuthScreen({onAuth}:{onAuth:()=>void}) {
  const [tab, setTab] = useState<"signin"|"signup">("signin");
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({name:"",email:"alex.morgan@gmail.com",password:"••••••••",confirm:""});

  const handle = (e:React.FormEvent) => { e.preventDefault(); onAuth(); };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-[#0d1b2e] p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{background:"radial-gradient(ellipse at 20% 50%, #10b981 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #6366f1 0%, transparent 50%)"}}/>
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Leaf size={18} className="text-white"/>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">Prospera</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">Your finances,<br/>perfectly clear.</h2>
          <p className="text-slate-400 text-sm leading-relaxed">Track income, control spending, hit savings goals — all in one elegant dashboard built for professionals.</p>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            {icon:TrendingUp,label:"Smart spending insights"},
            {icon:Target,label:"Budget tracking & alerts"},
            {icon:PiggyBank,label:"Savings goals progress"},
          ].map(({icon:Icon,label}) => (
            <div key={label} className="flex items-center gap-3 text-slate-300 text-sm">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Icon size={14} className="text-emerald-400"/>
              </div>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f8fafc] dark:bg-[#0a1120]">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Leaf size={16} className="text-white"/>
            </div>
            <span className="text-xl font-bold">Prospera</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#0d1b2e] dark:text-slate-100 mb-1">
              {tab === "signin" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-slate-500 text-sm">
              {tab === "signin" ? "Sign in to your Prospera account" : "Start your financial journey today"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6">
            {(["signin","signup"] as const).map(t => (
              <button key={t} onClick={()=>setTab(t)}
                className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                  tab===t ? "bg-white dark:bg-[#111c2d] text-[#0d1b2e] dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}>
                {t==="signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handle} className="space-y-4">
            {tab === "signup" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <Input className="pl-10 bg-white dark:bg-[#162032] border-slate-200 dark:border-white/10 h-11" placeholder="Alex Morgan" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <Input type="email" className="pl-10 bg-white dark:bg-[#162032] border-slate-200 dark:border-white/10 h-11" placeholder="you@example.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                {tab==="signin" && <button type="button" className="text-xs text-emerald-600 hover:text-emerald-500 font-medium">Forgot password?</button>}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <Input type={showPw?"text":"password"} className="pl-10 pr-10 bg-white dark:bg-[#162032] border-slate-200 dark:border-white/10 h-11" placeholder="••••••••" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            {tab==="signup" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <Input type="password" className="pl-10 bg-white dark:bg-[#162032] border-slate-200 dark:border-white/10 h-11" placeholder="••••••••"/>
                </div>
              </div>
            )}

            <button type="submit" className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-xl transition-colors mt-2">
              {tab==="signin" ? "Sign In" : "Create Account"}
            </button>

            <div className="relative flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"/>
              <span className="text-xs text-slate-400 font-medium">or continue with</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"/>
            </div>

            <button type="button" className="w-full h-11 flex items-center justify-center gap-2.5 bg-white dark:bg-[#162032] border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors font-semibold text-sm text-slate-700 dark:text-slate-200">
              <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
  {id:"dashboard",label:"Dashboard",icon:LayoutDashboard},
  {id:"transactions",label:"Transactions",icon:ArrowLeftRight},
  {id:"analytics",label:"Analytics",icon:BarChart3},
  {id:"budgets",label:"Budgets",icon:Target},
  {id:"goals",label:"Goals & Savings",icon:PiggyBank},
  {id:"reports",label:"Reports",icon:FileText},
  {id:"settings",label:"Settings",icon:Settings},
] as const;

function Sidebar({view,setView,collapsed,setCollapsed,isDark,setIsDark,onLogout}:{
  view:View; setView:(v:View)=>void; collapsed:boolean; setCollapsed:(v:boolean)=>void;
  isDark:boolean; setIsDark:(v:boolean)=>void; onLogout:()=>void;
}) {
  return (
    <aside className={cn(
      "flex flex-col bg-[#0d1b2e] h-screen flex-shrink-0 transition-all duration-300 ease-in-out relative z-20",
      collapsed ? "w-[68px]" : "w-[240px]"
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <Leaf size={16} className="text-white"/>
        </div>
        {!collapsed && <span className="ml-3 text-white font-bold text-lg tracking-tight">Prospera</span>}
        <button
          onClick={()=>setCollapsed(!collapsed)}
          className="ml-auto w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV.map(({id,label,icon:Icon}) => {
          const active = view === id;
          return (
            <button key={id} onClick={()=>setView(id as View)}
              title={collapsed ? label : undefined}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 text-left",
                active
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
              )}>
              <Icon size={18} className="flex-shrink-0"/>
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"/>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-3 space-y-1 flex-shrink-0">
        <button
          onClick={()=>setIsDark(!isDark)}
          title={collapsed ? (isDark?"Light mode":"Dark mode") : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 text-sm font-semibold transition-colors"
        >
          {isDark ? <Sun size={18} className="flex-shrink-0"/> : <Moon size={18} className="flex-shrink-0"/>}
          {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">AM</div>
            <div className="flex-1 min-w-0">
              <div className="text-slate-200 text-sm font-semibold truncate">Alex Morgan</div>
              <div className="text-slate-500 text-xs truncate">alex.morgan@gmail.com</div>
            </div>
          </div>
        )}

        <button onClick={onLogout}
          title={collapsed ? "Sign out" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 text-sm font-semibold transition-colors">
          <LogOut size={18} className="flex-shrink-0"/>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardView({transactions,budgets,setView}:{transactions:Transaction[];budgets:Budget[];setView:(v:View)=>void}) {
  const income = transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expenses = transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const savings = income - expenses;
  const balance = 12840 + savings;
  const budgetUsed = budgets.reduce((s,b)=>s+b.spent,0);
  const budgetTotal = budgets.reduce((s,b)=>s+b.limit,0);

  const recent = [...transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);

  const spendingPie = SPENDING_DATA.map((d,i)=>({...d,fill:Object.values(CAT_COLORS)[i%Object.values(CAT_COLORS).length]}));
  const totalSpend = SPENDING_DATA.reduce((s,d)=>s+d.value,0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0d1b2e] dark:text-slate-100">Good morning, Alex 👋</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Here's your financial overview for June 2026</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setView("transactions")} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus size={16}/> Add Transaction
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Balance" value={fmt(balance)} sub="Across all accounts" icon={Wallet} trend={8.2} iconBg="#059669"/>
        <StatCard label="Monthly Income" value={fmt(income)} sub="June 2026" icon={ArrowUpRight} trend={8.5} iconBg="#6366f1"/>
        <StatCard label="Monthly Expenses" value={fmt(expenses)} sub="June 2026" icon={ArrowDownRight} trend={-3.2} iconBg="#ef4444"/>
        <StatCard label="Savings" value={fmt(savings)} sub="Net this month" icon={PiggyBank} trend={22.4} iconBg="#f59e0b"/>
        <StatCard label="Budget Used" value={`${Math.round((budgetUsed/budgetTotal)*100)}%`} sub={`${fmt(budgetUsed)} of ${fmt(budgetTotal)}`} icon={Target} iconBg="#ec4899"/>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-[#0d1b2e] dark:text-slate-100">Income vs Expenses</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
            </div>
            <div className="flex gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-emerald-500 inline-block"/><span>Income</span></span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-red-400 inline-block"/><span>Expenses</span></span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_DATA} margin={{top:4,right:4,bottom:0,left:0}}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.2}/>
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}k`}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#gIncome)"/>
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f87171" strokeWidth={2} fill="url(#gExpense)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
          <h3 className="font-bold text-[#0d1b2e] dark:text-slate-100 mb-1">Spending Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">June 2026</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={spendingPie} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={2} stroke="transparent">
                {spendingPie.map((d,i)=><Cell key={i} fill={d.fill}/>)}
              </Pie>
              <Tooltip content={<PieTip/>}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {spendingPie.slice(0,4).map(d=>(
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:d.fill}}/>
                <span className="text-slate-500 dark:text-slate-400 flex-1">{d.name}</span>
                <span className="font-semibold font-mono text-[#0d1b2e] dark:text-slate-200">{fmt(d.value)}</span>
                <span className="text-slate-400 w-10 text-right">{((d.value/totalSpend)*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent transactions */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0d1b2e] dark:text-slate-100">Recent Transactions</h3>
            <button onClick={()=>setView("transactions")} className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold">View all</button>
          </div>
          <div className="space-y-1">
            {recent.map(tx=>(
              <div key={tx.id} className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${catColor(tx.category)}20`}}>
                  <span className="text-sm" style={{color:catColor(tx.category)}}>
                    {tx.type==="income" ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0d1b2e] dark:text-slate-200 truncate">{tx.category}</div>
                  <div className="text-xs text-slate-400 truncate">{tx.notes || tx.account}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={cn("font-bold font-mono text-sm", tx.type==="income" ? "text-emerald-500" : "text-red-500")}>
                    {tx.type==="income" ? "+" : "-"}{fmtD(tx.amount)}
                  </div>
                  <div className="text-xs text-slate-400">{fmtDate(tx.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget progress */}
        <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0d1b2e] dark:text-slate-100">Budget Progress</h3>
            <button onClick={()=>setView("budgets")} className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold">Manage</button>
          </div>
          <div className="space-y-4">
            {budgets.slice(0,5).map(b=>{
              const pct = Math.min((b.spent/b.limit)*100,100);
              const over = b.spent > b.limit;
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#0d1b2e] dark:text-slate-200">{b.category}</span>
                    <span className={cn("font-mono font-semibold", over ? "text-red-500" : "text-slate-400")}>
                      {fmt(b.spent)} / {fmt(b.limit)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,background:over?"#ef4444":catColor(b.category)}}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Financial health score */}
          <div className="mt-5 pt-4 border-t border-black/[0.05] dark:border-white/[0.05]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Financial Health</span>
              <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                <Zap size={12}/> 78/100
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{width:"78%"}}/>
            </div>
            <p className="text-xs text-slate-400 mt-2">Great progress! Reduce dining spending to reach 85+.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Transaction Modal ────────────────────────────────────────────────────────

function TxModal({open,onClose,tx,onSave}:{open:boolean;onClose:()=>void;tx:Transaction|null;onSave:(t:Transaction)=>void}) {
  const [form, setForm] = useState<TxForm>(tx ? {
    type:tx.type,category:tx.category,amount:String(tx.amount),date:tx.date,
    notes:tx.notes,tags:tx.tags.join(", "),paymentMethod:tx.paymentMethod,account:tx.account,
  } : emptyTxForm());

  useEffect(()=>{
    setForm(tx ? {type:tx.type,category:tx.category,amount:String(tx.amount),date:tx.date,
      notes:tx.notes,tags:tx.tags.join(", "),paymentMethod:tx.paymentMethod,account:tx.account}
      : emptyTxForm());
  },[tx,open]);

  const cats = form.type === "income" ? INCOME_CATS : EXPENSE_CATS;

  const submit = (e:React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.amount || !form.date) return;
    onSave({
      id: tx?.id || uid(),
      type: form.type,
      category: form.category,
      amount: parseFloat(form.amount),
      date: form.date,
      notes: form.notes,
      tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean),
      paymentMethod: form.paymentMethod,
      account: form.account,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-[#111c2d] border-black/10 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="text-[#0d1b2e] dark:text-slate-100">{tx ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl">
            {(["expense","income"] as const).map(t=>(
              <button key={t} type="button" onClick={()=>setForm(f=>({...f,type:t,category:""}))}
                className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize",
                  form.type===t
                    ? t==="income" ? "bg-emerald-500 text-white shadow-sm" : "bg-red-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}>{t}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Category</label>
              <Select value={form.category} onValueChange={v=>setForm(f=>({...f,category:v}))}>
                <SelectTrigger className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm">
                  <SelectValue placeholder="Select..."/>
                </SelectTrigger>
                <SelectContent>
                  {cats.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">$</span>
                <Input type="number" min="0" step="0.01" className="pl-7 h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 font-mono text-sm" placeholder="0.00" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required/>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Date</label>
              <Input type="date" className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Account</label>
              <Select value={form.account} onValueChange={v=>setForm(f=>({...f,account:v}))}>
                <SelectTrigger className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm">
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNTS_LIST.map(a=><SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Payment Method</label>
            <Select value={form.paymentMethod} onValueChange={v=>setForm(f=>({...f,paymentMethod:v}))}>
              <SelectTrigger className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm">
                <SelectValue/>
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Notes</label>
            <Input className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm" placeholder="Optional description..." value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tags (comma-separated)</label>
            <Input className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm" placeholder="food, work, personal..." value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))}/>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1 h-10" onClick={onClose}>Cancel</Button>
            <button type="submit" className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors">
              {tx ? "Save Changes" : "Add Transaction"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transactions View ────────────────────────────────────────────────────────

function TransactionsView({transactions,setTransactions}:{transactions:Transaction[];setTransactions:(t:Transaction[])=>void}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all"|"income"|"expense">("all");
  const [filterCat, setFilterCat] = useState("all");
  const [sortBy, setSortBy] = useState<"date"|"amount">("date");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Transaction|null>(null);

  const filtered = useMemo(()=>{
    let r = [...transactions];
    if (filterType !== "all") r = r.filter(t=>t.type===filterType);
    if (filterCat !== "all") r = r.filter(t=>t.category===filterCat);
    if (search) r = r.filter(t=>
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.notes.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(g=>g.toLowerCase().includes(search.toLowerCase()))
    );
    r.sort((a,b)=>sortBy==="date" ? b.date.localeCompare(a.date) : b.amount-a.amount);
    return r;
  },[transactions,filterType,filterCat,search,sortBy]);

  const save = (tx:Transaction) => {
    setTransactions(editing
      ? transactions.map(t=>t.id===tx.id?tx:t)
      : [tx,...transactions]
    );
    setEditing(null);
  };

  const del = (id:string) => setTransactions(transactions.filter(t=>t.id!==id));

  const allCats = useMemo(()=>[...new Set(transactions.map(t=>t.category))].sort(),[transactions]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0d1b2e] dark:text-slate-100">Transactions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{filtered.length} of {transactions.length} records</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors">
            <Download size={15}/> Export
          </button>
          <button onClick={()=>{setEditing(null);setModal(true);}} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus size={16}/> Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <Input className="pl-9 h-9 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm" placeholder="Search transactions..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-0.5">
          {(["all","income","expense"] as const).map(t=>(
            <button key={t} onClick={()=>setFilterType(t)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                filterType===t ? "bg-white dark:bg-[#0d1b2e] text-[#0d1b2e] dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}>{t}</button>
          ))}
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="h-9 w-[160px] bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm">
            <SelectValue placeholder="All categories"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {allCats.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v=>setSortBy(v as any)}>
          <SelectTrigger className="h-9 w-[130px] bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm">
            <SelectValue/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="amount">Sort by Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_120px_100px_110px_80px] gap-4 px-5 py-3 border-b border-black/[0.05] dark:border-white/[0.05] text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>Transaction</span><span>Category</span><span>Account</span><span>Date</span><span className="text-right">Amount</span>
        </div>
        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Search size={32} className="mx-auto mb-3 opacity-30"/>
              <p className="font-medium">No transactions found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : filtered.map(tx=>(
            <div key={tx.id} className="flex md:grid md:grid-cols-[1fr_120px_100px_110px_80px] gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors items-center group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${catColor(tx.category)}18`}}>
                  <span style={{color:catColor(tx.category)}}>
                    {tx.type==="income" ? <ArrowUpRight size={15}/> : <ArrowDownRight size={15}/>}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#0d1b2e] dark:text-slate-200 truncate">{tx.notes || tx.category}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{tx.paymentMethod}</span>
                    {tx.tags.slice(0,2).map(g=>(
                      <span key={g} className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 rounded-md text-[10px] font-medium">{g}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold" style={{background:`${catColor(tx.category)}15`,color:catColor(tx.category)}}>
                  {tx.category}
                </span>
              </div>
              <div className="hidden md:block text-xs text-slate-400 font-medium">{tx.account}</div>
              <div className="hidden md:block text-xs text-slate-400">{fmtDate(tx.date)}</div>
              <div className="ml-auto md:ml-0 flex items-center gap-2">
                <span className={cn("font-bold font-mono text-sm md:block", tx.type==="income" ? "text-emerald-500" : "text-red-500")}>
                  {tx.type==="income" ? "+" : "-"}{fmtD(tx.amount)}
                </span>
                <div className="hidden group-hover:flex items-center gap-1 ml-2">
                  <button onClick={()=>{setEditing(tx);setModal(true);}} className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <Edit2 size={12}/>
                  </button>
                  <button onClick={()=>del(tx.id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TxModal open={modal} onClose={()=>{setModal(false);setEditing(null);}} tx={editing} onSave={save}/>
    </div>
  );
}

// ─── Analytics View ───────────────────────────────────────────────────────────

function AnalyticsView({transactions}:{transactions:Transaction[]}) {
  const [period, setPeriod] = useState("6m");

  const catSpend = useMemo(()=>{
    const map: Record<string,number> = {};
    transactions.filter(t=>t.type==="expense").forEach(t=>{ map[t.category]=(map[t.category]||0)+t.amount; });
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,8);
  },[transactions]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0d1b2e] dark:text-slate-100">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Deep insights into your financial patterns</p>
        </div>
        <div className="flex gap-1 bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-1">
          {["3m","6m","1y"].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                period===p ? "bg-emerald-500 text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Savings trend */}
        <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
          <h3 className="font-bold text-[#0d1b2e] dark:text-slate-100 mb-1">Savings Growth</h3>
          <p className="text-xs text-slate-400 mb-4">Monthly net savings</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MONTHLY_DATA} margin={{top:4,right:4,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}k`}/>
              <Tooltip content={<ChartTip/>}/>
              <Line type="monotone" dataKey="savings" name="Savings" stroke="#10b981" strokeWidth={2.5} dot={{r:4,fill:"#10b981",strokeWidth:0}} activeDot={{r:6}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly comparison */}
        <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
          <h3 className="font-bold text-[#0d1b2e] dark:text-slate-100 mb-1">Monthly Comparison</h3>
          <p className="text-xs text-slate-400 mb-4">Income vs expenses by month</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY_DATA} margin={{top:4,right:4,bottom:0,left:0}} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}k`}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4,4,0,0]} maxBarSize={28}/>
              <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4,4,0,0]} maxBarSize={28}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
          <h3 className="font-bold text-[#0d1b2e] dark:text-slate-100 mb-1">Category Analysis</h3>
          <p className="text-xs text-slate-400 mb-4">Top spending categories</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catSpend} layout="vertical" margin={{top:0,right:12,bottom:0,left:80}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false}/>
              <XAxis type="number" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false} width={78}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="value" name="Spent" radius={[0,4,4,0]} maxBarSize={16}>
                {catSpend.map((d,i)=><Cell key={i} fill={catColor(d.name)}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cash flow */}
        <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
          <h3 className="font-bold text-[#0d1b2e] dark:text-slate-100 mb-1">Cash Flow</h3>
          <p className="text-xs text-slate-400 mb-4">Cumulative balance trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_DATA.map((d,i)=>({...d,balance:MONTHLY_DATA.slice(0,i+1).reduce((s,m)=>s+m.savings,8000)}))} margin={{top:4,right:4,bottom:0,left:0}}>
              <defs>
                <linearGradient id="gBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}k`}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="balance" name="Balance" stroke="#6366f1" strokeWidth={2} fill="url(#gBalance)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
        <h3 className="font-bold text-[#0d1b2e] dark:text-slate-100 mb-4">Smart Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {icon:AlertTriangle,color:"#f59e0b",bg:"#fef3c7",label:"Dining Up 18%","desc":"You spent 18% more on dining this month compared to May."},
            {icon:TrendingUp,color:"#10b981",bg:"#d1fae5",label:"Savings Record","desc":"June is your best savings month in the last 6 months!"},
            {icon:Bell,color:"#6366f1",bg:"#e0e7ff",label:"Bill Due Soon","desc":"Internet bill of $79.99 is due in 3 days — July 12."},
          ].map(({icon:Icon,color,bg,label,desc})=>(
            <div key={label} className="flex gap-3 p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:bg}}>
                <Icon size={16} style={{color}}/>
              </div>
              <div>
                <div className="text-sm font-bold text-[#0d1b2e] dark:text-slate-100 mb-0.5">{label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Budgets View ─────────────────────────────────────────────────────────────

function BudgetsView({budgets,setBudgets}:{budgets:Budget[];setBudgets:(b:Budget[])=>void}) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<BudgetForm>({category:"",limit:""});

  const addBudget = (e:React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.limit) return;
    setBudgets([...budgets,{id:uid(),category:form.category,limit:parseFloat(form.limit),spent:0}]);
    setForm({category:"",limit:""});
    setModal(false);
  };

  const total = budgets.reduce((s,b)=>s+b.limit,0);
  const totalSpent = budgets.reduce((s,b)=>s+b.spent,0);
  const overBudget = budgets.filter(b=>b.spent>b.limit).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0d1b2e] dark:text-slate-100">Budgets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Monthly spending limits by category</p>
        </div>
        <button onClick={()=>setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus size={16}/> New Budget
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:"Total Budget",value:fmt(total),icon:Wallet,color:"#6366f1"},
          {label:"Total Spent",value:fmt(totalSpent),icon:ArrowDownRight,color:totalSpent>total?"#ef4444":"#10b981"},
          {label:"Over Budget",value:`${overBudget} categor${overBudget===1?"y":"ies"}`,icon:AlertTriangle,color:"#f59e0b"},
        ].map(({label,value,icon:Icon,color})=>(
          <div key={label} className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${color}15`}}>
              <Icon size={18} style={{color}}/>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">{label}</div>
              <div className="font-bold font-mono text-[#0d1b2e] dark:text-slate-100">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Budget cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map(b=>{
          const pct = Math.min((b.spent/b.limit)*100,100);
          const over = b.spent > b.limit;
          const remaining = b.limit - b.spent;
          const color = over ? "#ef4444" : catColor(b.category);
          return (
            <div key={b.id} className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${color}15`}}>
                    <DollarSign size={18} style={{color}}/>
                  </div>
                  <div>
                    <div className="font-bold text-[#0d1b2e] dark:text-slate-100 text-sm">{b.category}</div>
                    <div className="text-xs text-slate-400">Monthly budget</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {over && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 rounded-lg">Over budget</span>
                  )}
                  <button onClick={()=>setBudgets(budgets.filter(x=>x.id!==b.id))} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,background:color}}/>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Spent: <span className="font-mono font-semibold text-[#0d1b2e] dark:text-slate-200">{fmtD(b.spent)}</span></span>
                <span className="text-slate-400">Budget: <span className="font-mono font-semibold text-[#0d1b2e] dark:text-slate-200">{fmtD(b.limit)}</span></span>
              </div>
              <div className="mt-2 text-xs">
                <span className={cn("font-semibold font-mono", over ? "text-red-500" : "text-emerald-500")}>
                  {over ? `${fmtD(Math.abs(remaining))} over` : `${fmtD(remaining)} remaining`}
                </span>
                <span className="text-slate-400"> · {pct.toFixed(0)}% used</span>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-sm bg-white dark:bg-[#111c2d] border-black/10 dark:border-white/10">
          <DialogHeader><DialogTitle>New Budget</DialogTitle></DialogHeader>
          <form onSubmit={addBudget} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Category</label>
              <Select value={form.category} onValueChange={v=>setForm(f=>({...f,category:v}))}>
                <SelectTrigger className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm">
                  <SelectValue placeholder="Select category..."/>
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATS.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Monthly Limit (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">$</span>
                <Input type="number" min="1" step="1" className="pl-7 h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 font-mono text-sm" placeholder="500" value={form.limit} onChange={e=>setForm(f=>({...f,limit:e.target.value}))} required/>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-10" onClick={()=>setModal(false)}>Cancel</Button>
              <button type="submit" className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors">Create Budget</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Goals View ───────────────────────────────────────────────────────────────

function GoalsView({goals,setGoals}:{goals:Goal[];setGoals:(g:Goal[])=>void}) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<GoalForm>({name:"",targetAmount:"",currentAmount:"0",deadline:"",color:"#10b981",icon:"star"});

  const addGoal = (e:React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.targetAmount || !form.deadline) return;
    setGoals([...goals,{id:uid(),name:form.name,targetAmount:parseFloat(form.targetAmount),currentAmount:parseFloat(form.currentAmount||"0"),deadline:form.deadline,color:form.color,icon:form.icon}]);
    setForm({name:"",targetAmount:"",currentAmount:"0",deadline:"",color:"#10b981",icon:"star"});
    setModal(false);
  };

  const totalSaved = goals.reduce((s,g)=>s+g.currentAmount,0);
  const totalTarget = goals.reduce((s,g)=>s+g.targetAmount,0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0d1b2e] dark:text-slate-100">Goals & Savings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{fmt(totalSaved)} saved of {fmt(totalTarget)} total target</p>
        </div>
        <button onClick={()=>setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus size={16}/> New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {goals.map(g=>{
          const pct = Math.min((g.currentAmount/g.targetAmount)*100,100);
          const remaining = g.targetAmount - g.currentAmount;
          const deadline = new Date(g.deadline);
          const today = new Date();
          const daysLeft = Math.ceil((deadline.getTime()-today.getTime())/(1000*60*60*24));
          const complete = pct >= 100;

          return (
            <div key={g.id} className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5" style={{background:g.color,transform:"translate(30%,-30%)"}}/>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{background:`${g.color}20`,color:g.color}}>
                    <GoalIcon icon={g.icon} size={20}/>
                  </div>
                  <div>
                    <div className="font-bold text-[#0d1b2e] dark:text-slate-100">{g.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Calendar size={11}/>
                      {complete ? "Completed!" : `${daysLeft > 0 ? daysLeft + " days left" : "Overdue"} · ${fmtDate(g.deadline)}`}
                    </div>
                  </div>
                </div>
                <button onClick={()=>setGoals(goals.filter(x=>x.id!==g.id))} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <Trash2 size={13}/>
                </button>
              </div>

              {/* Circular progress */}
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="8" className="dark:stroke-white/10"/>
                    <circle cx="40" cy="40" r="32" fill="none" stroke={g.color} strokeWidth="8"
                      strokeDasharray={`${2*Math.PI*32}`}
                      strokeDashoffset={`${2*Math.PI*32*(1-pct/100)}`}
                      strokeLinecap="round" style={{transition:"stroke-dashoffset 1s ease"}}/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold" style={{color:g.color,fontFamily:"'DM Mono',monospace"}}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Saved</span>
                    <span className="font-mono font-bold text-[#0d1b2e] dark:text-slate-200">{fmtD(g.currentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Target</span>
                    <span className="font-mono font-bold text-[#0d1b2e] dark:text-slate-200">{fmtD(g.targetAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Remaining</span>
                    <span className="font-mono font-semibold" style={{color:g.color}}>{complete ? "Done!" : fmtD(remaining)}</span>
                  </div>
                </div>
              </div>

              {complete && (
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl px-3 py-2">
                  <CheckCircle2 size={14}/> Goal achieved! 🎉
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-sm bg-white dark:bg-[#111c2d] border-black/10 dark:border-white/10">
          <DialogHeader><DialogTitle>New Savings Goal</DialogTitle></DialogHeader>
          <form onSubmit={addGoal} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Goal Name</label>
              <Input className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm" placeholder="e.g. Emergency Fund" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Target Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">$</span>
                  <Input type="number" min="1" className="pl-7 h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 font-mono text-sm" placeholder="5000" value={form.targetAmount} onChange={e=>setForm(f=>({...f,targetAmount:e.target.value}))} required/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Already Saved</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">$</span>
                  <Input type="number" min="0" className="pl-7 h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 font-mono text-sm" placeholder="0" value={form.currentAmount} onChange={e=>setForm(f=>({...f,currentAmount:e.target.value}))}/>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Deadline</label>
              <Input type="date" className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} required/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Icon</label>
              <div className="flex gap-2">
                {GOAL_ICONS.map(ic=>(
                  <button key={ic} type="button" onClick={()=>setForm(f=>({...f,icon:ic}))}
                    className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all text-slate-400",
                      form.icon===ic ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10"
                    )}>
                    <GoalIcon icon={ic} size={16}/>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Color</label>
              <div className="flex gap-2">
                {GOAL_COLORS.map(c=>(
                  <button key={c} type="button" onClick={()=>setForm(f=>({...f,color:c}))}
                    className="w-7 h-7 rounded-full transition-all flex items-center justify-center" style={{background:c}}>
                    {form.color===c && <Check size={12} className="text-white"/>}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-10" onClick={()=>setModal(false)}>Cancel</Button>
              <button type="submit" className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors">Create Goal</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Reports View ─────────────────────────────────────────────────────────────

function ReportsView() {
  const reports = [
    {title:"Monthly Summary",desc:"Complete overview of June 2026 — income, expenses, savings, and budget performance.",icon:BarChart3,color:"#10b981"},
    {title:"Income Report",desc:"Detailed breakdown of all income sources with month-over-month comparison.",icon:ArrowUpRight,color:"#6366f1"},
    {title:"Expense Report",desc:"Category-wise spending analysis with trends and anomaly detection.",icon:ArrowDownRight,color:"#ef4444"},
    {title:"Budget Report",desc:"Budget utilization by category with variance analysis and forecast.",icon:Target,color:"#f59e0b"},
    {title:"Savings Report",desc:"Progress towards savings goals with projected completion timelines.",icon:PiggyBank,color:"#ec4899"},
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0d1b2e] dark:text-slate-100">Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Generate and export professional financial reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(r=>(
          <div key={r.title} className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5 flex gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:`${r.color}15`}}>
              <r.icon size={22} style={{color:r.color}}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[#0d1b2e] dark:text-slate-100 mb-1">{r.title}</div>
              <div className="text-xs text-slate-400 leading-relaxed mb-3">{r.desc}</div>
              <div className="flex gap-2">
                {["PDF","CSV","Excel"].map(fmt=>(
                  <button key={fmt} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors">
                    <Download size={11}/>{fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
        <h3 className="font-bold text-[#0d1b2e] dark:text-slate-100 mb-4">June 2026 Quick Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {label:"Total Income",value:"$6,665",change:"+8.5%",up:true},
            {label:"Total Expenses",value:"$3,041",change:"-3.2%",up:false},
            {label:"Net Savings",value:"$3,624",change:"+22.4%",up:true},
            {label:"Transactions",value:"20",change:"this month",up:true},
          ].map(s=>(
            <div key={s.label} className="p-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl">
              <div className="text-xs text-slate-400 font-medium mb-1">{s.label}</div>
              <div className="text-lg font-bold font-mono text-[#0d1b2e] dark:text-slate-100">{s.value}</div>
              <div className={cn("text-xs font-semibold mt-0.5", s.up ? "text-emerald-500" : "text-red-500")}>{s.change}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────

function SettingsView({isDark,setIsDark}:{isDark:boolean;setIsDark:(v:boolean)=>void}) {
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex.morgan@gmail.com");
  const [currency, setCurrency] = useState("USD");
  const [saved, setSaved] = useState(false);

  const save = (e:React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-[#0d1b2e] dark:text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] p-1 rounded-xl h-auto">
          {["profile","preferences","security"].map(t=>(
            <TabsTrigger key={t} value={t} className="capitalize rounded-lg text-sm px-4 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-none">{t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-5">
          <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-black/[0.05] dark:border-white/[0.05]">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">AM</div>
              <div>
                <div className="font-bold text-[#0d1b2e] dark:text-slate-100">{name}</div>
                <div className="text-sm text-slate-400">{email}</div>
                <button className="mt-2 text-xs text-emerald-500 hover:text-emerald-400 font-semibold flex items-center gap-1">
                  <Camera size={12}/> Change photo
                </button>
              </div>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Full Name</label>
                  <Input className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm" value={name} onChange={e=>setName(e.target.value)}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Email Address</label>
                  <Input type="email" className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm" value={email} onChange={e=>setEmail(e.target.value)}/>
                </div>
              </div>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors">
                {saved ? <><Check size={15}/> Saved!</> : "Save Changes"}
              </button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="mt-5">
          <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-6 space-y-5">
            {[
              {label:"Currency", sub:"Primary currency for display", child:(
                <Select defaultValue="PKR" onValueChange={(v)=>{ activeCurrency=v; }}>
                  <SelectTrigger className="h-10 w-40 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    {["USD","EUR","GBP","JPY","CAD","AUD","PKR"].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )},
              {label:"Theme", sub:"Choose your preferred appearance", child:(
                <div className="flex gap-2">
                  {[{v:false,label:"Light"},{v:true,label:"Dark"}].map(({v,label})=>(
                    <button key={label} onClick={()=>setIsDark(v)}
                      className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                        isDark===v ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10"
                      )}>{label}</button>
                  ))}
                </div>
              )},
              {label:"Date Format", sub:"How dates are displayed throughout the app", child:(
                <Select defaultValue="MMM DD YYYY">
                  <SelectTrigger className="h-10 w-44 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MMM DD YYYY">Jun 25, 2026</SelectItem>
                    <SelectItem value="DD/MM/YYYY">25/06/2026</SelectItem>
                    <SelectItem value="MM/DD/YYYY">06/25/2026</SelectItem>
                    <SelectItem value="YYYY-MM-DD">2026-06-25</SelectItem>
                  </SelectContent>
                </Select>
              )},
            ].map(({label,sub,child})=>(
              <div key={label} className="flex items-center justify-between py-3 border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                <div>
                  <div className="text-sm font-semibold text-[#0d1b2e] dark:text-slate-200">{label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
                </div>
                {child}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-5">
          <div className="bg-white dark:bg-[#111c2d] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-6 space-y-5">
            <div>
              <h4 className="font-bold text-[#0d1b2e] dark:text-slate-100 mb-4">Change Password</h4>
              <div className="space-y-3">
                {["Current Password","New Password","Confirm New Password"].map(l=>(
                  <div key={l}>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{l}</label>
                    <Input type="password" className="h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm" placeholder="••••••••"/>
                  </div>
                ))}
                <button className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors">
                  Update Password
                </button>
              </div>
            </div>
            <div className="pt-4 border-t border-black/[0.05] dark:border-white/[0.05]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#0d1b2e] dark:text-slate-200">Email Verification</div>
                  <div className="text-xs text-slate-400 mt-0.5">alex.morgan@gmail.com</div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 size={13}/> Verified
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-black/[0.05] dark:border-white/[0.05]">
              <div className="text-sm font-semibold text-red-500 mb-1">Danger Zone</div>
              <p className="text-xs text-slate-400 mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <button className="px-4 py-2 border border-red-200 dark:border-red-500/30 text-red-500 text-sm font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(INIT_TX);
  const [budgets, setBudgets] = useState<Budget[]>(INIT_BUDGETS);
  const [goals, setGoals] = useState<Goal[]>(INIT_GOALS);

  useEffect(()=>{
    document.documentElement.classList.toggle("dark", isDark);
  },[isDark]);

  if (!isAuthed) {
    return <AuthScreen onAuth={()=>setIsAuthed(true)}/>;
  }

  const views: Record<View, React.ReactNode> = {
    dashboard: <DashboardView transactions={transactions} budgets={budgets} setView={setView}/>,
    transactions: <TransactionsView transactions={transactions} setTransactions={setTransactions}/>,
    analytics: <AnalyticsView transactions={transactions}/>,
    budgets: <BudgetsView budgets={budgets} setBudgets={setBudgets}/>,
    goals: <GoalsView goals={goals} setGoals={setGoals}/>,
    reports: <ReportsView/>,
    settings: <SettingsView isDark={isDark} setIsDark={setIsDark}/>,
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <Sidebar
        view={view} setView={setView}
        collapsed={collapsed} setCollapsed={setCollapsed}
        isDark={isDark} setIsDark={setIsDark}
        onLogout={()=>setIsAuthed(false)}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto p-6 md:p-8">
          {views[view]}
        </div>
      </main>
    </div>
  );
}
