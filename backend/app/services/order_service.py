from datetime import datetime
from typing import Dict, List

from fastapi import HTTPException, status
from prisma import Prisma

from ..schemas.order import OrderItemCreate
from .referral_service import create_commissions


async def create_order(prisma: Prisma, customer_id: int, items: list[OrderItemCreate]):
    if not items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="سبد خرید خالی است")

    product_ids = [item.productId for item in items]
    products = await prisma.product.find_many(where={"id": {"in": product_ids}, "isActive": True})
    products_map = {p.id: p for p in products}
    if len(products_map) != len(product_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="برخی محصولات یافت نشدند یا غیرفعال هستند")

    total_amount = 0.0
    order_items_data: List[Dict] = []
    for item in items:
        product = products_map[item.productId]
        unit_price = product.discountPrice if product.discountPrice is not None else product.basePrice
        total_price = unit_price * item.quantity
        total_amount += total_price
        order_items_data.append(
            {
                "productId": product.id,
                "quantity": item.quantity,
                "unitPrice": unit_price,
                "totalPrice": total_price,
            }
        )

    order = await prisma.order.create(
        data={
            "customerId": customer_id,
            "totalAmount": total_amount,
            "status": "PENDING",
            "paymentStatus": "UNPAID",
        }
    )

    created_items = []
    for item in order_items_data:
        created = await prisma.orderitem.create(data={"orderId": order.id, **item}, include={"product": True})
        created_items.append(created)

    return order, created_items


async def mark_order_paid(prisma: Prisma, order_id: int, requested_by: int, is_admin: bool = False):
    order = await prisma.order.find_unique(where={"id": order_id})
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="سفارش یافت نشد")
    if not is_admin and order.customerId != requested_by:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="شما مالک این سفارش نیستید")

    if order.paymentStatus == "PAID":
        return order

    updated = await prisma.order.update(
        where={"id": order_id},
        data={"paymentStatus": "PAID", "status": "PAID"},
    )

    await create_commissions(prisma, buyer_id=order.customerId, order_id=order.id, amount=order.totalAmount)
    return updated


async def list_orders_for_customer(prisma: Prisma, customer_id: int):
    return await prisma.order.find_many(
        where={"customerId": customer_id},
        include={"items": {"include": {"product": True}}},
        order={"createdAt": "desc"},
    )


async def list_commissions_for_user(prisma: Prisma, user_id: int):
    return await prisma.commission.find_many(where={"toUserId": user_id}, order={"createdAt": "desc"})


async def list_orders_for_seller(prisma: Prisma, seller_id: int):
    items = await prisma.orderitem.find_many(
        where={"product": {"sellerId": seller_id}},
        include={"order": True, "product": True},
    )
    orders_map: Dict[int, Dict] = {}
    for item in items:
        if not item.order or not item.product:
            continue
        bucket = orders_map.setdefault(
            item.orderId,
            {
                "order": item.order,
                "items": [],
                "total_for_seller": 0.0,
            },
        )
        bucket["items"].append(item)
        bucket["total_for_seller"] += item.totalPrice
    return orders_map


async def seller_stats(prisma: Prisma, seller_id: int):
    grouped = await list_orders_for_seller(prisma, seller_id)
    revenue = sum(bucket["total_for_seller"] for bucket in grouped.values())
    total_orders = len(grouped)
    now = datetime.utcnow()
    monthly_orders = 0
    for bucket in grouped.values():
        created = bucket["order"].createdAt
        if created and created.month == now.month and created.year == now.year:
            monthly_orders += 1
    return {
        "revenue": round(revenue, 2),
        "monthlyOrders": monthly_orders,
        "totalOrders": total_orders,
    }
