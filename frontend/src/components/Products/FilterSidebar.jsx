import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const FilterSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    category: "",
    gender: "",
    color: [],
    size: [],
    material: [],
    brand: [],
    minPrice: 0,
    maxPrice: 10000000,
  });

  const [priceRange, setPriceRange] = useState([0, 10000000]);

  const categories = ["Phần Trên", "Phần Dưới"];
  const colors = [
    "Trắng",
    "Đen",
    "Xanh Dương",
    "Xám",
    "Xanh Đậm",
    "Xanh Nhạt",
    "Xanh Lá",
    "Xanh Ô Liu",
    "Đỏ",
    "Xám Nhạt",
    "Xám Đậm",
    "Xanh Lục",
    "Hồng Phấn",
    "Be",
    "Nâu",
    "Nâu Nhạt",
    "Kaki",
  ];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const materials = [
    "Vải cotton",
    "Len",
    "Vải denim",
    "Vải lụa",
    "Vải lanh",
    "Vải nỉ",
  ];
  const brands = ["Việt Tiến", "NEM", "K&K Fashion", "Coolmate", "Canifa"];
  const genders = ["Nam", "Nữ"];

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

  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);

    setFilters({
      category: params.category || "",
      gender: params.gender || "",
      color: params.color ? params.color.split(",") : [],
      size: params.size ? params.size.split(",") : [],
      material: params.material ? params.material.split(",") : [],
      brand: params.brand ? params.brand.split(",") : [],
      minPrice: params.minPrice || 0,
      maxPrice: params.maxPrice || 10000000,
    });
    setPriceRange([0, params.maxPrice || 10000000]);
  }, [searchParams]);

  const handleFilterChange = (e) => {
    const { name, value, checked, type } = e.target;

    let newFilters = { ...filters };

    if (type === "checkbox") {
      if (checked) {
        newFilters[name] = [...(newFilters[name] || []), value];
      } else {
        newFilters[name] = newFilters[name].filter((item) => item !== value);
      }
    } else {
      newFilters[name] = value;
    }
    setFilters(newFilters);
    updateURLParams(newFilters);
  };

  const updateURLParams = (newFilters) => {
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach((key) => {
      if (Array.isArray(newFilters[key]) && newFilters[key].length > 0) {
        params.append(key, newFilters[key].join(","));
      } else if (newFilters[key] && !Array.isArray(newFilters[key])) {
        params.append(key, newFilters[key]);
      }
    });
    setSearchParams(params);
    navigate(`?${params.toString()}`);
  };

  const handlePriceChange = (e) => {
    const newPrice = e.target.value;
    setPriceRange([0, newPrice]);
    const newFilters = { ...filters, minPrice: 0, maxPrice: newPrice };
    setFilters(newFilters);
    updateURLParams(newFilters);
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-medium text-gray-800 mb-4">Bộ lọc</h3>
      {/* category */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">
          Phân loại
        </label>
        {categories.map((category) => (
          <div key={category} className="flex items-center mb-1">
            <input
              type="radio"
              name="category"
              value={category}
              checked={filters.category === category}
              onChange={handleFilterChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-gray-700">{category}</span>
          </div>
        ))}
      </div>

      {/* gender */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">
          Giới tính
        </label>
        {genders.map((gender) => (
          <div key={gender} className="flex items-center mb-1">
            <input
              type="radio"
              name="gender"
              value={gender}
              checked={filters.gender === gender}
              onChange={handleFilterChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-gray-700">
              {gender === "Nam" ? "Nam" : "Nữ"}
            </span>
          </div>
        ))}
      </div>

      {/* color */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Màu</label>
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color) => (
            <div key={color} className="relative group">
              <input
                type="checkbox"
                name="color"
                value={color}
                checked={filters.color.includes(color)}
                onChange={handleFilterChange}
                className="absolute opacity-0 h-0 w-0"
              />
              <label
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer transition-transform duration-200 hover:scale-110 ${
                  filters.color.includes(color)
                    ? "border-blue-500 shadow-lg scale-105"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: colorMap[color] || "#CCCCCC" }}
              >
                {filters.color.includes(color) && (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </label>
              <span className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {color}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* size */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Kích cỡ</label>
        {sizes.map((size) => (
          <div key={size} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="size"
              value={size}
              checked={filters.size.includes(size)}
              onChange={handleFilterChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <span className="text-gray-700">{size}</span>
          </div>
        ))}
      </div>

      {/* material */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">
          Chất liệu
        </label>
        {materials.map((material) => (
          <div key={material} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="material"
              value={material}
              checked={filters.material.includes(material)}
              onChange={handleFilterChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <span className="text-gray-700">{material}</span>
          </div>
        ))}
      </div>

      {/* brand */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Hãng</label>
        {brands.map((brand) => (
          <div key={brand} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="brand"
              value={brand}
              checked={filters.brand.includes(brand)}
              onChange={handleFilterChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
            />
            <span className="text-gray-700">{brand}</span>
          </div>
        ))}
      </div>

      {/* price range */}
      <div className="mb-8">
        <label className="block text-gray-600 font-medium mb-2">
          Phạm vi giá
        </label>
        <input
          type="range"
          name="priceRange"
          min={0}
          max={10000000}
          step={50000}
          value={priceRange[1]}
          onChange={handlePriceChange}
          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-gray-600 mt-2">
          <span>0 VND</span>
          <span>{priceRange[1].toLocaleString("vi-VN")} VND</span>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
