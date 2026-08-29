import { timingSafeEqual } from "node:crypto";

import { getWorkspaceData } from "@/app/workspace/shinten/actions";
import {
  collectDueAlertItems,
  formatDueAlertSubject,
  formatDueAlertText,
  getJstCalendarDate,
  isJstWeekend,
} from "@/lib/dueAlert";
import { sendDueAlertEmail } from "@/lib/dueAlertMail";

export const dynamic = "force-dynamic";

function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (!header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  if (isJstWeekend(now)) {
    return Response.json({ ok: true, skipped: "weekend" });
  }

  const stores = await getWorkspaceData();
  const today = getJstCalendarDate(now);
  const digest = collectDueAlertItems(stores, today);

  if (digest.redCount === 0 && digest.yellowCount === 0) {
    return Response.json({ ok: true, skipped: "empty" });
  }

  const sent = await sendDueAlertEmail({
    subject: formatDueAlertSubject(digest, { isTest: false }),
    text: formatDueAlertText(digest, { isTest: false, today }),
  });

  if (!sent.ok) {
    return Response.json({ error: sent.error }, { status: 500 });
  }

  return Response.json({
    ok: true,
    sent: true,
    redCount: digest.redCount,
    yellowCount: digest.yellowCount,
  });
}
