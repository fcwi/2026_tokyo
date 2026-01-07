import React, { useState, useMemo } from "react";
import {
  Info,
  ChevronUp,
  ChevronDown,
  Star,
  MapPin,
  Scissors,
  Coffee,
  Store,
} from "lucide-react";
import { shopGuideData } from "../../tripdata_2026_karuizawa.jsx";
import { getMapLink } from "../../utils/links.js";

const ShopTab = ({ theme, isDarkMode }) => {
  const [expandedShops, setExpandedShops] = useState({});

  const toggleShop = (index) => {
    setExpandedShops((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const colors = useMemo(() => {
    const sc = theme.semanticColors || {};
    const mode = isDarkMode ? "dark" : "light";
    return {
      blue: sc.blue?.[mode],
      green: sc.green?.[mode],
      red: sc.red?.[mode],
      orange: sc.orange?.[mode],
      pink: sc.pink?.[mode],
    };
  }, [theme, isDarkMode]);

  return (
    <div className="flex-1 px-4 pb-32 space-y-5 animate-fadeIn">
      <div
        className={`rounded-[2rem] p-5 shadow-xl min-h-[auto] transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
      >
        <h2
          className={`text-lg font-bold mb-1 flex items-center gap-2 ${theme.text}`}
        >
          <div
            className={`p-1.5 rounded-xl ${isDarkMode ? "bg-amber-900/20" : "bg-[#FFF8E1]"}`}
          >
            <Store
              className={`w-4 h-4 ${isDarkMode ? "text-amber-300" : "text-[#8B6B23]"}`}
            />
          </div>
          購物與美食攻略
        </h2>
        <p
          className={`text-xs mb-4 ml-1 flex items-center gap-1.5 ${theme.textSec}`}
        >
          <Info className="w-3 h-3" /> 點擊商家名稱即可開啟 Google Maps
        </p>

        <div className="space-y-3">
          {shopGuideData && shopGuideData.length > 0 ? (
            shopGuideData.map((areaData, idx) => {
              const isShopOpen = expandedShops[idx];
              return (
                <div
                  key={idx}
                  className={`backdrop-blur-sm border rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 transform ${isDarkMode ? "bg-neutral-800/30 border-neutral-700" : "bg-white/60 border-stone-200"}`}
                >
                  {/* 區域標題列 (點擊展開) */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => toggleShop(idx)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isShopOpen}
                    aria-controls={`shop-${idx}-content`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleShop(idx);
                      }
                    }}
                  >
                    <div>
                      <h3 className={`text-base font-bold ${theme.accent}`}>
                        {areaData.area}
                      </h3>
                      {!isShopOpen && (
                        <p
                          className={`text-xs mt-0.5 truncate ${theme.textSec}`}
                        >
                          {areaData.desc}
                        </p>
                      )}
                    </div>
                    {isShopOpen ? (
                      <ChevronUp className={`w-4 h-4 ${theme.textSec}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${theme.textSec}`} />
                    )}
                  </div>

                  {/* 展開後的商家列表 */}
                  {isShopOpen && (
                    <div
                      id={`shop-${idx}-content`}
                      className="px-5 pb-5 animate-fadeIn"
                    >
                      <p className={`text-sm mb-4 ${theme.textSec}`}>
                        {areaData.desc}
                      </p>

                      {/* 重點商家 (行程相關) */}
                      <div className="mb-5">
                        <h4
                          className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${theme.textSec}`}
                        >
                          <Star className={`w-3.5 h-3.5 ${colors.orange}`} />{" "}
                          行程重點商家
                        </h4>
                        <div className="grid grid-cols-1 gap-2.5">
                          {areaData.mainShops.map((shop, i) => (
                            <div
                              key={i}
                              className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${isDarkMode ? "bg-amber-900/10 border-amber-800/30 hover:bg-amber-900/20" : "bg-[#FFF8E1]/50 border-amber-100 hover:bg-[#FFF8E1]"}`}
                            >
                              <a
                                href={getMapLink(
                                  `${shop.name} ${areaData.mapQuerySuffix}`,
                                )}
                                className="flex items-center gap-3 group flex-1"
                              >
                                <MapPin
                                  className={`w-4 h-4 ${isDarkMode ? "text-amber-500" : "text-[#CD853F]"} group-hover:scale-125 transition-transform`}
                                />
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-sm font-bold transition-colors ${isDarkMode ? "text-neutral-200 group-hover:text-amber-300" : "text-[#37474F] group-hover:text-[#CD853F]"}`}
                                    >
                                      {shop.name}
                                    </span>
                                    <span
                                      className={`text-[11px] px-1.5 py-0.5 rounded-xl border shadow-sm ${isDarkMode ? "bg-neutral-800 text-neutral-400 border-neutral-700" : "bg-white text-stone-500 border-stone-200"}`}
                                    >
                                      {shop.tag}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-xs mt-0.5 ${theme.textSec}`}
                                  >
                                    {shop.note}
                                  </span>
                                </div>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 特別推薦 (如：童裝、文具) */}
                      {areaData.specialShops && (
                        <div className="mb-5">
                          <h4
                            className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${theme.textSec}`}
                          >
                            <Scissors
                              className={`w-3.5 h-3.5 ${colors.pink}`}
                            />{" "}
                            童裝與文具推薦
                          </h4>
                          <div className="grid grid-cols-1 gap-2.5">
                            {areaData.specialShops.map((shop, i) => (
                              <div
                                key={i}
                                className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${isDarkMode ? "bg-rose-900/10 border-rose-800/30 hover:bg-rose-900/20" : "bg-[#FFF0F5]/60 border-rose-100 hover:bg-[#FFF0F5]"}`}
                              >
                                <a
                                  href={getMapLink(
                                    `${shop.name} ${areaData.mapQuerySuffix}`,
                                  )}
                                  className="flex items-center gap-3 group flex-1"
                                >
                                  <MapPin
                                    className={`w-4 h-4 ${isDarkMode ? "text-rose-400" : "text-[#BC8F8F]"} group-hover:scale-125 transition-transform`}
                                  />
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-sm font-bold transition-colors ${isDarkMode ? "text-neutral-200 group-hover:text-rose-300" : "text-[#37474F] group-hover:text-[#BC8F8F]"}`}
                                      >
                                        {shop.name}
                                      </span>
                                      <span
                                        className={`text-[11px] px-1.5 py-0.5 rounded-xl border shadow-sm ${isDarkMode ? "bg-neutral-800 text-neutral-400 border-neutral-700" : "bg-white text-stone-500 border-stone-200"}`}
                                      >
                                        {shop.tag}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-xs mt-0.5 ${theme.textSec}`}
                                    >
                                      {shop.note}
                                    </span>
                                  </div>
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 周邊連鎖店 (便利商店、咖啡廳) */}
                      <div>
                        <h4
                          className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${theme.textSec}`}
                        >
                          <Coffee className="w-3.5 h-3.5 text-stone-400" />{" "}
                          附近常見連鎖 (1km內)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {areaData.nearbyChains.map((chain, i) => (
                            <a
                              key={i}
                              href={getMapLink(
                                `${chain.name} ${areaData.mapQuerySuffix}`,
                              )}
                              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-sm transition-all ${isDarkMode ? "bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-sky-300 hover:border-sky-800" : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-[#5D737E] hover:border-[#5D737E]/30"}`}
                            >
                              <span className="font-bold">{chain.name}</span>
                              <span
                                className={`text-xs border-l pl-2 ${isDarkMode ? "border-neutral-600 text-neutral-500" : "text-stone-400 border-stone-200"}`}
                              >
                                {chain.location}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div
              className={`py-12 text-center rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isDarkMode ? "bg-neutral-800/20 border-neutral-700" : "bg-stone-50/50 border-stone-200"}`}
            >
              <Store
                className={`w-12 h-12 mx-auto mb-3 opacity-40 ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
              />
              <p className={`text-sm font-medium ${theme.textSec}`}>
                暫無商家資訊
              </p>
              <p
                className={`text-xs mt-1 ${isDarkMode ? "text-neutral-600" : "text-stone-400"}`}
              >
                敬請期待更多內容
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopTab;
