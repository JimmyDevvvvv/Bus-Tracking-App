import api from '../api';

export interface BusRoute {
  _id: string;
  name: string;
  stops: string[];
  driverId?: string;
}

export interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver' | 'student';
}

const adminService = {
  // Routes management
  async getRoutes() {
    const response = await api.get('/admin/routes');
    return response.data;
  },
  
  async createRoute(routeData: Omit<BusRoute, '_id'>) {
    const response = await api.post('/admin/routes', routeData);
    return response.data;
  },
  
  async updateRoute(id: string, routeData: Partial<BusRoute>) {
    const response = await api.put(`/admin/routes/${id}`, routeData);
    return response.data;
  },
  
  async deleteRoute(id: string) {
    const response = await api.delete(`/admin/routes/${id}`);
    return response.data;
  },
  
  // User management
  async getUsers() {
    const response = await api.get('/admin/users');
    return response.data;
  },
  
  async updateUser(id: string, userData: Partial<UserData>) {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },
  
  async deleteUser(id: string) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
  
  // Assign driver to route
  async assignDriverToRoute(routeId: string, driverId: string) {
    const response = await api.post(`/admin/routes/${routeId}/assign`, { driverId });
    return response.data;
  }
};

export default adminService; 