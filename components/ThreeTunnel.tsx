"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import buildSpline from "@/lib/spline";

/**
 * The chat's "signal" — a neon tunnel the assistant's reply travels through.
 * Drifts slowly at idle; speeds up and blooms brighter while a response streams in.
 * Adapted from the original getting-started-with-threejs tunnel-flight demo.
 */
export default function ThreeTunnel({ intensity }: { intensity: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const intensityRef = useRef(0);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05050d, 0.22);

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.04;
    controls.enablePan = false;
    controls.enableZoom = false;

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.6, 0.5, 0.05);
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    const spline = buildSpline();
    const tubeGeo = new THREE.TubeGeometry(spline, 222, 0.65, 16, true);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xff2bd6,
      emissive: 0x4a0f5c,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tube);

    const hemiLight = new THREE.HemisphereLight(0x34f5ff, 0xff2bd6, 2);
    scene.add(hemiLight);

    // sparse particle field so idle drift still feels alive
    const particleCount = 240;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const p = spline.getPointAt(Math.random());
      const jitter = () => (Math.random() - 0.5) * 3;
      particlePositions[i * 3] = p.x + jitter();
      particlePositions[i * 3 + 1] = p.y + jitter();
      particlePositions[i * 3 + 2] = p.z + jitter();
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x8b5cf6,
      size: 0.045,
      transparent: true,
      opacity: 0.85,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    function resize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let smoothIntensity = 0;
    let frameId = 0;

    function updateCamera(t: number, speed: number) {
      const time = t * (0.05 + speed * 0.22);
      const loopTime = 20 * 1000;
      const p = (time % loopTime) / loopTime;
      const pos = spline.getPointAt(p);
      const lookAt = spline.getPointAt((p + 0.01) % 1);
      camera.position.copy(pos);
      camera.lookAt(lookAt);
    }

    function animate(t = 0) {
      frameId = requestAnimationFrame(animate);

      smoothIntensity += (intensityRef.current - smoothIntensity) * 0.05;
      updateCamera(t, smoothIntensity);

      bloomPass.strength = 1.6 + smoothIntensity * 2.4;
      tubeMat.wireframe = true;
      tube.rotation.z += 0.0006 + smoothIntensity * 0.003;
      particles.rotation.y += 0.0004 + smoothIntensity * 0.002;

      const hue = 0.86 - smoothIntensity * 0.18; // magenta -> violet/cyan as it heats up
      tubeMat.color.setHSL(hue, 1, 0.55);

      controls.update();
      composer.render();
    }
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      tubeGeo.dispose();
      tubeMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}
