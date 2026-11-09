"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";

export default function HandoffsPage() {
  const [handoffs, setHandoffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHandoffs = async () => {
    try {
      const data = await api.getHandoffs();
      setHandoffs(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHandoffs();
  }, []);

  const handleRespond = async (id: string, status: string) => {
    try {
      await api.respondHandoff(id, status, `Remediation marked as ${status}`);
      alert(`Handoff marked as ${status}`);
      await loadHandoffs();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
          <Share2 className="w-3.5 h-3.5" />
          <span>Cross-Department Remediation Handoffs</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Inter-Departmental Collaboration & Task Handoff
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Secure, permission-isolated vulnerability delegation between VAPT and Software Development teams.
        </p>
      </div>

      {/* Handoff Requests List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {handoffs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No active cross-department handoffs. Handoffs created from VAPT findings will appear here.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {handoffs.map((h) => (
              <div key={h.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{h.resource_type} Handoff</span>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                      h.request_status === "accepted" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300"
                    }`}>
                      {h.request_status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    Delegated to Software Development Team
                  </div>
                  <p className="text-xs text-slate-400 whitespace-pre-line">{h.notes}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {h.request_status === "pending" && (
                    <>
                      <button
                        onClick={() => handleRespond(h.id, "accepted")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept & Start Fix</span>
                      </button>
                      <button
                        onClick={() => handleRespond(h.id, "rejected")}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  {h.request_status === "accepted" && (
                    <button
                      onClick={() => handleRespond(h.id, "completed")}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready for Retest</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
