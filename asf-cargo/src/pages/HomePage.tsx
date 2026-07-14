import SiteLayout from '../layouts/SiteLayout';
import Hero from '../components/home/Hero';
import PayCardsSection from '../components/home/PayCardsSection';
import DispatchBoardSection from '../components/home/DispatchBoardSection';
import EquipmentSection from '../components/home/EquipmentSection';
import RequirementsSection from '../components/home/RequirementsSection';
import ContactSection from '../components/home/ContactSection';
import CtaBand from '../components/home/CtaBand';

export default function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <PayCardsSection />
      <DispatchBoardSection />
      <EquipmentSection />
      <RequirementsSection />
      <ContactSection />
      <CtaBand />
    </SiteLayout>
  );
}
