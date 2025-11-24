"""
Email Service for sending transactional emails
Supports SendGrid, Mailgun, and AWS SES
"""

import os
from typing import Dict, Any, Optional
from enum import Enum


class EmailProvider(Enum):
    SENDGRID = "sendgrid"
    MAILGUN = "mailgun"
    AWS_SES = "aws_ses"


class EmailService:
    """Email service abstraction"""
    
    def __init__(self):
        self.provider = os.getenv("EMAIL_PROVIDER", "sendgrid")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@flowai.com")
        self.from_name = os.getenv("FROM_NAME", "FlowAI")
        
    def send_email(
        self,
        to_email: str,
        subject: str,
        template: str,
        context: Dict[str, Any],
        from_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send email using configured provider
        
        Args:
            to_email: Recipient email
            subject: Email subject
            template: Template name
            context: Template variables
            from_email: Optional custom from email
            
        Returns:
            Send result with message ID
        """
        if self.provider == EmailProvider.SENDGRID.value:
            return self._send_sendgrid(to_email, subject, template, context, from_email)
        elif self.provider == EmailProvider.MAILGUN.value:
            return self._send_mailgun(to_email, subject, template, context, from_email)
        elif self.provider == EmailProvider.AWS_SES.value:
            return self._send_aws_ses(to_email, subject, template, context, from_email)
        else:
            raise ValueError(f"Unsupported email provider: {self.provider}")
    
    def _send_sendgrid(
        self,
        to_email: str,
        subject: str,
        template: str,
        context: Dict[str, Any],
        from_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send email via SendGrid"""
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, Email, To, Content
            
            api_key = os.getenv("SENDGRID_API_KEY")
            if not api_key:
                raise ValueError("SENDGRID_API_KEY not configured")
            
            # Render template
            html_content = self._render_template(template, context)
            
            message = Mail(
                from_email=Email(from_email or self.from_email, self.from_name),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            sg = SendGridAPIClient(api_key)
            response = sg.send(message)
            
            return {
                "provider": "sendgrid",
                "message_id": response.headers.get("X-Message-Id"),
                "status_code": response.status_code
            }
        except Exception as e:
            raise Exception(f"SendGrid error: {str(e)}")
    
    def _send_mailgun(
        self,
        to_email: str,
        subject: str,
        template: str,
        context: Dict[str, Any],
        from_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send email via Mailgun"""
        try:
            import requests
            
            api_key = os.getenv("MAILGUN_API_KEY")
            domain = os.getenv("MAILGUN_DOMAIN")
            
            if not api_key or not domain:
                raise ValueError("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured")
            
            # Render template
            html_content = self._render_template(template, context)
            
            response = requests.post(
                f"https://api.mailgun.net/v3/{domain}/messages",
                auth=("api", api_key),
                data={
                    "from": f"{self.from_name} <{from_email or self.from_email}>",
                    "to": to_email,
                    "subject": subject,
                    "html": html_content
                }
            )
            
            response.raise_for_status()
            result = response.json()
            
            return {
                "provider": "mailgun",
                "message_id": result.get("id"),
                "status": "sent"
            }
        except Exception as e:
            raise Exception(f"Mailgun error: {str(e)}")
    
    def _send_aws_ses(
        self,
        to_email: str,
        subject: str,
        template: str,
        context: Dict[str, Any],
        from_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send email via AWS SES"""
        try:
            import boto3
            
            ses_client = boto3.client(
                "ses",
                region_name=os.getenv("AWS_REGION", "us-east-1"),
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
            )
            
            # Render template
            html_content = self._render_template(template, context)
            
            response = ses_client.send_email(
                Source=f"{self.from_name} <{from_email or self.from_email}>",
                Destination={"ToAddresses": [to_email]},
                Message={
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {
                        "Html": {"Data": html_content, "Charset": "UTF-8"}
                    }
                }
            )
            
            return {
                "provider": "aws_ses",
                "message_id": response["MessageId"],
                "status": "sent"
            }
        except Exception as e:
            raise Exception(f"AWS SES error: {str(e)}")
    
    def _render_template(self, template: str, context: Dict[str, Any]) -> str:
        """
        Render email template with context
        
        Args:
            template: Template name
            context: Template variables
            
        Returns:
            Rendered HTML
        """
        templates = {
            "referral_invitation": self._referral_invitation_template,
            "payment_success": self._payment_success_template,
            "subscription_renewal": self._subscription_renewal_template,
            "failed_payment": self._failed_payment_template,
            "role_change": self._role_change_template,
            "welcome": self._welcome_template,
        }
        
        template_func = templates.get(template)
        if not template_func:
            raise ValueError(f"Unknown template: {template}")
        
        return template_func(context)
    
    def _referral_invitation_template(self, context: Dict[str, Any]) -> str:
        """Referral invitation email template"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .button {{ background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }}
                .highlight {{ color: #6366f1; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>You've been invited to FlowAI!</h1>
                <p>Hi there!</p>
                <p><strong>{context.get('referrer_name')}</strong> thinks you'd love FlowAI - the AI-native creator platform.</p>
                <p>Sign up now and get <span class="highlight">{context.get('bonus_tokens', 100)} free tokens</span> to start creating amazing AI videos!</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{context.get('referral_link')}" class="button">Join FlowAI</a>
                </p>
                <p>Happy creating!<br>The FlowAI Team</p>
            </div>
        </body>
        </html>
        """
    
    def _payment_success_template(self, context: Dict[str, Any]) -> str:
        """Payment success email template"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .success {{ color: #10b981; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Payment Successful! 🎉</h1>
                <p>Hi {context.get('user_name')},</p>
                <p class="success">Your payment has been processed successfully.</p>
                <p><strong>Details:</strong></p>
                <ul>
                    <li>Amount: ${context.get('amount')}</li>
                    <li>Plan: {context.get('plan_name')}</li>
                    <li>Receipt: <a href="{context.get('receipt_url')}">Download</a></li>
                </ul>
                <p>Thank you for your purchase!</p>
                <p>Best regards,<br>The FlowAI Team</p>
            </div>
        </body>
        </html>
        """
    
    def _subscription_renewal_template(self, context: Dict[str, Any]) -> str:
        """Subscription renewal reminder template"""
        return f"""
        <!DOCTYPE html>
        <html>
        <body>
            <div class="container">
                <h1>Subscription Renewal Reminder</h1>
                <p>Hi {context.get('user_name')},</p>
                <p>Your <strong>{context.get('plan_name')}</strong> subscription will renew on {context.get('renewal_date')}.</p>
                <p>Amount: ${context.get('amount')}</p>
                <p>If you need to update your payment method or cancel, visit your account settings.</p>
                <p>Best regards,<br>The FlowAI Team</p>
            </div>
        </body>
        </html>
        """
    
    def _failed_payment_template(self, context: Dict[str, Any]) -> str:
        """Failed payment notification template"""
        return f"""
        <!DOCTYPE html>
        <html>
        <body>
            <div class="container">
                <h1>Payment Failed</h1>
                <p>Hi {context.get('user_name')},</p>
                <p>We were unable to process your payment for the <strong>{context.get('plan_name')}</strong> subscription.</p>
                <p>Please update your payment method to continue enjoying FlowAI.</p>
                <p><a href="{context.get('update_payment_url')}">Update Payment Method</a></p>
                <p>Best regards,<br>The FlowAI Team</p>
            </div>
        </body>
        </html>
        """
    
    def _role_change_template(self, context: Dict[str, Any]) -> str:
        """Role change notification template"""
        return f"""
        <!DOCTYPE html>
        <html>
        <body>
            <div class="container">
                <h1>Your Role Has Been Updated</h1>
                <p>Hi {context.get('user_name')},</p>
                <p>Your role has been changed to <strong>{context.get('new_role')}</strong>.</p>
                <p>You now have access to additional features and capabilities.</p>
                <p><a href="{context.get('dashboard_url')}">Go to Dashboard</a></p>
                <p>Best regards,<br>The FlowAI Team</p>
            </div>
        </body>
        </html>
        """
    
    def _welcome_template(self, context: Dict[str, Any]) -> str:
        """Welcome email template"""
        return f"""
        <!DOCTYPE html>
        <html>
        <body>
            <div class="container">
                <h1>Welcome to FlowAI! 🚀</h1>
                <p>Hi {context.get('user_name')},</p>
                <p>Thanks for joining FlowAI - the world's first AI-native creator platform!</p>
                <p>You've received <strong>{context.get('welcome_tokens', 100)} free tokens</strong> to get started.</p>
                <p>Here's what you can do:</p>
                <ul>
                    <li>Generate AI videos from text</li>
                    <li>Explore style packs in the marketplace</li>
                    <li>Earn tokens through referrals</li>
                    <li>Complete Season Pass quests</li>
                </ul>
                <p><a href="{context.get('dashboard_url')}">Get Started</a></p>
                <p>Happy creating!<br>The FlowAI Team</p>
            </div>
        </body>
        </html>
        """


# Singleton instance
_email_service = None

def get_email_service() -> EmailService:
    """Get email service singleton"""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service


def send_email(to_email: str, subject: str, template: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function to send email
    
    Args:
        to_email: Recipient email
        subject: Email subject
        template: Template name
        context: Template variables
        
    Returns:
        Send result
    """
    service = get_email_service()
    return service.send_email(to_email, subject, template, context)
