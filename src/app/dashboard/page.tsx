import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const roleRedirects: Record<string, string> = {
    WAITER: '/dashboard/tables',
    CASHIER: '/dashboard/payment',
    MANAGER: '/dashboard/tables',
    ADMIN: '/dashboard/tables',
  }

  redirect(roleRedirects[session.role] || '/dashboard/tables')
}
