import os
from prisma import Prisma

# جلوگیری از استفاده از پروکسی سیستم برای اتصال به کوئری انجین محلی
os.environ.setdefault("NO_PROXY", "localhost,127.0.0.1")
os.environ.setdefault("no_proxy", "localhost,127.0.0.1")

prisma = Prisma(http={"trust_env": False})
