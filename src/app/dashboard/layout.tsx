import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from '@/components/DashboardLayoutClient'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayoutClient session={session}>
      {children}
    </DashboardLayoutClient>
  )
}
