from fastapi import APIRouter, Depends

from prisma import Prisma

from ..core.deps import get_db
from ..schemas.category import CategoryOut
from ..schemas.product import ProductOut
from ..services.product_service import get_product_detail, list_active_products, list_categories

router = APIRouter()


@router.get("/", response_model=list[ProductOut], summary="لیست محصولات فعال")
async def list_products(db: Prisma = Depends(get_db)):
    products = await list_active_products(db)
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


@router.get("/categories", response_model=list[CategoryOut], summary="دسته‌بندی‌ها")
async def categories(db: Prisma = Depends(get_db)):
    categories = await list_categories(db)
    return [CategoryOut(id=c.id, name=c.name, slug=c.slug) for c in categories]


@router.get("/{product_id}", response_model=ProductOut, summary="جزئیات محصول")
async def product_detail(product_id: int, db: Prisma = Depends(get_db)):
    product = await get_product_detail(db, product_id=product_id)
    return ProductOut(
        id=product.id,
        sellerId=product.sellerId,
        name=product.name,
        description=product.description,
        basePrice=product.basePrice,
        discountPrice=product.discountPrice,
        categoryId=product.categoryId,
        categoryName=product.category.name if product.category else None,
        brand=product.brand,
        colors=product.colors or [],
        sizes=product.sizes or [],
        images=product.images or [],
        isActive=product.isActive,
    )
