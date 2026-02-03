"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { galleryLocations, GalleryLocation } from "../data/galleryData";
import gsap from "gsap";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface Globe3DProps {
  onLocationSelect: (location: GalleryLocation) => void;
  selectedLocation: GalleryLocation | null;
  onTransitionComplete?: () => void;
  isExiting?: boolean;
}

// Convert Lat/Lng to Vector3
const calcPosFromLatLngRad = (lat: number, lng: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return [x, y, z] as [number, number, number];
};

const LocationMarker = ({
  location,
  onClick,
}: {
  location: GalleryLocation;
  onClick: (loc: GalleryLocation) => void;
}) => {
  const position = useMemo(
    () => calcPosFromLatLngRad(location.lat, location.lng, 2.05),
    [location.lat, location.lng],
  );
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.lookAt(0, 0, 0);
    }
  });

  // Scale animation on hover
  const scale = hovered ? 1.5 : 1;

  return (
    <group position={position} ref={ref}>
      {/* Hit Area - Transparent but visible to raycaster */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick(location);
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
          setHovered(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          setHovered(false);
        }}
      >
        <circleGeometry args={[0.25, 32]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Visible Marker */}
      <mesh scale={[scale, scale, scale]} position={[0, 0, 0.002]}>
        <circleGeometry args={[0.08, 32]} />
        <meshBasicMaterial
          color={hovered ? "#ffffff" : "#ff4444"}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Pulse effect ring */}
      <mesh
        scale={[scale * 1.5, scale * 1.5, scale * 1.5]}
        position={[0, 0, -0.01]}
      >
        <ringGeometry args={[0.08, 0.1, 32]} />
        <meshBasicMaterial
          color="#ff4444"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <Html
        distanceFactor={10}
        position={[0, 0, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`px-3 py-2 bg-black border border-white/40 text-[10px] text-white font-mono uppercase tracking-[0.2em] whitespace-nowrap transition-opacity duration-300 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
          style={{
            transform: "translate(-50%, -150%)", // Center horizontally, move up
            pointerEvents: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          {location.name}
        </div>
      </Html>
    </group>
  );
};

// Cache points globally to avoid regeneration on remount
let cachedPoints: Float32Array | null = null;

const DotSphere = () => {
  // Use a ref to store points so we don't re-calculate unnecessarily
  const [points, setPoints] = useState<Float32Array | null>(cachedPoints);

  useEffect(() => {
    if (cachedPoints) {
      setPoints(cachedPoints);
      return;
    }

    const generatePoints = async () => {
      const img = new Image();
      img.src = "/images/earth_specular_2048.jpg";
      img.crossOrigin = "Anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const width = img.width;
        const height = img.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const tempPoints: number[] = [];
        const radius = 2;

        // Denser points for continuous neon look
        const step = 4;

        for (let y = 0; y < height; y += step) {
          for (let x = 0; x < width; x += step) {
            // Get pixel index
            const index = (y * width + x) * 4;
            // Earth specular map: Red channel (or simple brightness) indicates land
            // Values are typically 0-255. Let's pick a threshold.
            const brightness = data[index];

            // If pixel is dark, it's ocean (or whatever the user wants 'black' to be)
            // User requested "invert... so that only black gets the points"
            if (brightness < 50) {
              // Convert x,y to lat,lon
              // UV mapping: u = x / width, v = y / height
              // phi = v * PI (0 to PI)
              // theta = u * 2PI (0 to 2PI)

              const phi = (y / height) * Math.PI;

              // Remove offset to align with LocationMarker's lat/lng system
              // LocationMarker assumes theta 0 = -180 deg, theta 2PI = +180 deg
              // Standard equirectangular maps match this (Left edge = -180).
              const theta = (x / width) * 2 * Math.PI;

              // Convert Spherical to Cartesian
              // We use same logic as calcPosFromLatLngRad roughly
              const vx = -(radius * Math.sin(phi) * Math.cos(theta));
              const vz = radius * Math.sin(phi) * Math.sin(theta);
              const vy = radius * Math.cos(phi);

              tempPoints.push(vx, vy, vz);
            }
          }
        }
        const finalPoints = new Float32Array(tempPoints);
        cachedPoints = finalPoints;
        setPoints(finalPoints);
      };
    };

    generatePoints();
  }, []);

  if (!points) return null;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      {/* Neon Material */}
      <pointsMaterial
        size={0.02}
        color={new THREE.Color("#4a9eff").multiplyScalar(1.5)} // HDR Color for Bloom
        sizeAttenuation={true}
        transparent
        opacity={0.8}
        toneMapped={false} // Crucial for Bloom
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const CameraController = ({
  selectedLocation,
  onTransitionComplete,
  isExiting,
}: {
  selectedLocation: GalleryLocation | null;
  onTransitionComplete?: () => void;
  isExiting?: boolean;
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isFocusing = useRef(false);

  // Handle Exit Animation
  useEffect(() => {
    if (isExiting) {
      if (controlsRef.current) controlsRef.current.enabled = false;
      
      gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 20, // Zoom out far
        duration: 1.5,
        ease: "power2.in",
        onUpdate: () => camera.lookAt(0, 0, 0),
      });
      return;
    }
  }, [isExiting, camera]);

  useEffect(() => {
    if (isExiting) return;
    if (!controlsRef.current) return;

    if (selectedLocation) {
      // 1. Calculate Target Position
      const [x, y, z] = calcPosFromLatLngRad(
        selectedLocation.lat,
        selectedLocation.lng,
        4.5,
      ); // 4.5 is camera distance
      const targetPosition = new THREE.Vector3(x, y, z);

      // 2. Animate Camera
      isFocusing.current = true;
      controlsRef.current.autoRotate = false; // Stop rotation

      gsap.to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1.0, // Slightly faster overall
        ease: "power3.inOut", // Higher acceleration curve
        onUpdate: () => {
          // Keep looking at center during animation
          camera.lookAt(0, 0, 0);
        },
        onComplete: () => {
          // Ensure final lock
          camera.lookAt(0, 0, 0);
          if (onTransitionComplete) onTransitionComplete();
        },
      });
    } else {
      // Reset / Back to AutoRotate
      // We don't necessarily need to move the camera back, just re-enable rotation
      if (controlsRef.current) {
        controlsRef.current.autoRotate = true;
      }
    }
  }, [selectedLocation, camera, isExiting]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      minDistance={3}
      maxDistance={8}
      autoRotate={true}
      autoRotateSpeed={0.5}
    />
  );
};

export default function Globe3D({
  onLocationSelect,
  selectedLocation,
  onTransitionComplete,
  isExiting,
}: Globe3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />

        <group rotation={[0, 0, 0]}>
          <DotSphere />
          {/* Inner sphere to block background stars appearing through the globe */}
          <mesh>
            <sphereGeometry args={[1.95, 32, 32]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>

        {galleryLocations.map((loc) => (
          <LocationMarker
            key={loc.id}
            location={loc}
            onClick={onLocationSelect}
          />
        ))}

        <CameraController
          selectedLocation={selectedLocation}
          onTransitionComplete={onTransitionComplete}
          isExiting={isExiting}
        />

        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.5}
            luminanceSmoothing={0.9}
            intensity={2.0}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
