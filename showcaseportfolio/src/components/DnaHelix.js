import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function DnaHelix() {
  const containerRef = useRef(null);

  useEffect(() => {
    // --- Scene setup ---
    const scene = new THREE.Scene();
    scene.background = null; // transparent

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(5, 0, 0);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    containerRef.current.appendChild(renderer.domElement);

    // --- DNA group ---
    const dnaGroup = new THREE.Group();

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
      new THREE.MeshStandardMaterial({ color: 0x33aaff })
    );
    const backbone2 = new THREE.Mesh(
      tubeGeom2,
      new THREE.MeshStandardMaterial({ color: 0xff5555 })
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
        new THREE.MeshStandardMaterial({ color: 0xcccccc })
      );

      rung.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);

      const dir = new THREE.Vector3(x2 - x1, 0, z2 - z1).normalize();
      rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      dnaGroup.add(rung);
    }

    scene.add(dnaGroup);

    // --- Lighting ---
    scene.add(new THREE.AmbientLight(0x666666));
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

    // --- Scroll interaction ---
    const onScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const progress = window.scrollY / maxScroll;
      camera.position.y = (progress - 0.5) * helixHeight;
    };
    window.addEventListener("scroll", onScroll);

    // --- Animation loop ---
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      dnaGroup.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    // --- Resize ---
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="dna-canvas" />;
}
