import { GoogleGenAI, Type } from "@google/genai";
import { TravelPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateTravelPlan = async (
  destination: string,
  days: number,
  style: string,
  startDate: string,
  mustVisitLocations: string
): Promise<TravelPlan> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `請扮演專業導遊，為我規劃一份 ${destination} 的 ${days} 天旅遊行程。
行程風格：${style}。
開始日期：${startDate}。
必須包含的地點：${mustVisitLocations || '無'}。
請務必使用繁體中文回答。請確保行程中的日期是從 ${startDate} 開始計算的連續日期。
請注意：預估總花費 (total_budget) 必須是所有行程項目 (itinerary) 中預估花費 (estimated_cost) 的總和。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          destination: { type: Type.STRING },
          days: { type: Type.NUMBER },
          style: { type: Type.STRING },
          startDate: { type: Type.STRING },
          mustVisitLocations: { type: Type.ARRAY, items: { type: Type.STRING } },
          total_budget: { type: Type.STRING, description: "預估總花費" },
          itinerary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.NUMBER },
                date: { type: Type.STRING, description: "YYYY-MM-DD" },
                time: { type: Type.STRING, description: "HH:mm" },
                location: { type: Type.STRING },
                description: { type: Type.STRING },
                transportation: { type: Type.STRING, description: "交通工具簡稱，例如：地鐵、公車、步行" },
                transport_details: { type: Type.STRING, description: "詳細交通說明，包含路線名稱、轉乘資訊或大約步行時間" },
                estimated_cost: { type: Type.STRING },
              },
              required: ["day", "date", "time", "location", "description", "transportation", "transport_details", "estimated_cost"],
            },
          },
          weather_forecast: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "YYYY-MM-DD" },
                temp: { type: Type.STRING },
                condition: { type: Type.STRING },
                icon: { type: Type.STRING, description: "weather icon name like sun, cloud, rain" },
              },
              required: ["date", "temp", "condition", "icon"],
            },
          },
        },
        required: ["destination", "days", "style", "startDate", "mustVisitLocations", "itinerary", "total_budget", "weather_forecast"],
      },
    },
  });

  return JSON.parse(response.text || "{}") as TravelPlan;
};

export const generateQMapImage = async (plan: TravelPlan): Promise<string | null> => {
  const locations = plan.itinerary.map(item => item.location).join(", ");
  const prompt = `A cute, chibi-style (Q-style) illustrated travel map for ${plan.destination}. 
  The map should feature these locations: ${locations}. 
  Include cute icons for each spot, colorful paths, and a whimsical aesthetic. 
  The style should be like a hand-drawn children's book illustration or a trendy travel journal. 
  No text labels, just visual icons representing the spots.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const chatWithAI = async (message: string, context: TravelPlan | null) => {
  const systemInstruction = `你是一位專業的旅遊助手。你正在協助使用者規劃前往 ${context?.destination || '目的地'} 的旅行。
  目前計畫：${JSON.stringify(context || '無')}。
  請提供有幫助、簡潔的建議，並回答有關旅行的問題。請務必使用繁體中文回答。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: message,
    config: {
      systemInstruction,
    },
  });

  return response.text;
};
