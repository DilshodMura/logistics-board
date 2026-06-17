import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import OrderTable from './components/OrderTable';
import GroupModal from './components/GroupModal';
import DriverModal from './components/DriverModal';
import GrossAccounting from './components/GrossAccounting';
import AuditModal from './components/AuditModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('dispatcher');
  const [orders, setOrders] = useState([]);
  const [currentTab, setCurrentTab] = useState('board'); // 'board' или 'gross'
  const [authLoading, setAuthLoading] = useState(true);
  
  // Состояния для формы логина
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  useEffect(() => {
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Автоматическая архивация недели по понедельникам
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    const checkAndAutoArchiveWeek = async () => {
      const now = new Date();
      
      const currentWeekRangeString = () => {
        const distanceToMon = (now.getDay() + 6) % 7; 
        const mon = new Date(now);
        mon.setDate(now.getDate() - distanceToMon);
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        const f = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.${d.getFullYear()}`;
        return `${f(mon)} - ${f(sun)}`;
      };

      const currentRange = currentWeekRangeString();
      const lastArchivedKey = localStorage.getItem('last_auto_archived_week');

      if (lastArchivedKey !== currentRange && now.getDay() === 1) { 
        
        const prevMon = new Date(now);
        prevMon.setDate(now.getDate() - 7);
        const prevSun = new Date(now);
        prevSun.setDate(now.getDate() - 1);
        const f = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.${d.getFullYear()}`;
        const pastWeekRange = `${f(prevMon)} - ${f(prevSun)}`;

        const activeDriversWithGross = orders.filter(o => {
          if(o.driver_name === '-- NEW GROUP PENDING --') return false;
          const daily = o.daily_gross || {};
          const total = Object.values(daily).reduce((s, v) => s + (Number(v) || 0), 0);
          return total > 0;
        });

        if (activeDriversWithGross.length > 0) {
          const archivePayload = activeDriversWithGross.map(d => {
            const daily = d.daily_gross || {};
            const total = Object.values(daily).reduce((s, v) => s + (Number(v) || 0), 0);
            return {
              week_range: pastWeekRange,
              dispatcher_group: d.dispatcher_group ? d.dispatcher_group.toUpperCase() : 'UNASSIGNED',
              driver_name: d.driver_name,
              truck_num: d.truck_num || '',
              daily_breakdown: daily,
              total_amount: total
            };
          });

          try {
            const { error: archiveError } = await supabase.from('gross_archive').insert(archivePayload);
            if (archiveError) throw archiveError;

            localStorage.setItem('last_auto_archived_week', currentRange);

            const emptyData = {"MON":0,"TUE":0,"WED":0,"THU":0,"FRI":0,"SAT":0,"SUN":0};
            const emptyLoads = {"MON":"","TUE":"","WED":"","THU":"","FRI":"","SAT":"","SUN":""};

            // ИСПРАВЛЕНО: Принудительно выставляем true для всех обновляемых на новую неделю водителей,
            // чтобы старые конфигурации архивации в фоне не откатывали состояние флага активности.
            const { error: updateError } = await supabase
              .from('orders')
              .update({ 
                daily_gross: emptyData, 
                load_numbers: emptyLoads,
                weekly_gross: 0,
                is_active: true
              })
              .neq('driver_name', '-- NEW GROUP PENDING --');

            if (updateError) throw updateError;
            
            fetchOrders();
          } catch (err) {
            console.error("Критическая ошибка архивации: ", err.message);
            localStorage.setItem('last_auto_archived_week', currentRange);
          }
        } else {
          localStorage.setItem('last_auto_archived_week', currentRange);
        }
      }
    };

    checkAndAutoArchiveWeek();
  }, [orders]);

  useEffect(() => {
    if (!user) return;
    fetchOrders();

    const channel = supabase
      .channel('realtime-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchUserProfile = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (data) setUserRole(data.role);
    } catch(e) { console.error(e); }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await supabase.from('orders').select('*');
      if (data) setOrders(data);
    } catch(e) { console.error(e); }
  };

  const handleUpdateCell = async (id, columnName, value) => {
    setOrders((prev) => prev.map((item) => (item.id === id ? { ...item, [columnName]: value } : item)));
    await supabase.from('orders').update({ [columnName]: value }).eq('id', id);
  };

  const handleLogOut = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await supabase.auth.signOut();
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      if (data.user) {
        setUser(data.user);
        fetchUserProfile(data.user.id);
      }
    } catch (err) {
      setLoginError(err.message || 'Invalid login details');
    } finally {
      setLoginLoading(false);
    }
  };

  // Группировка данных для вкладки Main Board С АЛФАВИТНЫМ ПОРЯДКОМ ГРУПП
  const groups = React.useMemo(() => {
    // 1. Первичная группировка активных водителей
    const rawGroups = orders.reduce((acc, order) => {
      if (order.is_active === false) return acc;

      const groupKey = order.dispatcher_group ? order.dispatcher_group.trim().toUpperCase() : 'UNASSIGNED';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(order);
      return acc;
    }, {});

    // 2. Сортировка десков по алфавиту
    const sortedKeys = Object.keys(rawGroups).sort((a, b) => a.localeCompare(b));

    // 3. Сборка финального упорядоченного объекта
    const sortedGroups = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = rawGroups[key];
    });

    return sortedGroups;
  }, [orders]);

  // 1. Экран загрузки
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center font-sans">
        <div className="text-slate-500 font-medium animate-pulse text-sm">Loading Logistics Core...</div>
      </div>
    );
  }
  
  // 2. Авторизация
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center font-sans px-4">
        <div className="bg-white p-8 rounded-3xl border border-[#e8e8ed] shadow-sm max-w-sm w-full">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">Logistics Hub</h2>
            <p className="text-xs text-[#86868b] mt-1">Sign in with your corporate account</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1 px-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#d2d2d7] focus:bg-white px-4 py-2.5 rounded-xl text-xs outline-none transition-all text-[#1d1d1f]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1 px-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#d2d2d7] focus:bg-white px-4 py-2.5 rounded-xl text-xs outline-none transition-all text-[#1d1d1f]"
              />
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-2 rounded-xl text-[11px] font-medium leading-normal">
                {loginError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loginLoading}
              className="w-full bg-[#0071e3] hover:bg-[#0077ed] disabled:bg-[#0071e3]/50 text-white font-medium py-2.5 rounded-xl text-xs transition-all tracking-tight shadow-sm mt-2"
            >
              {loginLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Главный интерфейс
  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6 font-sans text-[#1d1d1f] antialiased">
      
      {/* Apple Navigation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-[#ffffff]/80 backdrop-blur-md p-4 px-6 rounded-2xl shadow-sm border border-[#e8e8ed] gap-4">
        <div className="flex flex-wrap items-center justify-between md:justify-start gap-6 w-full md:w-auto">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Logistics Hub</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-[11px] text-[#86868b]">{user.email} ({userRole})</p>
              
              <span className="text-[#d2d2d7] text-[10px] select-none">•</span>
              
              {/* КНОПКА ЖУРНАЛА АУДИТА */}
              <button 
                onClick={() => setShowAuditModal(true)} 
                className="text-[11px] font-medium text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
              >
                📜 Audit Logs
              </button>

              <span className="text-[#d2d2d7] text-[10px] select-none">•</span>
              
              <button 
                onClick={handleLogOut} 
                className="text-[11px] font-medium text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-2 py-0.5 rounded transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
          
          {/* Переключатель страниц */}
          <div className="flex bg-[#f5f5f7] p-1 rounded-full border border-[#e8e8ed]">
            <button onClick={() => setCurrentTab('board')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${currentTab === 'board' ? 'bg-white text-[#0071e3] shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}>
              Main Board
            </button>
            <button onClick={() => setCurrentTab('gross')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${currentTab === 'gross' ? 'bg-white text-[#0071e3] shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}>
              Weekly Gross
            </button>
          </div>
        </div>
        
        {currentTab === 'board' && (
          <div className="flex gap-3 w-full md:w-auto">
            {userRole === 'operations' && (
              <>
                <button onClick={() => setShowGroupModal(true)} className="border border-[#0071e3] text-[#0071e3] px-5 py-2 rounded-full text-xs font-medium hover:bg-[#0071e3]/5 transition-all">Add Group</button>
                <button onClick={() => setShowDriverModal(true)} className="bg-[#0071e3] text-white px-5 py-2 rounded-full text-xs font-medium hover:bg-[#0077ed] transition-all">Add Driver</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Рендеринг контента таблиц */}
      {currentTab === 'board' ? (
        <div className="space-y-8">
          {Object.keys(groups).map((groupName) => (
            <OrderTable 
              key={groupName} 
              groupName={groupName} 
              orders={groups[groupName]} 
              userRole={userRole} 
              onUpdateCell={handleUpdateCell} 
              onDeleteOrder={async (id) => {
                if (window.confirm('Delete driver from Main Board?')) {
                  // Оптимистично скрываем водителя в UI
                  setOrders(prev => prev.map(o => o.id === id ? { ...o, is_active: false } : o));
                  
                  // Выполняем физический апдейт флага в базе
                  const { error } = await supabase
                    .from('orders')
                    .update({ is_active: false })
                    .eq('id', id);

                  if (error) {
                    console.error("❌ Error occured:", error.message, error.details);
                    alert(`Can not delete driver from database: ${error.message}`);
                    fetchOrders(); // возвращаем актуальные данные
                  }
                }
              }} 
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

      {/* Модальные окна */}
      {showGroupModal && <GroupModal onClose={() => setShowGroupModal(false)} onGroupCreated={fetchOrders} />}
      {showDriverModal && <DriverModal orders={orders} onClose={() => setShowDriverModal(false)} />}
      
      {/* Контроль рендеринга модалки аудита */}
      {showAuditModal && <AuditModal onClose={() => setShowAuditModal(false)} />}
    </div>
  );
}