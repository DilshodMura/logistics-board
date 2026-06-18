// src/hooks/useOrders.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useOrders(user) {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const { data } = await supabase.from('orders').select('*');
      if (data) setOrders(data);
    } catch(e) { console.error(e); }
  };

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

  const handleUpdateCell = async (id, columnName, value) => {
    setOrders((prev) => prev.map((item) => (item.id === id ? { ...item, [columnName]: value } : item)));
    await supabase.from('orders').update({ [columnName]: value }).eq('id', id);
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Delete driver from Main Board?')) return;
    
    // Оптимистичное обновление UI
    setOrders(prev => prev.map(o => o.id === id ? { ...o, is_active: false } : o));
    
    const { error } = await supabase.from('orders').update({ is_active: false }).eq('id', id);
    if (error) {
      console.error("❌ Error occurred:", error.message);
      alert(`Can not delete driver: ${error.message}`);
      fetchOrders();
    }
  };

  return { orders, fetchOrders, handleUpdateCell, handleDeleteOrder };
}