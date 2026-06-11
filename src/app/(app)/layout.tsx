"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { BottomNav } from "@/components/bottom-nav";
import { Skeleton } from "@/components/states";
import { useCurrentUser } from "@/lib/hooks";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, ready } = useCurrentUser();

  useEffect(() => {
    if (ready && !user) router.replace("/");
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!user) return null; // redirecionando

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-linha bg-creme/95 px-4 py-3 backdrop-blur">
        <Brand className="text-xl" />
        <span className="text-xs text-tinta/60">{user.nome.split(" ")[0]}</span>
      </header>
      <main className="app-scroll flex-1 overflow-y-auto px-4 pb-28 pt-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
