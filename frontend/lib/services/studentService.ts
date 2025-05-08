import api from '../api';

export interface BusLocation {
  latitude: number;
  longitude: number;
  routeId: string;
  timestamp: string;
}

export interface RouteStatus {
  _id: string;
  name: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  currentStop: string;
  nextStop: string;
  estimatedArrival: string;
}

const studentService = {
  // Get assigned bus route
  async getAssignedRoute() {
    const response = await api.get('/student/route');
    return response.data;
  },
  
  // Track bus location
  async trackBus(routeId: string) {
    const response = await api.get(`/student/route/${routeId}/track`);
    return response.data as BusLocation;
  },
  
  // Get route status
  async getRouteStatus(routeId: string) {
    const response = await api.get(`/student/route/${routeId}/status`);
    return response.data as RouteStatus;
  },
  
  // Upcoming bus schedule
  async getSchedule() {
    const response = await api.get('/student/schedule');
    return response.data;
  },
  
  // Set preferred stop
  async setPreferredStop(routeId: string, stopId: string) {
    const response = await api.post('/student/stop/preferred', { routeId, stopId });
    return response.data;
  },
  
  // Notify absence
  async notifyAbsence(date: string, reason: string) {
    const response = await api.post('/student/absence', { date, reason });
    return response.data;
  }
};

export default studentService; 