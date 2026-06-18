// src/components/OrderTable/OrderTable.jsx
import React, { useState } from 'react';
import DriverRow from './DriverRow';
import { sortDrivers, getDriverTotal } from '../../utils/driverUtils';

export default function OrderTable({ groupName, orders, userRole, onUpdateCell, onDeleteOrder }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuOrderId, setActiveMenuOrderId] = useState(null);

  const totalGroupGross = orders.reduce((sum, o) => sum + getDriverTotal(o), 0);

  const filteredAndSortedOrders = [...orders]
    .filter(order => {
      if (order.driver_name === '-- NEW GROUP PENDING --') return false;
      const query = searchQuery.toLowerCase();
      return (
        (order.driver_name || '').toLowerCase().includes(query) ||
        (order.truck_num || '').toLowerCase().includes(query) ||
        (order.phone || '').toLowerCase().includes(query)
      );
    })
    .sort(sortDrivers);

  return (
    <div className="bg-white rounded-2xl border border-[#e8e8ed] shadow-sm mb-8">
      {/* ХЕДЕР ГРУППЫ */}
      <div className="border-b border-[#e8e8ed] px-6 py-4 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-[#1d1d1f] tracking-tight">{groupName}</span>
          <span className="text-xs bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold">
            {orders.filter(o => o.driver_name !== '-- NEW GROUP PENDING --').length} Drivers
          </span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            Gross: ${totalGroupGross.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {!collapsed && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search group..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 px-3 py-1.5 pl-8 text-xs bg-white border border-slate-200 rounded-lg focus:border-[#0071e3] outline-none transition-all text-slate-700"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-xs font-semibold text-[#0071e3] hover:underline bg-transparent">
            {collapsed ? '▼ Expand' : '▲ Collapse'}
          </button>
        </div>
      </div>

      {/* ТАБЛИЦА С ОБНОВЛЕННЫМ РАСПРЕДЕЛЕНИЕМ ВЕСА КОЛОНОК */}
      {!collapsed && (
        <div className="w-full overflow-visible"> 
          <table className="w-full text-left text-[13px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50 text-[#424245] border-b border-[#e8e8ed] text-xs font-bold select-none">
                <th className="p-3.5 min-w-[150px] border-b border-[#e8e8ed]">DRIVER NAME</th>
                <th className="p-3.5 min-w-[85px] border-b border-[#e8e8ed]">TRUCK #</th>
                <th className="p-3.5 min-w-[100px] border-b border-[#e8e8ed]">TRAILER #</th>
                <th className="p-3.5 min-w-[130px] border-b border-[#e8e8ed]">PHONE #</th>
                <th className="p-3.5 min-w-[145px] border-b border-[#e8e8ed]">STATUS</th>
                <th className="p-3.5 min-w-[130px] border-b border-[#e8e8ed]">ETA</th>
                <th className="p-3.5 min-w-[160px] border-b border-[#e8e8ed]">ORIGIN / DELIVERY</th>
                <th className="p-3.5 min-w-[150px] border-b border-[#e8e8ed]">NOTES</th>
                <th className="p-3.5 min-w-[110px] text-right pr-6 border-b border-[#e8e8ed]">WEEKLY GROSS</th>
                {userRole === 'operations' && (
                  /* Даем этой колонке чуть больше пространства, чтобы меню раскрывалось абсолютно безопасно */
                  <th className="p-3.5 w-[120px] text-center border-b border-[#e8e8ed]">ACTIONS</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredAndSortedOrders.map((order) => (
                <DriverRow 
                  key={order.id}
                  order={order}
                  userRole={userRole}
                  onUpdateCell={onUpdateCell}
                  onDeleteOrder={onDeleteOrder}
                  isMenuOpen={activeMenuOrderId === order.id}
                  onToggleMenu={() => setActiveMenuOrderId(activeMenuOrderId === order.id ? null : order.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}