import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Maximize2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getGalleryItems } from "@/lib/supabase";
import type { GalleryItem } from "@/types";

export const GalleryPreview: React.FC = () => {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchPhotos() {
      try {
        const live = await getGalleryItems();
        if (isMounted) {
          setPhotos(live);
        }
      } catch (err) {
        console.error("Error loading gallery preview", err);
        if (isMounted) setPhotos([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPhotos();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="gallery" className="py-20 bg-foss-lightBg/50 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-foss-green text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-2">
              Life at FOSS CEPrn
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foss-black tracking-tight">
              Community Gallery
            </h2>
            <p className="text-base text-foss-gray mt-1">
              Moments from workshops, hack nights, and tech sessions across our campus.
            </p>
          </div>

          <Button asChild variant="outline" className="self-start sm:self-auto gap-2">
            <Link to="/gallery">
              <span>View Full Gallery</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-white border border-border animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && photos.length === 0 && (
          <div className="text-center py-16 px-6 rounded-2xl bg-white border border-border max-w-xl mx-auto space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-foss-greenLight flex items-center justify-center text-foss-green mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foss-black">
              Gallery Photos Coming Soon
            </h3>
            <p className="text-sm text-foss-gray leading-relaxed">
              Snapshots and highlights from our upcoming workshops, hackathons, and community meetups
              will be shared here.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/events">Explore Upcoming Events</Link>
            </Button>
          </div>
        )}

        {/* Photo Grid */}
        {!loading && photos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {photos.slice(0, 4).map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer bg-white border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foss-greenLight mb-1">
                    {photo.category}
                  </span>
                  <h4 className="text-sm font-semibold leading-tight mb-2">
                    {photo.title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-gray-300 font-medium">
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                    <span>Click to expand</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Dialog Modal */}
      <Dialog
        open={Boolean(selectedPhoto)}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white border-border">
          {selectedPhoto && (
            <div className="flex flex-col">
              <div className="relative max-h-[70vh] bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.title}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
              <div className="p-6 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-foss-greenLight text-foss-greenDark">
                    {selectedPhoto.category}
                  </span>
                  <span className="text-xs text-foss-gray">FOSS CEPrn Photo Archive</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foss-black">
                  {selectedPhoto.title}
                </DialogTitle>
                {selectedPhoto.description && (
                  <DialogDescription className="text-sm text-foss-gray leading-relaxed">
                    {selectedPhoto.description}
                  </DialogDescription>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
