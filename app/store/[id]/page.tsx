"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Share2, Heart } from "lucide-react";
import StoreNavbar from "@/components/StoreNavbar";

interface SizeOption {
  id: string;
  size: string;
  available: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  regular_price: string | number;
  product_images?: { id: string; image: string }[];
}

const ProductPageSkeleton = () => (
  <div className="min-h-screen bg-[#FAF6F5]">
    <StoreNavbar />
    {/* Mobile Header Skeleton */}
    <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
    <div className="lg:mt-32">
      <div className="max-w-7xl mx-auto lg:py-8 px-2 lg:px-4">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          <div className="relative h-[60vh] bg-gray-200 animate-pulse mb-4"></div>
          <div className="px-4 space-y-6 pb-24">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
              <div className="grid grid-cols-2 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <div className="w-14 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 h-12 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        {/* Desktop Layout Skeleton */}
        <div className="hidden lg:grid grid-cols-12 gap-8">
          <div className="col-span-1">
            <div className="sticky top-36 flex flex-col gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-full aspect-square bg-gray-200 rounded-sm animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="col-span-6">
            <div className="sticky top-36">
              <div className="relative w-full aspect-[3/4] rounded overflow-hidden border border-gray-300 max-w-md mx-auto bg-gray-200 animate-pulse"></div>
            </div>
          </div>
          <div className="col-span-5 space-y-6">
            <div>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-1 w-full"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
              <div className="grid grid-cols-2 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="w-full h-14 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-full h-14 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function ProductPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // Mock data for demonstration
  const mockProducts: { [key: string]: Product } = {
    "1": {
      id: "1",
      name: "Premium T-Shirt",
      description:
        "High-quality cotton blend t-shirt with premium materials and comfortable fit. Perfect for everyday wear and special occasions.",
      regular_price: 29.99,
      product_images: [
        { id: "1", image: "/shirt.png" },
        { id: "2", image: "/shirt.png" },
        { id: "3", image: "/shirt.png" },
      ],
    },
    "2": {
      id: "2",
      name: "Coffee Mug",
      description:
        "Ceramic mug perfect for your morning coffee with comfortable handle and heat-resistant design.",
      regular_price: 14.99,
      product_images: [
        { id: "1", image: "/shirt.png" },
        { id: "2", image: "/shirt.png" },
      ],
    },
    "3": {
      id: "3",
      name: "Hoodie",
      description:
        "Cozy fleece hoodie for cool weather with kangaroo pocket and adjustable drawstring hood.",
      regular_price: 49.99,
      product_images: [
        { id: "1", image: "/shirt.png" },
        { id: "2", image: "/shirt.png" },
        { id: "3", image: "/shirt.png" },
      ],
    },
    "4": {
      id: "4",
      name: "Laptop Sticker Pack",
      description:
        "Set of 10 vinyl stickers for laptops and devices. Weather-resistant and easy to apply.",
      regular_price: 9.99,
      product_images: [{ id: "1", image: "/shirt.png" }],
    },
    "5": {
      id: "5",
      name: "Baseball Cap",
      description:
        "Adjustable baseball cap with embroidered logo. Classic 6-panel design with curved visor.",
      regular_price: 24.99,
      product_images: [
        { id: "1", image: "/shirt.png" },
        { id: "2", image: "/shirt.png" },
      ],
    },
    "6": {
      id: "6",
      name: "Water Bottle",
      description:
        "Insulated stainless steel water bottle. Keeps drinks cold for 24 hours or hot for 12 hours.",
      regular_price: 19.99,
      product_images: [
        { id: "1", image: "/shirt.png" },
        { id: "2", image: "/shirt.png" },
      ],
    },
  };

  const mockSizes: SizeOption[] = [
    { id: "1", size: "XS", available: true },
    { id: "2", size: "S", available: true },
    { id: "3", size: "M", available: false },
    { id: "4", size: "L", available: true },
    { id: "5", size: "XL", available: true },
    { id: "6", size: "XXL", available: true },
  ];

  // State management
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [mainImageLoading, setMainImageLoading] = useState(true);
  const [sizes] = useState<SizeOption[]>(mockSizes);

  const defaultImage = "/shirt.png";

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const foundProduct = mockProducts[id];
      if (foundProduct) {
        setProduct(foundProduct);
      }
      setLoading(false);
    }, 1000);
  }, [id, mockProducts]);

  // Event handlers
  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    console.log("Share product");
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size");
      return;
    }
    console.log("Add to cart:", {
      productId: product?.id,
      size: selectedSize,
      variantId: selectedVariantId,
    });
    alert("Added to cart!");
  };

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    console.log("Toggle favorite:", !isFavorited);
  };

  if (loading) return <ProductPageSkeleton />;
  if (!product)
    return (
      <div className="min-h-screen bg-[#FAF6F5]">
        <StoreNavbar />
        <p className="text-center mt-32">Product not found.</p>
      </div>
    );

  const price =
    typeof product.regular_price === "string"
      ? parseFloat(product.regular_price)
      : product.regular_price;
  const images =
    product.product_images && product.product_images.length > 0
      ? product.product_images.map((img) => img.image)
      : [defaultImage];

  return (
    <div className="min-h-screen bg-[#FAF6F5]">
      <StoreNavbar />

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-medium text-gray-900 truncate max-w-[200px]">
            {product.name}
          </h1>
          <button
            onClick={handleShare}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="lg:mt-32">
        <div className="max-w-7xl mx-auto lg:py-8 px-2 lg:px-4">
          {/* Mobile Layout */}
          <div className="lg:hidden">
            {/* Mobile Image Carousel */}
            <div className="relative">
              <div className="relative h-[60vh] bg-gray-100 overflow-hidden">
                {mainImageLoading && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-3 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <img
                  src={images[selectedImage]}
                  alt={`Product image ${selectedImage + 1}`}
                  className="w-full h-full object-cover"
                  onLoad={() => setMainImageLoading(false)}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = defaultImage;
                    setMainImageLoading(false);
                  }}
                />
              </div>
              {/* Image Indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedImage(i);
                        setMainImageLoading(true);
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        selectedImage === i ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Thumbnails */}
            {images.length > 1 && (
              <div className="px-4 py-3">
                <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedImage(i);
                        setMainImageLoading(true);
                      }}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === i
                          ? "border-[#D4A299]"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={src}
                        alt={`Thumbnail ${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            defaultImage;
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Content */}
            <div className="px-4 space-y-6 pb-24">
              {/* Product Info */}
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {product.name}
                </h1>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {product.description}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${price.toFixed(2)}
                </p>
              </div>

              {/* Size Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Select Size
                  </h3>
                  {selectedSize && (
                    <span className="text-sm text-gray-600">
                      Selected: {selectedSize}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {sizes.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedSize(opt.size);
                        setSelectedVariantId(opt.id);
                      }}
                      disabled={!opt.available}
                      className={`p-3 border-2 rounded-xl text-sm font-medium transition-all ${
                        opt.available
                          ? selectedVariantId === opt.id
                            ? "border-[#D4A299] bg-[#D4A299] text-white shadow-lg"
                            : "border-gray-200 bg-white hover:border-[#D4A299] text-gray-900"
                          : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {opt.size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900">Product Details</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Premium quality materials</p>
                  <p>• Comfortable fit</p>
                  <p>• Durable construction</p>
                  <p>• Easy care instructions</p>
                </div>
              </div>
            </div>

            {/* Mobile Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-30">
              <div className="flex gap-3">
                <button
                  onClick={handleToggleFavorite}
                  className="flex-shrink-0 w-14 h-12 border-2 border-gray-200 rounded-full flex items-center justify-center hover:border-[#D4A299] transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isFavorited
                        ? "text-red-500 fill-red-500"
                        : "text-gray-600"
                    }`}
                  />
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariantId}
                  className="flex-1 h-12 bg-[#D4A299] text-white rounded-full flex items-center justify-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#C4928A] transition-colors"
                >
                  Add to Bag
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:grid grid-cols-12 gap-8">
            {/* Desktop Thumbnails */}
            <div className="col-span-1">
              <div className="sticky top-36 flex flex-col gap-2">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedImage(i);
                      setMainImageLoading(true);
                    }}
                    className={`w-full aspect-square overflow-hidden rounded-sm relative ${
                      selectedImage === i ? "ring-2 ring-[#D4A299]" : ""
                    }`}
                  >
                    {imageLoading[i] && (
                      <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <img
                      src={src}
                      alt={`Thumbnail ${i + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onLoad={() =>
                        setImageLoading((prev) => ({ ...prev, [i]: false }))
                      }
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          defaultImage;
                        setImageLoading((prev) => ({ ...prev, [i]: false }));
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Main Image */}
            <div className="col-span-6">
              <div className="sticky top-36">
                <div className="relative w-full aspect-[3/4] rounded overflow-hidden border border-gray-300 max-w-md mx-auto">
                  {mainImageLoading && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
                      <div className="w-8 h-8 border-3 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <img
                    src={images[selectedImage]}
                    alt={`Product image ${selectedImage + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onLoad={() => setMainImageLoading(false)}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = defaultImage;
                      setMainImageLoading(false);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Details & Actions */}
            <div className="col-span-5 space-y-6">
              <div>
                <h1 className="text-2xl font-medium mb-1">{product.name}</h1>
                <p className="text-gray-600 mb-2">{product.description}</p>
                <p className="text-xl font-medium">${price.toFixed(2)}</p>
              </div>

              {/* Desktop Size selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Select Size</h3>
                <div className="grid grid-cols-2 gap-2">
                  {sizes.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedSize(opt.size);
                        setSelectedVariantId(opt.id);
                      }}
                      disabled={!opt.available}
                      className={`h-12 border rounded text-sm font-medium ${
                        opt.available
                          ? selectedVariantId === opt.id
                            ? "border-[#D4A299] bg-[#D4A299] text-white"
                            : "border-gray-300 bg-white hover:border-[#D4A299]"
                          : "border-gray-300 bg-gray-100 text-gray-400"
                      }`}
                    >
                      {opt.size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Actions */}
              <div className="space-y-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariantId}
                  className="w-full h-14 bg-[#D4A299] text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#C4928A] transition-colors"
                >
                  Add to Bag
                </button>
                <button
                  onClick={handleToggleFavorite}
                  className="w-full h-14 border rounded-full flex items-center justify-center gap-2 bg-white border-gray-400/50 hover:border-[#D4A299] transition-colors"
                >
                  {isFavorited ? "Remove Favorite" : "Favorite"}
                  <Heart
                    className={`w-5 h-5 ${
                      isFavorited
                        ? "text-red-500 fill-red-500"
                        : "text-gray-600"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
