import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Search,
  ArrowRight,
  Filter,
  CalendarDays,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPublishedEvents } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { EventItem } from "@/types";

export const Events: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const live = await getPublishedEvents();
        if (isMounted) {
          setEvents(live);
        }
      } catch {
        if (isMounted) setEvents([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase());

    const isPast =
      evt.registration_status === "ended" ||
      new Date(evt.start_date).getTime() < Date.now() - 86400000;

    if (activeTab === "upcoming") {
      return matchesSearch && !isPast;
    }
    if (activeTab === "past") {
      return matchesSearch && isPast;
    }
    return matchesSearch;
  });

  return (
    <PageLayout>
      {/* Hero Header */}
      <section className="py-16 md:py-20 bg-foss-lightBg/80 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-foss-green text-xs font-semibold uppercase tracking-wider border border-emerald-200">
            Workshops & Meetups
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foss-black tracking-tight">
            Events at <span className="text-foss-green">FOSS CEPrn</span>
          </h1>
          <p className="text-base sm:text-lg text-foss-gray max-w-2xl mx-auto leading-relaxed">
            Hands-on technical bootcamps, hackathons, and collaborative open-source sessions
            hosted for students at College of Engineering Perumon.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-16 bg-white min-h-[500px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Controls Bar: Search & Category Tabs */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-border">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-foss-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search events by title or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl"
              />
            </div>

            {/* Filter Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(val: any) => setActiveTab(val)}
              className="w-full md:w-auto"
            >
              <TabsList className="bg-foss-lightBg p-1 border border-border">
                <TabsTrigger value="all" className="text-xs px-4">
                  All Events
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="text-xs px-4">
                  Upcoming
                </TabsTrigger>
                <TabsTrigger value="past" className="text-xs px-4">
                  Past Events
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-80 rounded-2xl bg-foss-lightBg animate-pulse border border-border"
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredEvents.length === 0 && (
            <div className="text-center py-20 px-6 rounded-2xl bg-foss-lightBg/50 border border-border max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-foss-greenLight flex items-center justify-center text-foss-green mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foss-black">
                {events.length === 0 ? "No Events Scheduled Yet" : "No Matching Events Found"}
              </h3>
              <p className="text-sm text-foss-gray leading-relaxed">
                {events.length === 0
                  ? "We are currently organizing workshops and technical sessions for the chapter. Check back soon or join our community!"
                  : "No events matched your current search and filter criteria. Try adjusting your search query."}
              </p>
              {events.length === 0 ? (
                <Button asChild size="sm">
                  <Link to="/join">Join FOSS CEPrn</Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveTab("all");
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          )}

          {/* Events Grid */}
          {!loading && filteredEvents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((evt) => (
                <Card
                  key={evt.id}
                  className="group overflow-hidden bg-white border-border hover:border-foss-green transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Event Banner */}
                    {evt.cover_image ? (
                      <div className="relative h-48 w-full overflow-hidden bg-foss-lightBg">
                        <img
                          src={evt.cover_image}
                          alt={evt.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge
                            variant={
                              evt.registration_status === "open"
                                ? "statusOpen"
                                : evt.registration_status === "upcoming"
                                ? "accent"
                                : "statusClosed"
                            }
                          >
                            {evt.registration_status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-32 w-full bg-foss-lightBg flex items-center justify-center border-b border-border">
                        <CalendarDays className="w-8 h-8 text-foss-green/40" />
                        <div className="absolute top-3 left-3">
                          <Badge
                            variant={
                              evt.registration_status === "open"
                                ? "statusOpen"
                                : evt.registration_status === "upcoming"
                                ? "accent"
                                : "statusClosed"
                            }
                          >
                            {evt.registration_status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Card Content */}
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-foss-green font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(evt.start_date)}</span>
                        </div>

                        <h3 className="text-lg font-bold text-foss-black group-hover:text-foss-green transition-colors leading-snug">
                          {evt.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-foss-gray">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{evt.venue}</span>
                        </div>

                        <p className="text-xs text-foss-gray leading-relaxed line-clamp-3 pt-1">
                          {evt.description}
                        </p>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-6 pt-0 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[11px] text-foss-gray font-medium">
                      CE Perumon Campus
                    </span>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-foss-green hover:text-foss-greenHover hover:bg-emerald-50 text-xs gap-1.5"
                    >
                      <Link to={`/events/${evt.slug || evt.id}`}>
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};
export default Events;
