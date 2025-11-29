type Props = {
  open: boolean;
  onClose: () => void;
  product?: {
    name: string;
    price: number;
    oldPrice?: number | null;
    image?: string;
    description?: string;
  };
};

export function QuickViewModal({ open, onClose, product }: Props) {
  if (!open || !product) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-brand-900">{product.name}</h3>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-brand-700">
            بستن
          </button>
        </div>
        <div className="mt-3 h-48 w-full overflow-hidden rounded-xl bg-brand-50" style={product.image ? { backgroundImage: `url(${product.image})`, backgroundSize: "cover", backgroundPosition: "center" } : {}} />
        <p className="mt-3 text-sm text-gray-700 line-clamp-3">{product.description || "توضیحات محصول"}</p>
        <div className="mt-3 flex items-center gap-2 text-brand-900">
          {product.oldPrice ? <span className="text-xs text-gray-500 line-through">{product.oldPrice.toLocaleString()} تومان</span> : null}
          <span className="text-lg font-bold">{product.price.toLocaleString()} تومان</span>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
