import api from '../api';

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  routeId: string;
}

export interface DriverRoute {
  _id: string;
  name: string;
  stops: string[];
}

const driverService = {
  // Get assigned route
  async getAssignedRoute() {
    const response = await api.get('/driver/route');
    return response.data;
  },
  
  // Update bus location
  async updateLocation(locationData: LocationUpdate) {
    const response = await api.post('/driver/location', locationData);
    return response.data;
  },
  
  // Start route
  async startRoute(routeId: string) {
    const response = await api.post(`/driver/route/${routeId}/start`);
    return response.data;
  },
  
  // End route
  async endRoute(routeId: string) {
    const response = await api.post(`/driver/route/${routeId}/end`);
    return response.data;
  },
  
  // Mark stop as reached
  async markStopReached(routeId: string, stopId: string) {
    const response = await api.post(`/driver/route/${routeId}/stop/${stopId}/reached`);
    return response.data;
  },
  
  // Get all students on the route
  async getRouteStudents(routeId: string) {
    const response = await api.get(`/driver/route/${routeId}/students`);
    return response.data;
  }
};

export default driverService; 