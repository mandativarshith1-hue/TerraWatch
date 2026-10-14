import { Globe2, Satellite, Smartphone, Languages, Building2, Zap, Shield, TrendingUp, Database, Cpu, Info } from "lucide-react";

export default function ImpactPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Impact & Scalability</h1>
          <p className="text-sm text-gray-400">Real-world value, data transparency, and growth path for TerraWatch</p>
        </div>

        {/* Real-world impact */}
        <section className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            Real-World Impact
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImpactCard icon={Zap} title="Earlier Warnings" text="By combining live weather data with threshold-based derived alerts, TerraWatch can flag developing hazards hours before official warnings are issued, giving communities critical preparation time." />
            <ImpactCard icon={TrendingUp} title="Lives Saved" text="Even a 30-minute early warning for cyclones, floods, and tsunamis can reduce casualties by up to 50%. Real-time earthquake and wildfire proximity alerts help people evacuate faster." />
            <ImpactCard icon={Building2} title="Better Resource Planning" text="Authorities can pre-position NDRF teams, emergency supplies, and medical resources based on risk scores. The authority response guidance provides actionable checklists for each hazard level." />
            <ImpactCard icon={Globe2} title="Global Coverage" text="Using free, no-API-key data sources (Open-Meteo, USGS, NASA EONET, NWS), TerraWatch works for any location on Earth. The risk engine adapts thresholds to local conditions." />
          </div>
        </section>

        {/* Scalability */}
        <section className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Scalability Path
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImpactCard icon={Satellite} title="Satellite & IMD/NASA Data" text="Integrate IMD radar, INSAT satellite imagery, and NASA MODIS fire data for richer hazard detection. Add GDACS RSS for global multi-hazard alerts with Red/Orange/Green levels." />
            <ImpactCard icon={Cpu} title="IoT Sensor Integration" text="Connect river level sensors, rain gauges, and seismic monitors for hyper-local real-time data. Edge devices in rural areas can feed the risk engine directly." />
            <ImpactCard icon={Smartphone} title="SMS Alerts for Low-Connectivity" text="Integrate with SMS gateways (Twilio, MSG91) to send alerts to areas without internet. The copy-to-WhatsApp feature is a first step toward this. USSD-based alerts for feature phones." />
            <ImpactCard icon={Languages} title="Multilingual Support" text="Add Hindi, Tamil, Bengali, Marathi, and other regional languages. Safety guidance and alert messages can be localized. Voice alerts for accessibility." />
            <ImpactCard icon={Building2} title="Government Dashboards" text="Deploy as a white-label dashboard for state disaster management authorities. Role-based access for NDRF, SDMA, and district administrations. Integration with existing emergency response systems." />
            <ImpactCard icon={Database} title="More Hazard Types" text="Add avalanche, dust storm, lightning, and heat island effects. Machine learning models can improve risk score accuracy over time with historical data training." />
          </div>
        </section>

        {/* Data transparency */}
        <section className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Info className="h-5 w-5 text-yellow-400" />
            Data Sources & Transparency
          </h2>
          <div className="space-y-3 text-sm">
            <DataSourceRow label="REAL DATA (live APIs, no key needed)" items={[
              "Open-Meteo Forecast API — current weather, hourly, 7-day forecast",
              "Open-Meteo Archive API — historical rainfall and temperature (30 days)",
              "Open-Meteo Flood API — river discharge data",
              "Open-Meteo Geocoding API — city search",
              "USGS Earthquake Feed — all earthquakes (24h) and M4.5+ (week)",
              "NASA EONET v3 — wildfires, volcanoes, storms, floods, drought, landslides",
              "NWS Alerts API — official US weather warnings with severity and instructions",
            ]} color="text-green-400" />
            <DataSourceRow label="DERIVED DATA (computed from forecasts)" items={[
              "Heavy rain warnings: >64.5mm/24h (Orange), >115.6mm/24h (Red) — IMD thresholds",
              "Heatwave warnings: ≥40°C or 4.5°C above historical normal",
              "Strong wind warnings: gusts ≥60 km/h (Orange), ≥90 km/h (Red)",
              "Dense fog advisories: visibility <1000m",
              "Extreme rainfall: >20mm/hr intensity",
              "All derived alerts are clearly labeled 'Derived from forecast, not an official warning'",
            ]} color="text-pink-400" />
            <DataSourceRow label="SIMULATED DATA (for demo)" items={[
              "Chennai Cyclone — M120 winds, 980 hPa pressure, 120mm rainfall",
              "Assam Flood — 200mm/72h rainfall, Brahmaputra overflow",
              "Delhi Heatwave — 47°C, 6.5°C above normal, 5 consecutive days",
              "Mumbai Extreme Rainfall — 250mm/24h, severe waterlogging",
              "Himalayan Earthquake — M6.8, 35km depth, tsunami warning",
              "All simulated data is clearly marked with a SIMULATED badge",
            ]} color="text-orange-400" />
          </div>
        </section>

        {/* Demo scenario note */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <h3 className="text-sm font-semibold text-blue-400 mb-1">Demo Scenario for Judges</h3>
          <p className="text-xs text-gray-400">
            Switch to "Chennai Cyclone" in Simulation Mode to see the full system in action:
            wind speeds, pressure drop, rainfall, and risk scores evolving hour by hour on the time slider,
            with safety guidance and emergency response instructions for residents and authorities.
          </p>
        </div>
      </div>
    </div>
  );
}

function ImpactCard({ icon: Icon, title, text }: { icon: typeof Globe2; title: string; text: string }) {
  return (
    <div className="rounded-lg bg-slate-800/50 p-3">
      <Icon className="h-5 w-5 text-blue-400 mb-2" />
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{text}</p>
    </div>
  );
}

function DataSourceRow({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div>
      <h4 className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${color}`}>{label}</h4>
      <ul className="space-y-1 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-400 list-disc">{item}</li>
        ))}
      </ul>
    </div>
  );
}
