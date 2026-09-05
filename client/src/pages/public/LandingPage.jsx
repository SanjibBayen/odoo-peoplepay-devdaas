import React from 'react';
import CTASection from '../../components/landing/CTASection.jsx';
import FeaturesSection from '../../components/landing/FeaturesSection.jsx';
import HeroSection from '../../components/landing/HeroSection.jsx';
import HowItWorks from '../../components/landing/HowItWorks.jsx';
import LandingFooter from '../../components/landing/LandingFooter.jsx';
import LandingNavbar from '../../components/landing/LandingNavbar.jsx';
import RolesSection from '../../components/landing/RolesSection.jsx';
import ValueStrip from '../../components/landing/ValueStrip.jsx';

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-[#FAF8F5] text-[#1E293B]'>
      <LandingNavbar />
      <main>
        <HeroSection />
        <ValueStrip />
        <FeaturesSection />
        <HowItWorks />
        <RolesSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
