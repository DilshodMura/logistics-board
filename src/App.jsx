// src/App.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './supabaseClient';
import { useOrders } from './hooks/useOrders';
import { checkAndAutoArchiveWeek } from './utils/archiveUtils';

// Путь исправлен в соответствии с вашей структурой папок
import OrderTable from "./components/OrderTable/OrderTable";
import LoginForm from './components/LoginForm';
import GroupModal from './components/GroupModal';
import DriverModal from './components/DriverModal';
import GrossAccounting from './components/GrossAccounting';
import AuditModal from './components/AuditModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('dispatcher');
  const [currentTab, setCurrentTab] = useState('board');
  const [authLoading, setAuthLoading] = useState(true);
  
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  
  // Состояние для выпадающего меню аватарки профиля
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Подключаем наш кастомный слой данных
  const { orders, fetchOrders, handleUpdateCell, handleDeleteOrder } = useOrders(user);

  // Закрытие меню пользователя при клике в любую свободную область экрана
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Контроль сессии пользователя
  useEffect(() => {
    const fetchUserProfile = async (userId) => {
      try {
        const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
        if (data) setUserRole(data.role);
      } catch(e) { console.error(e); }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { 
        setUser(session.user); 
        fetchUserProfile(session.user.id); 
      }
      setAuthLoading(false);
    }).catch(() => setAuthLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setUserRole('dispatcher');
      } else {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Вызов триггера автоматической архивации
  useEffect(() => {
    checkAndAutoArchiveWeek(orders, fetchOrders);
  }, [orders]);

  // Группировка десков в алфавитном порядке
  const groups = useMemo(() => {
    const rawGroups = orders.reduce((acc, order) => {
      if (order.is_active === false) return acc;
      const groupKey = order.dispatcher_group ? order.dispatcher_group.trim().toUpperCase() : 'UNASSIGNED';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(order);
      return acc;
    }, {});

    return Object.keys(rawGroups).sort().reduce((acc, key) => {
      acc[key] = rawGroups[key];
      return acc;
    }, {});
  }, [orders]);

  // Получаем первую букву почты для аватарки
  const avatarLetter = useMemo(() => {
    if (user && user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center font-sans">
        <div className="text-slate-500 font-medium animate-pulse text-sm">Loading Logistics Core...</div>
      </div>
    );
  }
  
  if (!user) {
    return <LoginForm onAuthSuccess={(loggedUser) => setUser(loggedUser)} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6 font-sans text-[#1d1d1f] antialiased">
      
      {/* Apple-Style Minimalistic Navigation Bar с принудительным z-index */}
      <div className="relative z-[50] flex flex-col md:flex-row items-center justify-between mb-8 bg-white/80 backdrop-blur-md p-4 px-6 rounded-2xl shadow-sm border border-[#e8e8ed] gap-4">
        
        {/* ЛЕВАЯ ЧАСТЬ: Исключительно логотип и название */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
          <div className="w-8 h-8 bg-[#0071e3] rounded-xl flex items-center justify-center text-white shadow-sm shadow-[#0071e3]/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M21 16v-4a1 1 0 00-1-1h-3m4 5a1 1 0 01-1 1h-1m-4 0h-3" />
            </svg>
          </div>
          <h1 className="text-base font-bold tracking-tight text-[#1d1d1f]">Logistics Hub</h1>
        </div>

        {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ: Вкладки (Строго по центру) */}
        <div className="flex bg-[#f5f5f7] p-0.5 rounded-full border border-[#e8e8ed] shadow-inner">
          <button 
            onClick={() => setCurrentTab('board')} 
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              currentTab === 'board' 
                ? 'bg-white text-[#0071e3] shadow-sm font-bold' 
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Main Board
          </button>
          <button 
            onClick={() => setCurrentTab('gross')} 
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              currentTab === 'gross' 
                ? 'bg-white text-[#0071e3] shadow-sm font-bold' 
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Weekly Gross
          </button>
        </div>
        
        {/* ПРАВАЯ ЧАСТЬ: Функциональные круглые кнопки и Аватар профиля */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-center md:justify-end">
          
          {/* Круглая кнопка просмотра истории (Audit Logs) */}
          <button 
            onClick={() => setShowAuditModal(true)} 
            title="Audit Logs"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-[#0071e3] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Функции добавления (доступны только для роли operations и на вкладке 'board') */}
          {currentTab === 'board' && userRole === 'operations' && (
            <>
              {/* Круглая кнопка Add Group */}
              <button 
                onClick={() => setShowGroupModal(true)} 
                title="Add Dispatch Group"
                className="w-9 h-9 flex items-center justify-center rounded-full border border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3]/5 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>

              {/* Круглый Плюсик — Add Driver */}
              <button 
                onClick={() => setShowDriverModal(true)} 
                title="Add Driver"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed] transition-all shadow-sm shadow-[#0071e3]/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </>
          )}

          {/* Еле заметный разделитель перед аватаркой */}
          <div className="w-[1px] h-5 bg-slate-200 mx-0.5" />

          {/* Контейнер аватарки */}
          <div className="relative flex items-center h-9" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm border border-slate-700 hover:scale-105 active:scale-95 transition-all outline-none"
            >
              {avatarLetter}
            </button>

            {/* МЕНЮ: Добавлен экстремальный z-[999999] и увеличен верхний отступ (top-[140%]), чтобы не перекрываться строкой поиска */}
            {showUserMenu && (
              <div className="absolute right-0 top-[140%] z-[999999] w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2">
                
                {/* Секция аккаунта внутри меню (имейл и роль) */}
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Account</p>
                  <p className="text-xs font-semibold text-slate-800 truncate mt-0.5" title={user.email}>
                    {user.email}
                  </p>
                  <div className="mt-1.5">
                    <span className="inline-block bg-slate-100 text-slate-600 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md border border-slate-200">
                      {userRole}
                    </span>
                  </div>
                </div>

                {/* Интерактивное действие: Log Out */}
                <div className="pt-1.5 px-1.5">
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      if (window.confirm('Are you sure you want to log out?')) {
                        supabase.auth.signOut();
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>

      {/* Контент */}
      {currentTab === 'board' ? (
        <div className="space-y-8">
          {Object.keys(groups).map((groupName) => (
            <OrderTable 
              key={groupName} 
              groupName={groupName} 
              orders={groups[groupName]} 
              userRole={userRole} 
              onUpdateCell={handleUpdateCell} 
              onDeleteOrder={handleDeleteOrder} 
            />
          ))}
          {Object.keys(groups).length === 0 && (
            <div className="text-center p-12 bg-white rounded-2xl border border-dashed text-slate-400 text-sm">
              No active drivers on the board.
            </div>
          )}
        </div>
      ) : (
        <GrossAccounting orders={orders} onUpdateCell={handleUpdateCell} />
      )}

      {/* Модалки */}
      {showGroupModal && <GroupModal onClose={() => setShowGroupModal(false)} onGroupCreated={fetchOrders} />}
      {showDriverModal && <DriverModal orders={orders} onClose={() => setShowDriverModal(false)} />}
      {showAuditModal && <AuditModal onClose={() => setShowAuditModal(false)} />}
    </div>
  );
}