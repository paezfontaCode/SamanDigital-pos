import { redirect } from "next/navigation";

export default function AdminDashboardPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      <p className="text-muted-foreground">Bienvenido al panel de administración.</p>
    </div>
  );
}
