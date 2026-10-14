import type { CityLocation, HazardType, SafetyGuidance, EmergencyContact } from "@/types";

export const CITIES: CityLocation[] = [
  { id: "chennai", name: "Chennai", country: "India", lat: 13.0827, lon: 80.2707 },
  { id: "mumbai", name: "Mumbai", country: "India", lat: 19.076, lon: 72.8777 },
  { id: "kolkata", name: "Kolkata", country: "India", lat: 22.5726, lon: 88.3639 },
  { id: "delhi", name: "Delhi", country: "India", lat: 28.6139, lon: 77.209 },
  { id: "guwahati", name: "Guwahati", country: "India", lat: 26.1445, lon: 91.7362 },
  { id: "bhubaneswar", name: "Bhubaneswar", country: "India", lat: 20.296, lon: 85.8245 },
  { id: "bangalore", name: "Bangalore", country: "India", lat: 12.9716, lon: 77.5946 },
  { id: "hyderabad", name: "Hyderabad", country: "India", lat: 17.385, lon: 78.4867 },
  { id: "new-york", name: "New York", country: "USA", lat: 40.7128, lon: -74.006 },
  { id: "los-angeles", name: "Los Angeles", country: "USA", lat: 34.0522, lon: -118.2437 },
  { id: "london", name: "London", country: "UK", lat: 51.5074, lon: -0.1278 },
  { id: "tokyo", name: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503 },
  { id: "jakarta", name: "Jakarta", country: "Indonesia", lat: -6.2088, lon: 106.8456 },
  { id: "sydney", name: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093 },
  { id: "manila", name: "Manila", country: "Philippines", lat: 14.5995, lon: 120.9842 },
  { id: "mexico-city", name: "Mexico City", country: "Mexico", lat: 19.4326, lon: -99.1332 },
  { id: "sao-paulo", name: "São Paulo", country: "Brazil", lat: -23.5505, lon: -46.6333 },
  { id: "cairo", name: "Cairo", country: "Egypt", lat: 30.0444, lon: 31.2357 },
  { id: "dhaka", name: "Dhaka", country: "Bangladesh", lat: 23.8103, lon: 90.4125 },
  { id: "singapore", name: "Singapore", country: "Singapore", lat: 1.3521, lon: 103.8198 },
];

export const HAZARD_META: Record<
  HazardType,
  { label: string; icon: string; colors: Record<string, string>; layerToggle: string }
> = {
  flood: { label: "Flood", icon: "Waves", colors: { low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444" }, layerToggle: "Flood Risk" },
  heatwave: { label: "Heatwave", icon: "ThermometerSun", colors: { low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444" }, layerToggle: "Heatwave" },
  cyclone: { label: "Cyclone/Wind", icon: "Wind", colors: { low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444" }, layerToggle: "Cyclone/Wind" },
  extremeRainfall: { label: "Extreme Rainfall", icon: "CloudRain", colors: { low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444" }, layerToggle: "Extreme Rainfall" },
  earthquake: { label: "Earthquake", icon: "Activity", colors: { low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444" }, layerToggle: "Earthquakes" },
  wildfire: { label: "Wildfire", icon: "Flame", colors: { low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444" }, layerToggle: "Wildfires" },
  volcano: { label: "Volcano", icon: "Mountain", colors: { low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444" }, layerToggle: "Volcanoes" },
  landslide: { label: "Landslide", icon: "TrendingDown", colors: { low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444" }, layerToggle: "Landslides" },
  drought: { label: "Drought", icon: "Sun", colors: { low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444" }, layerToggle: "Drought" },
  coldWave: { label: "Cold Wave", icon: "Snowflake", colors: { low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444" }, layerToggle: "Cold Wave" },
  tsunami: { label: "Tsunami", icon: "Waves", colors: { low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444" }, layerToggle: "Tsunami" },
};

export const RISK_LEVEL_META = {
  low: { label: "Low", color: "#22c55e", bgColor: "bg-green-500/20", textColor: "text-green-400", borderColor: "border-green-500/40" },
  moderate: { label: "Moderate", color: "#eab308", bgColor: "bg-yellow-500/20", textColor: "text-yellow-400", borderColor: "border-yellow-500/40" },
  high: { label: "High", color: "#f97316", bgColor: "bg-orange-500/20", textColor: "text-orange-400", borderColor: "border-orange-500/40" },
  severe: { label: "Severe", color: "#ef4444", bgColor: "bg-red-500/20", textColor: "text-red-400", borderColor: "border-red-500/40" },
} as const;

export const SEVERITY_META = {
  advisory: { label: "Advisory", color: "#3b82f6" },
  watch: { label: "Watch", color: "#eab308" },
  warning: { label: "Warning", color: "#f97316" },
  emergency: { label: "Emergency", color: "#ef4444" },
} as const;

export const SAFETY_GUIDANCE: Record<HazardType, SafetyGuidance> = {
  flood: {
    before: ["Move valuables to higher floors", "Prepare an emergency kit with documents, water, and food", "Know your local evacuation routes", "Keep emergency contact numbers handy"],
    during: ["Do not walk or drive through flood waters", "Move to higher ground immediately", "Turn off electricity and gas", "Stay tuned to local radio for updates"],
    after: ["Wait for official all-clear before returning home", "Check for structural damage before entering buildings", "Boil water before drinking", "Document damage for insurance claims"],
  },
  heatwave: {
    before: ["Stock up on water and oral rehydration salts", "Check on elderly and vulnerable neighbors", "Prepare cooling options: fans, wet cloths", "Close curtains on sun-facing windows"],
    during: ["Stay indoors during peak heat hours (11am-4pm)", "Drink water frequently, avoid alcohol", "Wear light, loose cotton clothing", "Use wet cloths to cool down"],
    after: ["Continue hydration even after temperatures drop", "Check on vulnerable individuals", "Report heat-related illnesses immediately", "Be aware of delayed heat stress effects"],
  },
  cyclone: {
    before: ["Secure loose outdoor items", "Board up windows or close storm shutters", "Stock emergency supplies for 72 hours", "Charge phones and power banks", "Know your nearest cyclone shelter"],
    during: ["Stay indoors, away from windows", "If outdoors, find sturdy shelter immediately", "Do not use candles or open flames", "Listen to emergency broadcasts"],
    after: ["Stay inside until official all-clear", "Avoid fallen power lines", "Check for gas leaks before entering buildings", "Report structural damage to authorities"],
  },
  extremeRainfall: {
    before: ["Clear drains and gutters around your home", "Move vehicles to higher ground", "Keep emergency supplies ready", "Monitor weather updates closely"],
    during: ["Avoid low-lying areas and underpasses", "Do not drive through waterlogged roads", "Stay on upper floors if possible", "Keep phone charged for emergencies"],
    after: ["Assess water damage carefully", "Sanitize flooded areas", "Check for electrical hazards", "Report blocked drains to municipal authorities"],
  },
  earthquake: {
    before: ["Secure heavy furniture to walls", "Identify safe spots in each room", "Prepare an emergency go-bag", "Practice drop, cover, and hold on"],
    during: ["Drop to the ground, take cover under sturdy furniture", "Stay away from windows and outer walls", "If outdoors, move to open ground", "Do not use elevators"],
    after: ["Check for injuries and provide first aid", "Inspect your building for damage", "Be prepared for aftershocks", "Use stairs, not elevators", "Listen to radio for updates"],
  },
  wildfire: {
    before: ["Create a defensible space around your home", "Prepare a go-bag with essentials", "Know at least two evacuation routes", "Keep important documents in a fireproof container"],
    during: ["Evacuate immediately if ordered", "Wear N95 masks to protect from smoke", "Close all windows and doors", "Move flammable items away from windows"],
    after: ["Do not return until officials say it is safe", "Check for hot spots or smoldering areas", "Wear protective clothing and masks", "Document damage for insurance"],
  },
  volcano: {
    before: ["Know your evacuation route and shelter", "Prepare masks and goggles for ash protection", "Stock emergency supplies", "Monitor official volcano observatory updates"],
    during: ["Evacuate immediately if ordered", "Protect yourself from ash: masks, goggles, long sleeves", "Stay upwind of the volcano if possible", "Avoid river valleys and low-lying areas"],
    after: ["Do not return until cleared by authorities", "Clear ash from roofs to prevent collapse", "Protect water sources from contamination", "Seek medical help for breathing difficulties"],
  },
  landslide: {
    before: ["Learn to recognize warning signs: cracks, tilting trees", "Avoid building on steep slopes or near drainage", "Prepare an emergency kit", "Monitor rainfall warnings"],
    during: ["Move away from the path of the landslide", "If trapped, curl into a ball to protect yourself", "Listen for unusual sounds: rumbling, cracking", "Evacuate if told to do so"],
    after: ["Stay away from the slide area", "Check for injured or trapped persons", "Report utility damage immediately", "Watch for secondary slides"],
  },
  drought: {
    before: ["Install water-saving fixtures", "Collect rainwater where permitted", "Plan drought-tolerant landscaping", "Store emergency water supply"],
    during: ["Reduce water use: shorter showers, full laundry loads", "Reuse water where safe", "Avoid watering lawns and washing cars", "Check on vulnerable community members"],
    after: ["Continue conservation until supply is restored", "Inspect water systems for damage", "Support community recovery efforts", "Plan for future drought periods"],
  },
  coldWave: {
    before: ["Insulate pipes and walls", "Stock warm clothing and blankets", "Prepare emergency heating with ventilation", "Check heating systems"],
    during: ["Wear layers and cover extremities", "Keep indoor temperature above 18°C", "Avoid prolonged outdoor exposure", "Check on elderly neighbors"],
    after: ["Thaw frozen pipes carefully", "Check for frostbite and hypothermia", "Inspect home for cold damage", "Restock emergency supplies"],
  },
  tsunami: {
    before: ["Know your evacuation zone and route", "Identify high ground or tall buildings", "Prepare a go-bag", "Learn natural warning signs: receding ocean, ground shaking"],
    during: ["Move to high ground or inland immediately", "Do not wait for official warning if you see signs", "Move on foot if roads are jammed", "Stay away until official all-clear"],
    after: ["Do not return until authorities confirm safe", "Avoid damaged buildings", "Check water and food for contamination", "Stay tuned for aftershock warnings"],
  },
};

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: "Emergency (India)", number: "112", description: "All-in-one emergency number" },
  { name: "Police", number: "100", description: "Police emergency helpline" },
  { name: "Ambulance", number: "108", description: "Emergency medical services" },
  { name: "Fire Brigade", number: "101", description: "Fire and rescue services" },
  { name: "NDMA Helpline", number: "1078", description: "National Disaster Management Authority" },
  { name: "Disaster Management (SMS)", number: "1070", description: "State disaster control room" },
  { name: "Women Helpline", number: "1091", description: "Women's emergency helpline" },
  { name: "Child Helpline", number: "1098", description: "Child emergency helpline" },
];

export interface EmergencyService {
  id: string;
  name: string;
  icon: string;
  number: string;
  description: string;
  searchQuery: string;
  color: string;
}

export const NEARBY_EMERGENCY_SERVICES: EmergencyService[] = [
  { id: "hospital", name: "Hospitals", icon: "Plus", number: "108", description: "Nearest hospitals & emergency rooms", searchQuery: "hospital near me", color: "#ef4444" },
  { id: "police", name: "Police Stations", icon: "Shield", number: "100", description: "Nearest police stations", searchQuery: "police station near me", color: "#3b82f6" },
  { id: "fire", name: "Fire Stations", icon: "Flame", number: "101", description: "Nearest fire stations", searchQuery: "fire station near me", color: "#f97316" },
  { id: "pharmacy", name: "Pharmacies", icon: "Pill", number: "", description: "Nearest pharmacies & medical stores", searchQuery: "pharmacy near me", color: "#22c55e" },
  { id: "shelter", name: "Emergency Shelters", icon: "Home", number: "1078", description: "Nearest emergency & relief shelters", searchQuery: "emergency shelter near me", color: "#eab308" },
  { id: "bloodbank", name: "Blood Banks", icon: "Droplets", number: "", description: "Nearest blood banks & donation centers", searchQuery: "blood bank near me", color: "#ec4899" },
];
