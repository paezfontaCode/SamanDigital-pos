"use client";

import * as React from "react"

import { cn } from "@/lib/utils"

const Popover = React.createContext<any>(null);

const PopoverTrigger: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => {
  return React.cloneElement(children as React.ReactElement, { onClick });
}

const PopoverContent: React.FC<{ children: React.ReactNode; className?: string; align?: string }> = ({ children, className, align }) => {
  return (
    <div className={cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md", className)}>
      {children}
    </div>
  );
}

export { Popover, PopoverTrigger, PopoverContent }
