import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-linha bg-white px-3 text-sm text-tinta placeholder:text-tinta/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/40",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[88px] w-full rounded-xl border border-linha bg-white px-3 py-2 text-sm text-tinta placeholder:text-tinta/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/40",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-sm font-medium text-tinta", className)}
      {...props}
    />
  );
}
