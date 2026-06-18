// src/utils/driverUtils.js

export const formatPhoneNumber = (value) => {
  if (!value) return '';
  const num = value.replace(/[^\d]/g, '');
  if (num.length < 4) return num;
  if (num.length < 7) return `${num.slice(0, 3)}-${num.slice(3)}`;
  return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6, 10)}`;
};

export const getDriverTotal = (driver) => {
  const daily = driver.daily_gross || {};
  return ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    .reduce((sum, day) => sum + (Number(daily[day]) || 0), 0);
};

export const sortDrivers = (a, b) => {
  const statusPriority = { 
    'RESERVED': 1, 'HOLD FOR LOAD': 2, 'READY': 3, 'ENROUTE': 4, 'HOME': 5, 'SHOP': 6, 'STOP': 7 
  };
  const statusA = (a.status || 'READY').toUpperCase();
  const statusB = (b.status || 'READY').toUpperCase();
  
  if (statusPriority[statusA] !== statusPriority[statusB]) {
    return (statusPriority[statusA] || 3) - (statusPriority[statusB] || 3);
  }

  const parseETAToMinutes = (etaString) => {
    if (!etaString) return 99999; 
    const str = etaString.toUpperCase();
    const daysOrder = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const currentJsDay = new Date().getDay();
    const currentDayIndex = currentJsDay === 0 ? 6 : currentJsDay - 1; 

    const daysWeights = {};
    daysOrder.forEach((day, index) => {
      if (index >= currentDayIndex) {
        daysWeights[day] = (index - currentDayIndex) * 1440;
      } else {
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
    } else {
      const fallbackMatch = str.match(/([0-1]?[0-9]|2[0-3])/);
      if (fallbackMatch) {
        timeMinutes = parseInt(fallbackMatch[1], 10) * 60;
      }
    }
    return dayWeight + timeMinutes;
  };

  return parseETAToMinutes(a.eta) - parseETAToMinutes(b.eta);
};