import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/constants";
import ApiTokenCard from "./ApiTokenCard";

export const metadata = { title: "Perfil — Multiblog" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/iniciar-sesion");

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const apiUrl = `${protocol}://${host}/api/public/articles`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Perfil</h1>
        <p className="text-muted text-sm">Tu cuenta y credenciales de acceso.</p>
      </div>

      <div className="card p-5 sm:p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted mb-0.5">Nombre</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-muted mb-0.5">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted mb-0.5">Rol</dt>
            <dd className="font-medium">{ROLE_LABELS[user.role]}</dd>
          </div>
        </dl>
      </div>

      <ApiTokenCard token={user.apiToken} apiUrl={apiUrl} />
    </div>
  );
}
