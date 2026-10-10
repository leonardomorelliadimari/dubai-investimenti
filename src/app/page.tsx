import { Footer } from "@/components/Footer";
import { World } from "@/components/world/World";
import { IntroChapter } from "@/components/sections/IntroChapter";
import { RiseChapter } from "@/components/sections/RiseChapter";
import { ComparisonSection } from "@/components/sections/ComparisonSection";
import { MapChapter } from "@/components/sections/MapChapter";
import { StrategiesSection } from "@/components/sections/StrategiesSection";
import { BuildChapter } from "@/components/sections/BuildChapter";
import { RisksSection } from "@/components/sections/RisksSection";
import { MethodSection } from "@/components/sections/MethodSection";
import { NightChapter } from "@/components/sections/NightChapter";

export default function Home() {
  return (
    <>
      <World />
      <main id="contenuto" className="relative z-[1]">
        <IntroChapter />
        <RiseChapter />
        <ComparisonSection />
        <MapChapter />
        <StrategiesSection />
        <BuildChapter />
        <RisksSection />
        <MethodSection />
        <NightChapter />
      </main>
      <div className="relative z-[1]"><Footer /></div>
    </>
  );
}
