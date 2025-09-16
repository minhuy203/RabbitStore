import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import ProductGrid from "./ProductGrid";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductsDetails,
  fetchSimilarProducts,
} from "../../redux/slices/productSlice";
import { addToCart, fetchCart } from "../../redux/slices/cartSlice";

const ProductDetails = ({ productId }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProduct, loading, error, similarProducts } = useSelector(
    (state) => state.products
  );
  const { user, guestId } = useSelector((state) => state.auth);
  const [mainImage, setMainImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const colorMap = {
    Trắng: "#FFFFFF",
    Đen: "#000000",
    "Xanh Dương": "#0000FF",
    Xám: "#808080",
    "Xanh Đậm": "#003087",
    "Xanh Nhạt": "#ADD8E6",
    "Xanh Lá": "#008000",
    "Xanh Ô Liu": "#808000",
    Đỏ: "#FF0000",
    "Xám Nhạt": "#D3D3D3",
    "Xám Đậm": "#A9A9A9",
    "Xanh Lục": "#008000",
    "Hồng Phấn": "#FFB6C1",
    Be: "#F5F5DC",
    Nâu: "#A52A2A",
    "Nâu Nhạt": "#DEB887",
    Kaki: "#C3B091",
  };

  const productFetchId = productId || id;

  useEffect(() => {
    if (productFetchId) {
      dispatch(fetchProductsDetails(productFetchId));
      dispatch(fetchSimilarProducts({ id: productFetchId }));
    }
  }, [dispatch, productFetchId]);

  useEffect(() => {
    if (selectedProduct?.images?.length > 0) {
      setMainImage(selectedProduct.images[0].url);
    }
  }, [selectedProduct]);

  const handleQuantityChange = (action) => {
    if (action === "plus" && quantity < selectedProduct.countInStock) {
      setQuantity((prev) => prev + 1);
    }
    if (action === "minus" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast.error("Vui lòng chọn kích cỡ và màu trước khi thêm vào giỏ hàng!", {
        duration: 1000,
      });
      return;
    }
    setIsButtonDisabled(true);

    dispatch(
      addToCart({
        productId: productFetchId,
        quantity,
        size: selectedSize,
        color: selectedColor,
        guestId,
        userId: user?._id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        discountPrice: selectedProduct.discountPrice || null,
        image: mainImage,
      })
    )
      .then(() => {
        toast.success("Sản phẩm đã được thêm vào giỏ!", { duration: 1000 });
        dispatch(fetchCart({ userId: user?._id, guestId }));
      })
      .catch((error) => {
        toast.error("Lỗi khi thêm vào giỏ hàng: " + error.message, {
          duration: 1000,
        });
      })
      .finally(() => {
        setIsButtonDisabled(false);
      });
  };

  const handleBuyNow = () => {
    if (!selectedSize || !selectedColor) {
      toast.error("Vui lòng chọn kích cỡ và màu trước khi thanh toán!", {
        duration: 1000,
      });
      return;
    }

    dispatch(
      addToCart({
        productId: productFetchId,
        quantity,
        size: selectedSize,
        color: selectedColor,
        guestId,
        userId: user?._id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        discountPrice: selectedProduct.discountPrice || null,
        image: mainImage,
      })
    )
      .then(() => {
        dispatch(fetchCart({ userId: user?._id, guestId }));
        if (!user) {
          navigate("/login?redirect=checkout");
        } else {
          navigate("/checkout");
        }
      })
      .catch((error) => {
        toast.error("Lỗi khi thêm vào giỏ hàng: " + error.message, {
          duration: 1000,
        });
      });
  };

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <div className="p-6">
      {selectedProduct && (
        <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg">
          <div className="flex flex-col md:flex-row">
            {/* thumbnails */}
            <div className="hidden md:flex flex-col space-y-4 mr-6">
              {selectedProduct.images.map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={image.altText || `Thumbnail ${index}`}
                  className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${
                    mainImage === image.url ? "border-black" : "border-gray-300"
                  }`}
                  onClick={() => setMainImage(image.url)}
                />
              ))}
            </div>
            {/* main image */}
            <div className="md:w-1/2">
              <img
                src={mainImage}
                alt="Main Product"
                className="w-full h-auto object-cover rounded-lg mb-4"
              />
            </div>
            {/* right side */}
            <div className="md:w-1/2 md:ml-10">
              <h1 className="text-2xl md:text-3xl font-semibold mb-2">
                {selectedProduct.name}
              </h1>
              <p className="text-lg text-gray-600 mb-1 line-through">
                {selectedProduct.discountPrice &&
                  `${selectedProduct.price.toLocaleString("vi-VN")} VND`}
              </p>
              <p className="text-xl text-red-500 font-semibold mb-2">
                {selectedProduct.discountPrice
                  ? `${selectedProduct.discountPrice.toLocaleString(
                      "vi-VN"
                    )} VND`
                  : `${selectedProduct.price.toLocaleString("vi-VN")} VND`}
              </p>
              <p className="text-gray-600 mb-4">
                {selectedProduct.description}
              </p>

              {/* chọn màu */}
              <div className="mb-4">
                <p className="text-gray-700">Màu:</p>
                <div className="flex gap-2 mt-2">
                  {selectedProduct.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        selectedProduct.countInStock > 0 &&
                        setSelectedColor(color)
                      }
                      disabled={selectedProduct.countInStock === 0}
                      className={`w-8 h-8 rounded-full border ${
                        selectedColor === color
                          ? "border-4 border-black"
                          : "border-gray-300"
                      } ${
                        selectedProduct.countInStock === 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      style={{
                        backgroundColor: colorMap[color] || "#CCCCCC",
                      }}
                      title={color}
                    ></button>
                  ))}
                </div>
              </div>

              {/* chọn size */}
              <div className="mb-4">
                <p className="text-gray-700">Kích cỡ:</p>
                <div className="flex gap-2 mt-2">
                  {selectedProduct.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        selectedProduct.countInStock > 0 &&
                        setSelectedSize(size)
                      }
                      disabled={selectedProduct.countInStock === 0}
                      className={`px-4 py-2 rounded border ${
                        selectedSize === size ? "bg-black text-white" : ""
                      } ${
                        selectedProduct.countInStock === 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* số lượng */}
              <div className="mb-6">
                <p className="text-gray-700">Số lượng:</p>
                <div className="flex items-center space-x-4 mt-2">
                  <button
                    onClick={() => handleQuantityChange("minus")}
                    disabled={selectedProduct.countInStock === 0}
                    className={`px-2 py-1 bg-gray-200 rounded text-lg ${
                      selectedProduct.countInStock === 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    -
                  </button>
                  <span className="text-lg">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange("plus")}
                    disabled={selectedProduct.countInStock === 0}
                    className={`px-2 py-1 bg-gray-200 rounded text-lg ${
                      selectedProduct.countInStock === 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    +
                  </button>
                  <span className="text-gray-600 text-sm ml-4">
                    Còn {selectedProduct.countInStock} sản phẩm trong kho
                  </span>
                </div>
              </div>

              {/* nút thêm vào giỏ */}
              <button
                onClick={handleAddToCart}
                disabled={
                  isButtonDisabled || selectedProduct.countInStock === 0
                }
                className={`bg-black text-white py-2 px-6 rounded w-full mb-4 ${
                  isButtonDisabled || selectedProduct.countInStock === 0
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-gray-900"
                }`}
              >
                {selectedProduct.countInStock === 0
                  ? "HẾT HÀNG"
                  : isButtonDisabled
                  ? "Đang thêm vào giỏ..."
                  : "THÊM VÀO GIỎ HÀNG"}
              </button>

              {/* nút thanh toán ngay */}
              <button
                onClick={handleBuyNow}
                disabled={selectedProduct.countInStock === 0}
                className={`bg-green-600 text-white py-2 px-6 rounded w-full mb-6 ${
                  selectedProduct.countInStock === 0
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-green-700"
                }`}
              >
                THANH TOÁN NGAY
              </button>

              {/* đặc điểm */}
              <div className="mt-10 text-gray-700">
                <h3 className="text-xl font-bold mb-4">Đặc điểm</h3>
                <table className="w-full text-left text-sm text-gray-600">
                  <tbody>
                    <tr>
                      <td className="py-1">Hãng</td>
                      <td className="py-1">{selectedProduct.brand}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Chất liệu</td>
                      <td className="py-1">{selectedProduct.material}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* sản phẩm tương tự */}
          <div className="mt-20">
            <h2 className="text-2xl text-center font-medium mb-4">
              Có Thể Bạn Sẽ Thích
            </h2>
            <ProductGrid
              products={similarProducts}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
