import { EconomicsSection } from './_components/economics-section';
import { JoinSection } from './_components/join-section';
import { PluginsSection } from './_components/plugins-section';
import { AdvantagesSection } from './_components/advantages-section';
import { FaqSection } from './_components/faq-section';
import { FeaturesSection } from './_components/features-section';
import { HeroSectionFigma } from './_components/hero-section-figma';
import { HowItWorksSection } from './_components/how-it-works-section';
import { IntegrationSection } from './_components/integration-section';

export default function HomePage() {
  return (
    <main className="flex-1 relative overflow-visible bg-transparent">
      <HeroSectionFigma />
      <AdvantagesSection />
      <HowItWorksSection />
      <FeaturesSection />
      <IntegrationSection />
      <PluginsSection />
      {/* <PricingSectionNew /> */}
      <FaqSection />
      <EconomicsSection />
      <JoinSection />
    </main>
  );
}
