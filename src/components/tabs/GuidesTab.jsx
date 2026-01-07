import React, { useState, useMemo } from "react";
import {
  BookOpen,
  ChevronUp,
  ChevronDown,
  FileText,
  ExternalLink,
} from "lucide-react";
import { guidesData } from "../../tripdata_2026_karuizawa.jsx";

const GuidesTab = ({ theme, isDarkMode }) => {
  const [expandedGuides, setExpandedGuides] = useState({});

  const toggleGuide = (index) => {
    setExpandedGuides((prev) => ({
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
        className={`rounded-[2rem] p-5 ${theme.cardShadow || "shadow-xl"} min-h-[auto] transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
        style={theme.ambientStyle}
      >
        <h2
          className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.text}`}
          style={{
            textShadow: isDarkMode ? "0 2px 4px rgba(0,0,0,0.3)" : "none",
          }}
        >
          <div
            className={`p-1.5 rounded-xl ${isDarkMode ? "bg-purple-900/20" : "bg-[#E6E6FA]/50"}`}
          >
            <BookOpen
              className={`w-4 h-4 ${isDarkMode ? "text-purple-300" : "text-[#9370DB]"}`}
            />
          </div>
          實用參考指南
        </h2>
        <div className="space-y-3">
          {guidesData && guidesData.length > 0 ? (
            guidesData.map((guide, idx) => {
              const isGuideOpen = expandedGuides[idx];
              return (
                <div
                  key={idx}
                  className={`backdrop-blur-sm border rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 transform ${isDarkMode ? "bg-neutral-800/40 border-white/5" : "bg-white/70 border-white/20"}`}
                >
                  {/* 指南標題列 (點擊展開) */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => toggleGuide(idx)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isGuideOpen}
                    aria-controls={`guide-${idx}-content`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleGuide(idx);
                      }
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-inner ${isDarkMode ? "bg-neutral-800 border-neutral-600" : "bg-white border-stone-100"}`}
                    >
                      {guide.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-sm font-bold break-words ${theme.text}`}
                      >
                        {guide.title}
                      </h3>
                      {!isGuideOpen && (
                        <p
                          className={`text-xs mt-0.5 leading-relaxed truncate ${theme.textSec}`}
                        >
                          {guide.summary}
                        </p>
                      )}
                    </div>
                    {isGuideOpen ? (
                      <ChevronUp
                        className={`w-4 h-4 flex-shrink-0 ${theme.textSec}`}
                      />
                    ) : (
                      <ChevronDown
                        className={`w-4 h-4 flex-shrink-0 ${theme.textSec}`}
                      />
                    )}
                  </div>

                  {/* 展開後的詳細內容 */}
                  {isGuideOpen && (
                    <div
                      id={`guide-${idx}-content`}
                      className="px-5 pb-5 animate-fadeIn"
                    >
                      <p
                        className={`text-sm mb-4 leading-relaxed ${theme.textSec}`}
                      >
                        {guide.summary}
                      </p>

                      {/* 操作步驟 */}
                      <div
                        className={`rounded-xl p-3.5 my-3 border ${isDarkMode ? "bg-black/20 border-neutral-700" : "bg-[#F9F9F6] border-stone-200"}`}
                      >
                        <h4
                          className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${theme.textSec}`}
                        >
                          <FileText className="w-3.5 h-3.5" /> 操作重點
                        </h4>
                        <ol
                          className={`list-decimal list-inside text-sm space-y-2 pl-1 ${theme.textSec} ${isDarkMode ? "marker:text-sky-300" : `marker:${colors.blue}`} marker:font-bold`}
                        >
                          {guide.steps.map((step, i) => (
                            <li key={i} className="leading-relaxed pl-1">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* 相關連結與部落格教學 */}
                      <div className="space-y-3">
                        <a
                          href={guide.link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full text-center text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 ${isDarkMode ? theme.tagColors.transport.dark + " hover:bg-sky-900/30" : theme.tagColors.transport.light + " hover:bg-[#D0E0FC]"}`}
                        >
                          {guide.link.text}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {guide.blogs && guide.blogs.length > 0 && (
                          <div
                            className={`mt-3 border-t pt-3 ${isDarkMode ? "border-neutral-700" : "border-stone-200"}`}
                          >
                            <h4
                              className={`text-[11px] font-bold mb-2 uppercase tracking-wide ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
                            >
                              相關圖文教學
                            </h4>
                            <div className="space-y-1.5">
                              {guide.blogs.map((blog, bIdx) => (
                                <a
                                  key={bIdx}
                                  href={blog.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 text-xs transition-colors p-1.5 rounded-xl ${isDarkMode ? "text-neutral-400 hover:text-sky-300 hover:bg-neutral-700/50" : "text-stone-500 hover:text-[#3B5998] hover:bg-stone-100"}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? "bg-neutral-600" : "bg-stone-300"}`}
                                  ></span>
                                  <span className="truncate underline decoration-stone-300 underline-offset-4 decoration-1">
                                    {blog.title}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
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
              <BookOpen
                className={`w-12 h-12 mx-auto mb-3 opacity-40 ${isDarkMode ? "text-neutral-500" : "text-stone-400"}`}
              />
              <p className={`text-sm font-medium ${theme.textSec}`}>
                暫無參考指南
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

export default GuidesTab;
