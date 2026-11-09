"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ShieldAlert,
  Bug,
  Plus,
  Share2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Upload,
  AlertTriangle,
  Flame,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  User as UserIcon,
  UserCheck,
  Check,
  X,
  Clock,
  ArrowRight,
  Eye,
  FileUp,
  SlidersHorizontal,
  ChevronRight,
  Activity,
  Layers,
  Lock,
  MessageSquare,
  Download,
  Trash2,
  CheckSquare,
  Square,
  Edit3
} from "lucide-react";
import { api } from "@/lib/api";

interface Finding {
  id: string;
  organization_id: string;
  department_id: string;
  workspace_id: string;
  project_id?: string;
  asset_id?: string;
  finding_number: string;
  title: string;
  description?: string;
  observation: string;
  reproduction_steps?: string;
  impact: string;
  remediation: string;
  cwe_id?: string;
  cve_id?: string;
  owasp_mapping?: string;
  cvss_version: string;
  cvss_vector?: string;
  cvss_score: number;
  severity: string;
  status: string;
  discovered_by?: string;
  assigned_to?: string;
  assigned_user_name?: string;
  assigned_user_email?: string;
  discovered_at: string;
  created_at: string;
}

interface ExtractedFinding {
  id: string;
  selected: boolean;
  title: string;
  severity: string;
  cvss_score?: number;
  cvss_vector?: string;
  cvss_version?: string;
  observation?: string;
  description?: string;
  impact?: string;
  remediation?: string;
  affected_asset?: string;
  cve_id?: string;
  cwe_id?: string;
  status: string;
  suggested_assignee?: string;
  assigned_to?: string;
}

export default function VaptFindingsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [showSignoffModal, setShowSignoffModal] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  // Download state
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  // Filtering & Segregation State (for Team Lead & Users)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserFilter, setSelectedUserFilter] = useState("ALL");
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Create Finding form state
  const [title, setTitle] = useState("Remote Account Takeover via Insecure Deep Link");
  const [observation, setObservation] = useState("Exported activity handles transfer intents without verification.");
  const [impact, setImpact] = useState("Total loss of account balance.");
  const [remediation, setRemediation] = useState("Enforce exported=false and cryptographic token validation.");
  const [cvssVector, setCvssVector] = useState("CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N");
  const [cvssScore, setCvssScore] = useState(9.3);
  const [severity, setSeverity] = useState("Critical");
  const [createAssignee, setCreateAssignee] = useState("");

  // Upload & Extraction State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [extractedList, setExtractedList] = useState<ExtractedFinding[]>([]);
  const [extractedFilename, setExtractedFilename] = useState("");
  const [bulkDefaultAssignee, setBulkDefaultAssignee] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sign-off / Retest state
  const [signoffNotes, setSignoffNotes] = useState("");
  const [signoffAction, setSignoffAction] = useState<"close" | "open">("close");

  // Finding name & details modification state
  const [isEditingFinding, setIsEditingFinding] = useState(false);
  const [isSavingFinding, setIsSavingFinding] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    observation: "",
    impact: "",
    remediation: ""
  });

  // Quick inline rename state on finding card
  const [inlineEditingFindingId, setInlineEditingFindingId] = useState<string | null>(null);
  const [inlineTitleValue, setInlineTitleValue] = useState<string>("");
  const [isSavingInline, setIsSavingInline] = useState<boolean>(false);

  const handleSaveInlineTitle = async (findingId: string) => {
    if (!inlineTitleValue.trim()) {
      alert("Vulnerability name cannot be empty.");
      return;
    }
    try {
      setIsSavingInline(true);
      const updated = await api.updateFinding(findingId, {
        title: inlineTitleValue.trim()
      });
      setFindings((prev) =>
        prev.map((item) => (item.id === findingId ? { ...item, title: updated.title } : item))
      );
      if (selectedFinding && selectedFinding.id === findingId) {
        setSelectedFinding(updated);
      }
      setInlineEditingFindingId(null);
    } catch (e: any) {
      alert("Failed to modify vulnerability name: " + e.message);
    } finally {
      setIsSavingInline(false);
    }
  };

  const handleOpenFinding = (f: Finding, editMode: boolean = false) => {
    setSelectedFinding(f);
    setEditForm({
      title: f.title,
      observation: f.observation,
      impact: f.impact,
      remediation: f.remediation
    });
    setIsEditingFinding(editMode);
  };

  const handleSaveFindingModifications = async () => {
    if (!selectedFinding) return;
    if (!editForm.title.trim()) {
      alert("Vulnerability name cannot be empty.");
      return;
    }
    try {
      setIsSavingFinding(true);
      const updated = await api.updateFinding(selectedFinding.id, {
        title: editForm.title.trim(),
        observation: editForm.observation.trim(),
        impact: editForm.impact.trim(),
        remediation: editForm.remediation.trim()
      });
      setSelectedFinding(updated);
      setIsEditingFinding(false);
      await loadData();
      alert("Vulnerability name and details modified successfully!");
    } catch (e: any) {
      alert("Failed to save changes: " + e.message);
    } finally {
      setIsSavingFinding(false);
    }
  };

  // Handoff state
  const [handoffNotes, setHandoffNotes] = useState("Assigned for urgent security remediation.");

  // Clear All Vulnerabilities State
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const handleClearAllFindings = async () => {
    try {
      setIsClearingAll(true);
      const res = await api.clearAllFindings();
      alert(res.message || "All vulnerability findings have been cleared!");
      setShowClearAllModal(false);
      setSelectedFinding(null);
      await loadData();
    } catch (e: any) {
      alert("Failed to clear vulnerabilities: " + e.message);
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleDeleteSingleFinding = async (findingId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this vulnerability finding?")) return;
    try {
      await api.deleteFinding(findingId);
      if (selectedFinding && selectedFinding.id === findingId) {
        setSelectedFinding(null);
      }
      await loadData();
    } catch (err: any) {
      alert("Failed to delete finding: " + err.message);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [findingsData, usersData] = await Promise.all([
        api.getFindings(),
        api.getUsers().catch(() => [])
      ]);
      setFindings(findingsData || []);
      setUsers(usersData || []);
    } catch (e: any) {
      console.error("Failed to load VAPT data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedFinding(null);
        setIsEditingFinding(false);
        setShowUploadModal(false);
        setShowCreateModal(false);
        setShowHandoffModal(false);
        setShowSignoffModal(false);
        setInlineEditingFindingId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered findings according to search and Team Lead user segregation
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = f.title.toLowerCase().includes(q);
        const matchesNum = f.finding_number.toLowerCase().includes(q);
        const matchesObs = f.observation?.toLowerCase().includes(q);
        const matchesCve = f.cve_id?.toLowerCase().includes(q);
        const matchesAssignee = f.assigned_user_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNum && !matchesObs && !matchesCve && !matchesAssignee) {
          return false;
        }
      }

      if (selectedUserFilter !== "ALL") {
        if (selectedUserFilter === "UNASSIGNED") {
          if (f.assigned_to) return false;
        } else {
          if (f.assigned_to !== selectedUserFilter) return false;
        }
      }

      if (selectedSeverityFilter !== "ALL" && f.severity !== selectedSeverityFilter) {
        return false;
      }

      if (selectedStatusFilter !== "ALL") {
        if (selectedStatusFilter === "CLOSED_RESOLVED") {
          if (!["Resolved", "Closed"].includes(f.status)) return false;
        } else if (selectedStatusFilter === "OPEN") {
          if (["Resolved", "Closed"].includes(f.status)) return false;
        } else {
          if (f.status !== selectedStatusFilter) return false;
        }
      }

      return true;
    });
  }, [findings, searchQuery, selectedUserFilter, selectedSeverityFilter, selectedStatusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = findings.length;
    const critical = findings.filter((f) => f.severity === "Critical").length;
    const high = findings.filter((f) => f.severity === "High").length;
    const closed = findings.filter((f) => ["Resolved", "Closed"].includes(f.status)).length;
    const open = total - closed;
    const inProgress = findings.filter((f) => f.status === "In Progress").length;
    return { total, critical, high, closed, open, inProgress };
  }, [findings]);

  // Download Handlers (for tester and team leader)
  const handleDownloadExcel = async () => {
    try {
      setIsExportingExcel(true);
      let queryParams = "";
      if (selectedUserFilter !== "ALL") {
        queryParams += `?assigned_to=${selectedUserFilter}`;
      }
      await api.downloadFindingsExcel(queryParams);
    } catch (e: any) {
      alert("Failed to download Excel report: " + e.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadDocx = async () => {
    try {
      setIsExportingDocx(true);
      let queryParams = "";
      if (selectedUserFilter !== "ALL") {
        queryParams += `?assigned_to=${selectedUserFilter}`;
      }
      await api.downloadFindingsDocx(queryParams);
    } catch (e: any) {
      alert("Failed to download Word report: " + e.message);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleCalculateCvss = async (vec: string) => {
    setCvssVector(vec);
    try {
      const res = await api.calculateCVSS("4.0", vec);
      setCvssScore(res.score);
      setSeverity(res.severity);
    } catch {}
  };

  const handleCreateFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const depts = await api.getDepartments();
      const ws = await api.getWorkspaces();
      const vaptDept = depts.find((d: any) => d.slug.includes("vapt")) || depts[0];
      const androidWs = ws[0];

      await api.createFinding({
        organization_id: vaptDept?.organization_id || "default-org",
        department_id: vaptDept?.id || "vapt-dept",
        workspace_id: androidWs?.id || "android-ws",
        title,
        observation,
        impact,
        remediation,
        cvss_version: "4.0",
        cvss_vector: cvssVector,
        cvss_score: cvssScore,
        severity,
        assigned_to: createAssignee || undefined
      });

      setShowCreateModal(false);
      alert("Finding created! Security alerts dispatched.");
      await loadData();
    } catch (e: any) {
      alert("Failed to submit finding: " + e.message);
    }
  };

  // File Upload & Extraction Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setExtractedList([]);
      setExtractedFilename(e.target.files[0].name);
    }
  };

  const handleExtractFile = async () => {
    if (!selectedFile) return;
    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await api.uploadExtractFindings(formData);
      const items: ExtractedFinding[] = (res.findings || []).map((f: any, idx: number) => ({
        ...f,
        id: `extracted-${idx}-${Date.now()}`,
        selected: true // By default selected, user can uncheck or delete
      }));
      setExtractedList(items);
      setExtractedFilename(res.filename);
    } catch (e: any) {
      alert("Failed to extract findings: " + e.message);
    } finally {
      setIsExtracting(false);
    }
  };

  // Toggle selection for individual finding
  const handleToggleSelect = (id: string) => {
    setExtractedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  // Select all / Deselect all
  const handleToggleSelectAll = (selectAll: boolean) => {
    setExtractedList((prev) => prev.map((item) => ({ ...item, selected: selectAll })));
  };

  // Delete an unwanted extracted finding
  const handleDeleteExtracted = (id: string) => {
    setExtractedList((prev) => prev.filter((item) => item.id !== id));
  };

  // Add a new manual finding to the extracted list before importing
  const handleAddManualToExtracted = () => {
    const newItem: ExtractedFinding = {
      id: `manual-${Date.now()}`,
      selected: true,
      title: "New Custom Security Finding",
      severity: "High",
      cvss_score: 7.5,
      observation: "Observation details identified during audit...",
      impact: "Security risk to affected asset...",
      remediation: "Apply software patch and enforce input validation...",
      affected_asset: "/api/v1/endpoint",
      status: "Open",
      suggested_assignee: ""
    };
    setExtractedList((prev) => [newItem, ...prev]);
  };

  // Inline edit field in extracted list
  const handleUpdateExtractedField = (id: string, field: keyof ExtractedFinding, value: any) => {
    setExtractedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const selectedExtractedCount = useMemo(() => {
    return extractedList.filter((item) => item.selected).length;
  }, [extractedList]);

  const handleBulkImport = async () => {
    const selectedFindings = extractedList.filter((item) => item.selected);
    if (selectedFindings.length === 0) {
      alert("Please select at least one finding to import.");
      return;
    }
    setIsImporting(true);
    try {
      const findingsToImport = selectedFindings.map((f) => ({
        title: f.title,
        severity: f.severity,
        cvss_score: f.cvss_score,
        cvss_vector: f.cvss_vector,
        cvss_version: f.cvss_version || "4.0",
        observation: f.observation,
        description: f.description || f.observation,
        impact: f.impact,
        remediation: f.remediation,
        affected_asset: f.affected_asset,
        cve_id: f.cve_id,
        cwe_id: f.cwe_id,
        status: f.status,
        suggested_assignee: f.suggested_assignee,
        assigned_to: f.assigned_to || bulkDefaultAssignee || undefined
      }));

      await api.bulkImportFindings({
        default_assigned_to: bulkDefaultAssignee || undefined,
        findings: findingsToImport
      });

      alert(`Successfully imported ${findingsToImport.length} selected vulnerabilities into the dashboard!`);
      setShowUploadModal(false);
      setSelectedFile(null);
      setExtractedList([]);
      await loadData();
    } catch (e: any) {
      alert("Failed to import findings: " + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Status & Assignment Handlers
  const handleUpdateStatus = async (findingId: string, newStatus: string, notes?: string) => {
    try {
      await api.updateFinding(findingId, {
        status: newStatus,
        notes: notes || undefined
      });
      await loadData();
      if (selectedFinding && selectedFinding.id === findingId) {
        setSelectedFinding((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    }
  };

  const handleAssignUser = async (findingId: string, userId: string) => {
    try {
      const updated = await api.updateFinding(findingId, {
        assigned_to: userId
      });
      await loadData();
      if (selectedFinding && selectedFinding.id === findingId) {
        setSelectedFinding(updated);
      }
    } catch (e: any) {
      alert("Failed to reassign user: " + e.message);
    }
  };

  const handleConfirmSignoff = async () => {
    if (!selectedFinding) return;
    const targetStatus = signoffAction === "close" ? "Closed" : "Reopened";
    await handleUpdateStatus(
      selectedFinding.id,
      targetStatus,
      signoffNotes || (signoffAction === "close" ? "Patch verified & signed off." : "Patch verification failed. Reopened for remediation.")
    );
    setShowSignoffModal(false);
    setSignoffNotes("");
  };

  const handleInitiateHandoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;
    try {
      const depts = await api.getDepartments();
      const devDept = depts.find((d: any) => d.slug.includes("dev")) || depts[1] || depts[0];
      const devUser = users.find((u: any) => u.email.includes("dev")) || users[0];

      await api.createHandoff({
        target_department_id: devDept.id,
        recipient_user_id: devUser?.id,
        resource_type: "finding",
        resource_id: selectedFinding.id,
        notes: handoffNotes,
      });

      await handleUpdateStatus(selectedFinding.id, "In Progress", `Handoff dispatched to Software Development (${devUser?.full_name || 'Engineering'})`);

      setShowHandoffModal(false);
      alert("Remediation handoff dispatched to Software Development patching team!");
      await loadData();
    } catch (e: any) {
      alert("Failed to create handoff: " + e.message);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "Critical":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20";
      case "High":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-sm shadow-orange-500/20";
      case "Medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "Low":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    }
  };

  const getStatusBadge = (st: string) => {
    if (["Closed", "Resolved"].includes(st)) {
      return "bg-emerald-500/20 border-emerald-500/40 text-emerald-300";
    }
    if (st === "In Progress") {
      return "bg-cyan-500/20 border-cyan-500/40 text-cyan-300";
    }
    if (st === "Ready for Retest") {
      return "bg-purple-500/20 border-purple-500/40 text-purple-300";
    }
    return "bg-rose-500/20 border-rose-500/40 text-rose-300";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-white/10 shadow-glass">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-2">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>VAPT Vulnerability Operations & Team Lead Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Vulnerability Findings & Automated Extraction
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Upload Excel (.xlsx) and Word (.docx) audit documents, extract & select findings, segregate by assignee, download reports in Excel/Word, and collaborate on patch sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Download Excel Button */}
          <button
            onClick={handleDownloadExcel}
            disabled={isExportingExcel}
            title="Download full report as Excel (.xlsx)"
            className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {isExportingExcel ? (
              <div className="w-3.5 h-3.5 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            )}
            <span>Export Excel</span>
          </button>

          {/* Download Word Docx Button */}
          <button
            onClick={handleDownloadDocx}
            disabled={isExportingDocx}
            title="Download full report as Word document (.docx)"
            className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {isExportingDocx ? (
              <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="w-4 h-4 text-blue-400" />
            )}
            <span>Export Word</span>
          </button>

          {/* Upload & Extract Button */}
          <button
            onClick={() => {
              setSelectedFile(null);
              setExtractedList([]);
              setShowUploadModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition border border-cyan-400/30"
          >
            <Upload className="w-4 h-4 text-cyan-200" />
            <span>Upload & Extract (.xlsx, .docx)</span>
          </button>

          {/* Submit Finding Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/25 transition border border-rose-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Finding</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Vulnerabilities</span>
            <Bug className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.total}</div>
          <div className="text-[11px] text-slate-500">Tracked in database</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.03] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">Critical & High</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{stats.critical + stats.high}</div>
          <div className="text-[11px] text-rose-300/70">{stats.critical} Critical, {stats.high} High</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-300">Under Patching</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{stats.inProgress}</div>
          <div className="text-[11px] text-cyan-300/70">Active remediation fix</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">Resolved / Signed Off</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.closed}</div>
          <div className="text-[11px] text-emerald-300/70">Verified & closed</div>
        </div>
      </div>

      {/* Segregation & Filter Toolbar (For Team Lead & Patching Collaboration) */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by vulnerability name, VAPT ID, CVE, affected asset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Team Lead User Segregation Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80">
              <UserIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[11px] text-slate-400 shrink-0">Assignee:</span>
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Users / Team</option>
                <option value="UNASSIGNED" className="bg-slate-900 text-amber-300">Unassigned Only</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                    {u.full_name} ({u.email.split("@")[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80">
              <Filter className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-[11px] text-slate-400 shrink-0">Severity:</span>
              <select
                value={selectedSeverityFilter}
                onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Severities</option>
                <option value="Critical" className="bg-slate-900 text-rose-400">Critical</option>
                <option value="High" className="bg-slate-900 text-orange-400">High</option>
                <option value="Medium" className="bg-slate-900 text-amber-400">Medium</option>
                <option value="Low" className="bg-slate-900 text-emerald-400">Low</option>
                <option value="Informational" className="bg-slate-900 text-blue-400">Informational</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80">
              <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] text-slate-400 shrink-0">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Statuses</option>
                <option value="OPEN" className="bg-slate-900 text-rose-400">Open Only</option>
                <option value="In Progress" className="bg-slate-900 text-cyan-400">In Progress / Patching</option>
                <option value="Ready for Retest" className="bg-slate-900 text-purple-400">Ready for Retest</option>
                <option value="CLOSED_RESOLVED" className="bg-slate-900 text-emerald-400">Closed / Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(selectedUserFilter !== "ALL" || selectedSeverityFilter !== "ALL" || selectedStatusFilter !== "ALL" || searchQuery) && (
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-400 flex-wrap">
            <span>Filtering active: showing <strong>{filteredFindings.length}</strong> of <strong>{findings.length}</strong> vulnerabilities.</span>
            <button
              onClick={() => {
                setSelectedUserFilter("ALL");
                setSelectedSeverityFilter("ALL");
                setSelectedStatusFilter("ALL");
                setSearchQuery("");
              }}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline text-[11px]"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Findings Section Header & Batch Clear Action (Placed here to preserve pristine top header alignment) */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <span>Audit Findings</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
              {filteredFindings.length}{filteredFindings.length !== findings.length ? ` of ${findings.length}` : ""}
            </span>
          </h2>
        </div>

        {findings.length > 0 && (
          <button
            onClick={() => setShowClearAllModal(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Delete all vulnerability findings in this workspace"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear All Vulnerabilities ({findings.length})</span>
          </button>
        )}
      </div>

      {/* Findings Table List */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-glass">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span>Loading vulnerabilities and team assignments...</span>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400 space-y-3">
            <Bug className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="font-semibold text-white">No vulnerabilities match the current criteria</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Upload an Excel (.xlsx) or Word (.docx) audit report to extract findings, or click "Manual Finding".
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3.5 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-semibold"
              >
                Upload Excel / Word Report
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Create Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredFindings.map((f) => {
              const isClosed = ["Resolved", "Closed"].includes(f.status);
              return (
                <div
                  key={f.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-white/[0.03] transition group cursor-pointer"
                  onClick={() => handleOpenFinding(f, false)}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-rose-400 tracking-wider">
                        {f.finding_number}
                      </span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${getSeverityBadge(f.severity)}`}>
                        {f.severity} ({f.cvss_score.toFixed(1)})
                      </span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${getStatusBadge(f.status)}`}>
                        {f.status}
                      </span>
                      {f.cve_id && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-300">
                          {f.cve_id}
                        </span>
                      )}
                      {f.assigned_user_name ? (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-medium flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-blue-400" />
                          <span>{f.assigned_user_name}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-amber-300/80 font-medium">
                          Unassigned
                        </span>
                      )}
                    </div>

                    {inlineEditingFindingId === f.id ? (
                      <div
                        className="flex items-center gap-2 flex-wrap flex-1 my-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          autoFocus
                          value={inlineTitleValue}
                          onChange={(e) => setInlineTitleValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveInlineTitle(f.id);
                            } else if (e.key === "Escape") {
                              setInlineEditingFindingId(null);
                            }
                          }}
                          className="flex-1 min-w-[280px] max-w-xl px-3 py-1.5 text-sm font-bold text-white bg-slate-900 border border-cyan-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-md"
                          placeholder="Modify vulnerability name..."
                        />
                        <button
                          type="button"
                          disabled={isSavingInline}
                          onClick={() => handleSaveInlineTitle(f.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                          title="Save vulnerability name"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isSavingInline ? "Saving..." : "Save"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInlineEditingFindingId(null)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition flex items-center gap-1.5">
                          <span>{f.title}</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition" />
                        </h3>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInlineEditingFindingId(f.id);
                            setInlineTitleValue(f.title);
                          }}
                          title="Quick modify vulnerability name directly inline"
                          className="opacity-90 hover:opacity-100 px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-[10px] font-semibold inline-flex items-center gap-1 transition"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Rename</span>
                        </button>
                      </div>
                    )}

                    <div className="text-xs text-slate-400 line-clamp-2">
                      <strong className="text-slate-300">Observation:</strong> {f.observation}
                    </div>

                    <div className="text-xs text-emerald-400/90 line-clamp-1">
                      <strong className="text-emerald-300">Remediation:</strong> {f.remediation}
                    </div>
                  </div>

                  {/* Actions column */}
                  <div
                    className="flex items-center gap-2 shrink-0 flex-wrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleOpenFinding(f, false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-white/5"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() => handleOpenFinding(f, true)}
                      title="Modify vulnerability name & details"
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Modify Name</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedFinding(f);
                        setShowHandoffModal(true);
                      }}
                      title="Share with Patching/Development Team"
                      className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Handoff</span>
                    </button>

                    {isClosed ? (
                      <button
                        onClick={() => {
                          setSelectedFinding(f);
                          setSignoffAction("open");
                          setSignoffNotes("");
                          setShowSignoffModal(true);
                        }}
                        title="Reopen finding if patch failed"
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Keep Open / Reopen</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedFinding(f);
                          setSignoffAction("close");
                          setSignoffNotes("");
                          setShowSignoffModal(true);
                        }}
                        title="Mark verified and closed with sign-off note"
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition shadow-sm shadow-emerald-500/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Sign-off & Close</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSingleFinding(f.id, e)}
                      title="Permanently delete this vulnerability finding"
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. UPLOAD & SELECTIVE EXTRACTION MODAL (Excel .xlsx, Word .docx, CSV)       */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel max-w-5xl w-full p-6 rounded-2xl border border-white/20 shadow-glass my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Extract Vulnerabilities from Report</h3>
                  <p className="text-xs text-slate-400">
                    Upload Excel (.xlsx) or Word (.docx). You can select which findings to add, remove unwanted items, and add manual findings.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dropzone & File Selector */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 rounded-2xl bg-cyan-950/[0.08] hover:bg-cyan-950/[0.15] text-center cursor-pointer transition space-y-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.docx,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileUp className="w-8 h-8 text-cyan-400 mx-auto group-hover:scale-110 transition" />
              <div className="text-sm font-bold text-white">
                {selectedFile ? (
                  <span className="text-cyan-300 font-mono">{selectedFile.name}</span>
                ) : (
                  <span>Click to choose or drag & drop Excel / Word document</span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Supports Microsoft Excel (.xlsx, .xls), Word (.docx), and CSV tables.
              </p>
              {selectedFile && (
                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-medium">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
                </div>
              )}
            </div>

            {/* Extraction Trigger Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {extractedList.length > 0 ? (
                  <span>Extracted <strong>{extractedList.length}</strong> items from <em>{extractedFilename}</em></span>
                ) : (
                  <span>Select document and click Extract Data</span>
                )}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!selectedFile || isExtracting}
                  onClick={handleExtractFile}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
                >
                  {isExtracting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Extracting Data...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Extract Data from File</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Extracted Findings Selection & Management Table */}
            {extractedList.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                {/* Selection Bar & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/20">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Master Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAll(selectedExtractedCount < extractedList.length)}
                      className="flex items-center gap-2 text-xs font-bold text-white hover:text-cyan-300 transition"
                    >
                      {selectedExtractedCount === extractedList.length ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span>
                        {selectedExtractedCount === extractedList.length ? "Deselect All" : "Select All"}
                      </span>
                    </button>

                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
                      Selected {selectedExtractedCount} of {extractedList.length} to import
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Add Manual Finding Button */}
                    <button
                      type="button"
                      onClick={handleAddManualToExtracted}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Extra Finding</span>
                    </button>

                    {/* Bulk Assignee Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-300 font-semibold shrink-0">Default Assignee:</span>
                      <select
                        value={bulkDefaultAssignee}
                        onChange={(e) => setBulkDefaultAssignee(e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                      >
                        <option value="">Auto-match / Unassigned</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name} ({u.email.split("@")[0]})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* List of Extracted Findings with Select Checkboxes & Delete Action */}
                <div className="max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/70 divide-y divide-white/5 p-1">
                  {extractedList.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-lg text-xs space-y-2 transition ${
                        item.selected
                          ? "bg-slate-900/60 border border-cyan-500/20"
                          : "bg-slate-950/40 opacity-60 border border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Checkbox & Title */}
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(item.id)}
                            className="mt-0.5 text-cyan-400 hover:scale-110 transition shrink-0"
                            title={item.selected ? "Click to uncheck (will not import)" : "Click to select for import"}
                          >
                            {item.selected ? (
                              <CheckSquare className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>

                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Severity selector */}
                              <select
                                value={item.severity}
                                onChange={(e) => handleUpdateExtractedField(item.id, "severity", e.target.value)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-950 cursor-pointer ${getSeverityBadge(item.severity)}`}
                              >
                                <option value="Critical" className="bg-slate-900 text-rose-400">Critical</option>
                                <option value="High" className="bg-slate-900 text-orange-400">High</option>
                                <option value="Medium" className="bg-slate-900 text-amber-400">Medium</option>
                                <option value="Low" className="bg-slate-900 text-emerald-400">Low</option>
                                <option value="Informational" className="bg-slate-900 text-blue-400">Info</option>
                              </select>

                              {/* Editable Title */}
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => handleUpdateExtractedField(item.id, "title", e.target.value)}
                                className="font-bold text-white bg-transparent border-b border-dashed border-slate-700 hover:border-cyan-400 focus:border-cyan-400 focus:outline-none flex-1 text-xs"
                                placeholder="Vulnerability Title"
                              />

                              {/* Asset / Target */}
                              <input
                                type="text"
                                value={item.affected_asset || ""}
                                onChange={(e) => handleUpdateExtractedField(item.id, "affected_asset", e.target.value)}
                                placeholder="Target / Asset (optional)"
                                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px] w-36 focus:outline-none focus:border-cyan-400"
                              />
                            </div>

                            <p className="text-slate-400 text-[11px] line-clamp-2">
                              {item.observation || item.description}
                            </p>
                            <p className="text-emerald-400/90 text-[11px] line-clamp-1">
                              <strong>Remediation:</strong> {item.remediation}
                            </p>
                          </div>
                        </div>

                        {/* Assignee & Delete Button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={item.assigned_to || ""}
                            onChange={(e) => handleUpdateExtractedField(item.id, "assigned_to", e.target.value)}
                            className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px] max-w-[130px]"
                            title="Assign to user"
                          >
                            <option value="">{item.suggested_assignee ? `Matched: ${item.suggested_assignee}` : 'Assign user'}</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.full_name}
                              </option>
                            ))}
                          </select>

                          {/* Delete Unwanted Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteExtracted(item.id)}
                            title="Delete this unwanted finding from the list"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Import Confirmation Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-slate-400">
                    {selectedExtractedCount > 0 ? (
                      <span><strong>{selectedExtractedCount}</strong> findings will be saved to your dashboard database.</span>
                    ) : (
                      <span className="text-amber-400 font-semibold">Select at least one finding above to import.</span>
                    )}
                  </span>

                  <button
                    type="button"
                    disabled={isImporting || selectedExtractedCount === 0}
                    onClick={handleBulkImport}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-40 transition"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Importing to Dashboard...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm & Import ({selectedExtractedCount} Selected Findings)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VULNERABILITY DETAIL & SIGN-OFF DRAWER (When clicking on a row)        */}
      {/* ========================================================================= */}
      {selectedFinding && !showHandoffModal && !showSignoffModal && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-end z-50 p-0 sm:p-4"
          onClick={() => {
            setSelectedFinding(null);
            setIsEditingFinding(false);
          }}
        >
          <div
            className="glass-panel w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[92vh] sm:rounded-3xl border border-white/20 shadow-2xl overflow-y-auto flex flex-col justify-between p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Drawer Header with Name Modification */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="flex-1 mr-3">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-sm font-black text-rose-400">
                      {selectedFinding.finding_number}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${getSeverityBadge(selectedFinding.severity)}`}>
                      {selectedFinding.severity} ({selectedFinding.cvss_score.toFixed(1)})
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getStatusBadge(selectedFinding.status)}`}>
                      {selectedFinding.status}
                    </span>
                  </div>

                  {isEditingFinding ? (
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                        Modify Vulnerability Name / Title:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                          className="w-full text-base font-bold text-white bg-slate-900 border border-cyan-400 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
                          placeholder="Enter modified vulnerability title..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 flex-wrap pt-1">
                      <h2 className="text-xl font-bold text-white leading-tight">
                        {selectedFinding.title}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIsEditingFinding(true)}
                        title="Click to modify vulnerability name & details"
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modify Name</span>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedFinding(null);
                    setIsEditingFinding(false);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Assignee & Status Quick Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-900/60 border border-white/10">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Assigned User / Team Member
                  </label>
                  <select
                    value={selectedFinding.assigned_to || ""}
                    onChange={(e) => handleAssignUser(selectedFinding.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:border-cyan-400"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Patching & Lifecycle Status
                  </label>
                  <select
                    value={selectedFinding.status}
                    onChange={(e) => handleUpdateStatus(selectedFinding.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:border-cyan-400"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress (Patching)</option>
                    <option value="Ready for Retest">Ready for Retest</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Reopened">Reopened</option>
                  </select>
                </div>
              </div>

              {/* Details Sections: Editable Mode vs Read-only Mode */}
              {isEditingFinding ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs font-medium flex items-center justify-between">
                    <span>Editing vulnerability name, observation, and remediation details.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
                      Technical Observation & Evidence
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.observation}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, observation: e.target.value }))}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-300 uppercase tracking-wider mb-1">
                      Business & Security Impact
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.impact}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, impact: e.target.value }))}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
                      Remediation & Patch Guidance
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.remediation}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, remediation: e.target.value }))}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingFinding(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSavingFinding}
                      onClick={handleSaveFindingModifications}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
                    >
                      {isSavingFinding ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save Name & Details</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                        Technical Observation & Evidence
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsEditingFinding(true)}
                        className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selectedFinding.observation}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-1">
                      Business & Security Impact
                    </h4>
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selectedFinding.impact}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
                      Remediation & Patch Guidance
                    </h4>
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-200 whitespace-pre-wrap leading-relaxed">
                      {selectedFinding.remediation}
                    </div>
                  </div>

                  {selectedFinding.cvss_vector && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        CVSS Vector String
                      </h4>
                      <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-cyan-400 text-[11px] border border-slate-800 break-all">
                        {selectedFinding.cvss_vector}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Patch Collaboration & Sign-off Action Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowHandoffModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Handoff to Dev Team</span>
              </button>

              <div className="flex items-center gap-2">
                {["Resolved", "Closed"].includes(selectedFinding.status) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSignoffAction("open");
                      setSignoffNotes("");
                      setShowSignoffModal(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Keep Open / Reopen</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSignoffAction("close");
                      setSignoffNotes("");
                      setShowSignoffModal(true);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sign-off & Mark as Closed</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SIGN-OFF / STATUS CONFIRMATION MODAL                                    */}
      {/* ========================================================================= */}
      {showSignoffModal && selectedFinding && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-white/20 shadow-glass space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${signoffAction === "close" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}>
                {signoffAction === "close" ? <CheckCircle2 className="w-6 h-6" /> : <RotateCcw className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {signoffAction === "close" ? "Sign-off & Close Vulnerability" : "Reopen / Keep Open Vulnerability"}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedFinding.finding_number}: {selectedFinding.title.slice(0, 36)}...
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              {signoffAction === "close"
                ? "Provide sign-off notes, patch verification details, or QA test results confirming the fix."
                : "Explain why the patch failed validation or why this finding must remain open for remediation."}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sign-off & Retest Verification Notes
              </label>
              <textarea
                rows={3}
                placeholder={
                  signoffAction === "close"
                    ? "e.g. Patch verified in staging by QA team. All regression tests passed. Sign-off approved."
                    : "e.g. Patch did not remediate edge-case; vulnerability still triggers with payload X."
                }
                value={signoffNotes}
                onChange={(e) => setSignoffNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSignoffModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignoff}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 ${
                  signoffAction === "close"
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30"
                    : "bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30"
                }`}
              >
                {signoffAction === "close" ? "Confirm Sign-off (Close)" : "Confirm Reopen (Keep Open)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MANUAL CREATE FINDING MODAL                                             */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel max-w-2xl w-full p-6 rounded-2xl border border-white/20 shadow-glass my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Submit Security Vulnerability Finding</h3>
                <p className="text-xs text-slate-400">Calculates specification-compliant CVSS scores and triggers alerts.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFinding} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Finding Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>

              {/* CVSS v4.0 Vector Selector */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">CVSS v4.0 Scoring</span>
                  <div className="text-sm font-extrabold text-white">
                    Score: <span className="text-rose-400">{cvssScore}</span> ({severity})
                  </div>
                </div>
                <input
                  type="text"
                  value={cvssVector}
                  onChange={(e) => handleCalculateCvss(e.target.value)}
                  className="w-full font-mono text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleCalculateCvss("CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N")}
                    className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold"
                  >
                    Preset: Critical 9.3
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalculateCvss("CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:H/VI:L/VA:N/SC:N/SI:N/SA:N")}
                    className="px-2 py-1 rounded bg-orange-500/20 text-orange-300 text-[10px] font-bold"
                  >
                    Preset: High 7.1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalculateCvss("CVSS:4.0/AV:L/AC:H/AT:P/PR:H/UI:A/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N")}
                    className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold"
                  >
                    Preset: Medium 4.2
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assign User / Lead</label>
                <select
                  value={createAssignee}
                  onChange={(e) => setCreateAssignee(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Technical Observation</label>
                <textarea
                  required
                  rows={2}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Business & Security Impact</label>
                  <textarea
                    required
                    rows={2}
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Remediation Guidance</label>
                  <textarea
                    required
                    rows={2}
                    value={remediation}
                    onChange={(e) => setRemediation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs"
                >
                  Submit & Alert Stakeholders
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CROSS-DEPARTMENT HANDOFF MODAL                                         */}
      {/* ========================================================================= */}
      {showHandoffModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-white/20 shadow-glass">
            <h3 className="text-lg font-bold text-white mb-2">Assign Remediation Handoff</h3>
            <p className="text-xs text-slate-400 mb-4">
              Transfers vulnerability {selectedFinding?.finding_number} to Software Development with scoped read access.
            </p>
            <form onSubmit={handleInitiateHandoff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Department</label>
                <input
                  type="text"
                  disabled
                  value="Software Development"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Instructions for Engineering / Patching Team</label>
                <textarea
                  rows={3}
                  value={handoffNotes}
                  onChange={(e) => setHandoffNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHandoffModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs"
                >
                  Confirm Handoff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CLEAR ALL VULNERABILITIES CONFIRMATION MODAL                          */}
      {/* ========================================================================= */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-rose-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear All Vulnerabilities</h3>
                <p className="text-xs text-rose-300">Delete all existing pentest findings from the database</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs text-slate-300 space-y-2">
              <p>
                Are you sure you want to permanently delete all <strong className="text-rose-400 font-bold">{findings.length} vulnerability findings</strong>?
              </p>
              <p className="text-slate-400">
                This will reset your findings count to 0 and clear all test history so you can start with a fresh slate or import a new audit report.
              </p>
              <p className="text-emerald-400 font-medium pt-0.5">
                ✓ User accounts, workspaces, and system settings will not be affected.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isClearingAll}
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingAll}
                onClick={handleClearAllFindings}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isClearingAll ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Findings...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete All Vulnerabilities</span>
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
