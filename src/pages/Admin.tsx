import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend,
} from "recharts";
import { Loader2, ShieldAlert, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface UsageRow {
  id: string;
  user_id: string | null;
  mode: string;
  kind: string;
  ms: number | null;
  cache_hit: boolean;
  tokens: number | null;
  status: string;
  created_at: string;
}

const COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6"];

function toCsv(rows: UsageRow[]): string {
  const head = ["created_at", "user_id", "mode", "kind", "status", "ms", "tokens", "cache_hit"];
  const body = rows.map(r => head.map(k => JSON.stringify((r as any)[k] ?? "")).join(","));
  return [head.join(","), ...body].join("\n");
}

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<UsageRow[] | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  const load = async () => {
    setFetching(true);
    const { data } = await supabase
      .from("usage_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);
    setRows((data ?? []) as UsageRow[]);
    setFetching(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const stats = useMemo(() => {
    const r = rows ?? [];
    const totalCalls = r.length;
    const cacheHits = r.filter(x => x.cache_hit).length;
    const errors = r.filter(x => x.status === "error").length;
    const rateLimited = r.filter(x => x.status === "rate_limited").length;
    const avgMs = (() => {
      const v = r.filter(x => x.ms).map(x => x.ms!);
      return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
    })();
    const totalTokens = r.reduce((s, x) => s + (x.tokens || 0), 0);
    const uniqueUsers = new Set(r.map(x => x.user_id).filter(Boolean)).size;

    const byMode: Record<string, number> = {};
    const avgByMode: Record<string, { sum: number; n: number }> = {};
    for (const x of r) {
      byMode[x.mode] = (byMode[x.mode] || 0) + 1;
      if (x.ms) {
        avgByMode[x.mode] ||= { sum: 0, n: 0 };
        avgByMode[x.mode].sum += x.ms;
        avgByMode[x.mode].n += 1;
      }
    }
    const modeData = Object.entries(byMode)
      .map(([mode, count]) => ({ mode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const latencyData = Object.entries(avgByMode)
      .map(([mode, v]) => ({ mode, ms: Math.round(v.sum / v.n) }))
      .sort((a, b) => b.ms - a.ms).slice(0, 10);

    // 14-day cache vs api series
    const dayKey = (iso: string) => iso.slice(0, 10);
    const days: Record<string, { day: string; api: number; cache: number }> = {};
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
      days[d] = { day: d.slice(5), api: 0, cache: 0 };
    }
    for (const x of r) {
      const k = dayKey(x.created_at);
      if (!days[k]) continue;
      if (x.cache_hit) days[k].cache++; else days[k].api++;
    }
    const series = Object.values(days);

    return { totalCalls, cacheHits, errors, rateLimited, avgMs, totalTokens, uniqueUsers, modeData, latencyData, series };
  }, [rows]);

  if (loading || (user && isAdmin === false && rows === null)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 max-w-md mx-auto text-center px-4">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Admin only</h1>
          <p className="text-sm text-muted-foreground mb-6">You don't have permission to view analytics.</p>
          <Button onClick={() => navigate("/")}>Back to app</Button>
        </div>
      </div>
    );
  }

  const downloadCsv = () => {
    const csv = toCsv(rows ?? []);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `studyforge-usage-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Admin Analytics — StudyForge</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Navbar />
      <main className="pt-20 max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Admin</p>
            <h1 className="font-display text-3xl font-bold">Usage analytics</h1>
            <p className="text-sm text-muted-foreground">Last 2,000 events across all users.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={load} disabled={fetching}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${fetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button size="sm" onClick={downloadCsv} disabled={!rows?.length}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Stat label="Total generations" value={stats.totalCalls.toLocaleString()} />
          <Stat label="Active users" value={stats.uniqueUsers.toLocaleString()} />
          <Stat label="Cache hits" value={`${stats.cacheHits} (${stats.totalCalls ? Math.round(stats.cacheHits / stats.totalCalls * 100) : 0}%)`} />
          <Stat label="Avg latency" value={`${stats.avgMs} ms`} />
          <Stat label="Approx tokens" value={stats.totalTokens.toLocaleString()} />
          <Stat label="Errors" value={String(stats.errors)} />
          <Stat label="Rate-limited" value={String(stats.rateLimited)} />
          <Stat label="Hit ratio (savings)" value={`${stats.totalCalls ? Math.round(stats.cacheHits / stats.totalCalls * 100) : 0}%`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Most used modes">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.modeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mode" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-25} textAnchor="end" height={70} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Avg generation time per mode (ms)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mode" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-25} textAnchor="end" height={70} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="ms" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="API calls vs cache hits (last 14d)">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.series}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" dataKey="api" stackId="1" stroke="#6366f1" fill="url(#g1)" />
                <Area type="monotone" dataKey="cache" stackId="1" stroke="#10b981" fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Distribution by kind">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={Object.entries((rows ?? []).reduce<Record<string, number>>((m, r) => { m[r.kind] = (m[r.kind] || 0) + 1; return m; }, {}))
                    .map(([name, value]) => ({ name, value }))}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}
                >
                  {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <p className="font-display text-2xl font-bold">{value}</p>
      </Card>
    </motion.div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {children}
    </Card>
  );
}
