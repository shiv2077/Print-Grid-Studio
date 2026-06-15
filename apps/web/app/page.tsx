import { Hero } from './_home/Hero';
import { HowItWorks } from './_home/HowItWorks';
import { MaterialsTable } from './_home/MaterialsTable';
import { BuildEnvelope } from './_home/BuildEnvelope';
import { PricingTransparency } from './_home/PricingTransparency';
import { Shipping } from './_home/Shipping';
import { FinalCta } from './_home/FinalCta';

/* PrintGrid Studio homepage. Server component composition.
   Section order — see /Overnight.md Task 6:
     1. Hero (paper, gridPaper)
     2. HowItWorks (paper-warm)        #how-it-works anchor
     3. MaterialsTable (paper)
     4. BuildEnvelope (paper-warm)
     5. PricingTransparency (paper)    #pricing anchor
     6. Shipping (paper-warm)
     7. FinalCta (ink) */

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <MaterialsTable />
      <BuildEnvelope />
      <PricingTransparency />
      <Shipping />
      <FinalCta />
    </>
  );
}
