"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ComponentType, type PointerEvent } from "react";
import { Group, Mesh } from "three";

type PremiumHeroProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  badge: string;
};

type SceneProps = {
  pointer: [number, number];
  scrollY: number;
};

const textMotion = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({ opacity: 1, y: 0, transition: { delay, duration: 0.6 } }),
};

const arrowVariants = {
  initial: { x: 0 },
  hover: { x: 6 },
};

const FloatAny = Float as unknown as ComponentType<any>;

function HeroScene({ pointer, scrollY }: SceneProps) {
  const masterRef = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);
  const clothRef = useRef<Mesh>(null);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (masterRef.current) {
      masterRef.current.rotation.y = elapsed * 0.15 + pointer[0] * 0.4;
      masterRef.current.rotation.x = pointer[1] * 0.3;
      masterRef.current.position.y = Math.sin(elapsed * 0.6) * 0.3 - scrollY * 0.0005;
      masterRef.current.position.x = pointer[0] * 0.2;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = elapsed * 0.4;
      ringRef.current.rotation.y = elapsed * 0.2;
    }
    if (clothRef.current) {
      clothRef.current.rotation.x = Math.sin(elapsed * 0.5) * 0.2;
      clothRef.current.rotation.z = Math.cos(elapsed * 0.3) * 0.15;
    }
  });

  return (
    <group ref={masterRef}>
      <ambientLight intensity={0.7} />
      <pointLight position={[3, 4, 4]} intensity={1.3} color="#ff77c8" />
      <pointLight position={[-4, -1.5, 3]} intensity={1.0} color="#c084fc" />
      <pointLight position={[0, 4, -4]} intensity={0.5} color="#6ee7b7" />
      <directionalLight position={[5, 5, 5]} intensity={0.4} color="#fce7f3" />

      {/* Main floating shape - fashion-inspired blob */}
      <FloatAny floatIntensity={1.4} rotationIntensity={0.4} speed={1.6}>
        <mesh castShadow receiveShadow ref={clothRef}>
          <icosahedronGeometry args={[1.5, 2]} />
          <MeshDistortMaterial 
            color="#f472b6" 
            distort={0.55} 
            speed={1.6} 
            roughness={0.15} 
            metalness={0.35}
            transparent
            opacity={0.95}
          />
        </mesh>
      </FloatAny>

      {/* Secondary floating element */}
      <FloatAny floatIntensity={0.8} rotationIntensity={0.5} speed={1.3}>
        <mesh position={[1.8, -0.3, 0]}>
          <torusGeometry args={[0.5, 0.18, 24, 64]} />
          <MeshDistortMaterial 
            color="#a855f7" 
            distort={0.3} 
            speed={1.0} 
            roughness={0.35} 
            metalness={0.55}
          />
        </mesh>
      </FloatAny>

      {/* Animated ring */}
      <FloatAny floatIntensity={0.7} rotationIntensity={0.15} speed={0.8}>
        <mesh ref={ringRef} position={[-1.5, -0.1, -0.2]}>
          <torusGeometry args={[1.4, 0.1, 16, 128]} />
          <meshStandardMaterial 
            color="#22d3ee" 
            opacity={0.85} 
            transparent 
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      </FloatAny>

      {/* Additional small floating particles */}
      <FloatAny floatIntensity={1.0} rotationIntensity={0.3} speed={2.0}>
        <mesh position={[-1.2, 1.2, 0.5]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#f9a8d4" opacity={0.7} transparent />
        </mesh>
      </FloatAny>

      <FloatAny floatIntensity={0.9} rotationIntensity={0.25} speed={1.8}>
        <mesh position={[1.5, 0.8, -0.5]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#c084fc" opacity={0.6} transparent />
        </mesh>
      </FloatAny>
    </group>
  );
}

export function PremiumHero({ title, subtitle, ctaLabel, badge }: PremiumHeroProps) {
  const [pointer, setPointer] = useState<[number, number]>([0, 0]);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePointer = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    setPointer([x, y]);
  };

  return (
    <section
      onPointerMove={handlePointer}
      onPointerLeave={() => setPointer([0, 0])}
      className="relative isolate overflow-hidden rounded-[32px] border border-white/40 bg-gradient-to-br from-pink-50 via-white/60 to-white shadow-[0_40px_80px_rgba(131,58,180,0.25)] dark:border-slate-800/60"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Canvas
          className="h-full w-full"
          camera={{ position: [0, 0, 6.5], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <HeroScene pointer={pointer} scrollY={scrollY} />
        </Canvas>
        {/* Enhanced gradient overlay with parallax effect */}
        <motion.div
          animate={{
            backgroundPosition: [
              `${50 + pointer[0] * 10}% ${50 + pointer[1] * 10}%`,
            ],
          }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-900/75 via-pink-600/50 via-purple-600/40 to-transparent"
          style={{ backgroundSize: "200% 200%" }}
        />
        {/* Additional depth layers */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(244,114,182,0.2),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.15),transparent_50%)]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 sm:gap-12 sm:px-8 lg:flex-row lg:items-center lg:py-16 lg:px-10">
        <div className="space-y-5 text-right">
          <motion.span
            initial="hidden"
            animate="visible"
            variants={textMotion}
            custom={0}
            className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/60 px-4 py-2 text-xs font-semibold tracking-wide text-pink-600 shadow-[0_10px_30px_rgba(244,114,182,0.35)]"
          >
            {badge}
          </motion.span>
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={textMotion}
            custom={0.2}
            className="text-3xl font-black text-slate-900 drop-shadow-lg sm:text-4xl lg:text-5xl"
          >
            {title}
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={textMotion}
            custom={0.4}
            className="max-w-2xl text-sm text-slate-600"
          >
            {subtitle}
          </motion.p>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={textMotion}
            custom={0.6}
            className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600"
          >
            <span className="rounded-2xl bg-white/70 px-3 py-1 shadow-lg shadow-pink-200/40">کیفیت ممتاز و طراحی لوکس</span>
            <span className="rounded-2xl border border-white/40 px-3 py-1 bg-white/20 text-brand-600">ارسال سریع و پرداخت امن</span>
          </motion.div>
          <motion.button
            initial="initial"
            whileHover="hover"
            variants={{ hover: { translateY: -2 } }}
            type="button"
            className="relative inline-flex items-center gap-3 rounded-[26px] bg-gradient-to-r from-pink-500 to-brand-600 px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_20px_50px_rgba(244,114,182,0.4)] transition duration-300"
          >
            {ctaLabel}
            <motion.span variants={arrowVariants} className="text-xl leading-none">→</motion.span>
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col gap-4 rounded-3xl border border-white/40 bg-white/70 p-5 shadow-[0_30px_60px_rgba(15,23,42,0.25)] backdrop-blur dark:bg-slate-900/60"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">KPI رشد فروش</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">+42%</span>
          </div>
          <div className="grid gap-3 text-xs text-slate-500">
            <div className="flex items-center justify-between rounded-2xl bg-slate-900/5 px-3 py-2 text-slate-600 dark:bg-white/10 dark:text-slate-200">
              <span>نرخ تبدیل فروش</span>
              <span className="font-black text-pink-500">1.6x</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-pink-50/60 px-3 py-2 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
              <span>میانگین سبد خرید</span>
              <span className="font-black text-pink-600">افزایش سفارش‌ها</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

