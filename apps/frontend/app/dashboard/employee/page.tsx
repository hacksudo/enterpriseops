"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Square,
  CheckCircle2,
  Clock,
  Plus,
  FileCheck,
  AlertCircle,
  Briefcase,
  Layers,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";

export default function EmployeeDashboardPage() {
  const [workStatus, setWorkStatus] = useState<any>({ checked_in: false, elapsed_minutes: 0 });
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Daily report form modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSummary, setReportSummary] = useState("");
  const [reportBlockers, setReportBlockers] = useState("");
  const [reportNextSteps, setReportNextSteps] = useState("");

  // New task modal
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("Android Penetration Testing");
  const [taskCategory, setTaskCategory] = useState("Android Penetration Testing");
  const [taskPriority, setTaskPriority] = useState("critical");
  const [taskDesc, setTaskDesc] = useState("Dynamic analysis and API security verification for mobile application APK.");

  const loadData = async () => {
    try {
      const [statusRes, tasksRes, statsRes] = await Promise.all([
        api.getWorkStatus(),
        api.getTasks("?assigned_to_me=true"),
        api.getEmployeeStats(),
      ]);
      setWorkStatus(statusRes);
      setTasks(tasksRes);
      setStats(statsRes);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStartWork = async () => {
    setActionLoading(true);
    try {
      await api.checkin();
      await loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndWork = async () => {
    setActionLoading(true);
    try {
      await api.checkout();
      await loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const depts = await api.getDepartments();
      const ws = await api.getWorkspaces();
      const deptId = depts[0]?.id || "vapt-dept";
      const wsId = ws[0]?.id || "android-ws";
      const orgId = depts[0]?.organization_id || "default-org";

      await api.createTask({
        organization_id: orgId,
        department_id: deptId,
        workspace_id: wsId,
        title: taskTitle,
        description: taskDesc,
        category: taskCategory,
        priority: taskPriority,
        estimated_minutes: 480,
      });

      setShowNewTaskModal(false);
      await loadData();
    } catch (e: any) {
      alert("Failed to create task: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const depts = await api.getDepartments();
      const deptId = depts[0]?.id || "vapt-dept";

      await api.submitDailyReport({
        department_id: deptId,
        summary: reportSummary,
        blockers: reportBlockers,
        next_steps: reportNextSteps,
      });

      setShowReportModal(false);
      setReportSummary("");
      alert("Daily work report successfully submitted to PMO!");
      await loadData();
    } catch (e: any) {
      alert("Failed to submit report: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero: "I'M ON WORK" Banner */}
      <div className={`p-6 sm:p-8 rounded-2xl glass-panel transition-all ${
        workStatus.checked_in ? "border-emerald-500/40 glass-glow-cyan" : "border-white/10"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                workStatus.checked_in ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              }`} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {workStatus.checked_in ? "Work Session Active" : "Workday Not Started"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {workStatus.checked_in ? "You Are Currently On Work" : "Ready to Start Your Shift?"}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Check in to track task progression, record findings, and submit daily enterprise activity logs.
            </p>

            {workStatus.checked_in && (
              <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-emerald-300">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Elapsed: {Math.floor(workStatus.elapsed_minutes / 60)}h {workStatus.elapsed_minutes % 60}m</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!workStatus.checked_in ? (
              <button
                onClick={handleStartWork}
                disabled={actionLoading}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-lg shadow-emerald-500/30 transition scale-100 hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START WORK / I&apos;M ON WORK</span>
              </button>
            ) : (
              <button
                onClick={handleEndWork}
                disabled={actionLoading}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-rose-300 font-bold text-xs flex items-center gap-2 transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>End Work Session</span>
              </button>
            )}

            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-2 transition"
            >
              <FileCheck className="w-4 h-4" />
              <span>Submit Daily Summary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task Controls & Quick Add */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-cyan-400" />
          <span>My Assigned & Personal Tasks</span>
        </h2>
        <button
          onClick={() => setShowNewTaskModal(true)}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Tasks Table / Cards */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No assigned tasks yet. Click <strong>Create Task</strong> to self-assign a task.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tasks.map((task) => (
              <div key={task.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-cyan-400">{task.task_number}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">{task.category}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      task.priority === "critical" ? "bg-rose-500/20 text-rose-300" : "bg-blue-500/20 text-blue-300"
                    }`}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{task.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                    task.status === "In Progress" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-slate-800 text-slate-300"
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-white/20 shadow-glass">
            <h3 className="text-lg font-bold text-white mb-4">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    <option>Android Penetration Testing</option>
                    <option>Web Application Testing</option>
                    <option>API Security Testing</option>
                    <option>Code Review</option>
                    <option>Software Development</option>
                    <option>Bug Fixing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Create & Start
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-white/20 shadow-glass">
            <h3 className="text-lg font-bold text-white mb-2">Submit Daily Work Activity Report</h3>
            <p className="text-xs text-slate-400 mb-4">
              Your structured update will be delivered to PMO and Executive management dashboards.
            </p>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">What Work Was Performed Today?</label>
                <textarea
                  required
                  rows={4}
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="• Reviewed AndroidManifest.xml&#10;• Identified high vulnerability in exported deep link handler&#10;• Submitted POC evidence..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Blockers / Obstacles Encountered</label>
                <input
                  type="text"
                  value={reportBlockers}
                  onChange={(e) => setReportBlockers(e.target.value)}
                  placeholder="None / Waiting on test credentials"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Next Steps for Tomorrow</label>
                <input
                  type="text"
                  value={reportNextSteps}
                  onChange={(e) => setReportNextSteps(e.target.value)}
                  placeholder="Conduct API parameter tampering verification"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Submit Daily Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
