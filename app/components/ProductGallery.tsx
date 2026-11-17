"use client";

import { useState } from "react";
import type { ProductImage } from "../lib/data";

type GalleryImage = ProductImage & { id?: string };
const FIT_ZOOM = 84;
const MIN_ZOOM = 70;
const MAX_ZOOM = 118;

export function ProductGallery({ images, productName, category }: { images: GalleryImage[]; productName: string; category: string }) {
  const usableImages = images.length ? images : [];
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState(FIT_ZOOM);
  const active = usableImages[Math.min(selected, usableImages.length - 1)];
  if (!active) return null;

  function selectImage(index: number) {
    setSelected(index);
    setZoom(FIT_ZOOM);
  }

  function changeZoom(next: number) {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)));
  }

  return <div className="product-gallery">
    <div className="product-visual">
      <div className="visual-top"><span>CATALOG RECORD</span><span>{category}</span></div>
      {/* The catalog may reference managed uploads as well as bundled assets. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={active.src} alt={active.alt} width="900" height="900" fetchPriority="high" decoding="async" style={{ transform: `scale(${zoom / 100})` }} />
      <div className="image-reference-label">PRODUCT PHOTOGRAPHY · {selected + 1} / {usableImages.length}</div>
      <div className="visual-bottom"><span>B2B ENQUIRY ONLY</span><span>INDIA TRADE CATALOG</span></div>
    </div>
    <div className="gallery-controls">
      <div><span>IMAGE SCALE</span><strong aria-live="polite">{zoom}%</strong></div>
      <div className="zoom-controls">
        <button type="button" aria-label="Zoom image out" disabled={zoom <= MIN_ZOOM} onClick={() => changeZoom(zoom - 8)}>−</button>
        <input aria-label="Adjust product image size" type="range" min={MIN_ZOOM} max={MAX_ZOOM} step="2" value={zoom} onChange={(event) => changeZoom(Number(event.target.value))} />
        <button type="button" aria-label="Zoom image in" disabled={zoom >= MAX_ZOOM} onClick={() => changeZoom(zoom + 8)}>＋</button>
        <button type="button" className="fit-control" onClick={() => setZoom(FIT_ZOOM)} disabled={zoom === FIT_ZOOM}>Fit</button>
      </div>
    </div>
    {usableImages.length > 1 ? <div className="product-thumbnails" aria-label={productName + " image gallery"}>
      {usableImages.map((image, index) => <button key={image.id || image.src + index} type="button" className={index === selected ? "is-active" : ""} aria-label={`View ${productName} image ${index + 1}`} aria-pressed={index === selected} onClick={() => selectImage(index)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.src} alt="" width="360" height="240" loading="lazy" decoding="async" />
        <span>VIEW {index + 1}</span>
      </button>)}
    </div> : null}
  </div>;
}
