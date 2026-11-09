"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  KeyRound,
  Trash2,
  Building2,
  Briefcase,
  Mail,
  UserCheck,
  AlertTriangle,
  Lock,
  Crown,
  MoreVertical,
  RefreshCw
} from "lucide-react";
import { api } from "@/lib/api";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showClearDemoModal, setShowClearDemoModal] = useState(false);
  const [wipeDemoUsers, setWipeDemoUsers] = useState(false);
  const [isClearingDemoData, setIsClearingDemoData] = useState(false);

  const handleClearDemoData = async () => {
    try {
      setIsClearingDemoData(true);
      const res = await api.clearDemoData(wipeDemoUsers);
      alert(res.message || "All demo data has been cleared! System is now fresh for production launch.");
      setShowClearDemoModal(false);
      await loadData();
    } catch (e: any) {
      alert("Failed to clear demo data: " + e.message);
    } finally {
      setIsClearingDemoData(false);
    }
  };

  // Create Form State
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    designation: "Security Tester",
    employee_code: "",
    role_name: "Employee",
    department_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("enterpriseops_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
      } catch {}
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, dList] = await Promise.all([
        api.getUsers(),
        api.getDepartments(),
      ]);
      setUsers(uList || []);
      setDepartments(dList || []);
      if (dList && dList.length > 0) {
        setForm((prev) => ({ ...prev, department_id: dList[0].id }));
      }
    } catch (err: any) {
      console.error("Failed to load user data", err);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = currentUser?.role === "Super Admin" || currentUser?.roles?.includes("Super Admin");
  const isPMO = currentUser?.role === "PMO" || currentUser?.roles?.includes("PMO");

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const payload: any = {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        designation: form.designation,
        employee_code: form.employee_code || undefined,
        role_name: form.role_name,
        department_id: form.department_id || undefined,
      };

      await api.createUser(payload);
      setFeedback({ type: "success", msg: `User ${form.full_name} (${form.role_name}) successfully provisioned!` });
      setCreateModalOpen(false);
      setForm({
        full_name: "",
        email: "",
        password: "",
        designation: "Security Tester",
        employee_code: "",
        role_name: isSuperAdmin ? "Employee" : "Tester",
        department_id: departments[0]?.id || "",
      });
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to create user." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.account_status === "active" ? "suspended" : "active";
    const confirmMsg = `Are you sure you want to ${nextStatus === "suspended" ? "suspend" : "activate"} ${user.full_name}'s account?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.updateUserStatus(user.id, nextStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset || !newPassword) return;
    try {
      await api.resetUserPassword(selectedUserForReset.id, newPassword);
      alert(`Password for ${selectedUserForReset.full_name} updated successfully!`);
      setResetModalOpen(false);
      setNewPassword("");
      setSelectedUserForReset(null);
    } catch (err: any) {
      alert(err.message || "Failed to reset password");
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`PERMANENT ACTION: Are you sure you want to delete user ${user.full_name} (${user.email})?`)) return;
    try {
      await api.deleteUser(user.id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.employee_code?.toLowerCase().includes(search.toLowerCase()) ||
      u.designation?.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDept === "all" || u.department_id === selectedDept;
    const matchesRole =
      selectedRole === "all" ||
      u.roles?.includes(selectedRole) ||
      (selectedRole === "Admin" && u.roles?.some((r: string) => r.includes("Admin")));

    return matchesSearch && matchesDept && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Users & Team Directory</h1>
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Super Admin Full Authority
              </span>
            )}
            {isPMO && !isSuperAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                <Shield className="w-3.5 h-3.5 text-indigo-400" /> PMO Department Provisioning
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage user accounts, department assignments, role-based authorization, and security status.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {isSuperAdmin && (
            <button
              onClick={() => setShowClearDemoModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 transition shadow-sm cursor-pointer"
              title="Purge demo findings, tasks, and check-ins before official launch"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Clear Demo Data (Fresh Start)</span>
            </button>
          )}

          {(isSuperAdmin || isPMO) && (
            <button
              onClick={() => {
                setFeedback(null);
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {isSuperAdmin ? "Create New User" : "Add Team Member"}
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {feedback.msg}
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Members</div>
          <div className="text-2xl font-bold text-white mt-1">{users.length}</div>
          <div className="text-xs text-slate-500 mt-1">Across all departments</div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="text-xs text-amber-400 font-medium uppercase tracking-wider">Super Admins</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">
            {users.filter((u) => u.roles?.some((r: string) => r.includes("Super Admin") || r.includes("Managing Director"))).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Global authority</div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="text-xs text-indigo-400 font-medium uppercase tracking-wider">PMO & Leads</div>
          <div className="text-2xl font-bold text-indigo-300 mt-1">
            {users.filter((u) => u.roles?.some((r: string) => r.includes("PMO") || r.includes("Lead"))).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Project governance</div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Active Status</div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">
            {users.filter((u) => u.account_status === "active").length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Ready for assignment</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, code, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" /> Department:
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-2">
            Role:
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="PMO">PMO</option>
            <option value="Team Lead">Team Lead</option>
            <option value="Employee">Employee / Tester / Dev</option>
          </select>

          <button
            onClick={loadData}
            title="Refresh user list"
            className="p-2 rounded-lg bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 border-b border-white/5">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Employee Code</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Loading directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleStr = u.roles?.join(", ") || "Employee";
                  const isUserSuper = u.roles?.some((r: string) => r.includes("Super Admin") || r.includes("Managing Director"));
                  const isUserPMO = u.roles?.some((r: string) => r.includes("PMO"));

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-xs text-cyan-300">
                            {u.full_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              {u.full_name}
                              {isUserSuper && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Code & Designation */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                          {u.employee_code || "N/A"}
                        </span>
                        <div className="text-xs text-slate-400 mt-0.5">{u.designation || "Staff"}</div>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {u.department_name || (isUserSuper ? "Organization Wide" : "Unassigned")}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center">
                          {isUserSuper ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/35 shadow-sm shadow-amber-500/10 whitespace-nowrap">
                              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Super Admin</span>
                            </span>
                          ) : isUserPMO ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/35 whitespace-nowrap">
                              <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span>PMO Lead</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 whitespace-nowrap">
                              <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>{roleStr}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {u.account_status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Status Toggle (Super Admin or PMO for non-admins) */}
                          {(isSuperAdmin || (isPMO && !isUserSuper && !isUserPMO)) && u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              title={u.account_status === "active" ? "Suspend user" : "Activate user"}
                              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                                u.account_status === "active"
                                  ? "bg-slate-900 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                                  : "bg-slate-900 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              }`}
                            >
                              {u.account_status === "active" ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* Reset Password (Super Admin Only) */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => {
                                setSelectedUserForReset(u);
                                setNewPassword("");
                                setResetModalOpen(true);
                              }}
                              title="Reset Password (Super Admin)"
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 hover:bg-amber-500/10"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete User (Super Admin Only) */}
                          {isSuperAdmin && u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Delete Account (Super Admin)"
                              className="p-1.5 rounded-lg bg-slate-900 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-white/20 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {isSuperAdmin ? "Provision Enterprise User" : "Add Department Team Member"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isSuperAdmin
                      ? "Create accounts with full administrative or operational privileges"
                      : "Create and assign team contributors within your department"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Privilege Scope Banner */}
            <div className={`mt-4 p-3 rounded-xl border text-xs ${
              isSuperAdmin
                ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-200"
            }`}>
              {isSuperAdmin ? (
                <div className="flex items-start gap-2">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Super Admin Privilege Active:</span> You can provision any role (Super Admin, PMO, Team Lead, Employee) across any department or system-wide.
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">PMO Scope Active:</span> You can provision team contributors (Testers, Developers, Team Leads) bound to your department. Administrative roles are restricted.
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="john.doe@company.internal"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Employee Code</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-1049"
                    value={form.employee_code}
                    onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior VAPT Specialist"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role Privileges *</label>
                  <select
                    value={form.role_name}
                    onChange={(e) => setForm({ ...form, role_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {isSuperAdmin && <option value="Super Admin">👑 Super Admin / CEO</option>}
                    {isSuperAdmin && <option value="Department Admin">🏢 Department Administrator</option>}
                    <option value="PMO">🛡️ PMO / Project Manager</option>
                    <option value="Team Lead">⭐ Team Lead</option>
                    <option value="Employee">👤 Employee / Specialist</option>
                    <option value="Tester">🎯 VAPT Penetration Tester</option>
                    <option value="Developer">💻 Software Developer</option>
                    {isSuperAdmin && <option value="Auditor">📋 Compliance Auditor (Read-only)</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Department</label>
                <select
                  value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  {isSuperAdmin && <option value="">Global (Organization Wide)</option>}
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
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
                  {submitting ? "Creating..." : "Confirm Provisioning"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL (Super Admin) */}
      {resetModalOpen && selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 border border-white/20 shadow-2xl relative animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" /> Reset Password
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Set a new temporary password for <span className="text-white font-medium">{selectedUserForReset.full_name}</span>.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-300 bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-500/20"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLEAR DEMO DATA MODAL (FRESH START) */}
      {showClearDemoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-rose-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear Demo Data & Start Fresh</h3>
                <p className="text-xs text-rose-300">Prepare platform for official production launch</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs text-slate-300 space-y-2">
              <p>
                <strong className="text-rose-400">Warning:</strong> This action will permanently wipe:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>All demo VAPT vulnerability findings & retests</li>
                <li>All demo tasks, comments, and task events</li>
                <li>All workday check-ins & time log entries</li>
                <li>All cross-department handoff requests</li>
                <li>All demo notification alerts</li>
              </ul>
              <p className="text-emerald-400 font-medium pt-1">
                ✓ Administrator account and core department structures will be safely preserved.
              </p>
            </div>

            {/* Checkbox for Demo Users */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-white/10">
              <input
                type="checkbox"
                id="usersModalWipeCheck"
                checked={wipeDemoUsers}
                onChange={(e) => setWipeDemoUsers(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="usersModalWipeCheck" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-semibold text-white">Also remove demo staff accounts</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Deletes Sarah Jenkins (PMO), Vishal Waghmare (Tester), and Alex Rivera (Dev), leaving ONLY your Super Admin login.
                </p>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isClearingDemoData}
                onClick={() => setShowClearDemoModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingDemoData}
                onClick={handleClearDemoData}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isClearingDemoData ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Wiping Demo Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Wipe Demo Data & Start Fresh</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
