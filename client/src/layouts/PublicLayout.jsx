import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PublicLayout({ children }) {
  return (
    <div>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
