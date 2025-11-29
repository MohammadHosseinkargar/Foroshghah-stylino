import { notFound } from "next/navigation";
import ProductDetailsClient from "./ProductDetailsClient";
import { API_BASE } from "../../../lib/api";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const res = await fetch(`${API_BASE}/products/${params.id}`, { cache: "no-store" });
  if (!res.ok) {
    notFound();
  }
  const product = await res.json();
  return <ProductDetailsClient product={product} />;
}
