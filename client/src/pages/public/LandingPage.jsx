import React, { useState } from 'react';
import WorkspaceSelectorModal from '../../components/common/WorkspaceSelectorModal.jsx';
import CTASection from '../../components/landing/CTASection.jsx';
import FeaturesSection from '../../components/landing/FeaturesSection.jsx';
import HeroSection from '../../components/landing/HeroSection.jsx';
import HowItWorks from '../../components/landing/HowItWorks.jsx';
import LandingNavbar from '../../components/landing/LandingNavbar.jsx';
import RolesSection from '../../components/landing/RolesSection.jsx';
import ValueStrip from '../../components/landing/ValueStrip.jsx';

export default function LandingPage() {
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);

  const openWorkspaceModal = () => setWorkspaceModalOpen(true);
  const closeWorkspaceModal = () => setWorkspaceModalOpen(false);

  return (
    <div className='min-h-screen bg-[#FAF8F5] text-[#1E293B]'>
      <LandingNavbar onOpenWorkspaceModal={openWorkspaceModal} />
      <main>
        <HeroSection onOpenWorkspaceModal={openWorkspaceModal} />
        <ValueStrip />
        <FeaturesSection />
        <HowItWorks />
        <RolesSection onOpenWorkspaceModal={openWorkspaceModal} />
        <CTASection onOpenWorkspaceModal={openWorkspaceModal} />
      </main>

      {/* Choose Your Workspace Modal */}
      <WorkspaceSelectorModal
        isOpen={workspaceModalOpen}
        onClose={closeWorkspaceModal}
      />
    </div>
  );
}
