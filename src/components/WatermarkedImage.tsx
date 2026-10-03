import React from 'react';
import { RentchWatermarkOverlay } from './RentchWatermarkOverlay';
import { normalizeApartmentImageUrl, handleImageError } from '../utils/imageUrl';

interface WatermarkedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  watermarkSize?: 'sm' | 'md' | 'lg';
  showWatermark?: boolean;
  maskMyHome?: boolean;
  watermarkOpacity?: number;
}

export const WatermarkedImage: React.FC<WatermarkedImageProps> = ({
  src,
  alt = 'Квартира в Тбилиси',
  className = 'w-full h-full object-cover',
  containerClassName = 'relative w-full h-full overflow-hidden bg-stone-900',
  watermarkSize = 'md',
  showWatermark = true,
  maskMyHome = true,
  watermarkOpacity = 0.55,
  ...props
}) => {
  return (
    <div className={containerClassName}>
      <img
        src={normalizeApartmentImageUrl(src)}
        alt={alt}
        className={className}
        referrerPolicy="no-referrer"
        onError={(e) => handleImageError(e)}
        {...props}
      />

      {/* Subtle bottom shadow to enhance contrast and obscure bottom edge artifacts */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent pointer-events-none" />

      {/* Verified Rentch Badge */}
      {showWatermark && (
        <RentchWatermarkOverlay
          size={watermarkSize}
          maskMyHome={maskMyHome}
          opacity={watermarkOpacity}
          showCenterWatermark={false}
        />
      )}
    </div>
  );
};
