import React from "react";
import { Link } from "react-router-dom";
import {
  Code2,
  Heart,
  Globe2,
  Users2,
  ShieldCheck,
  Compass,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const About: React.FC = () => {
  const faqs = [
    {
      q: "Do I need to know programming before joining?",
      a: "No! FOSS CEPrn is open to students of all skill levels, from complete beginners to advanced hackers. We run bootcamps that start from day zero.",
    },
    {
      q: "Which branches can join FOSS CEPrn?",
      a: "Any student studying at College of Engineering Perumon across any discipline (CSE, IT, ECE, EEE, Mechanical) is welcome to join.",
    },
    {
      q: "How does FOSS CEPrn relate to FOSS United?",
      a: "We are an officially recognized Student Chapter of FOSS United, an all-India foundation dedicated to promoting the creation and adoption of Free and Open Source Software.",
    },
    {
      q: "Are the workshops and sessions free of cost?",
      a: "Yes. In keeping with the FOSS ethos, all our community workshops, coding camps, and meetups are 100% free for students.",
    },
  ];

  return (
    <PageLayout>
      {/* Header Banner */}
      <section className="py-16 md:py-24 bg-foss-lightBg/80 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-foss-green text-xs font-semibold uppercase tracking-wider border border-emerald-200">
            About Our Chapter
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foss-black tracking-tight">
            Nurturing Open Technology at <span className="text-foss-green">CE Perumon</span>
          </h1>
          <p className="text-base sm:text-lg text-foss-gray leading-relaxed max-w-2xl mx-auto">
            We are the official FOSS United Students Chapter at College of Engineering
            Perumon, Kerala — inspiring students to create public digital goods and
            contribute to the global developer community.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <Card className="p-8 border-border hover:border-foss-green transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-foss-greenLight flex items-center justify-center text-foss-green">
                  <Compass className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-foss-black">Our Mission</h2>
                <p className="text-sm sm:text-base text-foss-gray leading-relaxed">
                  To democratize technical education through peer learning, foster a vibrant
                  culture of open-source contributions among students, and empower future
                  software engineers with real-world collaboration skills.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 border-border hover:border-foss-green transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-foss-greenLight flex items-center justify-center text-foss-green">
                  <Globe2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-foss-black">Our Vision</h2>
                <p className="text-sm sm:text-base text-foss-gray leading-relaxed">
                  To transform College of Engineering Perumon into a leading hub of open-source
                  excellence in Kerala, where every graduate leaves with upstream contributions
                  and the mindset of giving back to the commons.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The 4 Freedoms of FOSS */}
      <section className="py-20 bg-foss-lightBg/50 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-extrabold text-foss-black">
              The Philosophy of Free & Open Source Software
            </h2>
            <p className="text-base text-foss-gray max-w-2xl mx-auto">
              FOSS is not just about free of cost — it is about freedom, agency, and community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "0", title: "Freedom to Run", desc: "The freedom to run the program as you wish, for any purpose." },
              { num: "1", title: "Freedom to Study", desc: "The freedom to study how the program works, and change it to make it do what you wish." },
              { num: "2", title: "Freedom to Share", desc: "The freedom to redistribute copies so you can help your neighbour." },
              { num: "3", title: "Freedom to Improve", desc: "The freedom to distribute copies of your modified versions to others." },
            ].map((f) => (
              <div
                key={f.num}
                className="p-6 rounded-2xl bg-white border border-border space-y-2 hover:border-foss-green transition-all"
              >
                <span className="text-xs font-black font-mono text-foss-green bg-foss-greenLight px-2 py-0.5 rounded">
                  Freedom {f.num}
                </span>
                <h3 className="text-base font-bold text-foss-black pt-1">{f.title}</h3>
                <p className="text-xs text-foss-gray leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-3xl font-extrabold text-foss-black">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-foss-gray">
              Common questions answered about joining and participating in FOSS CEPrn.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-foss-lightBg/60 border border-border space-y-2"
              >
                <h3 className="text-base font-bold text-foss-black flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-foss-green shrink-0" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-sm text-foss-gray pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center pt-12">
            <Button asChild size="lg" className="rounded-xl gap-2">
              <Link to="/join">
                <span>Become Part of FOSS CEPrn</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
export default About;
