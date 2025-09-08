import React from "react";
import { IoLogoInstagram } from "react-icons/io";
import { RiTwitchLine, RiTwitterXLine } from "react-icons/ri";
import { TbBrandMeta } from "react-icons/tb";
import { FiPhoneCall } from "react-icons/fi";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t py-12  ">
      <div className="container mx-auto max-w-[1800px]  grid grid-cols-1 md:grid-cols-4 gap-8 px-6">
        <div>
          <h3 className="text-lg text-gray-800 mb-4">Tin tức</h3>
          <p className="text-gray-500 mb-4">
            Hãy là người đầu tiên nghe về sản phẩm mới, các sự kiện đặc biệt và
            các ưu đãi trực tuyến.
          </p>
          <p className="font-bold text-sm text-gray-600 mb-6">
            Đăng ký để nhận 10% khuyến mãi cho đơn hàng đầu tiên.
          </p>
          {/* newsletter form */}
          <form className="flex">
            <input
              type="email"
              placeholder="Hãy nhập email của bạn"
              className="p-3 w-full text-sm border-t border-l border-b border-gray-300 rounded-l-md
              focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
              required
            />
            <button
              type="submit"
              className=" whitespace-nowrap bg-black text-white px-6 py-3 text-sm rounded-r-md hover:bg-gray-800 
              transition-all"
            >
              Đăng ký
            </button>
          </form>
        </div>
        {/* Shop links */}
        <div>
          <h3 className="text-lg text-gray-800 mb-4">Cửa hàng</h3>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link to="#" className="hover:text-gray-600 transition-colors">
                Phần trên cho nam giới
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-600 transition-colors">
                Phần trên cho nữ giới
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-600 transition-colors">
                Phần dưới cho nam giới
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-600 transition-colors">
                Phần dưới cho nữ giới
              </Link>
            </li>
          </ul>
        </div>
        {/* support links */}
        <div>
          <h3 className="text-lg text-gray-800 mb-4">Hỗ trợ</h3>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link to="#" className="hover:text-gray-600 transition-colors">
                Liên lạc với chúng tôi
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-600 transition-colors">
                Về chúng tôi
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-600 transition-colors">
                FAQs
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-600 transition-colors">
                Đặc điểm
              </Link>
            </li>
          </ul>
        </div>
        {/* follow us */}
        <div>
          <h3 className="text-lg text-gray-800 mb-4">Theo dõi chúng tôi</h3>
          <div className="flex-items-center space-x-4 mb-6">
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600"
            >
              <TbBrandMeta className="h-5 w-5" />
            </a>
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600"
            >
              <IoLogoInstagram className="h-5 w-5" />
            </a>
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600"
            >
              <RiTwitterXLine className="h-5 w-5" />
            </a>
          </div>
          <p className="text-gray-500">Liên lạc với chúng tôi</p>
          <p>
            <FiPhoneCall className="inline-block mr-2" />
            +84 (033) 412-7892
          </p>
        </div>
      </div>
      {/* footer bottom */}
      <div className="container mx-auto mt-12 px-4 lg:px-0 border-t border-gray-200 pt-6">
        <p className="text-gray-500 text-sm tracking-tighter text-center">
          © 2025, Tất cả bản quyền được lưu trữ
        </p>
      </div>
    </footer>
  );
};

export default Footer;
