import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLoginPage() {
  const user = await getCurrentUser();

  if (user?.role === "Admin") {
    redirect("/admin/movies");
  }

  if (user) {
    redirect("/");
  }

  redirect("/login?next=/admin/movies");
}
