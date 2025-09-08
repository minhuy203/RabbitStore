import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../../redux/slices/adminProductSlice";
import axios from "axios";

const CreateProductPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: 0,
    discountPrice: 0,
    countInStock: 0,
    sku: "",
    category: "",
    brand: "",
    sizes: [],
    colors: [],
    collections: "",
    material: "",
    gender: "",
    images: [],
  });

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const imageUrl = data.imageUrl || data.url || data.path;

      setProductData((prevData) => ({
        ...prevData,
        images: [...prevData.images, { url: imageUrl, altText: file.name }],
      }));

      e.target.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("❌ Upload ảnh thất bại!");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createProduct(productData)).unwrap();
      setMessage("✅ Tạo sản phẩm thành công!");
      setTimeout(() => setMessage(""), 3000);
      navigate("/admin/products");
    } catch (error) {
      console.error("Lỗi khi tạo sản phẩm:", error);
      setMessage("❌ Tạo sản phẩm thất bại!");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 shadow-md rounded-md">
      <h2 className="text-3xl font-bold mb-4">Thêm sản phẩm mới</h2>

      {message && (
        <div
          className={`mb-4 p-2 rounded text-white ${
            message.includes("❌") ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Tên sản phẩm */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Tên sản phẩm</label>
          <input
            type="text"
            name="name"
            value={productData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>

        {/* Mô tả */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Mô tả</label>
          <textarea
            name="description"
            value={productData.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            rows={4}
            required
          />
        </div>

        {/* Giá và giá giảm */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-semibold mb-2">Giá</label>
            <input
              type="number"
              name="price"
              value={productData.price}
              onChange={(e) =>
                setProductData((prev) => ({
                  ...prev,
                  price: Number(e.target.value),
                }))
              }
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Giá giảm</label>
            <input
              type="number"
              name="discountPrice"
              value={productData.discountPrice}
              onChange={(e) =>
                setProductData((prev) => ({
                  ...prev,
                  discountPrice: Number(e.target.value),
                }))
              }
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>

        {/* Số lượng */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Số lượng trong kho</label>
          <input
            type="number"
            name="countInStock"
            value={productData.countInStock}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* SKU */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Mã SP</label>
          <input
            type="text"
            name="sku"
            value={productData.sku}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Danh mục */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Danh mục</label>
          <select
            name="category"
            value={productData.category}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">Chọn danh mục</option>
            <option value="Phần Trên">Phần Trên</option>
            <option value="Phần Dưới">Phần Dưới</option>
          </select>
        </div>

        {/* Thương hiệu */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Thương hiệu</label>
          <select
            name="brand"
            value={productData.brand}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">Chọn thương hiệu</option>
            <option value="Việt Tiến">Việt Tiến</option>
            <option value="NEM">NEM</option>
            <option value="K&K Fashion">K&K Fashion</option>
            <option value="Coolmate">Coolmate</option>
            <option value="Canifa">Canifa</option>
          </select>
        </div>

        {/* Giới tính */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Giới tính</label>
          <select
            name="gender"
            value={productData.gender}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">Chọn giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>

        {/* Sizes */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">
            Kích cỡ (cách nhau bởi dấu ", ")
          </label>
          <input
            type="text"
            name="sizes"
            value={productData.sizes.join(", ")}
            onChange={(e) =>
              setProductData({
                ...productData,
                sizes: e.target.value.split(",").map((s) => s.trim()),
              })
            }
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Colors */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">
            Màu sắc (cách nhau bởi dấu ", ")
          </label>
          <input
            type="text"
            name="colors"
            value={productData.colors.join(", ")}
            onChange={(e) =>
              setProductData({
                ...productData,
                colors: e.target.value.split(",").map((c) => c.trim()),
              })
            }
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Collections */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Bộ sưu tập</label>
          <input
            type="text"
            name="collections"
            value={productData.collections}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Material */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Chất liệu</label>
          <select
            name="material"
            value={productData.material}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">Chọn chất liệu</option>
            <option value="Vải cotton">Vải cotton</option>
            <option value="Len">Len</option>
            <option value="Vải denim">Vải denim</option>
            <option value="Vải lụa">Vải lụa</option>
            <option value="Vải lanh">Vải lanh</option>
            <option value="Vải nỉ">Vải nỉ</option>
          </select>
        </div>

        {/* Upload ảnh */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Đăng tải ảnh</label>
          <div className="flex items-center gap-4">
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Chọn tệp
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {uploading && <p>Đang tải ảnh...</p>}
          </div>

          <div className="flex gap-4 mt-4 flex-wrap">
            {productData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image.url}
                  alt={image.altText || "Ảnh sản phẩm"}
                  className="w-20 h-20 object-cover rounded-md shadow-md"
                />
                <button
                  type="button"
                  onClick={() =>
                    setProductData((prev) => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index),
                    }))
                  }
                  className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
        >
          Tạo sản phẩm
        </button>
      </form>
    </div>
  );
};

export default CreateProductPage;
