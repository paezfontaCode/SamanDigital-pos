"use client";

import { User } from "next-auth";
import { LogOut, Bell, Menu } from "lucide-react";
import { signOut } from "next-auth/react";

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <button className="sm:hidden text-muted-foreground">
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle navigation menu</span>
      </button>
      
      <div className="w-full flex-1">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative rounded-full bg-background p-1 text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-destructive"></span>
        </button>
        
        <div className="flex items-center gap-2">
          <div className="flex flex-col text-right hidden md:flex">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.role}</span>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium hover:bg-muted/80"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
