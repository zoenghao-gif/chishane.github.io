import { History, Home, PlusCircle, Settings } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/home", label: "首页", icon: Home },
  { to: "/record", label: "记录", icon: PlusCircle },
  { to: "/history", label: "历史", icon: History },
  { to: "/settings", label: "设置", icon: Settings },
];

export function AppLayout() {
  return (
    <div className="mx-auto min-h-dvh max-w-[520px] bg-canvas">
      <main className="px-5 pb-28 pt-[max(24px,env(safe-area-inset-top))]">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[520px] border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="grid h-[72px] grid-cols-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-11 flex-col items-center justify-center gap-1 text-xs ${
                  isActive ? "font-medium text-brand" : "text-muted"
                }`
              }
            >
              <Icon className="h-5 w-5" strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
