export default function FormAlert({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <div className={`alert ${error ? "alert-error" : "alert-success"}`} role="status">
      {error ?? success}
    </div>
  );
}
