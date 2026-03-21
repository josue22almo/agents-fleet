export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}
