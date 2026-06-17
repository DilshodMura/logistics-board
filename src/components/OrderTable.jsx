import React, { useState } from 'react';

export default function OrderTable({ groupName, orders, userRole, onUpdateCell, onDeleteOrder }) {
  const [collapsed, setCollapsed] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [editForm, setEditForm] = useState({ driver_name: '', truck_num: '', phone: '' });

  const getDriverTotal = (driver) => {
    const daily = driver.daily_gross || {};
    return ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].reduce((sum, day) => sum + (Number(daily[day]) || 0), 0);
  };

  const totalGroupGross = orders.reduce((sum, o) => sum + getDriverTotal(o), 0);

  const formatPhoneNumber = (value) => {
    if (!value) return '';
    const num = value.replace(/[^\d]/g, '');
    if (num.length < 4) return num;
    if (num.length < 7) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6, 10)}`;
  };

  // ДИНАМИЧЕСКАЯ СОРТИРОВКА С УЧЕТОМ СЕГОДНЯШНЕГО ДНЯ НЕДЕЛИ
  const sortDrivers = (a, b) => {
    const statusPriority = { 
      'RESERVED': 1, 
      'HOLD FOR LOAD': 2, 
      'READY': 3, 
      'ENROUTE': 4, 
      'HOME': 5, 
      'SHOP': 6, 
      'STOP': 7 
    };
    
    const statusA = (a.status || 'READY').toUpperCase();
    const statusB = (b.status || 'READY').toUpperCase();
    
    if (statusPriority[statusA] !== statusPriority[statusB]) {
      return (statusPriority[statusA] || 3) - (statusPriority[statusB] || 3);
    }

    const parseETAToMinutes = (etaString) => {
      if (!etaString) return 99999; 
      const str = etaString.toUpperCase();
      
      // Стандартный циклический массив дней недели
      const daysOrder = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      
      // Получаем текущий день недели (0 - воскресенье, 1 - понедельник и т.д.)
      const currentJsDay = new Date().getDay();
      // Переводим в наш индекс (где MON - 0, SUN - 6)
      const currentDayIndex = currentJsDay === 0 ? 6 : currentJsDay - 1; 

      // Вычисляем динамический вес дней: сегодняшний и будущие дни идут сначала, прошедшие улетают вниз
      const daysWeights = {};
      daysOrder.forEach((day, index) => {
        if (index >= currentDayIndex) {
          // Сегодняшний и будущие дни (например, если сегодня вторник (1), то TUE=0, WED=1440...)
          daysWeights[day] = (index - currentDayIndex) * 1440;
        } else {
          // Прошедшие дни недели улетают в самый конец (добавляем им вес полной недели вперед)
          daysWeights[day] = (7 + index - currentDayIndex) * 1440;
        }
      });

      let dayWeight = 99999; 
      for (const day in daysWeights) {
        if (str.includes(day)) {
          dayWeight = daysWeights[day];
          break;
        }
      }

      const timeMatch = str.match(/([0-1]?[0-9]|2[0-3]):([0-5][0-9])/);
      let timeMinutes = 0;
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        timeMinutes = (hours * 60) + minutes;
      }

      return dayWeight + timeMinutes;
    };

    return parseETAToMinutes(a.eta) - parseETAToMinutes(b.eta);
  };

  const getStatusBadgeClass = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'RESERVED': return 'bg-sky-100 text-sky-800';
      case 'HOLD FOR LOAD': return 'bg-emerald-100 text-emerald-800';
      case 'READY': return 'bg-rose-100 text-rose-800';
      case 'ENROUTE': return 'bg-blue-100 text-blue-800';
      case 'HOME': return 'bg-slate-100 text-slate-700';
      case 'SHOP': return 'bg-purple-100 text-purple-800';
      case 'STOP': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const startEditing = (driver) => {
    setEditingDriverId(driver.id);
    setEditForm({
      driver_name: driver.driver_name,
      truck_num: driver.truck_num || '',
      phone: driver.phone || ''
    });
  };

  const saveDriverInfo = async (id) => {
    await onUpdateCell(id, 'driver_name', editForm.driver_name);
    await onUpdateCell(id, 'truck_num', editForm.truck_num);
    await onUpdateCell(id, 'phone', editForm.phone);
    setEditingDriverId(null); 
  };

  const sortedOrders = [...orders].sort(sortDrivers);

  return (
    <div className="bg-white rounded-2xl border border-[#e8e8ed] shadow-sm overflow-hidden mb-6">
      {/* ГРУППОВОЙ ХЕДЕР */}
      <div className="border-b border-[#e8e8ed] px-6 py-4 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
          <span className="text-base font-semibold text-[#1d1d1f] tracking-tight">{groupName}</span>
          <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium">
            {orders.filter(o => o.driver_name !== '-- NEW GROUP PENDING --').length} Drivers
          </span>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            Gross: ${totalGroupGross.toLocaleString()}
          </span>
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="text-xs font-medium text-[#0071e3] hover:underline bg-transparent">
          {collapsed ? '▼ Expand group' : '▲ Collapse group'}
        </button>
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-[#f5f5f7] text-[#86868b] border-b border-[#e8e8ed] text-xs font-semibold select-none">
                <th className="p-3 w-[160px]">DRIVER NAME</th>
                <th className="p-3 w-[90px]">TRUCK #</th>
                <th className="p-3 w-[110px]">TRAILER #</th>
                <th className="p-3 w-[140px]">PHONE #</th>
                <th className="p-3 w-[140px]">STATUS</th>
                <th className="p-3 w-[130px]">ETA</th>
                <th className="p-3 w-[160px]">ORIGIN / DELIVERY</th>
                <th className="p-3 min-w-[150px]">NOTES</th>
                <th className="p-3 w-[110px] text-right pr-6">WEEKLY GROSS</th>
                {userRole === 'operations' && <th className="p-3 w-[95px] text-center">ACTIONS</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e8ed]">
              {sortedOrders.map((order) => {
                if (order.driver_name === '-- NEW GROUP PENDING --') return null;
                const isEditing = editingDriverId === order.id;

                return (
                  <tr key={order.id} className="hover:bg-[#f5f5f7]/30 transition-colors">
                    
                    {/* DRIVER NAME */}
                    <td className="p-2">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editForm.driver_name} 
                          onChange={(e) => setEditForm({ ...editForm, driver_name: e.target.value })}
                          className="w-full bg-transparent px-2 py-1 text-xs rounded focus:bg-white border border-transparent focus:border-[#d2d2d7] outline-none text-slate-800 font-medium"
                        />
                      ) : (
                        <span className="font-medium px-2 py-1 text-slate-800 block">{order.driver_name}</span>
                      )}
                    </td>

                    {/* TRUCK # */}
                    <td className="p-2 font-mono">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editForm.truck_num} 
                          onChange={(e) => setEditForm({ ...editForm, truck_num: e.target.value })}
                          className="w-full bg-transparent px-2 py-1 text-xs rounded focus:bg-white border border-transparent focus:border-[#d2d2d7] outline-none text-slate-600"
                        />
                      ) : (
                        <span className="text-slate-600 px-2 py-1 block">{order.truck_num || '—'}</span>
                      )}
                    </td>

                    {/* TRAILER # */}
                    <td className="p-2 font-mono">
                      <input 
                        type="text" 
                        defaultValue={order.trailer_num || ''} 
                        onBlur={(e) => onUpdateCell(order.id, 'trailer_num', e.target.value)} 
                        placeholder="Enter Trailer #"
                        className="w-full bg-transparent px-2 py-1 text-xs rounded focus:bg-white border border-transparent focus:border-[#d2d2d7] outline-none text-slate-600"
                      />
                    </td>
                    
                    {/* PHONE # */}
                    <td className="p-2 font-mono">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editForm.phone} 
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full bg-transparent px-2 py-1 text-xs rounded focus:bg-white border border-transparent focus:border-[#d2d2d7] outline-none text-[#0071e3]"
                          placeholder="5713240867"
                        />
                      ) : (
                        <button 
                          onClick={() => {
                            if(!order.phone) return;
                            navigator.clipboard.writeText(formatPhoneNumber(order.phone));
                            setCopiedId(order.id);
                            setTimeout(() => setCopiedId(null), 1200);
                          }}
                          className={`text-left w-full px-2 py-1 rounded text-xs transition-all ${copiedId === order.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-[#0071e3] hover:bg-blue-50/50'}`}
                        >
                          {copiedId === order.id ? '✓ Copied!' : formatPhoneNumber(order.phone) || '—'}
                        </button>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="p-2">
                      <div className="px-2 py-1">
                        <select 
                          value={(order.status || 'READY').toUpperCase()} 
                          onChange={(e) => onUpdateCell(order.id, 'status', e.target.value)} 
                          className={`px-2.5 py-0.5 rounded-full font-medium text-xs outline-none cursor-pointer appearance-none border border-transparent ${getStatusBadgeClass(order.status)}`}
                        >
                          <option value="RESERVED">Reserved</option>
                          <option value="HOLD FOR LOAD">Hold for load</option>
                          <option value="READY">Ready</option>
                          <option value="ENROUTE">Enroute</option>
                          <option value="HOME">Home</option>
                          <option value="SHOP">Shop</option>
                          <option value="STOP">Stop</option>
                        </select>
                      </div>
                    </td>

                    {/* ETA */}
                    <td className="p-2">
                      <input 
                        type="text" 
                        defaultValue={order.eta || ''} 
                        onBlur={(e) => onUpdateCell(order.id, 'eta', e.target.value)} 
                        placeholder="DEL 10:00 TUE"
                        className="w-full bg-transparent px-2 py-1 text-xs rounded focus:bg-white border border-transparent focus:border-[#d2d2d7] outline-none text-slate-800 font-medium"
                      />
                    </td>

                    {/* ORIGIN / DELIVERY */}
                    <td className="p-2 text-slate-700">
                      <input 
                        type="text" 
                        defaultValue={order.origin_delivery || ''} 
                        onBlur={(e) => onUpdateCell(order.id, 'origin_delivery', e.target.value)} 
                        placeholder="—"
                        className="w-full bg-transparent px-2 py-1 text-xs rounded focus:bg-white border border-transparent focus:border-[#d2d2d7] outline-none text-slate-700 truncate"
                      />
                    </td>

                    {/* NOTES */}
                    <td className="p-2">
                      <input 
                        type="text" 
                        defaultValue={order.notes || ''} 
                        onBlur={(e) => onUpdateCell(order.id, 'notes', e.target.value)} 
                        placeholder="—"
                        className="w-full bg-transparent px-2 py-1 text-xs rounded focus:bg-white border border-transparent focus:border-[#d2d2d7] outline-none text-slate-400 italic truncate"
                      />
                    </td>

                    {/* WEEKLY GROSS */}
                    <td className="p-2 text-right pr-6 font-mono font-bold text-slate-900">
                      ${getDriverTotal(order).toLocaleString()}
                    </td>

                    {/* ACTIONS */}
                    {userRole === 'operations' && (
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-2 select-none">
                          {isEditing ? (
                            <button 
                              onClick={() => saveDriverInfo(order.id)}
                              className="text-emerald-600 hover:text-emerald-700 px-1.5 py-0.5 rounded text-[11px] font-semibold hover:underline bg-transparent"
                            >
                              Save
                            </button>
                          ) : (
                            <button 
                              onClick={() => startEditing(order)}
                              className="text-[#0071e3] hover:underline px-1.5 py-0.5 rounded text-[11px] font-medium bg-transparent"
                            >
                              Edit
                            </button>
                          )}
                          <button 
                            onClick={() => onDeleteOrder(order.id)} 
                            className="text-slate-300 hover:text-red-500 p-0.5 transition-colors font-medium text-xs"
                            title="Delete Driver"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    )}

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}