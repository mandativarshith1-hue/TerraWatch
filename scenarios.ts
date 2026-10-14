import type { ScenarioData, ScenarioId, TimelineFrame, DisasterEvent, UnifiedAlert, WeatherData } from "@/types";

function makeBaseWeather(overrides: Partial<WeatherData>): WeatherData {
  const now = new Date();
  const hourTimes: string[] = [];
  const dayTimes: string[] = [];
  for (let i = 0; i < 168; i++) {
    const d = new Date(now);
    d.setHours(d.getHours() + i);
    hourTimes.push(d.toISOString());
  }
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    dayTimes.push(d.toISOString().slice(0, 10));
  }

  return {
    current: {
      temperature: 28,
      apparentTemperature: 30,
      precipitation: 0,
      rain: 0,
      windSpeed: 15,
      windGusts: 25,
      pressure: 1010,
      humidity: 70,
      visibility: 10000,
      cloudCover: 40,
      weatherCode: 3,
      isDay: true,
      time: now.toISOString(),
      ...overrides.current,
    },
    hourly: {
      time: hourTimes,
      temperature: Array(168).fill(28),
      precipitation: Array(168).fill(0),
      rain: Array(168).fill(0),
      windSpeed: Array(168).fill(15),
      windGusts: Array(168).fill(25),
      visibility: Array(168).fill(10000),
      pressure: Array(168).fill(1010),
      humidity: Array(168).fill(70),
      cloudCover: Array(168).fill(40),
      weatherCode: Array(168).fill(3),
      ...overrides.hourly,
    },
    daily: {
      time: dayTimes,
      temperatureMax: [32, 33, 34, 33, 32, 31, 30],
      temperatureMin: [24, 25, 25, 24, 24, 23, 23],
      precipitationSum: [5, 2, 1, 3, 8, 12, 6],
      rainSum: [5, 2, 1, 3, 8, 12, 6],
      windSpeedMax: [25, 20, 18, 22, 30, 28, 24],
      windGustsMax: [35, 30, 25, 32, 45, 40, 35],
      weatherCode: [3, 3, 2, 3, 61, 63, 3],
      sunrise: dayTimes.map((d) => `${d}T06:00`),
      sunset: dayTimes.map((d) => `${d}T18:30`),
      uvIndexMax: [7, 8, 8, 7, 5, 4, 6],
      ...overrides.daily,
    },
    timezone: "UTC",
    fetchedAt: Date.now(),
  };
}

export const SCENARIOS: Record<ScenarioId, ScenarioData> = {
  live: {
    id: "live",
    name: "Live Data",
    description: "Real-time data from Open-Meteo, USGS, NASA EONET, and NWS",
    centerLat: 20,
    centerLon: 80,
    zoom: 2.5,
    events: [],
    alerts: [],
    weather: makeBaseWeather({}),
    riskAssessments: [],
    timelineHours: 0,
    timelineData: [],
  },

  "chennai-cyclone": {
    id: "chennai-cyclone",
    name: "Chennai Cyclone",
    description: "Cyclone Nivar-style landfall near Chennai with 120 km/h winds and heavy rainfall",
    centerLat: 13.0827,
    centerLon: 80.2707,
    zoom: 4,
    events: [
      {
        id: "sim-cyclone-1",
        type: "cyclone",
        title: "Cyclone Simulation — Landfall near Chennai",
        description: "Severe cyclonic storm making landfall with sustained winds of 120 km/h. Storm surge of 1-2m expected along coast.",
        location: "Chennai, Tamil Nadu, India",
        lat: 13.0827,
        lon: 80.2707,
        severity: "emergency",
        source: "simulation",
        sourceLabel: "Simulated scenario",
        time: new Date().toISOString(),
        alertLevel: "severe",
        magnitude: 120,
        affectedArea: "Chennai, Kanchipuram, Tiruvallur districts",
        affectedPopulation: "~10 million",
        raw: null,
      },
    ],
    alerts: [],
    weather: makeBaseWeather({
      current: {
        temperature: 27,
        apparentTemperature: 32,
        precipitation: 85,
        rain: 85,
        windSpeed: 120,
        windGusts: 145,
        pressure: 980,
        humidity: 92,
        visibility: 3000,
        cloudCover: 95,
        weatherCode: 95,
        isDay: true,
        time: new Date().toISOString(),
      },
      daily: {
        temperatureMax: [29, 28, 27, 28, 30, 31, 32],
        temperatureMin: [25, 24, 24, 25, 25, 25, 26],
        precipitationSum: [120, 85, 45, 20, 10, 5, 3],
        rainSum: [120, 85, 45, 20, 10, 5, 3],
        windSpeedMax: [120, 95, 60, 40, 30, 25, 20],
        windGustsMax: [145, 110, 75, 50, 38, 32, 28],
        weatherCode: [95, 95, 80, 63, 61, 3, 2],
        sunrise: Array(7).fill("").map((_, i) => `${new Date().toISOString().slice(0, 10)}T06:00`),
        sunset: Array(7).fill("").map((_, i) => `${new Date().toISOString().slice(0, 10)}T18:30`),
        uvIndexMax: [1, 2, 4, 6, 7, 8, 8],
      },
      hourly: {
        ...makeBaseWeather({}).hourly,
        temperature: Array(168).fill(0).map((_, i) => 28 - Math.sin(i / 6) * 2),
        rain: Array(168).fill(0).map((_, i) => {
          if (i < 12) return 15 + Math.sin(i / 2) * 8;
          if (i < 24) return 8 + Math.sin(i / 3) * 5;
          return Math.max(0, 3 - (i - 24) / 20);
        }),
        windSpeed: Array(168).fill(0).map((_, i) => {
          if (i < 6) return 120 - i * 5;
          if (i < 24) return Math.max(30, 90 - i * 2.5);
          return Math.max(15, 30 - (i - 24) / 4);
        }),
        windGusts: Array(168).fill(0).map((_, i) => {
          if (i < 6) return 145 - i * 5;
          if (i < 24) return Math.max(45, 115 - i * 3);
          return Math.max(25, 45 - (i - 24) / 3);
        }),
        pressure: Array(168).fill(0).map((_, i) => {
          if (i < 12) return 980 + i * 2;
          if (i < 48) return 1004 + (i - 12) * 0.5;
          return 1013;
        }),
      },
    }),
    riskAssessments: [],
    timelineHours: 48,
    timelineData: Array(48).fill(null).map((_, i) => {
      const windSpeed = i < 6 ? 120 - i * 5 : Math.max(30, 90 - i * 2.5);
      const gusts = i < 6 ? 145 - i * 5 : Math.max(45, 115 - i * 3);
      const rain = i < 12 ? 15 + Math.sin(i / 2) * 8 : Math.max(0, 8 - (i - 12) / 3);
      const pressure = i < 12 ? 980 + i * 2 : Math.min(1013, 1004 + (i - 12) * 0.5);
      const cycloneScore = Math.min(100, (gusts / 150) * 60 + (windSpeed / 120) * 30 + Math.max(0, (1013 - pressure) / 33 * 10));
      const floodScore = Math.min(100, (rain / 30) * 50 + (gusts / 150) * 20 + 20);
      const riskLevel = cycloneScore >= 70 ? "severe" : cycloneScore >= 45 ? "high" : cycloneScore >= 25 ? "moderate" : "low";
      return {
        hour: i,
        label: `T+${i}h`,
        weather: {
          windSpeed,
          windGusts: gusts,
          rain,
          pressure,
          temperature: 28 - Math.sin(i / 6) * 2,
          precipitation: rain,
          apparentTemperature: 32,
          humidity: 92,
          visibility: 3000,
          cloudCover: 95,
          weatherCode: 95,
          isDay: true,
          time: new Date(Date.now() + i * 3600000).toISOString(),
        },
        riskScores: {
          cyclone: Math.round(cycloneScore),
          flood: Math.round(floodScore),
          extremeRainfall: Math.round(floodScore * 0.8),
        },
        alertLevel: riskLevel,
      } as TimelineFrame;
    }),
  },

  "assam-flood": {
    id: "assam-flood",
    name: "Assam Flood",
    description: "Brahmaputra river overflow with 200mm rainfall over 72 hours affecting Assam",
    centerLat: 26.1445,
    centerLon: 91.7362,
    zoom: 5,
    events: [
      {
        id: "sim-flood-1",
        type: "flood",
        title: "Brahmaputra River Flood — Assam",
        description: "Severe flooding along the Brahmaputra river basin. River discharge at 8000 m³/s, well above danger level. 15 districts affected.",
        location: "Guwahati, Assam, India",
        lat: 26.1445,
        lon: 91.7362,
        severity: "emergency",
        source: "simulation",
        sourceLabel: "Simulated scenario",
        time: new Date().toISOString(),
        alertLevel: "severe",
        affectedArea: "15 districts of Assam",
        affectedPopulation: "~4.5 million",
        raw: null,
      },
    ],
    alerts: [],
    weather: makeBaseWeather({
      current: {
        temperature: 26,
        apparentTemperature: 29,
        precipitation: 75,
        rain: 75,
        windSpeed: 35,
        windGusts: 50,
        pressure: 998,
        humidity: 95,
        visibility: 2000,
        cloudCover: 90,
        weatherCode: 63,
        isDay: true,
        time: new Date().toISOString(),
      },
      daily: {
        temperatureMax: [28, 27, 26, 27, 29, 30, 31],
        temperatureMin: [23, 23, 22, 23, 24, 24, 25],
        precipitationSum: [85, 75, 60, 40, 20, 10, 5],
        rainSum: [85, 75, 60, 40, 20, 10, 5],
        windSpeedMax: [35, 30, 28, 25, 22, 20, 18],
        windGustsMax: [50, 42, 38, 32, 28, 25, 22],
        weatherCode: [63, 63, 61, 61, 3, 2, 2],
        sunrise: Array(7).fill("").map(() => `${new Date().toISOString().slice(0, 10)}T05:30`),
        sunset: Array(7).fill("").map(() => `${new Date().toISOString().slice(0, 10)}T17:45`),
        uvIndexMax: [2, 3, 4, 5, 7, 8, 8],
      },
      hourly: {
        ...makeBaseWeather({}).hourly,
        rain: Array(168).fill(0).map((_, i) => {
          if (i < 48) return Math.max(0, 12 - Math.abs(i - 24) / 4);
          return Math.max(0, 5 - (i - 48) / 20);
        }),
        temperature: Array(168).fill(0).map((_, i) => 26 + Math.sin((i + 6) / 6) * 3),
        windSpeed: Array(168).fill(0).map((_, i) => Math.max(15, 35 - i / 4)),
        windGusts: Array(168).fill(0).map((_, i) => Math.max(25, 50 - i / 3)),
        pressure: Array(168).fill(0).map((_, i) => Math.min(1010, 998 + i * 0.25)),
      },
    }),
    riskAssessments: [],
    timelineHours: 72,
    timelineData: Array(72).fill(null).map((_, i) => {
      const rain = i < 48 ? Math.max(0, 12 - Math.abs(i - 24) / 4) : Math.max(0, 5 - (i - 48) / 20);
      const floodScore = Math.min(100, (rain / 20) * 40 + 30 + Math.max(0, 20 - i / 4));
      const landslideScore = Math.min(100, (rain / 20) * 50 + 15);
      const riskLevel = floodScore >= 70 ? "severe" : floodScore >= 45 ? "high" : floodScore >= 25 ? "moderate" : "low";
      return {
        hour: i,
        label: `T+${i}h`,
        weather: {
          rain,
          temperature: 26 + Math.sin((i + 6) / 6) * 3,
          windSpeed: Math.max(15, 35 - i / 4),
          windGusts: Math.max(25, 50 - i / 3),
          precipitation: rain,
          apparentTemperature: 29,
          humidity: 95,
          visibility: 2000,
          cloudCover: 90,
          weatherCode: 63,
          isDay: true,
          pressure: Math.min(1010, 998 + i * 0.25),
          time: new Date(Date.now() + i * 3600000).toISOString(),
        },
        riskScores: {
          flood: Math.round(floodScore),
          extremeRainfall: Math.round(floodScore * 0.85),
          landslide: Math.round(landslideScore),
        },
        alertLevel: riskLevel,
      } as TimelineFrame;
    }),
  },

  "delhi-heatwave": {
    id: "delhi-heatwave",
    name: "Delhi Heatwave",
    description: "Extreme heatwave with temperatures reaching 47°C, 6°C above normal",
    centerLat: 28.6139,
    centerLon: 77.209,
    zoom: 5,
    events: [
      {
        id: "sim-heat-1",
        type: "heatwave",
        title: "Severe Heatwave — Delhi NCR",
        description: "Maximum temperature 47°C, 6.5°C above normal. 5 consecutive days above 45°C. Extreme heat risk for vulnerable populations.",
        location: "Delhi, India",
        lat: 28.6139,
        lon: 77.209,
        severity: "emergency",
        source: "simulation",
        sourceLabel: "Simulated scenario",
        time: new Date().toISOString(),
        alertLevel: "severe",
        affectedArea: "Delhi NCR, Noida, Gurgaon, Faridabad",
        affectedPopulation: "~30 million",
        raw: null,
      },
    ],
    alerts: [],
    weather: makeBaseWeather({
      current: {
        temperature: 47,
        apparentTemperature: 52,
        precipitation: 0,
        rain: 0,
        windSpeed: 12,
        windGusts: 18,
        pressure: 1008,
        humidity: 22,
        visibility: 5000,
        cloudCover: 5,
        weatherCode: 0,
        isDay: true,
        time: new Date().toISOString(),
      },
      daily: {
        temperatureMax: [47, 46, 45, 46, 47, 44, 42],
        temperatureMin: [32, 31, 31, 32, 32, 30, 29],
        precipitationSum: [0, 0, 0, 0, 0, 0, 0],
        rainSum: [0, 0, 0, 0, 0, 0, 0],
        windSpeedMax: [12, 14, 15, 12, 10, 16, 18],
        windGustsMax: [18, 22, 24, 18, 15, 25, 28],
        weatherCode: [0, 0, 0, 0, 0, 1, 1],
        sunrise: Array(7).fill("").map(() => `${new Date().toISOString().slice(0, 10)}T05:30`),
        sunset: Array(7).fill("").map(() => `${new Date().toISOString().slice(0, 10)}T19:15`),
        uvIndexMax: [11, 11, 10, 11, 11, 9, 8],
      },
      hourly: {
        ...makeBaseWeather({}).hourly,
        temperature: Array(168).fill(0).map((_, i) => {
          const base = 35 + Math.sin((i - 6) / 6) * 12;
          return Math.max(30, Math.min(48, base));
        }),
        windSpeed: Array(168).fill(12),
        windGusts: Array(168).fill(18),
        humidity: Array(168).fill(22),
        cloudCover: Array(168).fill(5),
        rain: Array(168).fill(0),
        precipitation: Array(168).fill(0),
      },
    }),
    riskAssessments: [],
    timelineHours: 24,
    timelineData: Array(24).fill(null).map((_, i) => {
      const temp = Math.max(30, Math.min(48, 35 + Math.sin((i - 6) / 6) * 12));
      const apparent = temp + 5;
      const heatScore = Math.min(100, ((temp - 30) / 18) * 50 + ((apparent - 35) / 17) * 30 + 15);
      const riskLevel = heatScore >= 70 ? "severe" : heatScore >= 45 ? "high" : heatScore >= 25 ? "moderate" : "low";
      return {
        hour: i,
        label: `T+${i}h`,
        weather: {
          temperature: temp,
          apparentTemperature: apparent,
          humidity: 22,
          windSpeed: 12,
          windGusts: 18,
          precipitation: 0,
          rain: 0,
          visibility: 5000,
          cloudCover: 5,
          weatherCode: 0,
          isDay: temp > 35,
          pressure: 1008,
          time: new Date(Date.now() + i * 3600000).toISOString(),
        },
        riskScores: {
          heatwave: Math.round(heatScore),
        },
        alertLevel: riskLevel,
      } as TimelineFrame;
    }),
  },

  "mumbai-rainfall": {
    id: "mumbai-rainfall",
    name: "Mumbai Extreme Rainfall",
    description: "Mumbai monsoon deluge with 250mm in 24 hours, waterlogging across the city",
    centerLat: 19.076,
    centerLon: 72.8777,
    zoom: 5,
    events: [
      {
        id: "sim-rain-1",
        type: "extremeRainfall",
        title: "Extreme Rainfall Event — Mumbai",
        description: "250mm rainfall in 24 hours. Severe waterlogging across low-lying areas. Suburban train services affected.",
        location: "Mumbai, Maharashtra, India",
        lat: 19.076,
        lon: 72.8777,
        severity: "emergency",
        source: "simulation",
        sourceLabel: "Simulated scenario",
        time: new Date().toISOString(),
        alertLevel: "severe",
        affectedArea: "Mumbai City and Suburban districts",
        affectedPopulation: "~20 million",
        raw: null,
      },
    ],
    alerts: [],
    weather: makeBaseWeather({
      current: {
        temperature: 25,
        apparentTemperature: 28,
        precipitation: 35,
        rain: 35,
        windSpeed: 45,
        windGusts: 65,
        pressure: 1003,
        humidity: 96,
        visibility: 500,
        cloudCover: 100,
        weatherCode: 95,
        isDay: true,
        time: new Date().toISOString(),
      },
      daily: {
        temperatureMax: [27, 26, 26, 28, 29, 30, 31],
        temperatureMin: [24, 24, 23, 24, 25, 25, 26],
        precipitationSum: [250, 120, 60, 30, 15, 8, 5],
        rainSum: [250, 120, 60, 30, 15, 8, 5],
        windSpeedMax: [45, 35, 28, 22, 18, 15, 14],
        windGustsMax: [65, 48, 38, 30, 25, 22, 20],
        weatherCode: [95, 95, 80, 63, 61, 3, 2],
        sunrise: Array(7).fill("").map(() => `${new Date().toISOString().slice(0, 10)}T06:15`),
        sunset: Array(7).fill("").map(() => `${new Date().toISOString().slice(0, 10)}T19:00`),
        uvIndexMax: [1, 2, 4, 6, 7, 8, 8],
      },
      hourly: {
        ...makeBaseWeather({}).hourly,
        rain: Array(168).fill(0).map((_, i) => {
          if (i < 24) return Math.max(0, 35 - Math.abs(i - 12) * 1.2);
          if (i < 48) return Math.max(0, 15 - Math.abs(i - 36) * 0.8);
          return Math.max(0, 5 - (i - 48) / 15);
        }),
        temperature: Array(168).fill(0).map((_, i) => 25 + Math.sin((i + 6) / 6) * 2),
        windSpeed: Array(168).fill(0).map((_, i) => Math.max(15, 45 - i / 2)),
        windGusts: Array(168).fill(0).map((_, i) => Math.max(25, 65 - i / 1.5)),
        visibility: Array(168).fill(0).map((_, i) => Math.min(10000, 500 + i * 200)),
      },
    }),
    riskAssessments: [],
    timelineHours: 48,
    timelineData: Array(48).fill(null).map((_, i) => {
      const rain = i < 24 ? Math.max(0, 35 - Math.abs(i - 12) * 1.2) : Math.max(0, 15 - Math.abs(i - 36) * 0.8);
      const floodScore = Math.min(100, (rain / 35) * 50 + 25 + Math.max(0, 15 - i / 3));
      const extremeScore = Math.min(100, (rain / 35) * 60 + 20);
      const riskLevel = floodScore >= 70 ? "severe" : floodScore >= 45 ? "high" : floodScore >= 25 ? "moderate" : "low";
      return {
        hour: i,
        label: `T+${i}h`,
        weather: {
          rain,
          temperature: 25 + Math.sin((i + 6) / 6) * 2,
          windSpeed: Math.max(15, 45 - i / 2),
          windGusts: Math.max(25, 65 - i / 1.5),
          precipitation: rain,
          apparentTemperature: 28,
          humidity: 96,
          visibility: Math.min(10000, 500 + i * 200),
          cloudCover: 100,
          weatherCode: 95,
          isDay: true,
          pressure: 1003,
          time: new Date(Date.now() + i * 3600000).toISOString(),
        },
        riskScores: {
          flood: Math.round(floodScore),
          extremeRainfall: Math.round(extremeScore),
        },
        alertLevel: riskLevel,
      } as TimelineFrame;
    }),
  },

  "himalayan-earthquake": {
    id: "himalayan-earthquake",
    name: "Himalayan Earthquake",
    description: "M6.8 earthquake in the Himalayan region with tsunami warning for nearby rivers",
    centerLat: 30.3165,
    centerLon: 78.0322,
    zoom: 5,
    events: [
      {
        id: "sim-quake-1",
        type: "earthquake",
        title: "M6.8 Earthquake — Himalayan Region",
        description: "Magnitude 6.8 earthquake at 35km depth. Felt across Uttarakhand, Himachal Pradesh, and parts of Nepal. Tsunami warning for nearby river valleys.",
        location: "Near Dehradun, Uttarakhand, India",
        lat: 30.3165,
        lon: 78.0322,
        severity: "emergency",
        source: "simulation",
        sourceLabel: "Simulated scenario",
        time: new Date().toISOString(),
        alertLevel: "severe",
        magnitude: 6.8,
        depth: 35,
        tsunamiWarning: true,
        affectedArea: "Uttarakhand, Himachal Pradesh, Western Nepal",
        affectedPopulation: "~5 million",
        raw: null,
      },
    ],
    alerts: [],
    weather: makeBaseWeather({}),
    riskAssessments: [],
    timelineHours: 24,
    timelineData: Array(24).fill(null).map((_, i) => {
      const quakeScore = i < 6 ? 85 : Math.max(30, 85 - i * 3);
      const landslideScore = i < 12 ? Math.min(70, 50 + i * 2) : Math.max(20, 70 - (i - 12) * 3);
      const riskLevel = quakeScore >= 70 ? "severe" : quakeScore >= 45 ? "high" : quakeScore >= 25 ? "moderate" : "low";
      return {
        hour: i,
        label: `T+${i}h`,
        weather: {
          temperature: 20,
          apparentTemperature: 20,
          humidity: 60,
          windSpeed: 10,
          windGusts: 15,
          precipitation: 0,
          rain: 0,
          visibility: 10000,
          cloudCover: 30,
          weatherCode: 2,
          isDay: true,
          pressure: 1010,
          time: new Date(Date.now() + i * 3600000).toISOString(),
        },
        riskScores: {
          earthquake: Math.round(quakeScore),
          landslide: Math.round(landslideScore),
        },
        alertLevel: riskLevel,
      } as TimelineFrame;
    }),
  },
};

export const SCENARIO_LIST = Object.values(SCENARIOS);
