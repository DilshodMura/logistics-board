import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AuditModal({ onClose }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    supabase.from('audit_logs')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { if (data) setLogs(data); });
  }, []);

  // Функция для красивого вывода деталей
  const showLogDetails = (log) => {
    alert(
      `User: ${log.changed_by_email}\n` +
      `Driver: ${log.driver_name}\n` +
      `Column: ${log.column_name}\n` +
      `Before: ${log.old_value || 'пусто'}\n` +
      `After: ${log.new_value || 'пусто'}\n` +
      `Time: ${new Date(log.changed_at).toLocaleString()}`
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-lg font-bold text-slate-800">📜 History </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg transition-colors">✕</button>
        </div>
        
        <div className="overflow-y-auto flex-1 text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b font-medium uppercase tracking-wider text-[10px]">
                <th className="p-2.5 pl-4">Time</th>
                <th className="p-2.5">User changed</th>
                <th className="p-2.5">Driver</th>
                <th className="p-2.5">Cell</th>
                <th className="p-2.5">Before</th>
                <th className="p-2.5">After</th>
                <th className="p-2.5 text-center pr-4">Action</th> {/* Новая колонка */}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors text-slate-600">
                  <td className="p-2.5 pl-4 text-slate-400 font-mono">
                    {new Date(log.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-2.5 text-blue-600 font-medium truncate max-w-[120px]" title={log.changed_by_email}>
                    {log.changed_by_email}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800">{log.driver_name}</td>
                  <td className="p-2.5">
                    <span className="bg-amber-50 text-amber-800 font-mono px-1.5 py-0.5 rounded text-[10px] border border-amber-200/50 uppercase">
                      {log.column_name}
                    </span>
                  </td>
                  <td className="p-2.5 text-red-500 line-through truncate max-w-[120px]" title={log.old_value}>
                    {log.old_value || <span className="italic text-slate-300">empty</span>}
                  </td>
                  <td className="p-2.5 text-emerald-600 font-semibold truncate max-w-[120px]" title={log.new_value}>
                    {log.new_value || <span className="italic text-slate-300">empty</span>}
                  </td>
                  
                  {/* КНОПКА ПОДРОБНЕЕ */}
                  <td className="p-2.5 text-center pr-4">
                    <button 
                      onClick={() => showLogDetails(log)}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[10px] font-medium transition-colors"
                    >
                      🔍 View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {logs.length === 0 && (
            <p className="text-center text-slate-400 italic py-8">History is empty.</p>
          )}
        </div>
      </div>
    </div>
  );
}