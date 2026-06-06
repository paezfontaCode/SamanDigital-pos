import { redirect } from "next/navigation";
import { auth } from "@/../auth";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user?.role;

  if (role === "ADMIN") {
    redirect("/admin");
  } else if (role === "VENDEDOR") {
    redirect("/vendedor");
  } else if (role === "TECNICO") {
    redirect("/tecnico");
  }

  return null;
}
