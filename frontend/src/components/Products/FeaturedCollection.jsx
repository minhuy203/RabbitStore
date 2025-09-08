import React from "react";
import { useNavigate } from "react-router-dom";
import featured from "../../assets/featured.webp";

const FeaturedCollection = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/collections/all"); // điều hướng
    window.scrollTo(0, 0); // cuộn lên đầu
  };

  return (
    <section className="py-16 px-6 lg:px-0">
      <div className="container mx-auto max-w-[1755px] flex flex-col-reverse lg:flex-row items-center bg-green-100 rounded-3xl">
        {/* left content */}
        <div className="lg:w-1/2 p-8 text-center lg:text-left">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Thoải Mái và Phong Cách
          </h2>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Được thiết kế cho cuộc sống hằng ngày của bạn
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Khám phá các sản phẩm thoải mái, chất lượng cao kết hợp giữa phong
            cách và chức năng của trang phục. Thiết kế làm bạn cảm thấy dễ chịu
            và yêu bản thân mỗi ngày.
          </p>
          <button
            onClick={handleClick}
            className="bg-black text-white px-6 py-3 rounded-lg text-lg hover:bg-gray-800"
          >
            Mua Ngay
          </button>
        </div>

        {/* right content */}
        <div className="lg:w-1/2">
          <img
            src={featured}
            alt="Featured Collection"
            className="w-full h-full object-cover lg:rounded-tr-3xl lg:rounded-br-3xl"
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollection;
