import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';

const DAYS_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function GrossAccounting({ orders, onUpdateCell }) {
  const [archive, setArchive] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  
  // Локальное состояние для фиксации стабильного порядка ID водителей (чтобы не прыгали при вводе)
  const [driverOrder, setDriverOrder] = useState([]);

  // Фиксируем порядок водителей при первой загрузке или изменении состава
  useEffect(() => {
    if (orders && orders.length > 0) {
      setDriverOrder(orders.map(o => o.id));
    }
  }, [orders?.length]); // Реагируем только на изменение количества, а не на изменение сумм

  // Вспомогательная функция для расчета дат текущей недели (MON - SUN)
  const getCurrentWeekRangeString = () => {
    const current = new Date();
    const distanceToMon = (current.getDay() + 6) % 7; 
    const mon = new Date(current);
    mon.setDate(current.getDate() - distanceToMon);
    
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const f = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.${d.getFullYear()}`;
    return `${f(mon)} - ${f(sun)}`;
  };

  // Получаем сумму гросса по водителю за все дни
  const getDriverTotal = (driver) => {
    const daily = driver.daily_gross || {};
    return DAYS_WEEK.reduce((sum, day) => sum + (Number(daily[day]) || 0), 0);
  };

  // Проверка: есть ли у водителя хоть какие-то данные за текущую неделю
  const hasWeeklyData = (driver) => {
    const daily = driver.daily_gross || {};
    const loads = driver.load_numbers || {};
    
    const hasGross = DAYS_WEEK.some(day => Number(daily[day]) > 0);
    const hasLoads = DAYS_WEEK.some(day => loads[day] && String(loads[day]).trim() !== '');
    
    return hasGross || hasLoads;
  };

  // Группировка текущих данных с ЖЕСТКИМ алфавитным порядком групп диспетчеров
  const groups = useMemo(() => {
    const ordersMap = new Map(orders.map(o => [o.id, o]));
    const sortedOrders = [];
    
    // Выстраиваем по зафиксированному порядку
    driverOrder.forEach(id => {
      if (ordersMap.has(id)) {
        sortedOrders.push(ordersMap.get(id));
        ordersMap.delete(id);
      }
    });
    
    // Новые водители (если появились)
    ordersMap.forEach(order => {
      sortedOrders.push(order);
    });

    // 1. Первичная группировка (неотсортированная)
    const rawGroups = sortedOrders.reduce((acc, order) => {
      if (order.driver_name === '-- NEW GROUP PENDING --') return acc;

      if (order.is_active === false && !hasWeeklyData(order)) {
        return acc;
      }

      const groupKey = order.dispatcher_group ? order.dispatcher_group.trim().toUpperCase() : 'UNASSIGNED';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(order);
      return acc;
    }, {});

    // 2. Сортировка ключей (названий групп) по алфавиту
    const sortedGroupKeys = Object.keys(rawGroups).sort((a, b) => a.localeCompare(b));

    // 3. Создание нового объекта со строгим алфавитным порядком свойств
    const sortedGroups = {};
    sortedGroupKeys.forEach(key => {
      sortedGroups[key] = rawGroups[key];
    });

    return sortedGroups;
  }, [orders, driverOrder]);

  // Считаем общий итог только по тем водителям, которые попали в отображение
  const companyTotal = useMemo(() => {
    let total = 0;
    Object.values(groups).forEach(groupDrivers => {
      groupDrivers.forEach(d => {
        total += getDriverTotal(d);
      });
    });
    return total;
  }, [groups]);

  useEffect(() => {
    const fetchArchive = async () => {
      const { data } = await supabase.from('gross_archive').select('*').order('created_at', { ascending: false });
      if (data) setArchive(data);
    };
    fetchArchive();
  }, []);

  // Изменение посуточного значения гросса
  const handleDailyGrossChange = async (driver, day, value) => {
    const currentDaily = { ...(driver.daily_gross || {}) };
    currentDaily[day] = Number(value) || 0;
    
    await onUpdateCell(driver.id, 'daily_gross', currentDaily);
    
    const newTotal = DAYS_WEEK.reduce((sum, d) => sum + (Number(currentDaily[d]) || 0), 0);
    await onUpdateCell(driver.id, 'weekly_gross', newTotal);
  };

  // Изменение посуточного номера лоада
  const handleDailyLoadChange = async (driver, day, value) => {
    const currentLoads = { ...(driver.load_numbers || {}) };
    currentLoads[day] = value;
    await onUpdateCell(driver.id, 'load_numbers', currentLoads);
  };

  // Список всех уникальных диспетчерских групп из архива, отсортированный по алфавиту
  const archiveGroups = useMemo(() => {
    const unique = Array.from(new Set(archive.map(item => item.dispatcher_group)));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [archive]);

  // Группируем архив по неделям внутри выбранного диспетчера
  const archivedWeeksForGroup = archive
    .filter(item => item.dispatcher_group === selectedGroup)
    .reduce((acc, item) => {
      if (!acc[item.week_range]) acc[item.week_range] = [];
      acc[item.week_range].push(item);
      return acc;
    }, {});

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Счётчик общей недели в стиле Apple */}
      <div className="bg-white border border-[#e8e8ed] p-6 rounded-2xl shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xs font-medium text-[#86868b] uppercase tracking-wider">Current Live Week ({getCurrentWeekRangeString()})</h2>
          <p className="text-3xl font-bold text-slate-900 mt-1">${companyTotal.toLocaleString()}</p>
        </div>
        <div className="text-right text-xs text-[#86868b]">
          Status: <span className="text-emerald-600 font-bold animate-pulse">● Auto-tracking Enabled</span>
        </div>
      </div>

      {/* ТЕКУЩИЙ НАБОР СЕТКИ DAY BY DAY */}
      <div className="space-y-6">
        {Object.keys(groups).map((groupName) => {
          const groupTotal = groups[groupName].reduce((sum, o) => sum + getDriverTotal(o), 0);
          
          return (
            <div key={groupName} className="bg-white border border-[#e8e8ed] rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-[#e8e8ed] px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-800 text-sm">Desk: {groupName}</span>
                </div>
                <span className="font-mono font-bold text-emerald-600 text-sm">Total: ${groupTotal.toLocaleString()}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-100/60 text-[#86868b] border-b border-[#e8e8ed] text-[11px] uppercase font-medium">
                      <th className="p-3 pl-6 w-[180px]">Driver / Truck</th>
                      {DAYS_WEEK.map(day => (
                        <th key={day} className="p-3 text-center border-l border-slate-200/60">{day}</th>
                      ))}
                      <th className="p-3 text-right pr-6 w-[120px]">Total Gross</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8e8ed]">
                    {groups[groupName].map((driver) => (
                      <tr 
                        key={driver.id} 
                        className={`transition-colors text-xs ${driver.is_active === false ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/40'}`}
                      >
                        {/* Водитель */}
                        <td className="p-3 pl-6">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            {driver.driver_name}
                            {driver.is_active === false && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-normal">
                                Off Board
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">TRK #{driver.truck_num || '—'}</div>
                        </td>

                        {/* Дни недели */}
                        {DAYS_WEEK.map(day => {
                          const dailyG = driver.daily_gross?.[day] || '';
                          const loadN = driver.load_numbers?.[day] || '';
                          return (
                            <td key={day} className="p-2 border-l border-slate-100 text-center min-w-[100px]">
                              <div className="space-y-1">
                                {/* СУММА ГРОССА */}
                                <div className="flex items-center bg-slate-50 rounded-lg px-1.5 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
                                  <span className="text-[10px] text-slate-400 font-mono">$</span>
                                  <input 
                                    type="number" 
                                    placeholder="0"
                                    value={dailyG}
                                    onChange={(e) => handleDailyGrossChange(driver, day, e.target.value)}
                                    className="w-full bg-transparent text-center font-mono font-medium p-1 text-xs outline-none"
                                  />
                                </div>
                                {/* LOAD NUMBER */}
                                <input 
                                  type="text" 
                                  placeholder="Load #"
                                  value={loadN}
                                  onChange={(e) => handleDailyLoadChange(driver, day, e.target.value)}
                                  className="w-full bg-transparent text-center text-[10px] p-0.5 text-slate-500 border-b border-transparent hover:border-slate-300 focus:border-blue-400 outline-none uppercase font-mono"
                                />
                              </div>
                            </td>
                          );
                        })}

                        {/* Итоговый Гросс */}
                        <td className="p-3 text-right pr-6 font-mono font-bold text-slate-900 text-sm">
                          ${getDriverTotal(driver).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* АРХИВ */}
      <div className="bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Dispatcher Archives</h3>
          <p className="text-xs text-[#86868b] mt-0.5">Select a dispatch unit to view its clean standalone historical logs.</p>
        </div>

        <select 
          value={selectedGroup} 
          onChange={e => setSelectedGroup(e.target.value)}
          className="p-2.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-xs font-medium outline-none text-slate-800 focus:border-[#0071e3] transition-all cursor-pointer min-w-[220px]"
        >
          <option value="">-- Choose Dispatcher Group --</option>
          {archiveGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        {selectedGroup && Object.keys(archivedWeeksForGroup).map(weekRange => {
          // Исправлено: суммируем по полю total_amount, которое сохраняется базой
          const weekTotal = archivedWeeksForGroup[weekRange].reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
          
          return (
            <div key={weekRange} className="border border-[#e8e8ed] rounded-xl overflow-hidden mt-4 animate-in fade-in-50">
              <div className="bg-slate-100/80 px-4 py-2.5 flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>📅 Period: {weekRange}</span>
                <span className="font-mono text-blue-600">Archived Gross: ${weekTotal.toLocaleString()}</span>
              </div>
              <table className="w-full text-left text-xs bg-white">
                <thead>
                  <tr className="bg-slate-50/50 text-[#86868b] border-b border-[#e8e8ed] text-[11px]">
                    <th className="p-2.5 pl-4">Driver Name</th>
                    <th className="p-2.5">Truck #</th>
                    <th className="p-2.5 text-right pr-4">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e8ed]">
                  {archivedWeeksForGroup[weekRange].map(item => (
                    <tr key={item.id} className="text-slate-600 hover:bg-slate-50/30">
                      <td className="p-2.5 pl-4 font-medium text-slate-800">{item.driver_name}</td>
                      <td className="p-2.5 font-mono text-xs">{item.truck_num || '—'}</td>
                      {/* Исправлено: выводим item.total_amount вместо несуществующего item.amount */}
                      <td className="p-2.5 text-right pr-4 font-mono font-semibold text-slate-900">
                        ${Number(item.total_amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {selectedGroup && Object.keys(archivedWeeksForGroup).length === 0 && (
          <p className="text-xs text-[#86868b] italic pt-2">No historical records for this dispatcher.</p>
        )}
      </div>

    </div>
  );
}