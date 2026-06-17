import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function GroupModal({ onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = groupName.trim().toUpperCase();
    if (!name) return;

    const { error } = await supabase.from('orders').insert([{
      dispatcher_group: name,
      driver_name: '-- NEW GROUP PENDING --',
      status: 'READY'
    }]);

    if (error) alert(error.message);
    else onGroupCreated(name);
  };

  return (
    <div className="fixed inset-0 bg-black/15 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      {/* Контейнер в светлом стиле Apple */}
      <div className="bg-white rounded-2xl max-w-[440px] w-full p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-[#e8e8ed] font-sans text-left">
        
        {/* Заголовок с минималистичной иконкой */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center select-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h3 className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight uppercase select-none">
            Allocate New Dispatch Cell
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Контейнер инпута */}
          <div>
            <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-2 select-none">
              Enter Desk Matrix Name
            </label>
            <input 
              type="text" 
              autoFocus
              placeholder="E.G. ALEX" 
              value={groupName} 
              onChange={e => setGroupName(e.target.value)} 
              className="w-full bg-[#f5f5f7] placeholder-[#86868b] text-[#1d1d1f] text-[13px] font-medium px-3 py-2.5 rounded-xl border border-transparent focus:border-[#d2d2d7] focus:bg-white outline-none transition-all uppercase" 
              required 
            />
          </div>

          {/* Кнопки управления в стиле macOS */}
          <div className="flex gap-2 justify-end pt-1 select-none">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-xl border border-transparent active:scale-[0.98] transition-all"
            >
              Abort
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-[13px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-xl shadow-sm shadow-blue-500/10 active:scale-[0.98] transition-all"
            >
              Mount Cell
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}