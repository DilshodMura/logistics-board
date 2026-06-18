// src/utils/archiveUtils.js
import { supabase } from '../supabaseClient';

export const getCurrentWeekRange = (now = new Date()) => {
  const distanceToMon = (now.getDay() + 6) % 7; 
  const mon = new Date(now);
  mon.setDate(now.getDate() - distanceToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  
  const f = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.${d.getFullYear()}`;
  return `${f(mon)} - ${f(sun)}`;
};

export const getPastWeekRange = (now = new Date()) => {
  const prevMon = new Date(now);
  prevMon.setDate(now.getDate() - 7);
  const prevSun = new Date(now);
  prevSun.setDate(now.getDate() - 1);
  
  const f = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.${d.getFullYear()}`;
  return `${f(prevMon)} - ${f(prevSun)}`;
};

export const checkAndAutoArchiveWeek = async (orders, onSuccess) => {
  if (!orders || orders.length === 0) return;

  const now = new Date();
  const currentRange = getCurrentWeekRange(now);
  const lastArchivedKey = localStorage.getItem('last_auto_archived_week');

  // Проверяем: понедельник ли сегодня и не архивировали ли мы уже эту неделю
  if (lastArchivedKey === currentRange || now.getDay() !== 1) return;

  const activeDriversWithGross = orders.filter(o => {
    if (o.driver_name === '-- NEW GROUP PENDING --') return false;
    const daily = o.daily_gross || {};
    const total = Object.values(daily).reduce((s, v) => s + (Number(v) || 0), 0);
    return total > 0;
  });

  if (activeDriversWithGross.length > 0) {
    const pastWeekRange = getPastWeekRange(now);
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
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Критическая ошибка архивации: ", err.message);
      localStorage.setItem('last_auto_archived_week', currentRange);
    }
  } else {
    localStorage.setItem('last_auto_archived_week', currentRange);
  }
};