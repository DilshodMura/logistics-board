// src/components/OrderTable/ActionMenu.jsx
import React, { useEffect, useRef } from 'react';

export default function ActionMenu({ isOpen, onClose, isEditing, onStartEdit, onSave, onDelete }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      // Ищем, не кликнул ли пользователь на саму кнопку с тремя точками (SVG или button)
      const clickedButton = e.target.closest('button');
      
      // Если клик внутри меню ИЛИ это клик по кнопке открытия — ничего не делаем
      if (menuRef.current && menuRef.current.contains(e.target)) {
        return;
      }
      if (clickedButton && clickedButton.querySelector('svg')) {
        return; 
      }

      // В остальных случаях (кликнули мимо) — закрываем меню
      onClose();
    }

    // Используем 'click' вместо 'mousedown' для идеальной синхронизации с onClick кнопок
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef} 
      className="absolute right-0 top-[110%] z-[9999] flex flex-col bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[110px] whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 origin-top-right"
      onClick={(e) => e.stopPropagation()} // Защита от всплытия кликов внутри самого меню
    >
      {isEditing ? (
        <button 
          onClick={(e) => { e.stopPropagation(); onSave(); }} 
          className="text-left px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
        >
          Save
        </button>
      ) : (
        <button 
          onClick={(e) => { e.stopPropagation(); onStartEdit(); }} 
          className="text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Edit
        </button>
      )}
      
      <div className="border-t border-slate-100 my-0.5" />
      
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }} 
        className="text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
      >
        Delete
      </button>
    </div>
  );
}