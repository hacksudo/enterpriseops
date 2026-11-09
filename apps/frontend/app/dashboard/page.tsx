"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  UserPlus
} from "lucide-react";
import { api, getApiBase } from "@/lib/api";

export default function ExecutiveDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.getExecutiveStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const rep = await api.generateReport({
        organization_id: "default-org",
        report_type: "executive_consolidated",
        title: "Q4 Executive IT & Vulnerability Assessment Report",
        format: "HTML",
      });
      window.open(`${getApiBase()}/api/v1/reports/${rep.id}/content`, "_blank");
    } catch (e: any) {
      alert("Failed to generate report: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Organization Posture & Security Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time cross-department telemetry, employee workload, and verified VAPT vulnerabilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/users"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shrink-0"
          >
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <span>Manage Users & Roles</span>
          </Link>
          <button
            onClick={handleExportReport}
            disabled={exporting}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? "Generating..." : "Export Executive Report"}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Employees</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats?.total_employees || 0}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{stats?.active_users || 0} checked in today</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tasks</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats?.total_tasks || 0}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-cyan-400 font-semibold">{stats?.completed_tasks || 0} completed</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats?.active_projects || 0}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-slate-300 font-medium">Across {stats?.total_departments || 0} departments</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-rose-500/30">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue Tasks</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400">{stats?.overdue_tasks || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Requires PMO escalation</div>
        </div>
      </div>

      {/* Vulnerability & Risk Intelligence Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span>Vulnerability Posture (VAPT Findings)</span>
              </h2>
              <p className="text-xs text-slate-400">Total verified findings: {stats?.total_findings || 0}</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                {stats?.critical_findings || 0} Critical
              </span>
              <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 font-bold">
                {stats?.high_findings || 0} High
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center">
              <div className="text-2xl font-black text-rose-400">{stats?.critical_findings || 0}</div>
              <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wider mt-1">Critical</div>
            </div>
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-center">
              <div className="text-2xl font-black text-orange-400">{stats?.high_findings || 0}</div>
              <div className="text-[11px] font-bold text-orange-300 uppercase tracking-wider mt-1">High</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
              <div className="text-2xl font-black text-amber-400">{stats?.medium_findings || 0}</div>
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mt-1">Medium</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
              <div className="text-2xl font-black text-blue-400">{stats?.low_findings || 0}</div>
              <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider mt-1">Low / Info</div>
            </div>
          </div>

          {/* Findings by Department */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Findings by Department</h3>
            {stats?.findings_by_department && Object.keys(stats.findings_by_department).map((dept) => (
              <div key={dept} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                <span className="text-slate-300 font-medium">{dept}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                  {stats.findings_by_department[dept]} findings
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Discovery Timelines */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Velocity Telemetry</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">Discovery and remediation velocity metrics.</p>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-300">Discovered Today</div>
                  <div className="text-[10px] text-slate-500">Live 24h intake</div>
                </div>
                <div className="text-xl font-black text-cyan-400">{stats?.findings_discovered_today || 0}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-300">Discovered This Week</div>
                  <div className="text-[10px] text-slate-500">Last 7 days cumulative</div>
                </div>
                <div className="text-xl font-black text-blue-400">{stats?.findings_discovered_this_week || 0}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-300">Discovered This Month</div>
                  <div className="text-[10px] text-slate-500">Monthly reporting window</div>
                </div>
                <div className="text-xl font-black text-emerald-400">{stats?.findings_discovered_this_month || 0}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
            <span>Open Findings: <strong className="text-white">{stats?.open_findings || 0}</strong></span>
            <span>Closed: <strong className="text-emerald-400">{stats?.closed_findings || 0}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
