import asyncio

import prisma.fields as fields

from app.core.security import get_password_hash
from app.db import prisma
from app.services.auth_service import generate_unique_referral
from app.services.order_service import create_order, mark_order_paid
from app.schemas.order import OrderItemCreate


async def ensure_user(name: str, email: str, role: str, phone: str | None = None, referred_by_id: int | None = None):
    existing = await prisma.user.find_unique(where={"email": email})
    if existing:
        return existing
    referral_code = await generate_unique_referral(prisma)
    password_hash = get_password_hash("Stylino123!")
    return await prisma.user.create(
        data={
            "name": name,
            "email": email,
            "phone": phone,
            "passwordHash": password_hash,
            "role": role,
            "referralCode": referral_code,
            "referredById": referred_by_id,
        }
    )


async def ensure_category(name: str, slug: str):
    existing = await prisma.category.find_unique(where={"slug": slug})
    if existing:
        return existing
    return await prisma.category.create(data={"name": name, "slug": slug})


async def ensure_product(
    seller_id: int,
    name: str,
    description: str,
    base_price: float,
    discount_price: float | None,
    category_id: int,
    brand: str,
    colors: list[str],
    sizes: list[str],
    images: list[str],
):
    existing = await prisma.product.find_first(where={"name": name, "sellerId": seller_id})
    if existing:
        return existing
    return await prisma.product.create(
        data={
            "sellerId": seller_id,
            "name": name,
            "description": description,
            "basePrice": base_price,
            "discountPrice": discount_price,
            "categoryId": category_id,
            "brand": brand,
            "colors": fields.Json(colors),
            "sizes": fields.Json(sizes),
            "images": fields.Json(images),
            "isActive": True,
        }
    )


async def seed():
    await prisma.connect()

    # کاربران اصلی
    admin = await ensure_user("ادمین استایلینو", "admin@stylino.ir", "ADMIN", phone="09120000000")
    seller1 = await ensure_user("فروشنده اول", "seller1@stylino.ir", "SELLER", phone="09121111111")
    seller2 = await ensure_user("فروشنده دوم", "seller2@stylino.ir", "SELLER", phone="09122222222")

    customer1 = await ensure_user("مریم رضایی", "customer1@stylino.ir", "CUSTOMER", phone="09123333333", referred_by_id=seller1.id)
    customer2 = await ensure_user("هستی فلاح", "customer2@stylino.ir", "CUSTOMER", phone="09124444444", referred_by_id=customer1.id)
    customer3 = await ensure_user("نگار محمدی", "customer3@stylino.ir", "CUSTOMER", phone="09125555555")

    # دسته‌بندی‌ها
    dress = await ensure_category("پیراهن", "dress")
    manteau = await ensure_category("مانتو", "manteau")
    set_cat = await ensure_category("ست و کو-ورد", "set")

    # محصولات
    p1 = await ensure_product(
        seller_id=seller1.id,
        name="پیراهن حریر گلدار",
        description="پیراهن حریر سبک با طرح گل‌های پاستلی، مناسب مهمانی و روزمره.",
        base_price=1890000,
        discount_price=1690000,
        category_id=dress.id,
        brand="Stylino",
        colors=["صورتی", "یاسی"],
        sizes=["S", "M", "L"],
        images=["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"],
    )
    p2 = await ensure_product(
        seller_id=seller1.id,
        name="ست لینن تابستانه",
        description="ست شلوار و شومیز لینن خنک با تنخور آزاد و پارچه تنفس‌پذیر.",
        base_price=2250000,
        discount_price=None,
        category_id=set_cat.id,
        brand="Minimal Chic",
        colors=["سبز پاستلی", "کرم"],
        sizes=["S", "M", "L", "XL"],
        images=["https://images.unsplash.com/photo-1542293772-8a684fdde88b?auto=format&fit=crop&w=800&q=80"],
    )
    p3 = await ensure_product(
        seller_id=seller2.id,
        name="مانتو لنین تابستانی",
        description="مانتو لنین سبک با دوخت مینیمال و یقه مردانه.",
        base_price=1990000,
        discount_price=1850000,
        category_id=manteau.id,
        brand="Urban Line",
        colors=["نخودی", "آبی آسمانی"],
        sizes=["S", "M", "L"],
        images=["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"],
    )

    # سفارش‌های نمونه (فقط اگر قبلا سفارش وجود ندارد)
    orders_count = await prisma.order.count()
    if orders_count == 0:
        order1, _ = await create_order(
            prisma,
            customer_id=customer1.id,
            items=[
                OrderItemCreate(productId=p1.id, quantity=1),
                OrderItemCreate(productId=p2.id, quantity=2),
            ],
        )
        await mark_order_paid(prisma, order1.id, requested_by=admin.id, is_admin=True)

        order2, _ = await create_order(
            prisma,
            customer_id=customer2.id,
            items=[OrderItemCreate(productId=p3.id, quantity=1)],
        )
        await mark_order_paid(prisma, order2.id, requested_by=admin.id, is_admin=True)

    await prisma.disconnect()
    print("Seed data created.")


if __name__ == "__main__":
    asyncio.run(seed())
