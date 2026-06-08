import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Paperclip, X } from "lucide-react";

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  attachment_path: string | null;
  attachment_name: string | null;
};

const MAX_FILE = 5 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "application/pdf"];

const schema = z.object({
  title: z.string().trim().min(1, "Título requerido").max(120),
  description: z.string().trim().max(2000).optional(),
  due_date: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in_progress", "completed"]),
});

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: TaskRow | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);

  useEffect(() => {
    if (open) { setFile(null); setRemoveAttachment(false); }
  }, [open]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      title: fd.get("title"),
      description: fd.get("description") || undefined,
      due_date: fd.get("due_date") || undefined,
      priority: fd.get("priority"),
      status: fd.get("status"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    if (file) {
      if (file.size > MAX_FILE) return toast.error("El archivo supera 5 MB");
      if (!ALLOWED.includes(file.type)) return toast.error("Solo se permiten imágenes o PDF");
    }

    setBusy(true);
    try {
      let attachment_path = task?.attachment_path ?? null;
      let attachment_name = task?.attachment_name ?? null;

      if (removeAttachment && task?.attachment_path) {
        await supabase.storage.from("task-attachments").remove([task.attachment_path]);
        attachment_path = null;
        attachment_name = null;
      }

      if (file) {
        if (task?.attachment_path) {
          await supabase.storage.from("task-attachments").remove([task.attachment_path]);
        }
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("task-attachments").upload(path, file);
        if (upErr) throw upErr;
        attachment_path = path;
        attachment_name = file.name;
      }

      const payload = {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        due_date: parsed.data.due_date ? new Date(parsed.data.due_date).toISOString() : null,
        priority: parsed.data.priority,
        status: parsed.data.status,
        attachment_path,
        attachment_name,
      };

      if (task) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
        if (error) throw error;
        toast.success("Tarea actualizada");
      } else {
        const { error } = await supabase.from("tasks").insert({ ...payload, user_id: user.id });
        if (error) throw error;
        toast.success("Tarea creada");
      }
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? "Error al guardar");
    } finally {
      setBusy(false);
    }
  };

  const dueValue = task?.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>Completa los detalles de la tarea.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" defaultValue={task?.title ?? ""} required maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" defaultValue={task?.description ?? ""} rows={3} maxLength={2000} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="due_date">Fecha límite</Label>
              <Input id="due_date" name="due_date" type="datetime-local" defaultValue={dueValue} />
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select name="priority" defaultValue={task?.priority ?? "medium"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Estado</Label>
              <Select name="status" defaultValue={task?.status ?? "pending"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En curso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Adjunto (imagen o PDF, máx. 5 MB)</Label>
            {task?.attachment_name && !file && !removeAttachment && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 truncate"><Paperclip className="h-4 w-4 text-muted-foreground" />{task.attachment_name}</span>
                <button type="button" onClick={() => setRemoveAttachment(true)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
