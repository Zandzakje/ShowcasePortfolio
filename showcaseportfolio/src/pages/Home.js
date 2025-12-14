import React from "react";
import Header from "../components/Header";
import "../styling/Home.css";

export default function Home() {
  return (
    <>
      <Header current="home" />

      <div className="content-wrapper">
        <div className="content-box">
          <h1>Welcome</h1>
          <p>Welcome to my showcase portfolio!</p>
          <p>
            On the other pages you'll find information about me, experience,
            and ways to get in contact with me.
          </p>
        </div>
      </div>
    </>
  );
}
