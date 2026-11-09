"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Download,
  Eye,
  ExternalLink,
  Sparkles,
  Calendar,
  Share2
} from "lucide-react";
import { api, getApiBase } from "@/lib/api";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [reportType, setReportType] = useState("executive_consolidated");
  const [title, setTitle] = useState("Consolidated Executive IT Operations & Vulnerability Report");
  const [format, setFormat] = useState("HTML");

  const loadReports = async () => {
    try {
      const data = await api.getReports();
      setReports(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.generateReport({
        organization_id: "default-org",
        report_type: reportType,
        title,
        format,
      });
      setShowGenerateModal(false);
      alert("Report successfully generated!");
      await loadReports();
    } catch (e: any) {
      alert("Failed: " + e.message);
    }
  };

  const handlePreview = (reportId: string) => {
    setPreviewUrl(`${getApiBase()}/api/v1/reports/${reportId}/content`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Consolidated Report Generation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Automated Audit & Compliance Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Export executive summaries, VAPT technical assessments, and employee logs in HTML, PDF, and XLSX.
          </p>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Report</span>
        </button>
      </div>

      {/* Reports Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No generated reports. Click <strong>Generate Report</strong> to compile current database records.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {reports.map((rep) => (
              <div key={rep.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                      {rep.format}
                    </span>
                    <span className="text-xs text-slate-400">{rep.report_type.replace(/_/g, " ").toUpperCase()}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{rep.title}</h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>Generated on {new Date(rep.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handlePreview(rep.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <a
                    href={`${getApiBase()}/api/v1/reports/${rep.id}/content`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In-Browser Safe Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col p-4 z-50">
          <div className="flex items-center justify-between pb-3 max-w-6xl w-full mx-auto">
            <span className="text-sm font-bold text-white">Safe Report Document Preview</span>
            <button
              onClick={() => setPreviewUrl(null)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
            >
              Close Preview
            </button>
          </div>
          <div className="flex-1 max-w-6xl w-full mx-auto rounded-2xl overflow-hidden glass-panel border border-white/20">
            <iframe src={previewUrl} className="w-full h-full border-0" title="Report Preview" />
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-white/20 shadow-glass">
            <h3 className="text-lg font-bold text-white mb-4">Generate Compliance Report</h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Report Classification</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                >
                  <option value="executive_consolidated">Executive Consolidated Operations</option>
                  <option value="vapt_assessment">VAPT Vulnerability Assessment</option>
                  <option value="employee_daily">Employee Workload & Velocity</option>
                  <option value="department_summary">Department Performance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Output Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                >
                  <option value="HTML">Interactive HTML (In-Browser Safe Preview)</option>
                  <option value="PDF">PDF (Print & Distribution)</option>
                  <option value="XLSX">Excel Spreadsheet (XLSX)</option>
                  <option value="CSV">Raw Data CSV</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Compile & Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
