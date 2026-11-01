import React from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { AnnouncementBanner } from "@/components/home/AnnouncementBanner";
import { Hero } from "@/components/home/Hero";
import { AboutSection } from "@/components/home/AboutSection";
import { Highlights } from "@/components/home/Highlights";
import { WhatWeDo } from "@/components/home/WhatWeDo";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { ExecomPreview } from "@/components/home/ExecomPreview";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { JoinCTA } from "@/components/home/JoinCTA";

export const Home: React.FC = () => {
  return (
    <PageLayout>
      <AnnouncementBanner />
      <Hero />
      <AboutSection />
      <Highlights />
      <WhatWeDo />
      <UpcomingEvents />
      <FeaturedProjects />
      <ExecomPreview />
      <GalleryPreview />
      <JoinCTA />
    </PageLayout>
  );
};
export default Home;
