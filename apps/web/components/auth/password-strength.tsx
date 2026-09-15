function scorePassword(password: string) {
  if (!password) return 0;
  let score = 1;
  if (password.length >= 8) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password) || /[A-Z]/.test(password)) score += 1;
  return score;
}

export function PasswordStrength({ password }: { password: string }) {
  const score = scorePassword(password);

  return (
    <div className="mb-6.5 flex gap-1.5" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`h-1.25 flex-1 rounded-full ${i < score ? "bg-rust" : "bg-line"}`} />
      ))}
    </div>
  );
}
