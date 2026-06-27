import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'diva-addis-lounge-secret-key-2024'
)

const roleRoutes: Record<string, string[]> = {
  '/dashboard/admin': ['ADMIN'],
  // staff-meals MUST come before /dashboard/staff so startsWith doesn't
  // accidentally match staff-meals against the stricter /dashboard/staff rule.
  '/dashboard/staff-meals': ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'],
  '/dashboard/staff': ['ADMIN'],
  '/dashboard/menu': ['ADMIN'],
  '/dashboard/reports': ['ADMIN', 'MANAGER'],
  '/dashboard/inventory': ['ADMIN', 'MANAGER'],
  '/dashboard/tables': ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'],
  '/dashboard/orders': ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'],
  '/dashboard/payment': ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, SECRET)
    const role = payload.role as string

    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
