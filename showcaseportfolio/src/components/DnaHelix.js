import { useEffect, useRef } from "react";
import * as THREE from "three";
import "../styling/DnaHelix.css";

export default function DnaHelix({ scrollRef }) {
  const cameraRef = useRef(null);
  const dnaGroupRef = useRef(null);
  const containerRef = useRef(null);
  const isScrollLocked = useRef(false);
  const lastScrollY = useRef(0);
  const rotationVelocity = useRef(0);
  const animationIdRef = useRef(null);
  
  useEffect(() => {
    // Reset refs on mount
    lastScrollY.current = window.scrollY;
    rotationVelocity.current = 0;
    
    // Capture container ref for cleanup
    const container = containerRef.current;
    
    // --- Scene setup ---
    const scene = new THREE.Scene();
    scene.background = null;
    
    // Get colors from CSS variables
    const styles = getComputedStyle(document.documentElement);
    const DNA_COLORS = {
      backboneA: parseInt(styles.getPropertyValue('--dna-backbone-a').trim().replace('#', '0x')),
      backboneB: parseInt(styles.getPropertyValue('--dna-backbone-b').trim().replace('#', '0x')),
      rung: parseInt(styles.getPropertyValue('--dna-rung').trim().replace('#', '0x'))
    };

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(5, 0, 0);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Clear any existing canvas before appending
    if (container) {
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    }

    const canvas = renderer.domElement;
    const onContextLost = (e) => {
      e.preventDefault();
      console.warn("WebGL context lost");
    };

    const onContextRestored = () => {
      console.warn("WebGL context restored");
      window.location.reload();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    // --- DNA group ---
    const dnaGroup = new THREE.Group();
    dnaGroupRef.current = dnaGroup;

    const helixRadius = 1;
    const helixHeight = 20;
    const turns = 10;
    const pointsPerTurn = 60;

    const backboneCurve1 = [];
    const backboneCurve2 = [];

    for (let i = 0; i <= turns * pointsPerTurn; i++) {
      const t = i / (turns * pointsPerTurn);
      const angle = t * turns * Math.PI * 2;
      const y = (t - 0.5) * helixHeight;

      backboneCurve1.push(
        new THREE.Vector3(
          helixRadius * Math.cos(angle),
          y,
          helixRadius * Math.sin(angle)
        )
      );

      backboneCurve2.push(
        new THREE.Vector3(
          helixRadius * Math.cos(angle + Math.PI),
          y,
          helixRadius * Math.sin(angle + Math.PI)
        )
      );
    }

    const curve1 = new THREE.CatmullRomCurve3(backboneCurve1);
    const curve2 = new THREE.CatmullRomCurve3(backboneCurve2);

    const tubeGeom1 = new THREE.TubeGeometry(curve1, turns * pointsPerTurn, 0.12, 8);
    const tubeGeom2 = new THREE.TubeGeometry(curve2, turns * pointsPerTurn, 0.12, 8);

    const backbone1 = new THREE.Mesh(
      tubeGeom1,
      new THREE.MeshStandardMaterial({ color: DNA_COLORS.backboneA })
    );
    const backbone2 = new THREE.Mesh(
      tubeGeom2,
      new THREE.MeshStandardMaterial({ color: DNA_COLORS.backboneB })
    );

    dnaGroup.add(backbone1, backbone2);

    // --- Base pairs ---
    for (let i = 0; i < turns * pointsPerTurn; i += 3) {
      const t = i / (turns * pointsPerTurn);
      const angle = t * turns * Math.PI * 2;
      const y = (t - 0.5) * helixHeight;

      const x1 = helixRadius * Math.cos(angle);
      const z1 = helixRadius * Math.sin(angle);
      const x2 = helixRadius * Math.cos(angle + Math.PI);
      const z2 = helixRadius * Math.sin(angle + Math.PI);

      const distance = Math.hypot(x2 - x1, z2 - z1);

      const rung = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, distance, 8),
        new THREE.MeshStandardMaterial({ color: DNA_COLORS.rung })
      );

      rung.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);

      const dir = new THREE.Vector3(x2 - x1, 0, z2 - z1).normalize();
      rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      dnaGroup.add(rung);
    }

    scene.add(dnaGroup);

    // --- Lighting ---
    // Get lighting values from CSS
    const ambientIntensity = parseFloat(styles.getPropertyValue('--dna-ambient-light').trim()) || 0.8;
    const pointIntensity = parseFloat(styles.getPropertyValue('--dna-point-light').trim()) || 1.5;
    
    scene.add(new THREE.AmbientLight(0xffffff, ambientIntensity));
    const light = new THREE.PointLight(0xffffff, pointIntensity);
    light.position.set(10, 10, 10);
    scene.add(light);
    
    // Additional fill light for better visibility
    const fillLight = new THREE.PointLight(0xffffff, 0.8);
    fillLight.position.set(-10, -5, 10);
    scene.add(fillLight);

    // --- Scroll interaction ---
    const onScroll = () => {
      if (!cameraRef.current || !scrollRef?.current) return;

      const rect = scrollRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const progress = THREE.MathUtils.clamp(
        1 - rect.bottom / (rect.height + viewportHeight),
        0,
        1
      );

      cameraRef.current.position.y = (progress - 0.5) * helixHeight;

      const delta = window.scrollY - lastScrollY.current;
      rotationVelocity.current = THREE.MathUtils.clamp(
        delta * 0.0004,
        -0.04,
        0.04
      );

      lastScrollY.current = window.scrollY;
    };
    
    // Initialize camera position on mount
    onScroll();
    
    window.addEventListener("scroll", onScroll, { passive: true });

    // --- Animation loop ---
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (dnaGroupRef.current) {
        dnaGroupRef.current.rotation.y += rotationVelocity.current;
        rotationVelocity.current *= 0.9;
      }

      renderer.render(scene, cameraRef.current);
    };
    animate();

    // --- Resize ---
    const onResize = () => {
      if (!cameraRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // --- Scroll momentum catch ---
    const onWheel = (e) => {
      if (isScrollLocked.current && e.deltaY > 0) {
        e.preventDefault();
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    // --- Cleanup ---
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onWheel);
      
      // Dispose Three.js resources
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
      
      // Clear container
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [scrollRef]);

  return (
    <div ref={containerRef} className="dna-canvas" />
  );
}