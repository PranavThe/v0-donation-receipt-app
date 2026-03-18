'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Users, 
  History, 
  LogOut,
  ShieldCheck,
  PenLine
} from 'lucide-react'

const ORG_INFO = {
  name: "Vedanta Society of Providence",
  shortName: "VSP"
}

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  
  const isAdmin = user?.role === 'admin'

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const navigation = [
    {
      title: 'Main',
      items: [
        {
          title: 'Create Receipt',
          href: '/dashboard',
          icon: FileText,
          active: pathname === '/dashboard',
          allowedRoles: ['admin', 'data_entry'] as const
        }
      ]
    },
    {
      title: 'Admin',
      items: [
        {
          title: 'Profiles',
          href: '/dashboard/profiles',
          icon: Users,
          active: pathname === '/dashboard/profiles',
          allowedRoles: ['admin'] as const
        },
        {
          title: 'Receipt History',
          href: '/dashboard/receipts',
          icon: History,
          active: pathname === '/dashboard/receipts',
          allowedRoles: ['admin'] as const
        }
      ]
    }
  ]

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-sm">
            {ORG_INFO.shortName.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{ORG_INFO.shortName}</span>
            <span className="text-xs text-muted-foreground">Donation System</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {navigation.map((group) => {
          const visibleItems = group.items.filter(item => 
            item.allowedRoles.includes(user?.role || 'data_entry')
          )
          
          if (visibleItems.length === 0) return null
          
          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={item.active}>
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <ShieldCheck className="size-4 text-primary" />
            ) : (
              <PenLine className="size-4 text-muted-foreground" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.username}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
