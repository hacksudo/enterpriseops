"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  UserCheck,
  FolderKanban,
  CheckSquare,
  Bug,
  Share2,
  FileText,
  MessageSquare,
  ScrollText,
  Building2,
  Bell,
  LogOut,
  ChevronDown,
  Clock,
  Sparkles,
  Menu,
  X,
  Users,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Download,
  Briefcase,
  Plus,
  Check,
  Trash2,
  RefreshCw
} from "lucide-react";
import { api, removeStoredToken } from "@/lib/api";

const tourSteps = [
  {
    title: "Welcome to hacksudo EnterpriseOps",
    badge: "Platform Overview",
    icon: Shield,
    description: "Your all-in-one command center unifying enterprise IT workforce tracking, PMO governance, and high-assurance VAPT vulnerability operations.",
    highlights: [
      "Real-time operational visibility across engineering, PMO, and security testing departments.",
      "Strict role-based access control (Super Admin, PMO, Team Lead, Employee).",
      "Tamper-evident audit logging and automated vulnerability tracking."
    ]
  },
  {
    title: "Navigation & Sidebar Tabs",
    badge: "Sidebar Navigation",
    icon: Layers,
    description: "Access all modules from the Liquid Glass sidebar on the left.",
    highlights: [
      "Executive Command: High-level KPI summaries and security metrics.",
      "My Work & Check-In: Clock in/out, log daily observations, and generate reports.",
      "PMO Governance: Project milestones, task assignments, and approval workflows.",
      "VAPT Vulnerabilities: Full pentest findings hub with automated document parsing.",
      "Users & Access: Team management, passwords, and fresh launch demo reset."
    ]
  },
  {
    title: "VAPT Upload & Automatic Extraction",
    badge: "VAPT Operations",
    icon: FileSpreadsheet,
    description: "Eliminate manual report copy-pasting with our automated document parsing engine.",
    highlights: [
      "Upload & Extract: Drop any Excel (.xlsx) or Word (.docx) security audit report.",
      "Selective Import: Check or uncheck findings to import only verified items.",
      "Add & Delete: Remove unwanted false positives or add custom manual findings.",
      "Assignees: Auto-match findings to team members or select a default assignee."
    ]
  },
  {
    title: "Quick Inline Rename & Patching Sign-Off",
    badge: "Collaboration & Patching",
    icon: CheckCircle2,
    description: "Collaborate seamlessly with the Software Development patching team.",
    highlights: [
      "Rename: Quick-edit any vulnerability title directly inline with instant save.",
      "Modify Name & Details: Slide-out drawer allows editing technical observations and remediation.",
      "Handoff Button: Dispatch vulnerabilities to developers for expedited remediation.",
      "Sign-Off Button: Verify fixes and mark as 'Closed' or 'Keep Open / Reopen'."
    ]
  },
  {
    title: "Executive Report Exports (Excel & Word)",
    badge: "Reporting Hub",
    icon: Download,
    description: "Generate presentation-ready reports for leadership, PMO, and external clients in one click.",
    highlights: [
      "Export Excel: Formatted spreadsheet with CVSS scores, status badges, and remediation details.",
      "Export Word: Formatted Word document with executive summary and finding breakdown.",
      "Downloadable by testers, team leads, and executive PMO administrators."
    ]
  },
  {
    title: "Clean Production Launch Ready",
    badge: "Fresh Start",
    icon: Sparkles,
    description: "When you are ready to transition from demo testing to real-world operations, launch with a clean slate.",
    highlights: [
      "Clear Demo Data Button: Located in 'Users & Access' to wipe demo entries in 1-click.",
      "Preserves Accounts: Keeps all administrator and user logins completely intact.",
      "Tutorial Button: Restart this tour anytime using the 'Tutorial Guide' button in the top bar."
    ]
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [workStatus, setWorkStatus] = useState<any>({ checked_in: false, elapsed_minutes: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tutorial Tour State
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Workspace Selector & Management State
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // Global Clean Handover Modal State
  const [showCleanHandoverModal, setShowCleanHandoverModal] = useState(false);
  const [wipeDemoUsers, setWipeDemoUsers] = useState(false);
  const [isClearingHandover, setIsClearingHandover] = useState(false);

  const handleExecuteCleanHandover = async () => {
    try {
      setIsClearingHandover(true);
      const res = await api.clearDemoData(wipeDemoUsers);
      alert(res.message || "All demo data has been permanently cleared! The system is now 100% clean for handover.");
      setShowCleanHandoverModal(false);
      window.location.reload();
    } catch (e: any) {
      alert("Failed to clear demo data: " + e.message);
    } finally {
      setIsClearingHandover(false);
    }
  };

  const loadWorkspaces = async () => {
    try {
      const list = await api.getWorkspaces();
      if (Array.isArray(list) && list.length > 0) {
        setWorkspaces(list);
        const savedWs = localStorage.getItem("enterpriseops_current_workspace");
        let active = null;
        if (savedWs) {
          try {
            const parsed = JSON.parse(savedWs);
            active = list.find((w: any) => w.id === parsed.id || w.name === parsed.name);
          } catch {}
        }
        if (!active) {
          active = list[0];
        }
        setCurrentWorkspace(active);
        localStorage.setItem("enterpriseops_current_workspace", JSON.stringify(active));
      } else {
        const fallback = { id: "default", name: "Android Security Workspace" };
        setWorkspaces([fallback]);
        setCurrentWorkspace(fallback);
      }
    } catch {
      const fallback = { id: "default", name: "Android Security Workspace" };
      setWorkspaces([fallback]);
      setCurrentWorkspace(fallback);
    }
  };

  const handleSelectWorkspace = (ws: any) => {
    setCurrentWorkspace(ws);
    localStorage.setItem("enterpriseops_current_workspace", JSON.stringify(ws));
    setWorkspaceDropdownOpen(false);
    window.dispatchEvent(new CustomEvent("enterpriseops_workspace_changed", { detail: ws }));
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setIsCreatingWorkspace(true);
    try {
      const created = await api.createWorkspace({
        name: newWorkspaceName.trim(),
        description: newWorkspaceDesc.trim() || undefined,
      });
      setWorkspaces((prev) => [created, ...prev.filter((w) => w.id !== created.id)]);
      setCurrentWorkspace(created);
      localStorage.setItem("enterpriseops_current_workspace", JSON.stringify(created));
      setShowCreateWorkspaceModal(false);
      setNewWorkspaceName("");
      setNewWorkspaceDesc("");
      setWorkspaceDropdownOpen(false);
      window.dispatchEvent(new CustomEvent("enterpriseops_workspace_changed", { detail: created }));
    } catch (err: any) {
      alert("Failed to create workspace: " + (err.message || "Unknown error"));
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("enterpriseops_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);

        // Check if user has already completed the first-time tour
        const tourDone = localStorage.getItem(`hacksudo_tour_completed_${parsed.id || 'default'}`);
        if (!tourDone) {
          const timer = setTimeout(() => {
            setTourOpen(true);
          }, 600);
          return () => clearTimeout(timer);
        }
      } catch {}
    } else {
      router.push("/");
    }

    // Load workspaces
    loadWorkspaces();

    // Load work status and notifications
    api.getWorkStatus().then(setWorkStatus).catch(() => {});
    api.getNotifications().then(setNotifications).catch(() => {});

    // Poll work timer every 30s
    const timer = setInterval(() => {
      api.getWorkStatus().then(setWorkStatus).catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [router]);

  const handleCloseTour = () => {
    setTourOpen(false);
    const userId = user?.id || "default";
    localStorage.setItem(`hacksudo_tour_completed_${userId}`, "true");
  };

  const handleLogout = () => {
    api.logout().catch(() => {});
    removeStoredToken();
    router.push("/");
  };

  const navItems = [
    { label: "Executive Command", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Work & Check-In", href: "/dashboard/employee", icon: UserCheck },
    { label: "PMO Governance", href: "/dashboard/pmo", icon: FolderKanban },
    { label: "Tasks & Board", href: "/dashboard/tasks", icon: CheckSquare },
    { label: "VAPT Vulnerabilities", href: "/dashboard/vapt", icon: Bug },
    { label: "Cross-Dept Handoffs", href: "/dashboard/handoffs", icon: Share2 },
    { label: "Departments", href: "/dashboard/departments", icon: Building2 },
    { label: "Users & Access", href: "/dashboard/users", icon: Users },
    { label: "Consolidated Reports", href: "/dashboard/reports", icon: FileText },
    { label: "Department Chat", href: "/dashboard/chat", icon: MessageSquare },
    { label: "Audit Logs", href: "/dashboard/audit", icon: ScrollText },
  ];

  const unreadNotifs = notifications.filter((n) => !n.read_at);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 glass-panel border-b border-white/10 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-white text-base">hacksudo <span className="text-cyan-400">EnterpriseOps</span></span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Liquid Glass Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 glass-panel border-r border-white/10 flex flex-col z-40 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-glass-sm shadow-cyan-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-white text-base tracking-tight leading-none">
              hacksudo <span className="text-cyan-400">EnterpriseOps</span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">
              IT Ops & VAPT
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  active
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/40 text-cyan-300 shadow-glass-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 transition ${active ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                <span className="truncate">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/10 glass-panel-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.full_name ? user.full_name[0] : "U"}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">{user?.full_name || "User"}</div>
                <div className="text-[10px] text-cyan-400 font-medium truncate">{user?.role || "Employee"}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 glass-panel border-b border-white/10 px-6 py-3.5 flex items-center justify-between">
          {/* Workspace Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-500/50 text-xs font-semibold text-white flex items-center gap-2 transition cursor-pointer shadow-sm group"
              title="Click to switch or create workspaces"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400 font-normal hidden sm:inline">Workspace:</span>
              <span className="text-cyan-300 font-bold max-w-[130px] sm:max-w-[210px] truncate">
                {currentWorkspace?.name || "Android Security Workspace"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${workspaceDropdownOpen ? "rotate-180 text-cyan-400" : "group-hover:text-white"}`} />
            </button>

            {/* Dropdown Menu */}
            {workspaceDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setWorkspaceDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-slate-950/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 px-1 border-b border-white/10 mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                      Select Workspace
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {workspaces.length} active
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                    {workspaces.map((ws) => {
                      const isSelected = currentWorkspace?.id === ws.id;
                      return (
                        <button
                          key={ws.id}
                          onClick={() => handleSelectWorkspace(ws)}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs transition cursor-pointer ${
                            isSelected
                              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-bold shadow-sm"
                              : "hover:bg-white/[0.05] text-slate-300 hover:text-white border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-cyan-400" : "bg-slate-600"}`} />
                            <div className="truncate">
                              <div className="truncate font-semibold">{ws.name}</div>
                              {ws.description && (
                                <div className="text-[10px] text-slate-400 truncate font-normal">{ws.description}</div>
                              )}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Create New Workspace Option */}
                  <div className="pt-2 border-t border-white/10 mt-1">
                    <button
                      onClick={() => {
                        setWorkspaceDropdownOpen(false);
                        setShowCreateWorkspaceModal(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4 text-cyan-400" />
                      <span>Create New Workspace</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Clean Handover Launcher Button */}
            <button
              onClick={() => setShowCleanHandoverModal(true)}
              title="Wipe demo records & prepare clean system for client handover"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Clean Handover</span>
            </button>

            {/* Tutorial Tour Launch Button */}
            <button
              onClick={() => {
                setTourStep(0);
                setTourOpen(true);
              }}
              title="Platform Feature Tutorial & Tab Guide"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Tutorial Guide</span>
            </button>

            {/* Work Status Timer Badge */}
            {workStatus.checked_in && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>On Work: {Math.floor(workStatus.elapsed_minutes / 60)}h {workStatus.elapsed_minutes % 60}m</span>
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-300 hover:text-white hover:border-cyan-500/40 transition"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-2xl shadow-glass border border-white/20 p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Alerts & Notifications</span>
                    <span className="text-[10px] text-cyan-400">{unreadNotifs.length} unread</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border text-xs transition ${
                            n.priority === "critical"
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
                              : "bg-slate-900/60 border-slate-700/60 text-slate-300"
                          }`}
                        >
                          <div className="font-semibold text-white mb-0.5">{n.title}</div>
                          <div className="text-[11px] text-slate-400">{n.body}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* FIRST-TIME USER TUTORIAL MODAL (With Skip, Next, Back, and Tab Guides)    */}
      {/* ========================================================================= */}
      {tourOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-xl rounded-3xl border border-cyan-500/40 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Header with Step Counter & Skip Button */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold uppercase tracking-wider">
                  {tourSteps[tourStep].badge}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Step {tourStep + 1} of {tourSteps.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseTour}
                className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5"
                title="Skip this tutorial"
              >
                <span>Skip Tour</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Step Content */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/10">
                  {React.createElement(tourSteps[tourStep].icon, { className: "w-6 h-6 text-cyan-400" })}
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-white tracking-tight">
                    {tourSteps[tourStep].title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {tourSteps[tourStep].description}
                  </p>
                </div>
              </div>

              {/* Visual Highlight Details Box */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Key Functions & Buttons</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {tourSteps[tourStep].highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
              {/* Progress Dots */}
              <div className="flex items-center gap-1.5">
                {tourSteps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTourStep(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === tourStep
                        ? "w-6 bg-gradient-to-r from-cyan-400 to-blue-500"
                        : "w-2 bg-slate-700 hover:bg-slate-500"
                    }`}
                    title={`Go to step ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {tourStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setTourStep((prev) => Math.max(0, prev - 1))}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                  >
                    Back
                  </button>
                )}
                {tourStep < tourSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setTourStep((prev) => prev + 1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCloseTour}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/25 transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Get Started</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Workspace Modal */}
      {showCreateWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/20 p-6 space-y-4 shadow-glass animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Workspace</h3>
                  <p className="text-xs text-slate-400">Add an operational workspace for projects or audits</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateWorkspaceModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Workspace Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Web Application Pentest, Cloud Audit..."
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Description <span className="text-slate-500 text-[10px]">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Operational scope, client name, or target environment..."
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateWorkspaceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition disabled:opacity-50 shadow-md flex items-center gap-1.5"
                >
                  {isCreatingWorkspace ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Workspace</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL CLIENT HANDOVER & CLEAN SLATE MODAL */}
      {showCleanHandoverModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-rose-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
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
                <li>All demo tasks, comments, and task events</li>
                <li>All VAPT vulnerability findings & retests</li>
                <li>All demo workday check-ins, time logs & reports</li>
                <li>All demo handoff requests & alerts</li>
              </ul>
              <p className="text-emerald-400 font-medium pt-1">
                ✓ Administrator accounts and department structure remain safe and ready for real operations.
              </p>
            </div>

            {/* Checkbox for Demo Users */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-white/10">
              <input
                type="checkbox"
                id="layoutModalWipeCheck"
                checked={wipeDemoUsers}
                onChange={(e) => setWipeDemoUsers(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="layoutModalWipeCheck" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-semibold text-white">Also remove demo staff accounts</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Deletes Sarah Jenkins (PMO), Vishal Waghmare (Tester), and Alex Rivera (Dev), leaving ONLY your Super Admin login.
                </p>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isClearingHandover}
                onClick={() => setShowCleanHandoverModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingHandover}
                onClick={handleExecuteCleanHandover}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isClearingHandover ? (
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
    </div>
  );
}
