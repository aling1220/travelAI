export interface ItineraryItem {
  day: number;
  date: string;
  time: string;
  location: string;
  description: string;
  transportation: string;
  transport_details: string;
  estimated_cost: string;
}

export interface TravelPlan {
  destination: string;
  days: number;
  style: string;
  startDate: string;
  mustVisitLocations: string[];
  itinerary: ItineraryItem[];
  total_budget: string;
  weather_forecast: {
    date: string;
    temp: string;
    condition: string;
    icon: string;
  }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
