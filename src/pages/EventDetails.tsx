import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Share2,
  Users,
  CheckCircle2,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { getEventBySlugOrId } from "@/lib/supabase";
import type { EventItem } from "@/types";

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchEvent() {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const found = await getEventBySlugOrId(id);
        if (isMounted) {
          setEvent(found);
        }
      } catch (err) {
        console.error("Error fetching event details", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchEvent();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-foss-gray text-sm">Loading event details...</p>
        </div>
      </PageLayout>
    );
  }

  if (!event) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-24 text-center max-w-md space-y-4">
          <div className="w-12 h-12 rounded-full bg-foss-greenLight flex items-center justify-center text-foss-green mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-foss-black">Event Not Found</h2>
          <p className="text-sm text-foss-gray">
            The event you are looking for does not exist or may have been moved.
          </p>
          <Button asChild size="sm">
            <Link to="/events">View All Events</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Back button bar */}
      <div className="bg-foss-lightBg/50 border-b border-border py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foss-gray hover:text-foss-green transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Events</span>
          </Link>
        </div>
      </div>

      <article className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          {/* Header & Badges */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant={
                  event.registration_status === "open"
                    ? "statusOpen"
                    : event.registration_status === "upcoming"
                    ? "accent"
                    : "statusClosed"
                }
              >
                {event.registration_status.replace("_", " ").toUpperCase()}
              </Badge>
              <span className="text-xs text-foss-gray">FOSS United Students Chapter Event</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foss-black tracking-tight leading-tight">
              {event.title}
            </h1>
          </div>

          {/* Cover Image if available */}
          {event.cover_image && (
            <div className="relative rounded-2xl overflow-hidden h-72 sm:h-96 w-full mb-10 border border-border shadow-card">
              <img
                src={event.cover_image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Grid Layout: Main info and sticky registration card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-8">
              <div className="prose max-w-none text-foss-black space-y-4">
                <h3 className="text-xl font-bold text-foss-black">About this Event</h3>
                <p className="text-base text-foss-gray leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>

              {/* Event Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="p-4 rounded-xl bg-foss-lightBg border border-border space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foss-green uppercase">
                    <Calendar className="w-4 h-4" />
                    <span>Date & Schedule</span>
                  </div>
                  <div className="text-sm font-bold text-foss-black">
                    {formatDate(event.start_date)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-foss-lightBg border border-border space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foss-green uppercase">
                    <MapPin className="w-4 h-4" />
                    <span>Venue</span>
                  </div>
                  <div className="text-sm font-bold text-foss-black">{event.venue}</div>
                </div>
              </div>
            </div>

            {/* Right Sidebar: Registration Action */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6 border-border shadow-sm sticky top-24 space-y-5">
                <CardContent className="p-0 space-y-5">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-foss-gray">
                      Registration
                    </span>
                    <h4 className="text-xl font-bold text-foss-black">
                      {event.registration_status === "open"
                        ? "Open for Students"
                        : event.registration_status === "upcoming"
                        ? "Opening Soon"
                        : "Registration Closed"}
                    </h4>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border text-xs text-foss-gray">
                    <div className="flex items-center justify-between">
                      <span>Eligibility</span>
                      <span className="font-semibold text-foss-black">All CEPrn Students</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Fee</span>
                      <span className="font-semibold text-foss-green">100% Free (FOSS)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Venue</span>
                      <span className="font-semibold text-foss-black truncate max-w-[150px]">
                        {event.venue}
                      </span>
                    </div>
                  </div>

                  {event.registration_status === "open" && (
                    <Button asChild size="lg" className="w-full font-semibold">
                      <Link to="/join">Register for this Event</Link>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="w-full gap-2 text-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copied ? "Link Copied to Clipboard!" : "Share Event"}</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </article>
    </PageLayout>
  );
};
export default EventDetails;
