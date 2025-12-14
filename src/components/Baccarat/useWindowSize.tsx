import { useState, useEffect } from 'react';

// Define the shape of the state object
interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

export const useWindowSize = () => {
  // Fix: Pass the interface <WindowSize> as the generic type
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,  // Fix: Set the actual VALUE to undefined
    height: undefined,
  });

  useEffect(() => {
    console.log("useWindowSize: Setting up resize listener", window.innerHeight);
    // Handler to call on window resize
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
     
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); 

  return windowSize;
};