"use client";

import React, { useState, useEffect } from "react";
import {
  ScrollText,
  ShieldCheck,
  Calendar,
  User,
  Activity,
  Lock
} from "lucide-react";
import { api } from "@/lib/api";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs()
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
          <Lock className="w-3.5 h-3.5" />
          <span>Compliance & Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Immutable System Audit Trail
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Cryptographically recorded tamper-evident activity history across authentication, permissions, and security operations.
        </p>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No audit events found or insufficient permissions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Timestamp (UTC)</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Resource</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {new Date(log.created_at).toISOString().replace("T", " ").substring(0, 19)}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-white font-semibold">
                      {log.resource_type}
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {log.actor_id ? log.actor_id.substring(0, 8) + "..." : "system"}
                    </td>
                    <td className="p-4 font-mono text-slate-500 text-[11px]">
                      {log.ip_address || "internal"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
