"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Users,
  ShieldAlert,
  ArrowRight,
  UserPlus,
  Trash2,
  Sparkles,
  RefreshCw,
  Bug,
  CheckSquare,
  X,
  ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";

export default function PmoDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Clean Slate / Handover Modal State
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [wipeDemoUsers, setWipeDemoUsers] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  // New Task Modal State
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    category: "Android Penetration Testing",
    priority: "medium",
    assigned_to_user_id: "",
    due_at: "",
    estimated_minutes: 240,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, tasksRes, findingsRes, usersRes] = await Promise.all([
        api.getPmoStats().catch(() => null),
        api.getTasks().catch(() => []),
        api.getFindings().catch(() => []),
        api.getUsers().catch(() => []),
      ]);
      setStats(statsRes);
      setTasks(tasksRes || []);
      setFindings(findingsRes || []);
      setUsers(usersRes || []);
      if (usersRes && usersRes.length > 0 && !taskForm.assigned_to_user_id) {
        setTaskForm((prev) => ({ ...prev, assigned_to_user_id: usersRes[0].id }));
      }
    } catch (e) {
      console.error("Failed to load PMO dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteTask = async (taskId: string, taskNumber: string, title: string) => {
    if (!confirm(`Are you sure you want to delete task ${taskNumber} ("${title}")?`)) return;
    try {
      await api.deleteTask(taskId);
      await loadData();
    } catch (e: any) {
      alert("Failed to delete task: " + e.message);
    }
  };

  const handleClearAllTasks = async () => {
    if (!confirm("Are you sure you want to delete ALL tasks in the workspace?")) return;
    try {
      const res = await api.clearAllTasks();
      alert(res.message || "All tasks deleted successfully!");
      await loadData();
    } catch (e: any) {
      alert("Failed to clear tasks: " + e.message);
    }
  };

  const handleDeleteFinding = async (findingId: string, findingNumber: string, title: string) => {
    if (!confirm(`Are you sure you want to delete vulnerability ${findingNumber} ("${title}")?`)) return;
    try {
      await api.deleteFinding(findingId);
      await loadData();
    } catch (e: any) {
      alert("Failed to delete finding: " + e.message);
    }
  };

  const handleClearAllFindings = async () => {
    if (!confirm("Are you sure you want to delete ALL vulnerability findings?")) return;
    try {
      const res = await api.clearAllFindings();
      alert(res.message || "All findings deleted successfully!");
      await loadData();
    } catch (e: any) {
      alert("Failed to clear findings: " + e.message);
    }
  };

  const handleExecuteHandoverWipe = async () => {
    try {
      setIsWiping(true);
      const res = await api.clearDemoData(wipeDemoUsers);
      alert(res.message || "Demo data successfully wiped! The system is now 100% clean for handover.");
      setHandoverModalOpen(false);
      await loadData();
    } catch (e: any) {
      alert("Failed to wipe demo data: " + e.message);
    } finally {
      setIsWiping(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    setTaskSubmitting(true);
    try {
      const payload: any = {
        title: taskForm.title,
        description: taskForm.description || undefined,
        category: taskForm.category,
        priority: taskForm.priority,
        assigned_to_user_id: taskForm.assigned_to_user_id || undefined,
        estimated_minutes: taskForm.estimated_minutes ? parseInt(taskForm.estimated_minutes.toString(), 10) : 0,
        due_at: taskForm.due_at ? new Date(taskForm.due_at).toISOString() : undefined,
      };

      await api.createTask(payload);
      setCreateTaskModalOpen(false);
      setTaskForm({
        title: "",
        description: "",
        category: "Android Penetration Testing",
        priority: "medium",
        assigned_to_user_id: users[0]?.id || "",
        due_at: "",
        estimated_minutes: 240,
      });
      await loadData();
    } catch (e: any) {
      alert("Failed to create task: " + e.message);
    } finally {
      setTaskSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>PMO Governance & Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Project Delivery & Security Remediation Oversight
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Task lifecycle management, remediation tracking, and cross-department collaboration governance.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {/* Handover & Clean Slate Trigger Button */}
          <button
            onClick={() => setHandoverModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 font-semibold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            title="Prepare system for client handover by removing demo records"
          >
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>Clean Slate / Handover</span>
          </button>

          <button
            onClick={() => setCreateTaskModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>

          <Link
            href="/dashboard/users"
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Projects</div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats?.active_projects || 0}</div>
          <div className="text-xs text-blue-400 mt-1">Under PMO Scope</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Tasks</div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400">{tasks.length}</div>
          <div className="text-xs text-slate-400 mt-1">{tasks.filter((t) => t.status === "Completed" || t.status === "Approved").length} completed</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-rose-500/30">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Critical Alerts</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400">
            {findings.filter((f) => f.severity === "Critical").length}
          </div>
          <div className="text-xs text-rose-300 mt-1">Urgent remediation</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-orange-500/30">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Remediation Pending</div>
          <div className="text-2xl sm:text-3xl font-black text-orange-400">
            {findings.filter((f) => f.status !== "Closed").length}
          </div>
          <div className="text-xs text-orange-300 mt-1">Awaiting retest</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Tasks Status */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <span>Workspace Tasks</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                  {tasks.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">PMO delivery progression and task deletion controls</p>
            </div>

            <div className="flex items-center gap-2">
              {tasks.length > 0 && (
                <button
                  onClick={handleClearAllTasks}
                  title="Clear all tasks"
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
              <Link
                href="/dashboard/tasks"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <span>Kanban Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {tasks.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No active tasks. System is clean or ready for new tasks.
              </div>
            ) : (
              tasks.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between text-xs group">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-bold">{t.task_number}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        t.priority === "critical" ? "bg-rose-500/20 text-rose-300" : "bg-blue-500/20 text-blue-300"
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm">{t.title}</div>
                    <div className="text-slate-400 text-[11px]">{t.category}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                      t.status === "In Progress"
                        ? "bg-cyan-500/20 text-cyan-300"
                        : t.status === "Completed"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-800 text-slate-300"
                    }`}>
                      {t.status}
                    </span>

                    {/* Delete Task Button */}
                    <button
                      onClick={() => handleDeleteTask(t.id, t.task_number, t.title)}
                      title="Delete this task"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Team Members */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Assigned Team</span>
            </h2>
            <Link href="/dashboard/users" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              Manage Users
            </Link>
          </div>

          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No team members registered.</div>
            ) : (
              users.map((u) => (
                <div key={u.id} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{u.full_name}</div>
                    <div className="text-slate-400 text-[11px]">{u.designation || u.email}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold text-[10px]">
                    {u.roles?.[0] || "Employee"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Security Findings & Remediation Oversight Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bug className="w-4 h-4 text-rose-400" />
              <span>Security Remediation & Findings Oversight</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                {findings.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track, retest, and delete VAPT vulnerabilities under PMO governance
            </p>
          </div>

          <div className="flex items-center gap-2">
            {findings.length > 0 && (
              <button
                onClick={handleClearAllFindings}
                title="Delete all findings"
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All Findings</span>
              </button>
            )}
            <Link
              href="/dashboard/vapt"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition"
            >
              <span>VAPT Hub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {findings.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No security findings logged. Zero demo items present!
            </div>
          ) : (
            findings.map((f) => (
              <div key={f.id} className="py-3 flex items-center justify-between text-xs group">
                <div className="space-y-0.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-bold">{f.finding_number}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      f.severity === "Critical"
                        ? "bg-rose-500/20 text-rose-300"
                        : f.severity === "High"
                        ? "bg-orange-500/20 text-orange-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}>
                      {f.severity} (CVSS {f.cvss_score || "N/A"})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {f.cwe_id || ""}
                    </span>
                  </div>
                  <div className="font-bold text-white text-sm">{f.title}</div>
                  <div className="text-slate-400 text-[11px] line-clamp-1">{f.impact || f.observation}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                    f.status === "Closed"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                  }`}>
                    {f.status}
                  </span>

                  {/* Delete Finding Button */}
                  <button
                    onClick={() => handleDeleteFinding(f.id, f.finding_number, f.title)}
                    title="Delete this vulnerability finding"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CLIENT HANDOVER & CLEAN SLATE MODAL */}
      {handoverModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-rose-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Client Handover / Clean Slate</h3>
                <p className="text-xs text-rose-300">Wipe all demonstration records for fresh production deployment</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs text-slate-300 space-y-2">
              <p>
                <strong className="text-rose-400">Handover Action:</strong> This will permanently delete:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>All demo tasks, comments, and task events ({tasks.length} tasks)</li>
                <li>All VAPT vulnerability findings & retests ({findings.length} findings)</li>
                <li>All demo workday check-ins, time logs & reports</li>
                <li>All demo handoff requests & alerts</li>
              </ul>
              <p className="text-emerald-400 font-medium pt-1">
                ✓ Administrator account and department structure remain safe and ready for the client.
              </p>
            </div>

            {/* Checkbox for Demo Users */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-white/10">
              <input
                type="checkbox"
                id="wipeUsersCheck"
                checked={wipeDemoUsers}
                onChange={(e) => setWipeDemoUsers(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="wipeUsersCheck" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-semibold text-white">Also remove demo staff accounts</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Deletes Sarah Jenkins (PMO), Vishal Waghmare (Tester), and Alex Rivera (Dev), leaving ONLY your Super Admin login.
                </p>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isWiping}
                onClick={() => setHandoverModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isWiping}
                onClick={handleExecuteHandoverWipe}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isWiping ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Wiping Demo Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Wipe Demo Data & Handover Clean</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {createTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-white/20 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Create Workspace Task</h3>
                  <p className="text-xs text-slate-400">Add an operational or security task to PMO scope</p>
                </div>
              </div>
              <button
                onClick={() => setCreateTaskModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 mt-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conduct Remediation Retest on Authentication Bypass"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide scope, testing steps, or deliverables..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Android Penetration Testing">Android Penetration Testing</option>
                    <option value="Web Application Testing">Web Application Testing</option>
                    <option value="Security Remediation">Security Remediation</option>
                    <option value="DevOps / Deployment">DevOps / Deployment</option>
                    <option value="Software Development">Software Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="critical">🚨 Critical</option>
                    <option value="high">⚠️ High</option>
                    <option value="medium">🔷 Medium</option>
                    <option value="low">◽ Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Team Member</label>
                  <select
                    value={taskForm.assigned_to_user_id}
                    onChange={(e) => setTaskForm({ ...taskForm, assigned_to_user_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.roles?.[0] || u.designation || "User"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_at}
                    onChange={(e) => setTaskForm({ ...taskForm, due_at: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCreateTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {taskSubmitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
