import { 
  LayoutDashboard, 
  Upload, 
  History, 
  ClipboardList, 
  CheckSquare,
  BarChart3,
  LogOut 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@shared/schema";

interface AppSidebarProps {
  role: UserRole;
  onLogout: () => void;
}

const studentMenuItems = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  { title: "Submit Assignment", url: "/student/submit", icon: Upload },
  { title: "My Submissions", url: "/student/submissions", icon: History },
];

const teacherMenuItems = [
  { title: "Dashboard", url: "/teacher", icon: LayoutDashboard },
  { title: "Review Queue", url: "/teacher/queue", icon: ClipboardList },
  { title: "Evaluated", url: "/teacher/evaluated", icon: CheckSquare },
  { title: "Analytics", url: "/teacher/analytics", icon: BarChart3 },
];

export function AppSidebar({ role, onLogout }: AppSidebarProps) {
  const [location] = useLocation();
  const menuItems = role === "student" ? studentMenuItems : teacherMenuItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">AI</span>
          </div>
          <div>
            <h2 className="font-semibold text-sm">EduAI Platform</h2>
            <p className="text-xs text-muted-foreground capitalize">{role} Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2" 
          onClick={onLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          Switch Role
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
