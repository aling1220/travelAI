/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Map as MapIcon, 
  Clock, 
  Bus, 
  DollarSign, 
  Cloud, 
  Sun, 
  CloudRain, 
  Navigation, 
  MessageSquare, 
  Send, 
  X,
  ChevronRight,
  Plus,
  Compass,
  MapPin,
  TrendingUp,
  Utensils,
  Download,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateTravelPlan, chatWithAI, generateQMapImage } from './services/geminiService';
import { TravelPlan, ChatMessage, ItineraryItem } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [destination, setDestination] = useState('東京');
  const [days, setDays] = useState(3);
  const [style, setStyle] = useState('文化與美食');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [mustVisitLocations, setMustVisitLocations] = useState('');
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [qMapUrl, setQMapUrl] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [activeTransportInfo, setActiveTransportInfo] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setQMapUrl(null);
    try {
      const newPlan = await generateTravelPlan(destination, days, style, startDate, mustVisitLocations);
      setPlan(newPlan);
      setChatMessages([{ role: 'assistant', content: `你好！我已為你規劃好 ${destination} 的行程。有什麼我可以幫你的嗎？` }]);
      if (newPlan.itinerary.length > 0) {
        setSelectedLocation(newPlan.itinerary[0].location);
      }
    } catch (error) {
      console.error('Failed to generate plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQMap = async () => {
    if (!plan) return;
    setMapLoading(true);
    try {
      const url = await generateQMapImage(plan);
      setQMapUrl(url);
    } catch (error) {
      console.error('Failed to generate Q-map:', error);
    } finally {
      setMapLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMsg = { role: 'user' as const, content: inputMessage };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    
    try {
      const response = await chatWithAI(inputMessage, plan);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response || '抱歉，我現在無法回答。' }]);
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  const downloadItinerary = () => {
    if (!plan) return;
    
    const content = `
行程規劃：${plan.destination}
天數：${plan.days} 天
風格：${plan.style}
預估總預算：${plan.total_budget}

--- 行程詳情 ---
${plan.itinerary.map(item => `
[第 ${item.day} 天 - ${item.time}]
地點：${item.location}
交通：${item.transportation} (${item.transport_details})
花費：${item.estimated_cost}
介紹：${item.description}
`).join('\n')}

--- 天氣預報 ---
${plan.weather_forecast.map((w, i) => `第 ${i+1} 天：${w.temp} (${w.condition})`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.destination}_行程規劃.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <Compass size={24} />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight">TravelAI</h1>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">目的地</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                placeholder="想去哪裡？"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">開始日期</label>
            <div className="flex items-center gap-2">
              <Calendar className="text-slate-400" size={18} />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">天數</label>
            <div className="flex items-center gap-2">
              <Calendar className="text-slate-400" size={18} />
              <input 
                type="number" 
                min="1" 
                max="14"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">想去的景點 (以逗點分隔)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={mustVisitLocations}
                onChange={(e) => setMustVisitLocations(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                placeholder="例如：東京鐵塔, 淺草寺"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">旅行風格</label>
            <select 
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all appearance-none"
            >
              <option>文化與美食</option>
              <option>冒險挑戰</option>
              <option>放鬆身心</option>
              <option>親子友善</option>
              <option>小資窮遊</option>
            </select>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <TrendingUp size={18} />
                生成行程
              </>
            )}
          </button>
        </div>

        <div className="mt-auto p-4 bg-orange-50 rounded-2xl border border-orange-100">
          <p className="text-sm text-orange-800 font-medium mb-1">小撇步</p>
          <p className="text-xs text-orange-600 leading-relaxed">
            試試「深度文化之旅」來獲得最道地的在地景點推薦！
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <header className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-orange-500 font-semibold text-sm mb-1">
                <Navigation size={14} />
                <span>您的專屬旅程</span>
              </div>
              <h2 className="text-4xl font-display font-bold text-slate-900">
                {plan?.destination || destination}
              </h2>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={downloadItinerary}
                disabled={!plan}
                className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Download size={18} />
                <span className="font-semibold text-sm">下載行程</span>
              </button>
              <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-500" />
                <span className="font-semibold text-slate-700">{plan?.total_budget || '--'}</span>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-display font-bold flex items-center gap-2">
                <Clock size={20} className="text-orange-500" />
                行程時間軸
              </h3>
              
              <div className="relative pl-8 space-y-12">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200" />
                
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-4">
                      <div className="h-6 w-32 bg-slate-200 rounded" />
                      <div className="h-24 w-full bg-slate-100 rounded-2xl" />
                    </div>
                  ))
                ) : plan?.itinerary.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx} 
                    className="relative"
                  >
                    <div className="absolute -left-[25px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-orange-500 z-10" />
                    
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-bold text-orange-500">第 {item.day} 天</span>
                      <span className="text-sm font-medium text-slate-400">•</span>
                      <span className="text-sm font-medium text-slate-500">{item.date}</span>
                      <span className="text-sm font-medium text-slate-400">•</span>
                      <span className="text-sm font-mono font-medium text-slate-500">{item.time}</span>
                    </div>

                    <div 
                      onClick={() => setSelectedLocation(item.location)}
                      className={cn(
                        "glass p-5 rounded-2xl transition-all group cursor-pointer border-2",
                        selectedLocation === item.location ? "border-orange-500 shadow-orange-100" : "border-transparent hover:border-orange-200"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                          {item.location}
                        </h4>
                        <div 
                          className="relative"
                          onMouseEnter={() => setActiveTransportInfo(idx)}
                          onMouseLeave={() => setActiveTransportInfo(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTransportInfo(activeTransportInfo === idx ? null : idx);
                          }}
                        >
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 hover:bg-orange-100 hover:text-orange-600 transition-colors">
                            <Bus size={12} />
                            {item.transportation}
                            <Info size={12} className="opacity-40" />
                          </div>
                          
                          <AnimatePresence>
                            {activeTransportInfo === idx && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-20 pointer-events-none"
                              >
                                <p className="font-bold mb-1 text-orange-400">交通詳細說明</p>
                                <p className="leading-relaxed opacity-90">{item.transport_details}</p>
                                <div className="absolute top-full right-4 border-8 border-transparent border-t-slate-900" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed mb-4">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                          <DollarSign size={14} />
                          預估花費: <span className="text-slate-700">{item.estimated_cost}</span>
                        </div>
                        <button className="text-xs font-bold text-orange-500 flex items-center gap-1 hover:gap-2 transition-all">
                          查看地圖 <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Side Widgets */}
            <div className="space-y-8">
              {/* Q-Style Map */}
              <section className="glass p-6 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Compass size={20} className="text-orange-500" />
                    Q版手繪地圖
                  </h3>
                  {plan && !qMapUrl && !mapLoading && (
                    <button 
                      onClick={handleGenerateQMap}
                      className="text-[10px] font-bold text-orange-500 hover:text-orange-600 border border-orange-200 px-2 py-1 rounded-lg transition-colors"
                    >
                      生成手繪圖
                    </button>
                  )}
                </div>
                <div className="aspect-square rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center relative overflow-hidden">
                  {mapLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                      <p className="text-[10px] font-bold text-slate-400">正在繪製 Q 版地圖...</p>
                    </div>
                  ) : qMapUrl ? (
                    <img src={qMapUrl} alt="Q-style Map" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-center p-6">
                      <Compass size={40} className="mx-auto mb-2 text-slate-200" />
                      <p className="text-xs text-slate-400">點擊按鈕生成專屬手繪地圖</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Weather */}
              <section className="glass p-6 rounded-3xl overflow-hidden relative">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-100 rounded-full blur-2xl opacity-50" />
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Cloud size={20} className="text-blue-500" />
                  天氣預報
                </h3>
                <div className="space-y-4">
                  {plan?.weather_forecast.map((w, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-orange-500">
                          {w.icon.includes('sun') ? <Sun size={20} /> : w.icon.includes('rain') ? <CloudRain size={20} /> : <Cloud size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{w.date}</p>
                          <p className="text-xs text-slate-500">{w.condition}</p>
                        </div>
                      </div>
                      <span className="text-lg font-display font-bold">{w.temp}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Google Map Widget */}
              <section className="glass p-4 rounded-3xl h-80 relative overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-orange-500" />
                    <span className="font-bold text-sm">Google 地圖</span>
                  </div>
                  {selectedLocation && (
                    <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[120px]">
                      {selectedLocation}
                    </span>
                  )}
                </div>
                <div className="flex-1 rounded-2xl overflow-hidden bg-slate-100 relative">
                  {selectedLocation ? (
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'}&q=${encodeURIComponent(selectedLocation + ' ' + (plan?.destination || destination))}`}
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                      <MapIcon size={40} className="mb-2 opacity-20" />
                      <p className="text-xs">點擊行程中的景點以查看地圖</p>
                    </div>
                  )}
                  {/* Fallback if no API key is provided - show a static map link or message */}
                  {(!process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') && selectedLocation && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
                      <p className="text-xs mb-4">請在環境變數中設定 GOOGLE_MAPS_API_KEY 以啟用嵌入式地圖。</p>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLocation + ' ' + (plan?.destination || destination))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-orange-500 rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors"
                      >
                        在 Google 地圖中開啟
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {/* Recommendations */}
              <section className="glass p-6 rounded-3xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Utensils size={20} className="text-orange-500" />
                  在地推薦
                </h3>
                <div className="space-y-3">
                  {(plan?.destination === '東京' || !plan ? ['一蘭拉麵', '築地外市場', '黃金街酒吧'] : ['在地特色美食 1', '在地特色美食 2', '在地特色美食 3']).map((rec, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">
                        <img src={`https://picsum.photos/seed/${rec}/100/100`} referrerPolicy="no-referrer" alt={rec} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold group-hover:text-orange-600 transition-colors">{rec}</p>
                        <p className="text-xs text-slate-500">必試的在地美味</p>
                      </div>
                      <Plus size={16} className="text-slate-300 group-hover:text-orange-500" />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Chat */}
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-20 right-0 w-96 h-[500px] glass rounded-3xl flex flex-col overflow-hidden shadow-2xl border-orange-100"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Compass size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">旅遊助手</p>
                    <p className="text-[10px] text-white/60 uppercase tracking-widest">由 Gemini 提供技術支援</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/10 p-1 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm",
                    msg.role === 'user' 
                      ? "bg-orange-500 text-white ml-auto rounded-tr-none" 
                      : "bg-slate-100 text-slate-700 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="隨便問我..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-500"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center hover:bg-orange-600 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-16 h-16 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-orange-500 transition-all active:scale-90 group relative"
        >
          <MessageSquare size={28} className={cn("transition-all", isChatOpen ? "rotate-90 opacity-0 scale-0" : "opacity-100 scale-100")} />
          <X size={28} className={cn("absolute transition-all", isChatOpen ? "rotate-0 opacity-100 scale-100" : "opacity-0 scale-0")} />
          {!isChatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white animate-bounce" />
          )}
        </button>
      </div>
    </div>
  );
}
