import logging
from typing import Optional

import httpx
from pydantic import BaseModel


logger = logging.getLogger(__name__)


class ZarinpalError(Exception):
    """Raised when a Zarinpal API call fails in a controlled way."""

    def __init__(self, message: str, code: Optional[int] = None):
        self.code = code
        super().__init__(message)


class PaymentRequestResult(BaseModel):
    authority: str
    payment_url: str
    code: int
    message: str


class PaymentVerifyResult(BaseModel):
    success: bool
    status_code: int
    message: str
    ref_id: Optional[int]
    card_pan: Optional[str]
    fee_type: Optional[str]
    fee: Optional[int]


class ZarinpalClient:
    """
    Async client wrapper around Zarinpal REST v4 for request/verify flows.
    Keeps URLs/config isolated and normalizes responses for the application layer.
    """

    def __init__(self, merchant_id: str, sandbox: bool, callback_url: str):
        self.merchant_id = merchant_id
        self.callback_url = callback_url
        self.base_api_url = f"https://{'sandbox' if sandbox else 'api'}.zarinpal.com"
        self.gateway_base_url = f"https://{'sandbox' if sandbox else 'www'}.zarinpal.com"

    async def payment_request(
        self,
        order_id: int | str,
        amount_toman: int,
        description: str,
        mobile: Optional[str],
        email: Optional[str],
    ) -> PaymentRequestResult:
        """Create a payment request and return authority + redirect URL."""
        amount_rial = amount_toman * 10
        payload: dict = {
            "merchant_id": self.merchant_id,
            "amount": amount_rial,
            "description": description,
            "callback_url": self.callback_url,
            "currency": "IRT",
        }
        metadata = {}
        if mobile:
            metadata["mobile"] = mobile
        if email:
            metadata["email"] = email
        if metadata:
            payload["metadata"] = metadata

        try:
            async with httpx.AsyncClient(base_url=self.base_api_url, timeout=15) as client:
                response = await client.post("/pg/v4/payment/request.json", json=payload)
        except httpx.RequestError as exc:
            logger.exception("Zarinpal request error for order %s", order_id)
            raise ZarinpalError(f"خطا در اتصال به زرین‌پال: {exc}") from exc

        data = self._parse_response(response)
        code = data.get("code")
        if code == 100:
            authority = data.get("authority")
            if not authority:
                raise ZarinpalError("کد تراکنش (Authority) از زرین‌پال دریافت نشد.", code=code)
            payment_url = f"{self.gateway_base_url}/pg/StartPay/{authority}"
            message = data.get("message") or "درخواست پرداخت با موفقیت ایجاد شد."
            return PaymentRequestResult(authority=authority, payment_url=payment_url, code=code, message=message)

        message = data.get("message") or self._extract_error_message(data) or "خطا در ایجاد تراکنش"
        logger.error("Zarinpal payment_request failed (order=%s, code=%s, msg=%s)", order_id, code, message)
        raise ZarinpalError(message, code=code)

    async def payment_verify(self, authority: str, amount_toman: int, order_id: int | str) -> PaymentVerifyResult:
        """Verify a payment after callback. Returns structured info without raising for gateway codes."""
        amount_rial = amount_toman * 10
        payload = {
            "merchant_id": self.merchant_id,
            "amount": amount_rial,
            "authority": authority,
        }
        try:
            async with httpx.AsyncClient(base_url=self.base_api_url, timeout=15) as client:
                response = await client.post("/pg/v4/payment/verify.json", json=payload)
        except httpx.RequestError as exc:
            logger.exception("Zarinpal verify error for order %s", order_id)
            raise ZarinpalError(f"خطا در تایید تراکنش: {exc}") from exc

        data = self._parse_response(response)
        code = int(data.get("code") or -1)
        success = code in (100, 101)
        message = data.get("message") or self._extract_error_message(data) or "پاسخ نامعتبر از زرین‌پال"
        result = PaymentVerifyResult(
            success=success,
            status_code=code,
            message=message,
            ref_id=data.get("ref_id"),
            card_pan=data.get("card_pan"),
            fee_type=data.get("fee_type"),
            fee=data.get("fee"),
        )
        if not success:
            logger.warning(
                "Zarinpal verification failed (order=%s, authority=%s, code=%s, msg=%s)",
                order_id,
                authority,
                code,
                message,
            )
        return result

    @staticmethod
    def _parse_response(response: httpx.Response) -> dict:
        """Normalize Zarinpal JSON response, raising on HTTP-level errors."""
        if response.status_code >= 400:
            raise ZarinpalError(f"پاسخ نامعتبر از زرین‌پال (HTTP {response.status_code})")
        try:
            payload = response.json()
        except ValueError as exc:
            raise ZarinpalError("پاسخ غیرقابل‌خواندن از زرین‌پال") from exc
        return payload.get("data") or payload

    @staticmethod
    def _extract_error_message(data: dict) -> Optional[str]:
        """Extract a readable error message from Zarinpal's `errors` or `data` block."""
        errors = data.get("errors") if isinstance(data, dict) else None
        if isinstance(errors, list) and errors:
            err = errors[0]
            if isinstance(err, dict):
                return err.get("message") or err.get("code")
            return str(err)
        if isinstance(errors, dict):
            return errors.get("message") or errors.get("code")
        if isinstance(data, dict):
            return data.get("message")
        return None
