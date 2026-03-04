export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

export const formatDuration = (mins: number): string => {
  if (mins < 60) {
    return `${mins} min`;
  }
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const calculateSuggestedContribution = (distanceKm: number): number => {
  return Math.round(distanceKm * 5);
};

export const getVehicleIcon = (type: string): string => {
  switch (type) {
    case 'car':
      return 'car';
    case 'bike':
      return 'bicycle';
    case 'auto':
      return 'taxi';
    default:
      return 'car';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'live':
      return '#06D6A0';
    case 'planned':
      return '#F7B801';
    case 'completed':
      return '#808080';
    default:
      return '#808080';
  }
};
