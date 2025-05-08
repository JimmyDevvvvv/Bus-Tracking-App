import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes that don't require authentication
const publicRoutes = ['/', '/login', '/register'];

// Define common routes that all authenticated users can access
const commonAuthenticatedRoutes = ['/profile'];

// Define routes based on user roles
const roleBasedRoutes: Record<string, string[]> = {
  admin: [
    '/dashboard/admin',
    '/routes',
    '/settings'
  ],
  driver: [
    '/dashboard/driver',
    '/routes'
  ],
  student: [
    '/dashboard/student',
    '/track'
  ]
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes and static files
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }
  
  // Check for token
  const token = request.cookies.get('token')?.value;
  
  // If no token found, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Get user role from the cookie
  const userRole = request.cookies.get('user_role')?.value;
  
  // If no role found, redirect to login
  if (!userRole) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Allow access to common authenticated routes
  if (commonAuthenticatedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }
  
  // Get allowed routes for the user's role
  const allowedRoutes = roleBasedRoutes[userRole] || [];
  
  // Check if the current path is allowed for the user's role
  const isAllowed = allowedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // If path is not allowed for this role, redirect to their dashboard
  if (!isAllowed) {
    return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. robots.txt)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 