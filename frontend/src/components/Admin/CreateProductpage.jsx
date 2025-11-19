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

const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];
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

  const handleSizeChange = (value, checked) => {
    setProductData(prev => {
      let newSizes = checked
        ? [...prev.sizes, value]
        : prev.sizes.filter(s => s !== value);
      newSizes.sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));
      return { ...prev, sizes: newSizes };
    });
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
        state: { message: "Thêm mới sản phẩm thành công!", type: "success" },
      });
    } catch (err) {
      setMessage(`Thêm mới thất bại! ${err.message || "Lỗi không xác định"}`);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleCancel = () => navigate("/admin/products");

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-md">
      <h2 className="text-3xl font-bold mb-6">Thêm mới sản phẩm</h2>

      {message && (
        <div className={`mb-4 p-3 rounded text-white ${message.includes("thất bại") || message.includes("bắt buộc") ? "bg-red-500" : "bg-green-500"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tất cả phần giống hệt EditProductPage, chỉ thay handleSizeChange */}
        {/* (Code giống hệt file Edit, chỉ khác tiêu đề và id checkbox) */}
        {/* Ở đây mình viết đầy đủ để bạn copy luôn */}

        <div>
          <label className="block font-semibold mb-2">Tên sản phẩm</label>
          <input type="text" name="name" value={productData.name} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2" required />
        </div>

        <div>
          <label className="block font-semibold mb-2">Mô tả</label>
          <textarea name="description" value={productData.description} onChange={handleChange}
            rows={5} className="w-full border border-gray-300 rounded-md p-2" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2">Giá</label>
            <input type="number" value={productData.price}
              onChange={(e) => setProductData(prev => ({ ...prev, price: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md p-2" required />
          </div>
          <div>
            <label className="block font-semibold mb-2">Giá giảm</label>
            <input type="number" value={productData.discountPrice}
              onChange={(e) => setProductData(prev => ({ ...prev, discountPrice: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md p-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2">Số lượng trong kho</label>
            <input type="number" value={productData.countInStock}
              onChange={(e) => setProductData(prev => ({ ...prev, countInStock: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md p-2" required />
          </div>
          <div>
            <label className="block font-semibold mb-2">Mã SP (SKU)</label>
            <input type="text" name="sku" value={productData.sku} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2" required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold mb-2">Danh mục</label>
            <select name="category" value={productData.category} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2">
              <option value="">Chọn danh mục</option>
              <option value="Phần Trên">Phần Trên</option>
              <option value="Phần Dưới">Phần Dưới</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-2">Thương hiệu</label>
            <select name="brand" value={productData.brand} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2">
              <option value="">Chọn thương hiệu</option>
              <option value="Việt Tiến">Việt Tiến</option>
              <option value="NEM">NEM</option>
              <option value="K&K Fashion">K&K Fashion</option>
              <option value="Coolmate">Coolmate</option>
              <option value="Canifa">Canifa</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-2">Giới tính</label>
            <select name="gender" value={productData.gender} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2">
              <option value="">Chọn giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>
        </div>

        <div>
.ten          <label className="block font-semibold mb-3">Kích cỡ</label>
          <div className="flex flex-wrap gap-6">
            {sizes.map((size) => (
              <div key={size} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`create-size-${size}`}
                  value={size}
                  checked={productData.sizes.includes(size)}
                  onChange={(e) => handleSizeChange(e.target.value, e.target.checked)}
                  className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor={`create-size-${size}`} className="text-lg font-medium cursor-pointer">
                  {size}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-3">Màu sắc</label>
          <div className="flex flex-wrap gap-4">
            {colors.map((color) => (
              <div key={color} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={color}
                  checked={productData.colors.includes(color)}
                  onChange={(e) => {
                    const { value, checked } = e.target;
                    setProductData(prev => ({
                      ...prev,
                      colors: checked ? [...prev.colors, value] : prev.colors.filter(c => c !== value),
                    }));
                  }}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
                  id={`create-color-${color}`}
                />
                <label htmlFor={`create-color-${color}`} className="flex items-center gap-2 cursor-pointer">
                  <div className="w-7 h-7 rounded-full border border-gray-400 shadow-sm"
                    style={{ backgroundColor: colorMap[color] || "#ccc" }}></div>
                  <span>{color}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2">Bộ sưu tập</label>
            <input type="text" name="collections" value={productData.collections} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block font-semibold mb-2">Chất liệu</label>
            <select name="material" value={productData.material} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2">
              <option value="">Chọn chất liệu</option>
              <option value="Vải cotton">Vải cotton</option>
              <option value="Len">Len</option>
              <option value="Vải denim">Vải denim</option>
              <option value="Vải lụa">Vải lụa</option>
              <option value="Vải lanh">Vải lanh</option>
              <option value="Vải nỉ">Vải nỉ</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-2">Đăng tải ảnh</label>
          <div className="flex items-center gap-4">
            <label htmlFor="file-upload-create" className="cursor-pointer bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600">
              Chọn tệp
            </label>
            <input id="file-upload-create" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            {uploading && <span className="text-blue-600">Đang tải ảnh...</span>}
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {productData.images.map((image, index) => (
              <div key={index} className="relative group">
                <img src={image.url} alt="Product" className="w-24 h-24 object-cover rounded-md shadow" />
                <button type="button" onClick={() => setProductData(prev => ({
                  ...prev,
                  images: prev.images.filter((_, i) => i !== index)
                }))}
                  className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button type="submit"
            className="flex-1 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition text-lg font-semibold">
            Thêm mới sản phẩm
          </button>
          <button type="button" onClick={handleCancel}
            className="flex-1 bg-gray-500 text-white py-3 rounded-md hover:bg-gray-600 transition text-lg font-semibold">
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProductPage;