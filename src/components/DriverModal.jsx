import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function DriverModal({ orders, onClose }) {
  const [group, setGroup] = useState('');
  const [driver, setDriver] = useState('');
  const [truck, setTruck] = useState('');
  const [phone, setPhone] = useState('');

  const existingGroups = Array.from(new Set(orders.map(o => o.dispatcher_group).filter(Boolean)));

  const handlePhoneChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9\s+\-()]/g, '');
    setPhone(cleaned);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!group || !driver) return;

    const pendingRow = orders.find(o => o.dispatcher_group === group && o.driver_name === '-- NEW GROUP PENDING --');

    if (pendingRow) {
      await supabase.from('orders').update({
        driver_name: driver,
        truck_num: truck,
        phone: phone,
        status: 'READY'
      }).eq('id', pendingRow.id);
    } else {
      await supabase.from('orders').insert([{
        dispatcher_group: group,
        driver_name: driver,
        truck_num: truck,
        phone: phone,
        status: 'READY'
      }]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1d1d1f]/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#e8e8ed] font-sans animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-semibold text-[#1d1d1f]">Add New Driver</h3>
          <button onClick={onClose} className="text-[#86868b] hover:text-[#1d1d1f] transition-colors text-lg">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="text-xs font-medium text-[#86868b] block mb-1">Dispatcher Group</label>
            <select value={group} onChange={e => setGroup(e.target.value)} className="w-full p-2.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:bg-white transition-all cursor-pointer" required>
              <option value="">Select group...</option>
              {existingGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          
          <div>
            <label className="text-xs font-medium text-[#86868b] block mb-1">Driver Name</label>
            <input type="text" placeholder="John Doe" value={driver} onChange={e => setDriver(e.target.value)} className="w-full p-2.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:bg-white transition-all placeholder-[#86868b]" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#86868b] block mb-1">Truck #</label>
              <input type="text" placeholder="101" value={truck} onChange={e => setTruck(e.target.value)} className="w-full p-2.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:bg-white transition-all placeholder-[#86868b]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#86868b] block mb-1">Phone #</label>
              <input type="text" placeholder="Numbers only" value={phone} onChange={handlePhoneChange} className="w-full p-2.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:bg-white transition-all placeholder-[#86868b]" />
            </div>
          </div>
          
          <div className="flex gap-3 justify-end pt-4 border-t border-[#e8e8ed] mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-[#f5f5f7] text-[#1d1d1f] rounded-full hover:bg-[#e8e8ed] transition-all text-xs font-medium">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-all text-xs shadow-sm">Save Driver</button>
          </div>
        </form>
      </div>
    </div>
  );
}