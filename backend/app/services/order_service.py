from datetime import datetime
from typing import Dict, List, Optional

from fastapi import HTTPException, status
from prisma import Prisma

from ..schemas.order import OrderItemCreate
from .referral_service import create_commissions


async def create_order(
    prisma: Prisma,
    customer_id: Optional[int],
    items: list[OrderItemCreate],
    guest_email: Optional[str] = None,
    guest_phone: Optional[str] = None,
    guest_name: Optional[str] = None,
    shipping_address_id: Optional[int] = None,
    shipping_method_id: Optional[int] = None,
    coupon_code: Optional[str] = None,
):
    """
    Create an order with stock validation and inventory management.
    Supports both authenticated users and guest checkout.
    """
    if not items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="سبد خرید خالی است")

    # Validate guest checkout
    if not customer_id and not (guest_email and guest_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="برای ثبت سفارش باید وارد شوید یا اطلاعات مهمان را وارد کنید"
        )

    product_ids = [item.productId for item in items]
    products = await prisma.product.find_many(
        where={"id": {"in": product_ids}, "isActive": True},
        include={"variants": True} if hasattr(prisma.product, "variants") else None,
    )
    products_map = {p.id: p for p in products}
    if len(products_map) != len(product_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="برخی محصولات یافت نشدند یا غیرفعال هستند")

    # Validate stock and calculate prices
    total_amount = 0.0
    order_items_data: List[Dict] = []
    
    for item in items:
        product = products_map[item.productId]
        
        # Check if using variant or base product
        variant = None
        if hasattr(item, "variantId") and item.variantId:
            # Find variant if specified
            if hasattr(product, "variants") and product.variants:
                variant = next((v for v in product.variants if v.id == item.variantId), None)
                if not variant:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"واریانت محصول {product.name} یافت نشد"
                    )
                # Check variant stock
                if variant.stock < item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"موجودی محصول {product.name} (رنگ: {variant.color}, سایز: {variant.size}) کافی نیست"
                    )
                unit_price = variant.price
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="واریانت محصول یافت نشد"
                )
        else:
            # Use base product stock
            product_stock = getattr(product, "stock", 0)
            if product_stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"موجودی محصول {product.name} کافی نیست"
                )
            unit_price = product.discountPrice if product.discountPrice is not None else product.basePrice
        
        total_price = unit_price * item.quantity
        total_amount += total_price
        
        order_items_data.append({
            "productId": product.id,
            "variantId": variant.id if variant else None,
            "quantity": item.quantity,
            "unitPrice": unit_price,
            "totalPrice": total_price,
            "color": variant.color if variant else (getattr(item, "color", None)),
            "size": variant.size if variant else (getattr(item, "size", None)),
        })

    # Calculate shipping cost
    shipping_amount = 0.0
    if shipping_method_id:
        shipping_method = await prisma.shippingmethod.find_unique(where={"id": shipping_method_id})
        if shipping_method and shipping_method.isActive:
            shipping_amount = shipping_method.cost
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="روش ارسال نامعتبر است")

    # Apply coupon if provided
    discount_amount = 0.0
    if coupon_code:
        coupon = await prisma.coupon.find_first(
            where={
                "code": coupon_code,
                "isActive": True,
                "validFrom": {"lte": datetime.utcnow()},
                "validUntil": {"gte": datetime.utcnow()},
            }
        )
        if coupon:
            if coupon.usageLimit and coupon.usedCount >= coupon.usageLimit:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="کد تخفیف به پایان رسیده است")
            if coupon.minPurchase and total_amount < coupon.minPurchase:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"حداقل مبلغ خرید برای این کد تخفیف {coupon.minPurchase} تومان است"
                )
            
            if coupon.discountType == "PERCENTAGE":
                discount_amount = (total_amount * coupon.discountValue) / 100
                if coupon.maxDiscount:
                    discount_amount = min(discount_amount, coupon.maxDiscount)
            else:  # FIXED
                discount_amount = coupon.discountValue
            
            discount_amount = min(discount_amount, total_amount)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="کد تخفیف نامعتبر است")

    final_amount = total_amount + shipping_amount - discount_amount

    # Create order in transaction to ensure atomicity
    try:
        async with prisma.tx() as transaction:
            order = await transaction.order.create(
                data={
                    "customerId": customer_id,
                    "guestEmail": guest_email,
                    "guestPhone": guest_phone,
                    "guestName": guest_name,
                    "totalAmount": final_amount,
                    "shippingAmount": shipping_amount,
                    "discountAmount": discount_amount,
                    "status": "PENDING",
                    "paymentStatus": "UNPAID",
                    "shippingAddressId": shipping_address_id,
                    "shippingMethodId": shipping_method_id,
                    "couponCode": coupon_code,
                }
            )

            # Create order items and decrement stock atomically
            created_items = []
            for item_data in order_items_data:
                # Decrement stock
                if item_data.get("variantId"):
                    variant = await transaction.productvariant.find_unique(where={"id": item_data["variantId"]})
                    if variant and variant.stock >= item_data["quantity"]:
                        await transaction.productvariant.update(
                            where={"id": variant.id},
                            data={"stock": variant.stock - item_data["quantity"]}
                        )
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="موجودی محصول تغییر کرده است"
                        )
                else:
                    product = await transaction.product.find_unique(where={"id": item_data["productId"]})
                    if product:
                        product_stock = getattr(product, "stock", 0)
                        if product_stock >= item_data["quantity"]:
                            await transaction.product.update(
                                where={"id": product.id},
                                data={"stock": product_stock - item_data["quantity"]}
                            )
                        else:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail="موجودی محصول تغییر کرده است"
                            )

                # Create order item
                item_create_data = {
                    "orderId": order.id,
                    "productId": item_data["productId"],
                    "quantity": item_data["quantity"],
                    "unitPrice": item_data["unitPrice"],
                    "totalPrice": item_data["totalPrice"],
                }
                if item_data.get("variantId"):
                    item_create_data["variantId"] = item_data["variantId"]
                if item_data.get("color"):
                    item_create_data["color"] = item_data["color"]
                if item_data.get("size"):
                    item_create_data["size"] = item_data["size"]

                created = await transaction.orderitem.create(
                    data=item_create_data,
                    include={"product": True}
                )
                created_items.append(created)

            # Update coupon usage count if used
            if coupon_code and coupon:
                await transaction.coupon.update(
                    where={"id": coupon.id},
                    data={"usedCount": coupon.usedCount + 1}
                )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطا در ایجاد سفارش: {str(e)}"
        )

    return order, created_items


async def mark_order_paid(
    prisma: Prisma,
    order_id: int,
    requested_by: int,
    is_admin: bool = False,
 main
    payment_update: dict | None = None,
):
    order = await prisma.order.find_unique(where={"id": order_id})
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="سفارش یافت نشد")
    if not is_admin and order.customerId != requested_by:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="شما مالک این سفارش نیستید")

    transaction_id: Optional[str] = None,
    gateway: str = "MANUAL",
):
    """
    Mark order as paid with transaction support to prevent race conditions.
    Uses database transaction to ensure atomicity.
    """
    # Use transaction to prevent race conditions
    try:
        async with prisma.tx() as transaction:
            # Lock the order row by selecting it first
            order = await transaction.order.find_unique(where={"id": order_id})
            if not order:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="سفارش یافت نشد")
            
            if not is_admin and order.customerId != requested_by:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="شما مالک این سفارش نیستید")

            # Check if already paid (prevent double payment)
            if order.paymentStatus == "PAID":
                return order

 main
    data = {"paymentStatus": "PAID", "status": "PAID"}
    if payment_update:
        data.update(payment_update)
    updated = await prisma.order.update(
        where={"id": order_id},
        data=data,
    )

            # Update order status atomically
            updated = await transaction.order.update(
                where={"id": order_id},
                data={"paymentStatus": "PAID", "status": "PAID"},
            )

            # Create payment transaction record if transaction_id provided
            if transaction_id:
                await transaction.paymenttransaction.create(
                    data={
                        "orderId": order_id,
                        "transactionId": transaction_id,
                        "gateway": gateway,
                        "amount": order.totalAmount,
                        "status": "SUCCESS",
                    }
                )

            # Create commissions (only if customer exists)
            if order.customerId:
                await create_commissions(
                    transaction,
                    buyer_id=order.customerId,
                    order_id=order.id,
                    amount=order.totalAmount
                )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطا در پردازش پرداخت: {str(e)}"
        )

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
