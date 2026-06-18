import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function GroupModal({ onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);

  // Закрытие модального окна по клавише Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Закрытие по клику на бэкдроп (мимо самого окна)
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = groupName.trim().toUpperCase();
    if (!name || isLoading) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.from('orders').insert([
        {
          dispatcher_group: name,
          driver_name: '-- NEW GROUP PENDING --',
          status: 'READY'
        }
      ]);

      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        onGroupCreated(name);
        onClose(); // Закрываем модалку после успешного создания
      }
    } catch (err) {
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/15 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
    >
      {/* Контейнер в светлом стиле Apple */}
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl max-w-[440px] w-full p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-[#e8e8ed] font-sans text-left transition-all"
      >
        
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
              disabled={isLoading}
              className="w-full bg-[#f5f5f7] placeholder-[#86868b] text-[#1d1d1f] text-[13px] font-medium px-3 py-2.5 rounded-xl border border-transparent focus:border-[#d2d2d7] focus:bg-white outline-none transition-all uppercase disabled:opacity-60 disabled:cursor-not-allowed" 
              required 
            />
          </div>

          {/* Кнопки управления в стиле macOS */}
          <div className="flex gap-2 justify-end pt-1 select-none">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isLoading}
              className="px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-xl border border-transparent active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              Abort
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !groupName.trim()}
              className="px-4 py-2 text-[13px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-xl shadow-sm shadow-blue-500/10 active:scale-[0.98] transition-all disabled:bg-[#0071e3]/50 disabled:pointer-events-none flex items-center justify-center min-w-[100px]"
            >
              {isLoading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
              ) : (
                'Mount Cell'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}