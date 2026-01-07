import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "../styling/DnaHelix.css";
import dna1 from "../assets/DNA_1.png";
import dna2 from "../assets/DNA_2.png";
import dna3 from "../assets/DNA_3.png";
import dna4 from "../assets/DNA_4.png";

const FLOATING_ITEMS = [
  {
    id: 1,
    image: dna1,
    title: "Carpet - Starry night",
    description: "A design that I've made during my time in Game Design & Technology semester from Fontys, 2025."
  },
  {
    id: 2,
    image: dna2,
    title: "Welcome mat - Magical welcome",
    description: "A design that I've made during my time in Game Design & Technology semester from Fontys, 2025."
  },
  {
    id: 3,
    image: dna3,
    title: "Carpet - Piercing eye",
    description: "A design that I've made during my time in Game Design & Technology semester from Fontys, 2025."
  },
  {
    id: 4,
    image: dna4,
    title: "Karma system progress bar",
    description: "A design that I've made during my time in Game Design & Technology semester from Fontys, 2025."
  }
];

export default function DnaHelix({ scrollRef }) {
  const cameraRef = useRef(null);
  const dnaGroupRef = useRef(null);
  const containerRef = useRef(null);
  const floatingItemsRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const isScrollLocked = useRef(false);
  const lastScrollY = useRef(0);
  const rotationVelocity = useRef(0);
  const animationIdRef = useRef(null);
  
  const [selectedItem, setSelectedItem] = useState(null);
  
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
      rungA: parseInt(styles.getPropertyValue('--dna-rung-a').trim().replace('#', '0x')),
      rungB: parseInt(styles.getPropertyValue('--dna-rung-b').trim().replace('#', '0x'))
    };
    
    // Get density settings from CSS
    const helixDensity = parseFloat(styles.getPropertyValue('--dna-helix-density').trim());
    const rungSpacing = parseInt(styles.getPropertyValue('--dna-rung-spacing').trim());
    
    // Apply defaults if NaN
    const actualHelixDensity = isNaN(helixDensity) ? 1.0 : helixDensity;
    const actualRungSpacing = isNaN(rungSpacing) ? 3 : rungSpacing;

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

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

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
    const helixHeight = 20 * actualHelixDensity;
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
    let rungColorToggle = false;
    for (let i = 0; i < turns * pointsPerTurn; i += actualRungSpacing) {
      const t = i / (turns * pointsPerTurn);
      const angle = t * turns * Math.PI * 2;
      const y = (t - 0.5) * helixHeight;

      const x1 = helixRadius * Math.cos(angle);
      const z1 = helixRadius * Math.sin(angle);
      const x2 = helixRadius * Math.cos(angle + Math.PI);
      const z2 = helixRadius * Math.sin(angle + Math.PI);

      const distance = Math.hypot(x2 - x1, z2 - z1);

      const rungColor = rungColorToggle ? DNA_COLORS.rungA : DNA_COLORS.rungB;
      rungColorToggle = !rungColorToggle;

      const rung = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, distance, 8),
        new THREE.MeshStandardMaterial({ color: rungColor })
      );

      rung.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);

      const dir = new THREE.Vector3(x2 - x1, 0, z2 - z1).normalize();
      rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      dnaGroup.add(rung);
    }

    // --- Floating items (pizza-shaped cylinders) ---
    const textureLoader = new THREE.TextureLoader();
    floatingItemsRef.current = [];
    
    // Get spacing from CSS - how much of helix height to use for items
    const itemSpacingFactor = parseFloat(styles.getPropertyValue('--dna-item-spacing').trim());
    const actualItemSpacing = isNaN(itemSpacingFactor) ? 0.6 : itemSpacingFactor;
    const totalItemHeight = helixHeight * actualItemSpacing;
    const startY = -totalItemHeight / 2;

    FLOATING_ITEMS.forEach((item, index) => {
      const group = new THREE.Group();
      
      // Evenly distribute items vertically
      const yPosition = startY + (index / (FLOATING_ITEMS.length - 1)) * totalItemHeight;
      
      // Position on left or right side from viewer's perspective
      const offsetRadius = 2.5;
      
      // Camera is at (5, 0, 0) looking at origin
      // From viewer's perspective: left = negative Z, right = positive Z
      const side = index % 2 === 0 ? -1 : 1;
      const x = 0; // Keep centered on X axis (toward/away from camera)
      const z = offsetRadius * side; // Left/right from viewer
      
      group.position.set(x, yPosition, z);
      
      // Outer flat cylinder (pizza shape)
      const outerCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.1, 32),
        new THREE.MeshStandardMaterial({ 
          color: 0x6c5ce7,
          metalness: 0.3,
          roughness: 0.4
        })
      );
      outerCylinder.rotation.x = Math.PI / 2;
      outerCylinder.rotation.y = Math.PI / 2;
      group.add(outerCylinder);
      
      // Inner cylinder with image
      textureLoader.load(item.image, (texture) => {
        const innerCylinder = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.45, 0.12, 32),
          new THREE.MeshStandardMaterial({ 
            map: texture,
            metalness: 0.1,
            roughness: 0.6
          })
        );
        innerCylinder.rotation.x = Math.PI / 2;
        innerCylinder.rotation.y = Math.PI / 2;
        group.add(innerCylinder);
      });
      
      // Store item data
      group.userData = { itemData: item };
      
      // Make it face the camera
      group.lookAt(camera.position);
      
      floatingItemsRef.current.push(group);
      scene.add(group);
    });

    scene.add(dnaGroup);

    // --- Lighting ---
    const ambientIntensity = parseFloat(styles.getPropertyValue('--dna-ambient-light').trim());
    const pointIntensity = parseFloat(styles.getPropertyValue('--dna-point-light').trim());
    
    const actualAmbientIntensity = isNaN(ambientIntensity) ? 0.8 : ambientIntensity;
    const actualPointIntensity = isNaN(pointIntensity) ? 1.5 : pointIntensity;
    
    scene.add(new THREE.AmbientLight(0xffffff, actualAmbientIntensity));
    const light = new THREE.PointLight(0xffffff, actualPointIntensity);
    light.position.set(10, 10, 10);
    scene.add(light);
    
    const fillLight = new THREE.PointLight(0xffffff, 0.8);
    fillLight.position.set(-10, -5, 10);
    scene.add(fillLight);

    // --- Mouse interaction ---
    const onMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(floatingItemsRef.current, true);
      
      // Update cursor
      canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
      
      // Hover effect
      floatingItemsRef.current.forEach(item => {
        item.scale.setScalar(1);
      });
      
      if (intersects.length > 0) {
        const hoveredGroup = intersects[0].object.parent;
        hoveredGroup.scale.setScalar(1.1);
      }
    };
    
    const onClick = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(floatingItemsRef.current, true);
      
      if (intersects.length > 0) {
        const clickedGroup = intersects[0].object.parent;
        setSelectedItem(clickedGroup.userData.itemData);
      }
    };
    
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);

    // --- Scroll interaction ---
    const onScroll = () => {
      if (!cameraRef.current || !scrollRef?.current) return;

      const rect = scrollRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Reversed: 0 at top, 1 at bottom
      const progress = THREE.MathUtils.clamp(
        rect.bottom / (rect.height + viewportHeight),
        0,
        1
      );

      // Start at top of helix, move down as we scroll
      cameraRef.current.position.y = (0.5 - progress) * helixHeight;

      const delta = window.scrollY - lastScrollY.current;
      rotationVelocity.current = THREE.MathUtils.clamp(
        delta * 0.0004,
        -0.04,
        0.04
      );

      lastScrollY.current = window.scrollY;
    };
    
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // --- Animation loop ---
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (dnaGroupRef.current) {
        dnaGroupRef.current.rotation.y += rotationVelocity.current;
        rotationVelocity.current *= 0.9;
      }
      
      // Make floating items always face camera
      floatingItemsRef.current.forEach(item => {
        item.lookAt(camera.position);
      });

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
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
      
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
      
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [scrollRef]);
  
  // Disable scrolling when popup is open
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedItem]);

  return (
    <>
      <div ref={containerRef} className="dna-canvas" />
      
      {selectedItem && (
        <div className="popup-overlay" onClick={() => setSelectedItem(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setSelectedItem(null)}>
              ×
            </button>
            <img 
              src={selectedItem.image} 
              alt={selectedItem.title}
              className="popup-image"
            />
            <h2 className="popup-title">{selectedItem.title}</h2>
            <p className="popup-description">{selectedItem.description}</p>
          </div>
        </div>
      )}
    </>
  );
}