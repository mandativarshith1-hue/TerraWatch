import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { DisasterEvent, RiskLevel } from "@/types";
import { useTheme } from "@/context/ThemeContext";

const EARTH_RADIUS = 2;
const ROTATION_SPEED = 0.03;

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

interface EarthProps {
  onGlobeClick: (lat: number, lon: number) => void;
  isLight: boolean;
}

function Earth({ onGlobeClick, isLight }: EarthProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const url = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
    return loader.load(url);
  }, [isLight]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const point = e.point.clone();
    const local = e.object.worldToLocal(point);
    const r = local.length();
    const lat = 90 - (Math.acos(local.y / r) * 180) / Math.PI;
    const lon = ((Math.atan2(local.z, -local.x) * 180) / Math.PI) - 180;
    const normalizedLon = ((lon + 540) % 360) - 180;
    onGlobeClick(lat, normalizedLon);
  };

  return (
    <mesh ref={meshRef} onClick={handleClick}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshPhongMaterial map={texture} shininess={10} />
    </mesh>
  );
}

function Atmosphere({ isLight }: { isLight: boolean }) {
  return (
    <mesh scale={1.15}>
      <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
      <meshBasicMaterial
        color={isLight ? "#4a9eff" : "#3b82f6"}
        transparent
        opacity={0.08}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function Clouds() {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load("https://unpkg.com/three-globe/example/img/earth-topology.png");
  }, []);

  return (
    <mesh scale={1.01}>
      <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
      <meshPhongMaterial map={texture} transparent opacity={0.25} depthWrite={false} />
    </mesh>
  );
}

interface MarkerProps {
  lat: number;
  lon: number;
  color: string;
  size: number;
  onClick: () => void;
  pulse?: boolean;
}

function Marker({ lat, lon, color, size, onClick, pulse }: MarkerProps) {
  const ref = useRef<THREE.Mesh>(null);
  const position = useMemo(() => latLonToVector3(lat, lon, EARTH_RADIUS * 1.01), [lat, lon]);

  useFrame((state) => {
    if (ref.current && pulse) {
      const s = size * (1 + Math.sin(state.clock.elapsedTime * 3) * 0.3);
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={ref} position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

interface RingMarkerProps {
  lat: number;
  lon: number;
  color: string;
  size: number;
  onClick: () => void;
}

function RingMarker({ lat, lon, color, size, onClick }: RingMarkerProps) {
  const ref = useRef<THREE.Mesh>(null);
  const position = useMemo(() => latLonToVector3(lat, lon, EARTH_RADIUS * 1.02), [lat, lon]);

  useFrame((state) => {
    if (ref.current) {
      const t = (state.clock.elapsedTime * 1.5) % 1;
      const s = 1 + t * 3;
      ref.current.scale.setScalar(s);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.6;
    }
  });

  const orientation = useMemo(() => {
    const pos = latLonToVector3(lat, lon, EARTH_RADIUS);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.normalize());
    return quaternion;
  }, [lat, lon]);

  return (
    <mesh ref={ref} position={position} quaternion={orientation} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <ringGeometry args={[size * 0.8, size, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
}

interface PinMarkerProps {
  lat: number;
  lon: number;
  color: string;
  onClick: () => void;
}

function PinMarker({ lat, lon, color, onClick }: PinMarkerProps) {
  const position = useMemo(() => latLonToVector3(lat, lon, EARTH_RADIUS * 1.02), [lat, lon]);
  const stickEnd = useMemo(() => latLonToVector3(lat, lon, EARTH_RADIUS * 1.15), [lat, lon]);

  return (
    <group>
      <mesh position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([position.x, position.y, position.z, stickEnd.x, stickEnd.y, stickEnd.z]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={2} />
      </mesh>
    </group>
  );
}

interface RotatingGroupProps {
  children: React.ReactNode;
}

function RotatingGroup({ children }: RotatingGroupProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * ROTATION_SPEED;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

interface FlyToControllerProps {
  target: { lat: number; lon: number } | null;
  controlsRef: React.RefObject<{ target: THREE.Vector3 } | null>;
}

function FlyToController({ target, controlsRef }: FlyToControllerProps) {
  const { camera } = useThree();
  const animatingRef = useRef(false);
  const targetRef = useRef(new THREE.Vector3());
  const startRef = useRef(new THREE.Vector3());
  const progressRef = useRef(0);

  useEffect(() => {
    if (!target) return;
    const pos = latLonToVector3(target.lat, target.lon, EARTH_RADIUS * 3.5);
    startRef.current.copy(camera.position);
    targetRef.current.copy(pos);
    progressRef.current = 0;
    animatingRef.current = true;
  }, [target, camera]);

  useFrame((_, delta) => {
    if (!animatingRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta * 1.5);
    const t = 1 - Math.pow(1 - progressRef.current, 3);
    camera.position.lerpVectors(startRef.current, targetRef.current, t);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
    }
    if (progressRef.current >= 1) animatingRef.current = false;
  });

  return null;
}

interface GlobeProps {
  events: DisasterEvent[];
  cityMarkers: { lat: number; lon: number; level: RiskLevel; name: string; id: string }[];
  customPin: { lat: number; lon: number } | null;
  onGlobeClick: (lat: number, lon: number) => void;
  onMarkerClick: (event: DisasterEvent) => void;
  onCityClick: (city: { id: string; name: string; lat: number; lon: number; country: string }) => void;
  flyTo: { lat: number; lon: number } | null;
  isLight: boolean;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "#22c55e",
  moderate: "#eab308",
  high: "#f97316",
  severe: "#ef4444",
};

export default function GlobeScene({
  events,
  cityMarkers,
  customPin,
  onGlobeClick,
  onMarkerClick,
  onCityClick,
  flyTo,
  isLight,
}: GlobeProps) {
  const controlsRef = useRef<{ target: THREE.Vector3 } | null>(null);
  const { mode } = useTheme();

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={isLight ? 1.2 : 0.9} />
      <directionalLight position={[5, 3, 5]} intensity={isLight ? 2.5 : 2.2} />
      <pointLight position={[-5, -3, -5]} intensity={0.6} color="#4a9eff" />

      {!isLight && <Stars radius={100} depth={50} count={3000} factor={4} fade speed={0} />}

      <RotatingGroup>
        <Earth onGlobeClick={onGlobeClick} isLight={isLight} />
        <Clouds />
        <Atmosphere isLight={isLight} />

        {cityMarkers.map((city) => (
          <Marker
            key={city.id}
            lat={city.lat}
            lon={city.lon}
            color={RISK_COLORS[city.level]}
            size={0.035}
            pulse={city.level === "severe" || city.level === "high"}
            onClick={() => onCityClick({ id: city.id, name: city.name, lat: city.lat, lon: city.lon, country: "" })}
          />
        ))}

        {events.slice(0, 50).map((event) => {
          const color = RISK_COLORS[event.alertLevel ?? event.riskLevel ?? "moderate"];
          const size = event.magnitude ? Math.max(0.03, Math.min(0.12, event.magnitude / 80)) : 0.04;
          return (
            <RingMarker
              key={event.id}
              lat={event.lat}
              lon={event.lon}
              color={color}
              size={size}
              onClick={() => onMarkerClick(event)}
            />
          );
        })}

        {customPin && (
          <PinMarker
            lat={customPin.lat}
            lon={customPin.lon}
            color="#3b82f6"
            onClick={() => onGlobeClick(customPin.lat, customPin.lon)}
          />
        )}
      </RotatingGroup>

      <FlyToController target={flyTo} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef as never}
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
    </Canvas>
  );
}
