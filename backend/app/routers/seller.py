from fastapi import APIRouter, Depends

from prisma import Prisma
from prisma.models import User

from ..core.deps import get_db, require_roles
from ..schemas.commission import CommissionOut
from ..schemas.order import SellerOrderOut, SellerStats
from ..schemas.product import ProductCreate, ProductOut, ProductUpdate
from ..services.order_service import list_orders_for_seller, seller_stats
from ..services.product_service import create_product, delete_product, update_product

router = APIRouter()


def _iso(dt):
    return dt.isoformat() if dt else ""


@router.get("/products", response_model=list[ProductOut], summary="محصولات من")
async def list_seller_products(
    db: Prisma = Depends(get_db),
    current_user: User = Depends(require_roles(["SELLER"])),
):
    products = await db.product.find_many(where={"sellerId": current_user.id}, include={"category": True}, order={"createdAt": "desc"})
    return [
        ProductOut(
            id=p.id,
            sellerId=p.sellerId,
            name=p.name,
            description=p.description,
            basePrice=p.basePrice,
            discountPrice=p.discountPrice,
            categoryId=p.categoryId,
            categoryName=p.category.name if p.category else None,
            brand=p.brand,
            colors=p.colors or [],
            sizes=p.sizes or [],
            images=p.images or [],
            isActive=p.isActive,
        )
        for p in products
    ]


@router.post("/products", response_model=ProductOut, summary="ایجاد محصول توسط فروشنده")
async def create_seller_product(
    payload: ProductCreate,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(require_roles(["SELLER"])),
):
    product = await create_product(db, seller_id=current_user.id, data=payload)
    return ProductOut(**product.dict())


@router.put("/products/{product_id}", response_model=ProductOut, summary="به‌روزرسانی محصول")
async def update_seller_product(
    product_id: int,
    payload: ProductUpdate,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(require_roles(["SELLER"])),
):
    product = await update_product(db, product_id=product_id, seller_id=current_user.id, data=payload)
    return ProductOut(**product.dict())


@router.delete("/products/{product_id}", summary="حذف محصول")
async def delete_seller_product(
    product_id: int,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(require_roles(["SELLER"])),
):
    await delete_product(db, product_id=product_id, seller_id=current_user.id)
    return {"ok": True}


@router.get("/orders", response_model=list[SellerOrderOut], summary="سفارش‌های محصولات من")
async def seller_orders(db: Prisma = Depends(get_db), current_user: User = Depends(require_roles(["SELLER"]))):
    grouped = await list_orders_for_seller(db, seller_id=current_user.id)
    response: list[SellerOrderOut] = []
    for order_id, payload in grouped.items():
        order = payload["order"]
        items = payload["items"]
        response.append(
            SellerOrderOut(
                id=order_id,
                customerId=order.customerId,
                totalAmount=order.totalAmount,
                status=order.status,
                paymentStatus=order.paymentStatus,
                createdAt=_iso(order.createdAt),
                items=[
                    {
                        "productId": item.productId,
                        "productName": item.product.name if item.product else "",
                        "quantity": item.quantity,
                        "totalPrice": item.totalPrice,
                    }
                    for item in items
                ],
            )
        )
    return sorted(response, key=lambda o: o.createdAt, reverse=True)


@router.get("/stats", response_model=SellerStats, summary="آمار فروشنده")
async def seller_dashboard_stats(db: Prisma = Depends(get_db), current_user: User = Depends(require_roles(["SELLER"]))):
    stats = await seller_stats(db, seller_id=current_user.id)
    return SellerStats(**stats)


@router.get("/commissions", response_model=list[CommissionOut], summary="کمیسیون‌های دریافتی فروشنده")
async def list_commissions(
    db: Prisma = Depends(get_db),
    current_user: User = Depends(require_roles(["SELLER"])),
):
    commissions = await db.commission.find_many(where={"toUserId": current_user.id}, order={"createdAt": "desc"})
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
