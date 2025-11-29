from fastapi import HTTPException, status
from prisma import Prisma

from ..schemas.product import ProductCreate, ProductUpdate


async def create_product(prisma: Prisma, seller_id: int, data: ProductCreate):
    return await prisma.product.create(
        data={
            "sellerId": seller_id,
            "name": data.name,
            "description": data.description,
            "basePrice": data.basePrice,
            "discountPrice": data.discountPrice,
            "categoryId": data.categoryId,
            "brand": data.brand,
            "colors": data.colors,
            "sizes": data.sizes,
            "images": data.images,
            "isActive": data.isActive,
        }
    )


async def update_product(prisma: Prisma, product_id: int, seller_id: int, data: ProductUpdate):
    product = await prisma.product.find_unique(where={"id": product_id})
    if not product or product.sellerId != seller_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="محصول یافت نشد")

    updated = await prisma.product.update(
        where={"id": product_id},
        data=data.dict(exclude_unset=True),
    )
    return updated


async def delete_product(prisma: Prisma, product_id: int, seller_id: int):
    product = await prisma.product.find_unique(where={"id": product_id})
    if not product or product.sellerId != seller_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="محصول یافت نشد")
    await prisma.product.delete(where={"id": product_id})
    return True


async def list_active_products(prisma: Prisma):
    return await prisma.product.find_many(where={"isActive": True}, include={"category": True})


async def get_product_detail(prisma: Prisma, product_id: int):
    product = await prisma.product.find_unique(where={"id": product_id}, include={"category": True, "seller": True})
    if not product or not product.isActive:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="محصول یافت نشد")
    return product


async def list_categories(prisma: Prisma):
    return await prisma.category.find_many(order={"name": "asc"})
