type PasswordResetInput = { email: string; name: string; token: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

export async function sendPasswordResetEmail(input: PasswordResetInput) {
  const resetUrl = `${process.env.APP_URL}/redefinir-senha?token=${encodeURIComponent(input.token)}`;
  const provider = process.env.EMAIL_PROVIDER ?? "console";
  if (provider === "console") {
    if (process.env.NODE_ENV !== "production") console.info(`[EMAIL DEV] Recuperação para ${input.email}: ${resetUrl}`);
    return;
  }
  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) throw new Error("Resend não configurado");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [input.email],
        subject: "Redefinição de senha — LiderFlix",
        html: `<div style="font-family:Arial,sans-serif;color:#171717"><h1>LiderFlix</h1><p>Olá, ${escapeHtml(input.name)}.</p><p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#b71920;color:#fff;padding:12px 20px;text-decoration:none">REDEFINIR SENHA</a></p><p>Este link expira em 30 minutos. Se você não fez a solicitação, ignore este e-mail.</p></div>`,
      }),
    });
    if (!response.ok) throw new Error(`Falha no envio pelo Resend (${response.status})`);
    return;
  }
  throw new Error(`Provedor de email não suportado: ${provider}`);
}
