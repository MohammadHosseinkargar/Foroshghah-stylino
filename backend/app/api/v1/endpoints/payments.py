import logging
from urllib.parse import quote_plus, urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from prisma import Prisma
from prisma.models import User

from ....core.config import get_settings
from ....core.deps import get_db, require_roles
from ....schemas.payment import PaymentCreateRequest, PaymentCreateResponse
from ....services.order_service import mark_order_paid
from ....services.zarinpal_client import ZarinpalClient, ZarinpalError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


def _get_client():
    settings = get_settings()
    if not settings.zarinpal_merchant_id or not settings.zarinpal_callback_url:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="پیکربندی درگاه پرداخت تکمیل نیست")
    client = ZarinpalClient(
        merchant_id=settings.zarinpal_merchant_id,
        sandbox=settings.zarinpal_sandbox,
        callback_url=settings.zarinpal_callback_url,
    )
    return settings, client


def _frontend_base_url(callback_url: str, configured: str | None) -> str:
    if configured:
        return configured.rstrip("/")
    try:
        parsed = urlparse(callback_url)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"
    except Exception:
        logger.warning("Could not parse callback_url for frontend base; falling back to localhost")
    return "http://localhost:3000"


@router.post("/zarinpal/create", response_model=PaymentCreateResponse)
async def create_zarinpal_payment(
    payload: PaymentCreateRequest,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(require_roles(["CUSTOMER", "ADMIN"])),
):
    """
    Create a Zarinpal payment request for an order and return the StartPay URL.
    """
    settings, client = _get_client()

    order = await db.order.find_unique(where={"id": payload.order_id})
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="سفارش یافت نشد")
    if current_user.role != "ADMIN" and order.customerId != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="دسترسی به این سفارش ندارید")
    if order.paymentStatus == "PAID":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="سفارش قبلا پرداخت شده است")

    # Always trust the server-side amount to avoid tampering
    amount_toman = int(round(order.paymentAmount or order.totalAmount))
    if payload.amount_toman and payload.amount_toman != amount_toman:
        logger.warning(
            "Amount mismatch for order %s (payload=%s, server=%s)",
            order.id,
            payload.amount_toman,
            amount_toman,
        )
    if amount_toman <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="مبلغ سفارش نامعتبر است")

    try:
        result = await client.payment_request(
            order_id=order.id,
            amount_toman=amount_toman,
            description=payload.description,
            mobile=payload.mobile,
            email=payload.email,
        )
    except ZarinpalError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    await db.order.update(
        where={"id": order.id},
        data={
            "authority": result.authority,
            "paymentStatus": "UNPAID",
            "status": "PENDING",
            "paymentAmount": amount_toman,
            "paymentGateway": "ZARINPAL",
            "paymentMessage": result.message,
        },
    )

    return PaymentCreateResponse(
        authority=result.authority,
        payment_url=result.payment_url,
        code=result.code,
        message=result.message,
    )


@router.get("/zarinpal/callback")
async def zarinpal_callback(
    Authority: str = Query(..., description="Authority code provided by Zarinpal"),  # noqa: N803
    Status: str = Query(..., description="Payment status from Zarinpal"),  # noqa: N803
    db: Prisma = Depends(get_db),
):
    """
    Handle Zarinpal callback, verify payment, update order, then redirect user to the frontend result page.
    """
    settings, client = _get_client()
    frontend_base = _frontend_base_url(settings.zarinpal_callback_url, settings.frontend_base_url)
    failure_base = f"{frontend_base}/payment/result?status=failed"

    order = await db.order.find_first(where={"authority": Authority})
    if not order:
        target = f"{failure_base}&message={quote_plus('سفارش یافت نشد')}"
        return RedirectResponse(url=target)

    amount_toman = int(round(order.paymentAmount or order.totalAmount))
    if Status != "OK":
        await db.order.update(
            where={"id": order.id},
            data={"paymentStatus": "FAILED", "status": "CANCELED", "paymentMessage": "پرداخت توسط کاربر لغو شد"},
        )
        target = f"{failure_base}&orderId={order.id}&message={quote_plus('پرداخت توسط کاربر لغو شد')}"
        return RedirectResponse(url=target)

    try:
        verify_result = await client.payment_verify(authority=Authority, amount_toman=amount_toman, order_id=order.id)
    except ZarinpalError as exc:
        await db.order.update(
            where={"id": order.id},
            data={"paymentStatus": "FAILED", "status": "CANCELED", "paymentMessage": str(exc)},
        )
        target = f"{failure_base}&orderId={order.id}&message={quote_plus(str(exc))}"
        return RedirectResponse(url=target)

    if verify_result.success:
        payment_update = {
            "authority": Authority,
            "refId": verify_result.ref_id,
            "cardPan": verify_result.card_pan,
            "feeType": verify_result.fee_type,
            "fee": verify_result.fee,
            "paymentMessage": verify_result.message,
            "paymentGateway": "ZARINPAL",
            "paymentAmount": amount_toman,
        }
        await mark_order_paid(
            prisma=db,
            order_id=order.id,
            requested_by=order.customerId,
            is_admin=True,
            payment_update=payment_update,
        )
        success_url = f"{frontend_base}/payment/result?status=success&orderId={order.id}&amount={amount_toman}"
        if verify_result.ref_id:
            success_url += f"&refId={verify_result.ref_id}"
        return RedirectResponse(url=success_url)

    await db.order.update(
        where={"id": order.id},
        data={
            "paymentStatus": "FAILED",
            "status": "CANCELED",
            "paymentMessage": verify_result.message,
        },
    )
    fail_url = (
        f"{failure_base}&orderId={order.id}&message={quote_plus(verify_result.message)}&code={verify_result.status_code}"
    )
    return RedirectResponse(url=fail_url)
