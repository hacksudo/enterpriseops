"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  FolderKanban,
  Plus,
  Users,
  Shield,
  Layers
} from "lucide-react";
import { api } from "@/lib/api";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");

  const loadData = async () => {
    try {
      const [deptRes, wsRes] = await Promise.all([
        api.getDepartments(),
        api.getWorkspaces(),
      ]);
      setDepartments(deptRes);
      setWorkspaces(wsRes);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const orgId = departments[0]?.organization_id || "default-org";
      await api.createDepartment({
        organization_id: orgId,
        name: deptName,
        slug: deptName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        description: deptDesc,
      });
      setShowDeptModal(false);
      setDeptName("");
      setDeptDesc("");
      alert("Department created successfully!");
      await loadData();
    } catch (e: any) {
      alert("Failed: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Organization Hierarchy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Departments & Project Workspaces
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise boundary isolation: create functional divisions and permission-scoped workspaces.
          </p>
        </div>

        <button
          onClick={() => setShowDeptModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Department</span>
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const deptWs = workspaces.filter((w) => w.department_id === dept.id);
          return (
            <div key={dept.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase">
                    {dept.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{dept.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{dept.description || "Enterprise IT department"}</p>
              </div>

              {/* Scoped Workspaces */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Workspaces ({deptWs.length})</span>
                </div>
                <div className="space-y-1.5">
                  {deptWs.map((ws) => (
                    <div key={ws.id} className="p-2 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{ws.name}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">/{ws.slug}</span>
                    </div>
                  ))}
                  {deptWs.length === 0 && (
                    <div className="text-[11px] text-slate-500 italic">No workspaces in this department</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-white/20 shadow-glass">
            <h3 className="text-lg font-bold text-white mb-2">Create New Department</h3>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Security & Infrastructure"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Operational scope, team roles, and mission..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
