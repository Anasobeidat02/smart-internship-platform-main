"""
Async-compatible email service.

Configure via environment variables (see .env.example):
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_TLS

When SMTP_HOST is not set the mailer logs to stdout instead of crashing,
which keeps the dev environment working without an email server.
"""
from __future__ import annotations

import asyncio
import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from functools import lru_cache

from app.core.config import get_settings

log = logging.getLogger(__name__)


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def _build_message(to: str, subject: str, html: str, text: str) -> MIMEMultipart:
    settings = get_settings()
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from or settings.smtp_user or "noreply@smartintern.jo"
    msg["To"] = to
    msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))
    return msg


def _send_sync(to: str, subject: str, html: str, text: str) -> None:
    settings = get_settings()

    if not settings.smtp_host:
        log.info("[MAILER-DRY-RUN] To: %s | Subject: %s", to, subject)
        log.info("[MAILER-DRY-RUN] Body:\n%s", text)
        return

    msg = _build_message(to, subject, html, text)
    ctx = ssl.create_default_context() if settings.smtp_tls else None

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        if settings.smtp_tls:
            server.starttls(context=ctx)
        if settings.smtp_user and settings.smtp_password:
            server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(msg["From"], [to], msg.as_bytes())

    log.info("[MAILER] Sent '%s' → %s", subject, to)


async def send_email(to: str, subject: str, html: str, text: str) -> None:
    """Send an email in a thread-pool executor so FastAPI stays non-blocking."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _send_sync, to, subject, html, text)


# --------------------------------------------------------------------------- #
# Canned templates
# --------------------------------------------------------------------------- #

async def notify_company_new_application(
    company_email: str,
    company_name: str,
    internship_title: str,
    student_name: str,
    student_email: str,
    cover_letter: str,
    match_score: float,
) -> None:
    """Notify a company that a new application was received."""
    subject = f"طلب تدريب جديد: {internship_title} — SmartIntern Jordan"
    score_pct = f"{int(match_score * 100)}%" if match_score <= 1 else f"{int(match_score)}%"

    text = (
        f"تلقّيت طلب تدريب جديد\n\n"
        f"المنصب: {internship_title}\n"
        f"الطالب: {student_name} ({student_email})\n"
        f"نسبة المطابقة: {score_pct}\n\n"
        f"خطاب التغطية:\n{cover_letter or '(لم يُرفق خطاب تغطية)'}\n\n"
        f"يرجى تسجيل الدخول إلى لوحة التحكم لمراجعة الطلب والموافقة عليه أو رفضه.\n"
        f"http://localhost:3000/dashboard"
    )

    html = f"""
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><title>طلب تدريب جديد</title></head>
<body style="font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;margin:0;">
  <div style="max-width:600px;margin:0 auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    <div style="background:linear-gradient(135deg,#0ea5e9,#22d3ee);padding:24px 32px;">
      <h1 style="margin:0;font-size:20px;color:#fff;">طلب تدريب جديد</h1>
      <p style="margin:4px 0 0;color:#e0f2fe;font-size:14px;">SmartIntern Jordan</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;">مرحباً <strong>{company_name}</strong>،</p>
      <p>تلقّيت طلب تدريب جديد على منصة SmartIntern Jordan.</p>

      <div style="background:#0f172a;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #334155;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="color:#94a3b8;padding:6px 0;width:140px;">المنصب</td><td><strong>{internship_title}</strong></td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">اسم الطالب</td><td>{student_name}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">البريد الإلكتروني</td><td><a href="mailto:{student_email}" style="color:#22d3ee;">{student_email}</a></td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">نسبة المطابقة</td><td><strong style="color:#22d3ee;">{score_pct}</strong></td></tr>
        </table>
      </div>

      {f'<div style="background:#0f172a;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #334155;"><p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">خطاب التغطية:</p><p style="font-size:14px;line-height:1.7;margin:0;">{cover_letter}</p></div>' if cover_letter else ''}

      <p style="font-size:13px;color:#94a3b8;">يرجى تسجيل الدخول إلى لوحة التحكم لمراجعة الطلب والموافقة عليه أو رفضه.</p>

      <a href="http://localhost:3000/dashboard"
         style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#0ea5e9,#22d3ee);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;font-size:14px;">
        فتح لوحة التحكم
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #334155;font-size:12px;color:#64748b;text-align:center;">
      SmartIntern Jordan — Powered by Al-Balqa Applied University (Al-Hosn College)
    </div>
  </div>
</body>
</html>
"""
    try:
        await send_email(company_email, subject, html, text)
    except Exception as exc:
        log.error("[MAILER] Failed to notify company %s: %s", company_email, exc)


async def notify_student_status_change(
    student_email: str,
    student_name: str,
    internship_title: str,
    company_name: str,
    new_status: str,
) -> None:
    """Notify a student that their application status changed."""
    status_ar = {"accepted": "مقبول ✅", "rejected": "مرفوض ❌", "pending": "قيد المراجعة ⏳"}.get(new_status, new_status)
    status_en = {"accepted": "Accepted ✅", "rejected": "Rejected ❌", "pending": "Pending ⏳"}.get(new_status, new_status)

    subject = f"تحديث حالة طلبك — {internship_title}"

    text = (
        f"مرحباً {student_name}،\n\n"
        f"تم تحديث حالة طلبك لفرصة التدريب:\n"
        f"  المنصب: {internship_title}\n"
        f"  الشركة: {company_name}\n"
        f"  الحالة الجديدة: {status_ar} ({status_en})\n\n"
        f"تابع طلباتك: http://localhost:3000/applications"
    )

    color = {"accepted": "#10b981", "rejected": "#ef4444"}.get(new_status, "#f59e0b")
    html = f"""
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><title>تحديث حالة الطلب</title></head>
<body style="font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;margin:0;">
  <div style="max-width:600px;margin:0 auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    <div style="background:{color};padding:24px 32px;">
      <h1 style="margin:0;font-size:20px;color:#fff;">تحديث حالة طلب التدريب</h1>
    </div>
    <div style="padding:32px;">
      <p>مرحباً <strong>{student_name}</strong>،</p>
      <p>تم تحديث حالة طلبك:</p>
      <div style="background:#0f172a;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #334155;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="color:#94a3b8;padding:6px 0;width:120px;">المنصب</td><td><strong>{internship_title}</strong></td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">الشركة</td><td>{company_name}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">الحالة</td><td><strong style="color:{color};">{status_ar}</strong></td></tr>
        </table>
      </div>
      <a href="http://localhost:3000/applications"
         style="display:inline-block;margin-top:8px;background:{color};color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;font-size:14px;">
        عرض طلباتي
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #334155;font-size:12px;color:#64748b;text-align:center;">
      SmartIntern Jordan — جامعة البلقاء التطبيقية (كلية الحصن)
    </div>
  </div>
</body>
</html>
"""
    try:
        await send_email(student_email, subject, html, text)
    except Exception as exc:
        log.error("[MAILER] Failed to notify student %s: %s", student_email, exc)
