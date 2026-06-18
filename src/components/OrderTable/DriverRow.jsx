// src/components/OrderTable/DriverRow.jsx
import React, { useState } from 'react';
import ActionMenu from './ActionMenu';
import { getStatusTheme } from '../../constants/statusThemes';
import { formatPhoneNumber, getDriverTotal } from '../../utils/driverUtils';

export default function DriverRow({ order, userRole, onUpdateCell, onDeleteOrder, isMenuOpen, onToggleMenu }) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editForm, setEditForm] = useState({ 
    driver_name: order.driver_name, truck_num: order.truck_num || '', phone: order.phone || '' 
  });

  const theme = getStatusTheme(order.status);

  const handleSave = async () => {
    await onUpdateCell(order.id, 'driver_name', editForm.driver_name);
    await onUpdateCell(order.id, 'truck_num', editForm.truck_num);
    await onUpdateCell(order.id, 'phone', editForm.phone);
    setIsEditing(false);
  };

  const handleCopyPhone = () => {
    if (!order.phone) return;
    navigator.clipboard.writeText(formatPhoneNumber(order.phone));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <tr className="group transition-all duration-150 hover:bg-slate-50/70">
      {/* DRIVER NAME */}
      <td className="p-3.5 border-b border-slate-100 group-hover:border-slate-200">
        {isEditing ? (
          <input 
            type="text" 
            value={editForm.driver_name} 
            onChange={(e) => setEditForm({ ...editForm, driver_name: e.target.value })}
            className="w-full bg-white px-2 py-1 text-xs rounded-md border border-[#d2d2d7] outline-none text-slate-800 font-medium"
          />
        ) : (
          <span className="font-semibold px-1 text-slate-800 block">{order.driver_name}</span>
        )}
      </td>

      {/* TRUCK # */}
      <td className="p-3.5 border-b border-slate-100 group-hover:border-slate-200 font-mono">
        {isEditing ? (
          <input 
            type="text" 
            value={editForm.truck_num} 
            onChange={(e) => setEditForm({ ...editForm, truck_num: e.target.value })}
            className="w-full bg-white px-2 py-1 text-xs rounded-md border border-[#d2d2d7] outline-none text-slate-600"
          />
        ) : (
          <span className="text-slate-600 px-1 block font-medium">{order.truck_num || '—'}</span>
        )}
      </td>

      {/* TRAILER # */}
      <td className="p-3.5 border-b border-slate-100 group-hover:border-slate-200 font-mono">
        <input 
          type="text" 
          defaultValue={order.trailer_num || ''} 
          onBlur={(e) => onUpdateCell(order.id, 'trailer_num', e.target.value)} 
          placeholder="Enter Trailer"
          className="w-full bg-transparent px-1 py-0.5 text-xs rounded-md focus:bg-white border border-transparent focus:border-[#d2d2d7] outline-none text-slate-600 font-medium"
        />
      </td>
      
      {/* PHONE # */}
      <td className="p-3.5 border-b border-slate-100 group-hover:border-slate-200 font-mono">
        {isEditing ? (
          <input 
            type="text" 
            value={editForm.phone} 
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            className="w-full bg-white px-2 py-1 text-xs rounded-md border border-[#d2d2d7] outline-none text-[#0071e3]"
          />
        ) : (
          <button 
            onClick={handleCopyPhone}
            className={`text-left px-1 py-0.5 rounded text-xs transition-all font-semibold ${copied ? 'text-emerald-600' : 'text-[#0071e3] hover:underline'}`}
          >
            {copied ? '✓ Copied' : formatPhoneNumber(order.phone) || '—'}
          </button>
        )}
      </td>

      {/* STATUS */}
      <td className="p-3.5 border-b border-slate-100 group-hover:border-slate-200">
        <div className="relative flex items-center w-full max-w-[145px]">
          <span className={`absolute left-3 w-1.5 h-1.5 rounded-full ${theme.dot} z-10`} />
          <select 
            value={(order.status || 'READY').toUpperCase()} 
            onChange={(e) => onUpdateCell(order.id, 'status', e.target.value)} 
            className={`pl-6.5 pr-6 py-1.5 rounded-xl font-bold text-[11px] outline-none cursor-pointer border ${theme.bg} appearance-none w-full shadow-sm`}
          >
            <option value="RESERVED">Reserved</option>
            <option value="HOLD FOR LOAD">Hold for load</option>
            <option value="READY">Ready</option>
            <option value="ENROUTE">Enroute</option>
            <option value="HOME">Home</option>
            <option value="SHOP">Shop</option>
            <option value="STOP">Stop</option>
          </select>
          <span className="absolute right-3 pointer-events-none text-slate-400 text-[9px]">▼</span>
        </div>
      </td>

      {/* ETA */}
      <td className="p-3.5 border-b border-slate-100 group-hover:border-slate-200">
        <input 
          type="text" 
          defaultValue={order.eta || ''} 
          onBlur={(e) => onUpdateCell(order.id, 'eta', e.target.value)} 
          placeholder="DEL 10:00 TUE"
          className="w-full bg-transparent text-xs font-bold text-[#0071e3] focus:bg-white border border-transparent focus:border-[#d2d2d7] px-1 py-0.5 rounded-md outline-none"
        />
      </td>

      {/* ORIGIN / DELIVERY */}
      <td className="p-3.5 border-b border-slate-100 group-hover:border-slate-200 text-slate-700">
        <input 
          type="text" 
          defaultValue={order.origin_delivery || ''} 
          onBlur={(e) => onUpdateCell(order.id, 'origin_delivery', e.target.value)} 
          placeholder="—"
          className="w-full bg-transparent px-1 py-0.5 text-xs rounded-md focus:bg-white border border-transparent focus:border-[#d2d2d7] outline-none text-slate-700 font-medium truncate"
        />
      </td>

      {/* NOTES */}
      <td className="p-3.5 border-b border-slate-100 group-hover:border-slate-200">
        <input 
          type="text" 
          defaultValue={order.notes || ''} 
          onBlur={(e) => onUpdateCell(order.id, 'notes', e.target.value)} 
          placeholder="—"
          className="w-full bg-transparent px-1 py-0.5 text-xs rounded-md focus:bg-white border border-transparent focus:border-[#d2d2d7] outline-none text-slate-400 italic truncate"
        />
      </td>

      {/* WEEKLY GROSS */}
      <td className="p-3.5 border-b border-slate-100 group-hover:border-slate-200 text-right pr-6 font-mono font-bold text-slate-900 text-[14px]">
        ${getDriverTotal(order).toLocaleString()}
      </td>

      {/* ACTIONS */}
      {userRole === 'operations' && (
        <td className="p-3.5 border-b border-slate-100 group-hover:border-slate-200 text-center relative">
          {/* Контейнер-якорь, внутри которого позиционируется меню */}
          <div className="relative inline-block text-left">
            <ActionMenu 
              isOpen={isMenuOpen}
              onClose={onToggleMenu}
              isEditing={isEditing}
              onStartEdit={() => setIsEditing(true)}
              onSave={handleSave}
              onDelete={() => { if (confirm("Are you sure?")) onDeleteOrder(order.id); }}
            />
            <button
              /* e.stopPropagation() изолирует клик и предотвращает моментальный конфликт с handleClickOutside */
              onClick={(e) => { e.stopPropagation(); onToggleMenu(); }}
              className={`p-1 rounded transition-colors ${
                isMenuOpen ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}