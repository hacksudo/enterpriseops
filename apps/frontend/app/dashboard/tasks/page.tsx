"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Clock,
  Filter,
  CheckCircle2,
  ChevronRight,
  User,
  Sparkles,
  Trash2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  X
} from "lucide-react";
import { api } from "@/lib/api";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");

  // Create Task Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
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
      const [tasksRes, usersRes] = await Promise.all([
        api.getTasks(),
        api.getUsers().catch(() => [])
      ]);
      setTasks(tasksRes || []);
      setUsers(usersRes || []);
      if (usersRes && usersRes.length > 0 && !form.assigned_to_user_id) {
        setForm((prev) => ({ ...prev, assigned_to_user_id: usersRes[0].id }));
      }
    } catch (e: any) {
      console.error("Failed to load tasks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      await loadData();
    } catch (e: any) {
      alert("Failed to update task: " + e.message);
    }
  };

  const handleDeleteTask = async (taskId: string, taskNumber: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to delete task ${taskNumber} ("${title}")?`)) return;
    try {
      await api.deleteTask(taskId);
      await loadData();
    } catch (e: any) {
      alert("Failed to delete task: " + e.message);
    }
  };

  const handleClearAllTasks = async () => {
    if (!confirm("PERMANENT ACTION: Are you sure you want to delete ALL tasks?\nThis will clear the entire Kanban board for a fresh handover.")) return;
    try {
      const res = await api.clearAllTasks();
      alert(res.message || "All tasks cleared successfully!");
      await loadData();
    } catch (e: any) {
      alert("Failed to clear tasks: " + e.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        priority: form.priority,
        assigned_to_user_id: form.assigned_to_user_id || undefined,
        estimated_minutes: form.estimated_minutes ? parseInt(form.estimated_minutes.toString(), 10) : 0,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : undefined,
      };

      await api.createTask(payload);
      setCreateModalOpen(false);
      setForm({
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
      setSubmitting(false);
    }
  };

  const columns = [
    { title: "Planned", status: "Planned", badge: "bg-slate-800 text-slate-300" },
    { title: "In Progress", status: "In Progress", badge: "bg-cyan-500/20 text-cyan-300" },
    { title: "In Review", status: "In Review", badge: "bg-amber-500/20 text-amber-300" },
    { title: "Completed", status: "Completed", badge: "bg-emerald-500/20 text-emerald-300" },
    { title: "Approved", status: "Approved", badge: "bg-blue-500/20 text-blue-300" },
  ];

  const filteredTasks = filterCategory === "all"
    ? tasks
    : tasks.filter((t) => t.category?.toLowerCase().includes(filterCategory.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Agile Board & Work Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Tasks, Sprints & Delivery Kanban
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            End-to-end task lifecycle, assignment tracking, and status progression.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none"
            >
              <option value="all" className="bg-slate-900">All Categories</option>
              <option value="Android" className="bg-slate-900">Android Penetration Testing</option>
              <option value="Web" className="bg-slate-900">Web Application Testing</option>
              <option value="DevOps" className="bg-slate-900">DevOps / Deployment</option>
              <option value="Development" className="bg-slate-900">Software Development</option>
              <option value="Remediation" className="bg-slate-900">Security Remediation</option>
            </select>
          </div>

          {/* Clear All Tasks (Handover helper) */}
          {tasks.length > 0 && (
            <button
              onClick={handleClearAllTasks}
              title="Delete all tasks to hand over a clean board"
              className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear All ({tasks.length})</span>
            </button>
          )}

          {/* New Task Button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="glass-panel p-4 rounded-2xl flex flex-col min-h-[520px]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">{col.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${col.badge}`}>
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/5 rounded-xl text-slate-500 text-xs">
                    <span>No {col.title.toLowerCase()} tasks</span>
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 hover:border-cyan-500/30 transition text-xs space-y-2 group relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-cyan-400">{t.task_number}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            t.priority === "critical"
                              ? "bg-rose-500/20 text-rose-300"
                              : t.priority === "high"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}>
                            {t.priority}
                          </span>

                          {/* Delete Task Icon Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTask(t.id, t.task_number, t.title, e)}
                            title="Delete this task"
                            className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-white text-xs leading-snug">{t.title}</h4>
                      {t.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                      )}

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[110px]" title={t.category}>{t.category}</span>
                        {col.status === "Planned" && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, "In Progress")}
                            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-0.5"
                          >
                            Start <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        {col.status === "In Progress" && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, "Completed")}
                            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5"
                          >
                            Complete <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        {col.status === "In Review" && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, "Completed")}
                            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5"
                          >
                            Done <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        {col.status === "Completed" && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, "Approved")}
                            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-0.5"
                          >
                            Approve <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        {col.status === "Approved" && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Signed off
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE NEW TASK MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-white/20 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Create New Task</h3>
                  <p className="text-xs text-slate-400">Add an agile delivery item or security task to the board</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
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
                  placeholder="e.g. Conduct SSL Pinning Audit on iOS Client"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide scope, testing steps, or deliverables..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Android Penetration Testing">Android Penetration Testing</option>
                    <option value="Web Application Testing">Web Application Testing</option>
                    <option value="API Security Assessment">API Security Assessment</option>
                    <option value="Security Remediation">Security Remediation</option>
                    <option value="DevOps / Deployment">DevOps / Deployment</option>
                    <option value="Software Development">Software Development</option>
                    <option value="Compliance & Audit">Compliance & Audit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
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
                    value={form.assigned_to_user_id}
                    onChange={(e) => setForm({ ...form, assigned_to_user_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Self / Unassigned</option>
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
                    value={form.due_at}
                    onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
