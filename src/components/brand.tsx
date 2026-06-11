import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif font-semibold text-tinta", className)}>
      Ô de Casa<span className="text-terracota">!</span>
    </span>
  );
}
