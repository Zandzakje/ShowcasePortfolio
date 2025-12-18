import Header from "../components/Header";
import DnaHelix from "../components/DnaHelix";
import "../styling/About.css";
import { useRef } from "react";
import { useLocation } from "react-router";

export default function About() {
  const dnaScrollRef = useRef(null);
  const location = useLocation();
  return (
    <>
      <Header />
      <div ref={dnaScrollRef} className="dna-scroll-space" />
      <DnaHelix key={location.pathname} scrollRef={dnaScrollRef} />
    </>
  );
}
