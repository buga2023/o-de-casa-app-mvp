"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Plus, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser, useData } from "@/lib/hooks";
import { data } from "@/lib/data";

const items = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/vizinhos", label: "Vizinhos", icon: Users },
  { href: "/registrar", label: "Registrar", icon: Plus, central: true },
  { href: "/notificacoes", label: "Notificações", icon: Bell, badge: true },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { data: naoLidas = 0 } = useData(
    () => (user ? data.countNaoLidas(user.id) : Promise.resolve(0)),
    [user?.id]
  );

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-app items-stretch justify-between border-t border-linha bg-creme/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        if ("central" in item && item.central) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center justify-center py-1.5"
            >
              <span className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-terracota text-creme shadow-soft">
                <Icon className="h-6 w-6" />
              </span>
              <span className="-mt-2 text-[10px] font-medium text-terracota">
                {item.label}
              </span>
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px]",
              active ? "text-terracota" : "text-tinta/50"
            )}
          >
            <Icon className="h-5 w-5" />
            {"badge" in item && item.badge && naoLidas > 0 && (
              <span className="absolute right-1/2 top-1 translate-x-3 rounded-full bg-terracota px-1.5 text-[10px] font-bold text-creme">
                {naoLidas}
              </span>
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
