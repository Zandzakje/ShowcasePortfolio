import React from "react";
import Header from "../components/Header";
import { Mail, Phone, Linkedin, FileText } from "lucide-react";
import "../styling/Contact.css";

export default function Contact() {
  const handlePreviewCV = () => {
    window.open("../assets/CV.pdf", "_blank");
  };

  const handleDownloadCV = () => {
    const link = document.createElement("a");
    link.href = "../assets/CV.pdf";
    link.download = "../assets/CV.pdf";
    link.click();
  };

  return (
    <>
      <Header current="contact" />
      <div className="content-wrapper">
        <div className="content-box">
          <div className="inner-box">
            <div className="contact-container">
              <div className="contact-icons">
                <Mail size={24} />
                <Phone size={24} />
                <Linkedin size={24} />
                <FileText size={24} />
              </div>

              <div className="contact-info">
                <div>damiantomasila@hotmail.com</div>
                <div>+31 6 34560197</div>
                <div>linkedin.com/in/yourprofile</div>
                <div className="cv-buttons">
                  <button onClick={handlePreviewCV} className="cv-button">
                    Preview
                  </button>
                  <button onClick={handleDownloadCV} className="cv-button">
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
