import { BidConfirm } from "@/components/landing/bid-confirm";
import { Close } from "@/components/landing/close";
import { Credibility } from "@/components/landing/credibility";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { Glance } from "@/components/landing/glance";
import { Hero } from "@/components/landing/hero";
import { LiveQueue } from "@/components/landing/live-queue";
import { Platforms } from "@/components/landing/platforms";
import { ProfileTuner } from "@/components/landing/profile-tuner";
import { Proof } from "@/components/landing/proof";
import { RejectedJobs } from "@/components/landing/rejected-jobs";
import { Steps } from "@/components/landing/steps";

export default function HomePage() {
  return (
    <>
      <div
        id="how-it-works"
        className="relative scroll-mt-20 overflow-hidden border-b border-border pb-16 sm:pb-20"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent to-background"
        />
        <div className="relative">
          <Hero />
          <LiveQueue />
        </div>
      </div>
      <Credibility />
      <Platforms />
      <Glance />
      <Proof />
      <BidConfirm />
      <ProfileTuner />
      <RejectedJobs />
      <Steps />
      <Faq />
      <Close />
      <Footer />
    </>
  );
}
