import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

const SliderVerification = ({ onVerify, disabled = false, label = 'Desliza para verificar' }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(300); // Default width
  
  // Get container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  const sliderWidth = 56; // Width of the slider button

  // Handle verification when slider reaches the end
  const handleDragEnd = (event, info) => {
    if (isVerified || disabled) return;
    
    // If dragged more than 70% of the container width
    if (info.offset.x > containerWidth * 0.7) {
      setIsVerified(true);
      onVerify?.();
    }
  };
  
  // Calculate the current position based on verification status
  const getPosition = () => {
    return isVerified ? containerWidth - sliderWidth : 0;
  };

  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    if (isVerified || disabled) return;
    setIsDragging(true);
  };

  return (
    <div className="w-full">
      <div 
        ref={containerRef}
        className="relative h-14 bg-gray-100 rounded-full overflow-hidden"
      >
        {/* Background text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className={`font-medium text-sm transition-opacity duration-300 ${
              isVerified ? 'opacity-0' : 'opacity-100 text-gray-600'
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            {isVerified ? '¡Verificación completada!' : label}
          </span>
        </div>
        
        {/* Slider track fill */}
        <motion.div 
          className="absolute inset-y-0 left-0 bg-blue-100 w-full"
          initial={{ width: '0%' }}
          animate={{ width: isVerified ? '100%' : '0%' }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Slider handle */}
        <motion.div
          className={`absolute left-0 top-0 h-14 w-14 rounded-full flex items-center justify-center z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isVerified ? 'bg-green-500' : 'bg-blue-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
          drag={!isVerified && !disabled ? 'x' : false}
          dragConstraints={{ left: 0, right: containerWidth - sliderWidth }}
          dragElastic={0}
          onDragEnd={handleDragEnd}
          initial={{ x: 0 }}
          animate={{ 
            x: getPosition(),
            backgroundColor: isVerified ? '#10B981' : '#2563EB'
          }}
          transition={{ 
            type: 'spring', 
            damping: 20, 
            stiffness: 300,
            bounce: isVerified ? 0.5 : 0.3
          }}
          onTouchStart={handleTouchStart}
          role="slider"
          aria-valuenow={isVerified ? 100 : 0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={isVerified ? 'Verificación completada' : 'Desliza para verificar'}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' && !isVerified) {
              setIsVerified(true);
              onVerify?.();
            } else if (e.key === 'ArrowLeft' && isVerified) {
              setIsVerified(false);
            }
          }}
        >
          {isVerified ? (
            <Check className="w-6 h-6 text-white" />
          ) : (
            <ArrowRight className="w-6 h-6 text-white" />
          )}
        </motion.div>
      </div>
      
      {/* Status message */}
      <AnimatePresence>
        {isVerified && (
          <motion.p 
            className="text-green-600 text-sm mt-2 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            ¡Verificación completada! 🎉
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SliderVerification;
