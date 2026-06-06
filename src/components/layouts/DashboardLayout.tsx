import { auth } from "@/../auth";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar role={session.user.role} />
      <div className="flex flex-col flex-1 sm:pl-64">
        <Header user={session.user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
