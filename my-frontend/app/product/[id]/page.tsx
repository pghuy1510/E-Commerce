interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Chi tiết sản phẩm</h1>
      <p className="mt-2 text-sm text-gray-600">Mã sản phẩm: {params.id}</p>
    </main>
  );
}
