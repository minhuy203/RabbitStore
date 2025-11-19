import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../../redux/slices/adminProductSlice";
import axios from "axios";

const colors = [
  "Trắng", "Đen", "Xanh Dương", "Xám", "Xanh Đậm", "Xanh Nhạt", "Xanh Lá",
  "Xanh Ô Liu", "Đỏ", "Xám Nhạt", "Xám Đậm", "Xanh Lục", "Hồng Phấn",
  "Be", "Nâu", "Nâu Nhạt", "Kaki",
];

const colorMap = {
  Trắng: "#FFFFFF", Đen: "#000000", "Xanh Dương": "#0000FF", Xám: "#808080",
  "Xanh Đậm": "#003087", "Xanh Nhạt": "#ADD8E6", "Xanh Lá": "#008000",
  "Xanh Ô Liu": "#808000", Đỏ: "#FF0000", "Xám Nhạt": "#D3D3D3",
  "Xám Đậm": "#A9A9A9", "Xanh Lục": "#008000", "Hồng Phấn": "#FFB6C1",
  Be: "#F5F5DC", Nâu: "#A52A2A", "Nâu Nhạt": "#DEB887", Kaki: "#C3B091",
};

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

const CreateProductPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [productData, setProductData] = useState({
    name: "", description: "", price: 0, discountPrice: 0, countInStock: 0,
    sku: "", category: "", brand: "", sizes: [], colors: [], collections: "",
    material: "", gender: "", images: [],
  });

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
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
      setProductData(prev => ({
        ...prev,
        images: [...prev.images, { url: imageUrl, altText: file.name }],
      }));
      e.target.value = "";
    } catch (err) {
      setMessage(`Upload ảnh thất bại! ${err.response?.data?.message || err.message}`);
      setTimeout(() => setMessage(""), 4000);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productData.name || !productData.description || !productData.price || !productData.countInStock || !productData.sku) {
      setMessage("Vui lòng điền đầy đủ các trường bắt buộc!");
      setTimeout(() => setMessage(""), 4000);
      return;
    }

    try {
      await dispatch(createProduct(productData)).unwrap();
      navigate("/admin/products", {
        state: { message: "Thêm mới sản phẩm thành công!", type: "success" }
      });
    } catch (err) {
      setMessage(`Thêm mới thất bại! ${err.message || err}`);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleCancel = () => navigate("/admin/products");

  return (
    <div className="max-w-5xl mx-auto p-6 shadow-md rounded-md">
      <h2 className="text-3xl font-bold mb-4">Thêm mới sản phẩm</h2>

      {message && (
        <div className={`mb-4 p-3 rounded text-white ${message.includes("thất bại") || message.includes("bắt buộc") ? "bg-red-500" : "bg-green-500"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Các trường giống Edit, chỉ thay phần Size */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Tên sản phẩm</label>
          <input type="text" name="name" value={productData.name} onChange={handleChange} className="w-full border rounded-md p-2" required />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-2">Mô tả</label>
          <textarea name="description" value={productData.description} onChange={handleChange} rows={4} className="w-full border rounded-md p-2" required />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-semibold mb-2">Giá</label>
            <input type="number" name="price" value={productData.price}
              onChange={e => setProductData(prev => ({ ...prev, price: Number(e.target.value) }))}
              className="w-full border rounded-md p-2" required />
          </div>
          <div>
            <label className="block font-semibold mb-2">Giá giảm</label>
            <input type="number" name="discountPrice" value={productData.discountPrice}
              onChange={e => setProductData(prev => ({ ...prev, discountPrice: Number(e.target.value) }))}
              className="w-full border rounded-md p-2" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-2">Số lượng trong kho</label>
          <input type="number" name="countInStock" value={productData.countInStock}
            onChange={e => setProductData(prev => ({ ...prev, countInStock: Number(e.target.value) }))}
            className="w-full border rounded-md p-2" required />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-2">Mã SP (SKU)</label>
          <input type="text" name="sku" value={productData.sku} onChange={handleChange}
            className="w-full border rounded-md p-2" required />
        </div>

        {/* Danh mục, thương hiệu, giới tính... */}
        {/* ... (giữ nguyên như cũ) ... */}

        {/* ==== SIZES - CHECKBOX ==== */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Kích cỡ</label>
          <div className="flex flex-wrap gap-6">
            {sizes.map((size) => (
              <div key={size} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`size-${size}`}
                  value={size}
                  checked={productData.sizes.includes(size)}
                  onChange={(e) => {
                    const { value, checked } = e.target;
                    setProductData(prev => ({
                      ...prev,
                      sizes: checked
                        ? [...prev.sizes, value]
                        : prev.sizes.filter(s => s !== value),
                    }));
                  }}
                  className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor={`size-${size}`} className="cursor-pointer text-lg font-medium">
                  {size}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Colors, Collections, Material, Upload ảnh, Buttons... giữ nguyên như cũ */}
        {/* (phần còn lại giống hệt file gốc, chỉ thay phần Size ở trên) */}

        <div className="flex gap-4 mt-6">
          <button type="submit"
            className="flex-1 bg-green-500 text-white py-3 rounded-md hover:bg-green-600 transition-colors text-lg font-semibold">
            Thêm mới sản phẩm
          </button>
          <button type="button" onClick={handleCancel}
            className="flex-1 bg-gray-500 text-white py-3 rounded-md hover:bg-gray-600 transition-colors text-lg font-semibold">
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProductPage;