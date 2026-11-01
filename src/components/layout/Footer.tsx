import React from "react";
import { Link } from "react-router-dom";
import { Github, Instagram, Mail, Heart, ExternalLink, Code2 } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-foss-lightBg border-t border-border mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="footer" />
            <p className="text-sm text-foss-gray leading-relaxed max-w-sm mt-3">
              FOSS CEPrn is a student-led open-source community at College of
              Engineering Perumon, Kollam under the FOSS United Students Chapter. We build,
              share knowledge, and foster open technology culture.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/fossceprn"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-white border border-border flex items-center justify-center text-foss-black hover:text-foss-green hover:border-foss-green hover:shadow-xs transition-all"
                aria-label="GitHub Profile"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/fossceprn"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-white border border-border flex items-center justify-center text-foss-black hover:text-foss-green hover:border-foss-green hover:shadow-xs transition-all"
                aria-label="Instagram Profile"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:foss@perumonec.ac.in"
                className="w-9 h-9 rounded-lg bg-white border border-border flex items-center justify-center text-foss-black hover:text-foss-green hover:border-foss-green hover:shadow-xs transition-all"
                aria-label="Contact Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foss-black">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-foss-gray">
              <li>
                <Link to="/" className="hover:text-foss-green transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-foss-green transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-foss-green transition-colors">
                  Events & Workshops
                </Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-foss-green transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link to="/execom" className="hover:text-foss-green transition-colors">
                  ExeCom Team
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-foss-green transition-colors">
                  Community Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Community & Ecosystem */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foss-black">
              Community
            </h4>
            <ul className="space-y-2 text-sm text-foss-gray">
              <li>
                <Link to="/join" className="hover:text-foss-green transition-colors">
                  Join FOSS CEPrn
                </Link>
              </li>
              <li>
                <a
                  href="https://fossunited.org"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foss-green transition-colors flex items-center gap-1"
                >
                  <span>FOSS United</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://perumonec.ac.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foss-green transition-colors flex items-center gap-1"
                >
                  <span>CE Perumon</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-foss-green transition-colors">
                  Member Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* College & Chapter Badge */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foss-black">
              Affiliation
            </h4>
            <div className="p-4 rounded-xl bg-white border border-border space-y-2 text-xs text-foss-gray">
              <p className="font-semibold text-foss-black">
                College of Engineering Perumon
              </p>
              <p>Under CAPE, Government of Kerala</p>
              <p className="text-[11px] text-foss-green font-medium pt-1 border-t border-border flex items-center gap-1">
                <Code2 className="w-3 h-3" />
                FOSS United Students Chapter
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/80 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foss-gray">
          <p>
            © {new Date().getFullYear()} FOSS CEPrn. Built by students with open source spirit.
          </p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-foss-green fill-foss-green" />
            <span>at College of Engineering Perumon, Kerala</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
