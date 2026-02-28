import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ProductImageCarousel.css';

interface ProductImage {
  id: number;
  image_url: string;
  image_format?: string;
  alt_text: string;
  image_order: number;
  is_thumbnail: boolean;
}

interface ProductImageCarouselProps {
  images: ProductImage[];
  productName: string;
  className?: string;
}

const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  images,
  productName,
  className = ''
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Helper to build full URL for images (prefix API base if relative path)
  const apiBase = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '') : '';
  const buildImageUrl = (url?: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${apiBase}${url}`;
  };

  // Sort images by order (use a copy to avoid mutating props)
  const sortedImages = React.useMemo(
    () => [...images].sort((a, b) => a.image_order - b.image_order),
    [images]
  );

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  React.useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [sortedImages]);

  // Reset image loaded state when selected image changes
  React.useEffect(() => {
    setImageLoaded(false);
  }, [selectedImageIndex, sortedImages]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth;

    if (direction === 'left') {
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    } else {
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!sortedImages.length) {
    return (
      <div className={`product-image-carousel ${className}`}>
        <div className="image-placeholder">
          <p>No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`product-image-carousel ${className}`}>
      {/* Main Image Display */}
      <div className="main-image-container">
        {!imageLoaded && (
          <div className="main-image-skeleton" aria-hidden="true">
            <div className="skeleton-box" />
          </div>
        )}

        <img
          src={buildImageUrl(sortedImages[selectedImageIndex]?.image_url)}
          alt={sortedImages[selectedImageIndex]?.alt_text || 'Product Image'}
          className={`main-image ${imageLoaded ? 'loaded' : 'loading'}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x500?text=Product+Image';
            setImageLoaded(true);
          }}
        />

        {/* Image Counter */}
        <div className="image-counter">
          {selectedImageIndex + 1} / {sortedImages.length}
        </div>
      </div>

      {/* Carousel Scroll Container */}
      <div className="carousel-wrapper">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            className="carousel-arrow carousel-arrow-left"
            onClick={() => scroll('left')}
            aria-label="Previous images"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Scroll Container */}
        <div className="carousel-container" ref={scrollContainerRef}>
          <div className="carousel-track">
            {sortedImages.map((image, index) => (
              <div
                key={image.id}
                className={`carousel-item ${selectedImageIndex === index ? 'active' : ''}`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img
                  src={buildImageUrl(image.image_url)}
                  alt={image.alt_text}
                  className="carousel-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120x120?text=Img';
                  }}
                />
                {image.is_thumbnail && <div className="thumbnail-badge">Thumbnail</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            className="carousel-arrow carousel-arrow-right"
            onClick={() => scroll('right')}
            aria-label="Next images"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Image Information */}
      <div className="image-info">
        <p className="image-alt">{sortedImages[selectedImageIndex]?.alt_text}</p>
      </div>
    </div>
  );
};

export default ProductImageCarousel;
