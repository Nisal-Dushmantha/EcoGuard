export const generateLocalId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LOCAL-${timestamp}-${random}`;
};

export const formatCoordinates = (latitude?: number, longitude?: number, accuracy?: number): string => {
  if (latitude === undefined || longitude === undefined) {
    return 'Coordinates unavailable';
  }
  const latStr = latitude.toFixed(5);
  const lngStr = longitude.toFixed(5);
  if (accuracy) {
    return `${latStr}° N, ${lngStr}° E (±${Math.round(accuracy)}m)`;
  }
  return `${latStr}°, ${lngStr}°`;
};

export const formatDateTime = (dateString?: string | Date): string => {
  if (!dateString) return 'Just now';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return 'Recently';

  const day = date.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day} ${month} • ${hours}:${minutes} ${ampm}`;
};

export const getGreetingByTime = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning, Ranger';
  if (hour < 17) return 'Good Afternoon, Ranger';
  return 'Good Evening, Ranger';
};
