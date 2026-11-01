import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowRight, Clock, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPublishedEvents } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { EventItem } from "@/types";

export const UpcomingEvents: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchEvents() {
      try {
        const liveEvents = await getPublishedEvents();
        if (isMounted) {
          setEvents(liveEvents);
        }
      } catch (err) {
        console.error("Error loading events", err);
        if (isMounted) setEvents([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="statusOpen">Registration Open</Badge>;
      case "closing_soon":
        return <Badge variant="default">Closing Soon</Badge>;
      case "upcoming":
        return <Badge variant="secondary">Announced Soon</Badge>;
      default:
        return <Badge variant="statusClosed">Completed</Badge>;
    }
  };

  return (
    <section id="events" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-foss-green text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-2">
              Learn & Connect
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foss-black tracking-tight">
              Upcoming Events
            </h2>
            <p className="text-base text-foss-gray mt-1">
              Join workshops, hackathons, and technical discussions hosted by FOSS CEPrn.
            </p>
          </div>

          <Button asChild variant="outline" className="self-start sm:self-auto gap-2">
            <Link to="/events">
              <span>View All Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-foss-lightBg animate-pulse border border-border"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && events.length === 0 && (
          <div className="text-center py-16 px-6 rounded-2xl bg-foss-lightBg border border-border space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-foss-greenLight flex items-center justify-center text-foss-green mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foss-black">
              No Upcoming Events Scheduled
            </h3>
            <p className="text-sm text-foss-gray leading-relaxed">
              We are currently planning our next round of sessions and workshops.
              Join our community to stay updated!
            </p>
            <Button asChild variant="default" size="sm">
              <Link to="/join">Join Community for Announcements</Link>
            </Button>
          </div>
        )}

        {/* Event Cards Grid */}
        {!loading && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.slice(0, 2).map((event) => (
              <Card
                key={event.id}
                className="group overflow-hidden bg-white border-border hover:border-foss-green transition-all duration-300 flex flex-col"
              >
                {/* Image Banner */}
                {event.cover_image ? (
                  <div className="relative h-52 w-full overflow-hidden bg-foss-lightBg">
                    <img
                      src={event.cover_image}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      {getStatusBadge(event.registration_status)}
                    </div>
                  </div>
                ) : (
                  <div className="relative h-32 w-full bg-foss-lightBg flex items-center justify-center border-b border-border">
                    <CalendarDays className="w-10 h-10 text-foss-green/40" />
                    <div className="absolute top-4 left-4">
                      {getStatusBadge(event.registration_status)}
                    </div>
                  </div>
                )}

                <CardContent className="p-6 flex flex-col flex-grow justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-foss-gray">
                      <span className="flex items-center gap-1.5 font-medium text-foss-black">
                        <Calendar className="w-3.5 h-3.5 text-foss-green" />
                        {formatDate(event.start_date)}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-foss-gray" />
                        {event.venue}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-foss-black group-hover:text-foss-green transition-colors leading-snug">
                      <Link to={`/events/${event.slug || event.id}`}>{event.title}</Link>
                    </h3>

                    <p className="text-sm text-foss-gray line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="p-0 text-foss-green hover:text-foss-greenDark hover:bg-transparent font-semibold gap-1.5"
                    >
                      <Link to={`/events/${event.slug || event.id}`}>
                        <span>View Details</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
