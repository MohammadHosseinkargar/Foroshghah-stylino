import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import HTTPException

from ..core.config import get_settings


async def send_email(to_email: str, subject: str, html_body: str, text_body: str = None) -> bool:
    """
    Send an email using SMTP.
    Returns True if successful, False otherwise.
    """
    settings = get_settings()
    
    if not settings.smtp_host or not settings.smtp_user:
        # In development, just log instead of actually sending
        print(f"[EMAIL] Would send to {to_email}: {subject}")
        print(f"[EMAIL] Body: {html_body}")
        return True
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from_email
        msg["To"] = to_email
        
        if text_body:
            part1 = MIMEText(text_body, "plain", "utf-8")
            msg.attach(part1)
        
        part2 = MIMEText(html_body, "html", "utf-8")
        msg.attach(part2)
        
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


async def send_verification_email(email: str, token: str) -> bool:
    """Send email verification link"""
    settings = get_settings()
    verification_url = f"{settings.frontend_url}/auth/verify?token={token}"
    
    html_body = f"""
    <html>
    <body dir="rtl" style="font-family: Tahoma, Arial, sans-serif;">
        <h2>تایید ایمیل</h2>
        <p>سلام،</p>
        <p>برای تایید ایمیل خود، روی لینک زیر کلیک کنید:</p>
        <p><a href="{verification_url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">تایید ایمیل</a></p>
        <p>یا این لینک را در مرورگر خود باز کنید:</p>
        <p>{verification_url}</p>
        <p>این لینک تا 24 ساعت معتبر است.</p>
        <p>اگر شما این ایمیل را درخواست نکرده‌اید، لطفا آن را نادیده بگیرید.</p>
    </body>
    </html>
    """
    
    text_body = f"""
    تایید ایمیل
    برای تایید ایمیل خود، این لینک را باز کنید:
    {verification_url}
    این لینک تا 24 ساعت معتبر است.
    """
    
    return await send_email(email, "تایید ایمیل - استایلینو", html_body, text_body)


async def send_password_reset_email(email: str, token: str) -> bool:
    """Send password reset link"""
    settings = get_settings()
    reset_url = f"{settings.frontend_url}/auth/reset-password?token={token}"
    
    html_body = f"""
    <html>
    <body dir="rtl" style="font-family: Tahoma, Arial, sans-serif;">
        <h2>بازیابی رمز عبور</h2>
        <p>سلام،</p>
        <p>برای بازیابی رمز عبور خود، روی لینک زیر کلیک کنید:</p>
        <p><a href="{reset_url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">بازیابی رمز عبور</a></p>
        <p>یا این لینک را در مرورگر خود باز کنید:</p>
        <p>{reset_url}</p>
        <p>این لینک تا 1 ساعت معتبر است.</p>
        <p>اگر شما این ایمیل را درخواست نکرده‌اید، لطفا آن را نادیده بگیرید.</p>
    </body>
    </html>
    """
    
    text_body = f"""
    بازیابی رمز عبور
    برای بازیابی رمز عبور خود، این لینک را باز کنید:
    {reset_url}
    این لینک تا 1 ساعت معتبر است.
    """
    
    return await send_email(email, "بازیابی رمز عبور - استایلینو", html_body, text_body)

