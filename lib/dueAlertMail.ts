import { Resend } from "resend";
import { z } from "zod";

const emailSchema = z.email();

export type DueAlertMailResult =
  | { ok: true }
  | { ok: false; error: string };

function missingConfigError(): string {
  return "RESEND_API_KEY または DUE_ALERT_EMAIL が未設定です。Vercel の環境変数を確認してください。";
}

export async function sendDueAlertEmail(input: {
  subject: string;
  text: string;
}): Promise<DueAlertMailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const toRaw = process.env.DUE_ALERT_EMAIL?.trim();
  if (!apiKey || !toRaw) {
    return { ok: false, error: missingConfigError() };
  }

  const parsedTo = emailSchema.safeParse(toRaw);
  if (!parsedTo.success) {
    return {
      ok: false,
      error: "DUE_ALERT_EMAIL がメールアドレスとして正しくありません。",
    };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "新店アラート <onboarding@resend.dev>",
    to: parsedTo.data,
    subject: input.subject,
    text: input.text,
  });

  if (error) {
    const message = error.message || "メール送信に失敗しました。";
    if (message.includes("your own email address")) {
      return {
        ok: false,
        error:
          "届ける先が、Resend に登録したメールと一致していません。DUE_ALERT_EMAIL を登録アドレスと同じにしてください。",
      };
    }
    return { ok: false, error: message };
  }

  return { ok: true };
}
