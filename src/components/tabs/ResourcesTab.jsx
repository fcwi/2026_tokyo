import React from "react";
import { LinkIcon, ExternalLink } from "lucide-react";
import { usefulLinks } from "../../tripdata_2026_karuizawa.jsx";

const ResourcesTab = ({ theme, isDarkMode }) => {
  return (
    <div className="flex-1 px-4 pb-32 space-y-5 animate-fadeIn">
      <div
        className={`rounded-[2rem] p-5 shadow-xl min-h-[auto] transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
      >
        <h2
          className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.text}`}
        >
          <div
            className={`p-1.5 rounded-xl ${isDarkMode ? "bg-blue-900/20" : "bg-[#E8F0FE]"}`}
          >
            <LinkIcon
              className={`w-4 h-4 ${isDarkMode ? "text-blue-300" : "text-[#3B5998]"}`}
            />
          </div>
          實用連結百寶箱
        </h2>

        <div className="space-y-4">
          {usefulLinks && usefulLinks.length > 0 ? (
            usefulLinks.map((section, idx) => (
              <div key={idx}>
                <h3
                  className={`text-xs font-bold mb-2.5 px-3 py-1.5 rounded-xl w-fit border ${isDarkMode ? "text-blue-300 bg-blue-900/20 border-blue-800/30" : "text-[#3B5998] bg-[#E8F0FE] border-blue-100"}`}
                >
                  {section.category}
                </h3>
                <div className="space-y-3">
                  {section.items.map((item, i) => (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-4 backdrop-blur-sm border rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-98 group ${isDarkMode ? "bg-neutral-800/30 border-neutral-700" : "bg-white/60 border-stone-200"}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-inner group-hover:scale-105 transition-transform ${isDarkMode ? "bg-neutral-800 border-neutral-600" : "bg-white border-stone-100"}`}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`text-sm font-bold flex items-center gap-1.5 group-hover:text-opacity-80 transition-colors ${isDarkMode ? "text-neutral-200 group-hover:text-sky-300" : "text-[#37474F] group-hover:text-[#5D737E]"}`}
                        >
                          {item.title}
                          <ExternalLink
                            className={`w-3 h-3 ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
                          />
                        </div>
                        <p className={`text-xs mt-0.5 ${theme.textSec}`}>
                          {item.desc}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div
              className={`py-12 text-center rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isDarkMode ? "bg-neutral-800/20 border-neutral-700" : "bg-stone-50/50 border-stone-200"}`}
            >
              <LinkIcon
                className={`w-12 h-12 mx-auto mb-3 opacity-40 ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
              />
              <p className={`text-sm font-medium ${theme.textSec}`}>
                暫無實用連結
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

export default ResourcesTab;
