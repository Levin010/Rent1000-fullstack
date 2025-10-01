"use client";

import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const HeroSection = () => {

  const router = useRouter();

  return (
    <div className="relative h-screen">
      <Image
        src="/landing-rent1000-splash.jpeg"
        alt="Rentiful Rental Platform Hero Section"
        fill
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-1/3 transform -translate-x-1/2 -translate-y-1/2 text-center w-full"
      >
        <div className="max-w-4xl mx-auto px-16 sm:px-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Start your journey to finding the perfect place to call home!
          </h1>
          <p className="text-xl text-white mb-8">
            Explore our wide range of Kenyan rental properties tailored to fit your
            lifestyle and needs
          </p>

          <div className="flex justify-center">
            <Button
              onClick={() => router.push("/search")}
              className="bg-secondary-700 text-white text-lg rounded-xl border-none hover:bg-secondary-600 h-12"
            >
              Search Properties
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;