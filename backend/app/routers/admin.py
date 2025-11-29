from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from prisma import Prisma

from ..core.deps import get_db, require_roles
from ..schemas.category import CategoryCreate, CategoryOut
from ..schemas.commission import CommissionOut
from ..schemas.order import AdminOrderOut, OrderItemOut
from ..schemas.user import UserOut, UserRoleUpdate


def _iso(dt):
    return dt.isoformat() if dt else ""

router = APIRouter()


@router.get("/users", response_model=list[UserOut], summary="لیست کاربران")
async def list_users(db: Prisma = Depends(get_db), admin=Depends(require_roles(["ADMIN"]))):
    users = await db.user.find_many(order={"createdAt": "desc"})
    return [
        UserOut(
            id=u.id,
            name=u.name,
            email=u.email,
            phone=u.phone,
            role=u.role,
            referralCode=u.referralCode,
            referredById=u.referredById,
        )
        for u in users
    ]


@router.put("/users/{user_id}/role", response_model=UserOut, summary="تغییر نقش کاربر")
async def change_user_role(user_id: int, payload: UserRoleUpdate, db: Prisma = Depends(get_db), admin=Depends(require_roles(["ADMIN"]))):
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="کاربر یافت نشد")
    updated = await db.user.update(where={"id": user_id}, data={"role": payload.role})
    return UserOut(
        id=updated.id,
        name=updated.name,
        email=updated.email,
        phone=updated.phone,
        role=updated.role,
        referralCode=updated.referralCode,
        referredById=updated.referredById,
    )


@router.post("/categories", response_model=CategoryOut, summary="ایجاد دسته‌بندی")
async def create_category(payload: CategoryCreate, db: Prisma = Depends(get_db), admin=Depends(require_roles(["ADMIN"]))):
    category = await db.category.create(data={"name": payload.name, "slug": payload.slug})
    return CategoryOut(id=category.id, name=category.name, slug=category.slug)


@router.get("/orders", response_model=list[AdminOrderOut], summary="لیست سفارش‌ها")
async def list_orders(db: Prisma = Depends(get_db), admin=Depends(require_roles(["ADMIN"]))):
    orders = await db.order.find_many(include={"items": {"include": {"product": True}}}, order={"createdAt": "desc"})
    response: list[AdminOrderOut] = []
    for order in orders:
        response.append(
            AdminOrderOut(
                id=order.id,
                customerId=order.customerId,
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


@router.get("/commissions", response_model=list[CommissionOut], summary="گزارش کمیسیون‌ها")
async def list_commissions(db: Prisma = Depends(get_db), admin=Depends(require_roles(["ADMIN"]))):
    commissions = await db.commission.find_many(order={"createdAt": "desc"})
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


@router.get("/stats", summary="آمار مدیریتی")
async def admin_stats(db: Prisma = Depends(get_db), admin=Depends(require_roles(["ADMIN"]))):
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    users_count = await db.user.count()
    orders_today = await db.order.count(where={"createdAt": {"gte": today}})
    paid_commissions = await db.commission.find_many(where={"status": "PAID"})
    paid_total = sum(c.amount for c in paid_commissions)
    return {"users": users_count, "ordersToday": orders_today, "paidCommission": round(paid_total, 2)}
