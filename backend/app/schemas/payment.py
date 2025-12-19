from typing import Optional

from pydantic import BaseModel


class PaymentCreateRequest(BaseModel):
    order_id: int
    amount_toman: int
    description: str
    mobile: Optional[str] = None
    email: Optional[str] = None


class PaymentCreateResponse(BaseModel):
    authority: str
    payment_url: str
    code: int
    message: str


class PaymentVerifyResponse(BaseModel):
    success: bool
    status_code: int
    message: str
    ref_id: Optional[int] = None
    card_pan: Optional[str] = None
    fee_type: Optional[str] = None
    fee: Optional[int] = None
