from fastapi import APIRouter, Depends

from prisma import Prisma
from prisma.models import User

from ..core.deps import get_db, require_roles
from ..schemas.commission import CommissionOut
from ..schemas.order import OrderCreate, OrderItemOut, OrderOut
from ..services.order_service import create_order, list_commissions_for_user, list_orders_for_customer, mark_order_paid


def _iso(dt):
    return dt.isoformat() if dt else ""

router = APIRouter()


@router.post("/", response_model=OrderOut, summary="ثبت سفارش")
async def create_customer_order(
    payload: OrderCreate,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(require_roles(["CUSTOMER"])),
):
    order, order_items = await create_order(db, customer_id=current_user.id, items=payload.items)
    return OrderOut(
        id=order.id,
        totalAmount=order.totalAmount,
        status=order.status,
        paymentStatus=order.paymentStatus,
        createdAt=_iso(order.createdAt),
        items=[
            OrderItemOut(
                productId=item.productId,
                productName=item.product.name if item.product else "",
                quantity=item.quantity,
                unitPrice=item.unitPrice,
                totalPrice=item.totalPrice,
            )
            for item in order_items
        ],
    )


@router.post("/{order_id}/pay", response_model=OrderOut, summary="تایید پرداخت و ثبت کمیسیون")
async def confirm_payment(
    order_id: int,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(require_roles(["CUSTOMER", "ADMIN"])),
):
    is_admin = current_user.role == "ADMIN"
    updated = await mark_order_paid(db, order_id=order_id, requested_by=current_user.id, is_admin=is_admin)
    items = await db.orderitem.find_many(where={"orderId": updated.id}, include={"product": True})
    return OrderOut(
        id=updated.id,
        totalAmount=updated.totalAmount,
        status=updated.status,
        paymentStatus=updated.paymentStatus,
        createdAt=_iso(updated.createdAt),
        items=[
            OrderItemOut(
                productId=item.productId,
                productName=item.product.name if item.product else "",
                quantity=item.quantity,
                unitPrice=item.unitPrice,
                totalPrice=item.totalPrice,
            )
            for item in items
        ],
    )


@router.get("/my", response_model=list[OrderOut], summary="سفارش‌های من")
async def my_orders(db: Prisma = Depends(get_db), current_user: User = Depends(require_roles(["CUSTOMER", "SELLER", "ADMIN"]))):
    orders = await list_orders_for_customer(db, customer_id=current_user.id)
    response: list[OrderOut] = []
    for order in orders:
        response.append(
            OrderOut(
                id=order.id,
                totalAmount=order.totalAmount,
                status=order.status,
                paymentStatus=order.paymentStatus,
                createdAt=_iso(order.createdAt),
                items=[
                    OrderItemOut(
                        productId=item.productId,
                        productName=item.product.name if item.product else "",
                        quantity=item.quantity,
                        unitPrice=item.unitPrice,
                        totalPrice=item.totalPrice,
                    )
                    for item in (order.items or [])
                ],
            )
        )
    return response


@router.get("/my/commissions", response_model=list[CommissionOut], summary="کمیسیون‌های من")
async def my_commissions(db: Prisma = Depends(get_db), current_user: User = Depends(require_roles(["CUSTOMER", "SELLER", "ADMIN"]))):
    commissions = await list_commissions_for_user(db, user_id=current_user.id)
    return [
        CommissionOut(
            id=c.id,
            orderId=c.orderId,
            fromUserId=c.fromUserId,
            toUserId=c.toUserId,
            level=c.level,
            amount=c.amount,
            status=c.status,
        )
        for c in commissions
    ]
