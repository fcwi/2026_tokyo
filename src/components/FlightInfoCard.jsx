import React, { memo } from "react";
import { 
  Plane, Phone, MapPin, AlertCircle, ChevronUp, ChevronDown 
} from "lucide-react";

const FlightInfoCard = memo(({ 
  isDarkMode, 
  theme, 
  colors, 
  tripConfig, 
  isFlightInfoExpanded, 
  setIsFlightInfoExpanded, 
  handleCopy 
}) => {
  return (
    <div
      className={`backdrop-blur-2xl border rounded-[2rem] p-5 ${theme.cardShadow} animate-fadeIn transition-colors duration-300 ${theme.cardBg} ${theme.cardBorder}`}
      style={theme.ambientStyle}
    >
      {/* 標題區 */}
      <div
        onClick={() => setIsFlightInfoExpanded(!isFlightInfoExpanded)}
        className={`flex items-center justify-between cursor-pointer group ${isFlightInfoExpanded ? "mb-4 border-b pb-2" : ""} ${isDarkMode ? "border-neutral-700/50" : "border-stone-200/50"}`}
        role="button"
        tabIndex={0}
      >
        <h3 className={`text-sm font-bold flex items-center gap-2 drop-shadow-sm ${theme.text}`}>
          <Plane className={`w-4 h-4 ${theme.accent}`} /> 航班與緊急資訊
        </h3>
        <div className={`p-1 rounded-full transition-colors ${isDarkMode ? "group-hover:bg-neutral-700" : "group-hover:bg-stone-100"}`}>
          {isFlightInfoExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isFlightInfoExpanded && (
        <div className="animate-fadeIn">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* 航班資訊 */}
            <div className={`rounded-xl p-3 border flex flex-col gap-2 ${isDarkMode ? "bg-neutral-800/40 border-neutral-700" : "bg-white/40 border-stone-200"}`}>
              <div className={`text-xs font-bold ${theme.textSec}`}>去程 ({tripConfig.flights.outbound.code})</div>
              <div className="text-sm font-bold tracking-wide">{tripConfig.flights.outbound.time}</div>
              <div className={`w-full h-px my-0.5 ${isDarkMode ? "bg-neutral-700" : "bg-stone-200"}`} />
              <div className={`text-xs font-bold ${theme.textSec}`}>回程 ({tripConfig.flights.inbound.code})</div>
              <div className="text-sm font-bold tracking-wide">{tripConfig.flights.inbound.time}</div>
            </div>

            {/* 飯店與地址 */}
            <div className={`rounded-xl p-3 border flex flex-col justify-center gap-2 ${isDarkMode ? "bg-neutral-800/40 border-neutral-700" : "bg-white/40 border-stone-200"}`}>
              {tripConfig.hotels.map((hotel, index) => (
                <React.Fragment key={index}>
                  <div className="flex flex-col gap-1">
                    <div className={`text-xs font-bold ${theme.textSec}`}>{hotel.name}</div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Phone className="w-3 h-3" />
                      <a href={`tel:${hotel.phone}`}>{hotel.phone}</a>
                    </div>
                    <button onClick={() => handleCopy(hotel.address)} className="text-xs flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="underline decoration-dotted">{hotel.address}</span>
                    </button>
                  </div>
                  {index < tripConfig.hotels.length - 1 && <div className={`w-full h-px my-0.5 ${isDarkMode ? "bg-neutral-700" : "bg-stone-200"}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 緊急聯絡 */}
          <div className={`rounded-xl p-3 border flex items-start gap-2.5 ${isDarkMode ? "bg-red-900/10 border-red-900/20" : "bg-red-50/40 border-red-100"}`}>
            <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.red}`} />
            <div className={`text-xs leading-relaxed ${isDarkMode ? "text-red-200/80" : "text-red-800/80"}`}>
              <span className="font-bold block mb-0.5">緊急聯絡：</span>
              報警 110 | 救護車 119 <br />
              旅外國人急難救助：+81-3-3280-7917
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default memo(FlightInfoCard);