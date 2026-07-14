import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = { title: "Buzón de pruebas — Multiblog" };
export const dynamic = "force-dynamic";

export default async function MailboxPage() {
  const emails = await prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-bold mb-1">Buzón de pruebas</h1>
      <p className="text-sm text-muted mb-8">
        Esta app no tiene un proveedor de email real conectado. Los correos (como los de recuperación de contraseña)
        se guardan aquí para que puedas probar el flujo completo.
      </p>

      {emails.length === 0 ? (
        <p className="text-muted">Todavía no se ha enviado ningún email.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {emails.map((email) => (
            <details key={email.id} className="card p-4">
              <summary className="cursor-pointer flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{email.subject}</span>
                <span className="text-xs text-muted">
                  para {email.to} · {formatDistanceToNow(email.createdAt, { addSuffix: true, locale: es })}
                </span>
              </summary>
              <div
                className="prose prose-sm dark:prose-invert max-w-none mt-4 border-t border-border pt-4"
                dangerouslySetInnerHTML={{ __html: email.html }}
              />
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
