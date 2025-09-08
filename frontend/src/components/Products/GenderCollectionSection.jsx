import React from "react";
import mensCollectionImage from "../../assets/mens-collection.webp";
import womensCollectionImage from "../../assets/womens-collection.webp";
import { useNavigate } from "react-router-dom";

const GenderCollectionSection = () => {
  const navigate = useNavigate();

  const handleClick = (gender) => {
    navigate(`/collections/all?gender=${gender}`);
    window.scrollTo(0, 0); // ✅ cuộn lên đầu trang
  };

  return (
    <section className="py-16 px-4 lg:px-0">
      <div className="container mx-auto max-w-[1800px] flex flex-col md:flex-row gap-8 px-6">
        {/* women's collection */}
        <div className="relative flex-1">
          <img
            src={womensCollectionImage}
            alt="Women's Collection"
            className="w-full h-[700px] object-cover"
          />
          <div className="absolute bottom-8 left-8 bg-white/90 p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Bộ Sưu Tập Cho Nữ
            </h2>
            <button
              onClick={() => handleClick("Nữ")}
              className="text-gray-900 underline"
            >
              Mua Ngay
            </button>
          </div>
        </div>

        {/* Men's collection */}
        <div className="relative flex-1">
          <img
            src={mensCollectionImage}
            alt="Men's Collection"
            className="w-full h-[700px] object-cover"
          />
          <div className="absolute bottom-8 left-8 bg-white/90 p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Bộ Sưu Tập Cho Nam
            </h2>
            <button
              onClick={() => handleClick("Nam")}
              className="text-gray-900 underline"
            >
              Mua Ngay
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenderCollectionSection;
