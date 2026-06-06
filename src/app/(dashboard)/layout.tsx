import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
