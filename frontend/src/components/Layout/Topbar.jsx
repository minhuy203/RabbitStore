import React from "react";
import { TbBrandMeta } from "react-icons/tb";
import { IoLogoInstagram } from "react-icons/io";
import { RiTwitterXLine } from "react-icons/ri";
const Topbar = () => {
  return (
    <div className="bg-[#ea2e02] text-white">
      <div className="container mx-auto max-w-[1800px] flex justify-between items-center py-3 px-4.5">
        <div className="hidden md:flex items-center space-x-4">
          <a href="#" className="hover:text-gray-300">
            <TbBrandMeta className="h-5 w-5" />
          </a>
          <a href="#" className="hover:text-gray-300">
            <IoLogoInstagram className="h-5 w-5" />
          </a>
          <a href="#" className="hover:text-gray-300">
            <RiTwitterXLine className="h-5 w-5" />
          </a>
        </div>
        <div className="text-sm text-center flex-grow">
          <span>
            Chúng tôi giao hàng toàn quốc - Nhanh chóng và đáng tin cậy!
          </span>
        </div>
        <div className="text-sm hidden md:block">
          <a href="SDT:+0334127892" className="hover:text-gray-300">
            +84 (033) 412-7892
          </a>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
