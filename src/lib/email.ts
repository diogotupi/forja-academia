type PasswordResetInput = { email: string; name: string; token: string };

export async function sendPasswordResetEmail(input: PasswordResetInput) {
  const resetUrl = `${process.env.APP_URL}/redefinir-senha?token=${encodeURIComponent(input.token)}`;
  if ((process.env.EMAIL_PROVIDER ?? "console") === "console") {
    if (process.env.NODE_ENV !== "production") console.info(`[EMAIL DEV] Recuperação para ${input.email}: ${resetUrl}`);
    return;
  }
  throw new Error("Provedor de email ainda não configurado");
}
