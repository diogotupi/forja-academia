type PasswordResetInput = { email: string; name: string; token: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

function emailContent(input: PasswordResetInput, resetUrl: string) {
  return `<div style="font-family:Arial,sans-serif;color:#171717"><h1>LiderFlix</h1><p>Olá, ${escapeHtml(input.name)}.</p><p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#b71920;color:#fff;padding:12px 20px;text-decoration:none">REDEFINIR SENHA</a></p><p>Este link expira em 30 minutos. Se você não fez a solicitação, ignore este e-mail.</p></div>`;
}

function senderFromEnvironment() {
  const value = process.env.EMAIL_FROM;
  if (!value) throw new Error("EMAIL_FROM não configurado");
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return match ? { name: match[1], email: match[2] } : { name: "LiderFlix", email: value };
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
        html: emailContent(input, resetUrl),
      }),
    });
    if (!response.ok) throw new Error(`Falha no envio pelo Resend (${response.status})`);
    return;
  }
  if (provider === "brevo") {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error("Brevo não configurado");
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        sender: senderFromEnvironment(),
        to: [{ email: input.email, name: input.name }],
        subject: "Redefinição de senha — LiderFlix",
        htmlContent: emailContent(input, resetUrl),
      }),
    });
    if (!response.ok) throw new Error(`Falha no envio pelo Brevo (${response.status})`);
    return;
  }
  throw new Error(`Provedor de email não suportado: ${provider}`);
}
