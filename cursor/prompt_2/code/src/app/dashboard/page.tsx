"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  Button,
  Alert,
  StatusBadge,
  RoleBadge,
  Badge,
  Input,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";

interface Article {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  author: { name: string };
  tags: { tag: { name: string } }[];
}

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [apiToken, setApiToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"articles" | "users" | "api">("articles");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const articlesRes = await fetch("/api/articles?mine=true");
    const articlesData = await articlesRes.json();
    setArticles(articlesData.articles || []);

    if (user.role === "EDITOR") {
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
    }

    const tokenRes = await fetch("/api/user/api-token");
    const tokenData = await tokenRes.json();
    setApiToken(tokenData.apiToken || "");

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }
    if (user) fetchData();
  }, [user, authLoading, router, fetchData]);

  const handleStatusAction = async (id: string, action: string) => {
    const res = await fetch(`/api/articles/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      fetchData();
    } else {
      setError(data.error);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    const res = await fetch("/api/user/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      fetchData();
    } else {
      setError(data.error);
    }
  };

  const regenerateToken = async () => {
    const res = await fetch("/api/user/api-token", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setApiToken(data.apiToken);
      setMessage("Token regenerado");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  const canCreate = user.role === "AUTHOR" || user.role === "EDITOR";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de control</h1>
          <p className="text-sm text-gray-500">
            Bienvenido, {user.name} <RoleBadge role={user.role} />
          </p>
        </div>
        {canCreate && (
          <Link href="/articles/new">
            <Button>Nuevo artículo</Button>
          </Link>
        )}
      </div>

      {message && <div className="mb-4"><Alert type="success" message={message} onClose={() => setMessage("")} /></div>}
      {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError("")} /></div>}

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {(
          [
            "articles",
            ...(user.role === "EDITOR" ? (["users"] as const) : []),
            "api",
          ] as ("articles" | "users" | "api")[]
        ).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "articles" ? "Mis artículos" : t === "users" ? "Usuarios" : "API"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : tab === "articles" ? (
        <div className="space-y-4">
          {articles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
              No tienes artículos aún.
              {canCreate && (
                <div className="mt-2">
                  <Link href="/articles/new" className="text-indigo-600 hover:underline">
                    Crear tu primer artículo
                  </Link>
                </div>
              )}
            </div>
          ) : (
            articles.map((article) => (
              <div
                key={article.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/articles/${article.id}`}
                      className="font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {article.title}
                    </Link>
                    <StatusBadge status={article.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>{formatDate(article.createdAt)}</span>
                    {article.tags.map((t) => (
                      <Badge key={t.tag.name}>{t.tag.name}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/articles/${article.id}/edit`}>
                    <Button variant="secondary" size="sm">Editar</Button>
                  </Link>
                  {article.status === "DRAFT" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusAction(article.id, "submit_review")}
                    >
                      Enviar a revisión
                    </Button>
                  )}
                  {user.role === "EDITOR" && article.status === "IN_REVIEW" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleStatusAction(article.id, "publish")}
                      >
                        Publicar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStatusAction(article.id, "reject")}
                      >
                        Rechazar
                      </Button>
                    </>
                  )}
                  {user.role === "EDITOR" && article.status === "PUBLISHED" && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleStatusAction(article.id, "unpublish")}
                    >
                      Despublicar
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : tab === "users" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Rol</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Cambiar rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3">
                    {u.id !== user.id && (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="READER">Lector</option>
                        <option value="AUTHOR">Autor</option>
                        <option value="EDITOR">Editor</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">API Pública</h3>
          <p className="text-sm text-gray-500">
            Usa este token para acceder a la API de solo lectura de artículos publicados.
          </p>
          <div className="flex gap-2">
            <Input value={apiToken} readOnly className="font-mono text-xs" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(apiToken);
                setMessage("Token copiado al portapapeles");
              }}
            >
              Copiar
            </Button>
            <Button variant="secondary" size="sm" onClick={regenerateToken}>
              Regenerar
            </Button>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-sm">
            <p className="font-medium text-gray-700 mb-2">Ejemplo de uso:</p>
            <code className="block text-xs text-gray-600 break-all">
              curl -H &quot;Authorization: Bearer {apiToken}&quot; {typeof window !== "undefined" ? window.location.origin : ""}/api/public/articles
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
