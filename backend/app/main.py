from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .db import prisma
from .routers import auth, products, orders, seller, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    await prisma.connect()
    yield
    await prisma.disconnect()


settings = get_settings()

app = FastAPI(
    title="استایلینو API",
    description="سرویس فروشگاه لباس زنانه استایلینو با منطق ارجاع دو سطحی",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(seller.router, prefix="/api/seller", tags=["seller"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
