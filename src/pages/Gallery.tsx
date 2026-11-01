import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Maximize2, Camera } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getGalleryItems } from "@/lib/supabase";
import type { GalleryItem } from "@/types";

export const Gallery: React.FC = () => {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activePhoto, setActivePhoto] = useState<GalleryItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const live = await getGalleryItems();
        if (isMounted) {
          setPhotos(live);
        }
      } catch {
        if (isMounted) setPhotos([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(photos.map((p) => p.category))),
  ];

  const filteredPhotos =
    selectedCategory === "All"
      ? photos
      : photos.filter((p) => p.category === selectedCategory);

  return (
    <PageLayout>
      {/* Header Banner */}
      <section className="py-16 md:py-20 bg-foss-lightBg/80 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-foss-green text-xs font-semibold uppercase tracking-wider border border-emerald-200">
            Visual Memories
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foss-black tracking-tight">
            Community <span className="text-foss-green">Gallery</span>
          </h1>
          <p className="text-base text-foss-gray max-w-2xl mx-auto leading-relaxed">
            Snapshots of activities, coding workshops, hackathons, and celebrations from our
            student chapter at College of Engineering Perumon.
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 bg-white min-h-[500px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter Pills */}
          {categories.length > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    selectedCategory === cat
                      ? "bg-foss-green text-white shadow-xs"
                      : "bg-foss-lightBg text-foss-black hover:bg-gray-100 border border-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-72 rounded-2xl bg-foss-lightBg animate-pulse border border-border"
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredPhotos.length === 0 && (
            <div className="text-center py-20 px-6 rounded-2xl bg-foss-lightBg/50 border border-border max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-foss-greenLight flex items-center justify-center text-foss-green mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foss-black">
                {photos.length === 0 ? "No Photos in Gallery Yet" : "No Matching Photos"}
              </h3>
              <p className="text-sm text-foss-gray leading-relaxed">
                {photos.length === 0
                  ? "Photos and moments from our upcoming workshops, hackathons, and community meetups will be uploaded here."
                  : "No photos found under the selected category."}
              </p>
              {photos.length === 0 ? (
                <Button asChild size="sm">
                  <Link to="/events">Explore Events</Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategory("All")}
                >
                  Show All Photos
                </Button>
              )}
            </div>
          )}

          {/* Photos Grid */}
          {!loading && filteredPhotos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setActivePhoto(photo)}
                  className="group relative h-72 rounded-2xl overflow-hidden cursor-pointer bg-white border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
                >
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foss-greenLight mb-1.5">
                      {photo.category}
                    </span>
                    <h4 className="text-base font-semibold leading-snug mb-2">
                      {photo.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-gray-300">
                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                      <span>View full image</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Dialog */}
      <Dialog
        open={Boolean(activePhoto)}
        onOpenChange={(open) => !open && setActivePhoto(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-border">
          {activePhoto && (
            <div className="flex flex-col">
              <div className="relative max-h-[75vh] bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={activePhoto.image_url}
                  alt={activePhoto.title}
                  className="w-full h-auto max-h-[75vh] object-contain"
                />
              </div>
              <div className="p-6 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-foss-greenLight text-foss-greenDark">
                    {activePhoto.category}
                  </span>
                  <span className="text-xs text-foss-gray">FOSS CEPrn Photo Archive</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foss-black">
                  {activePhoto.title}
                </DialogTitle>
                {activePhoto.description && (
                  <DialogDescription className="text-sm text-foss-gray leading-relaxed">
                    {activePhoto.description}
                  </DialogDescription>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};
export default Gallery;
