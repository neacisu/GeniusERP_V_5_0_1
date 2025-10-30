/**
 * Hook pentru cleanup forțat al dialogurilor
 * Rezolvă problema de freeze când dialogurile Radix UI nu se închid corect
 */

import { useEffect } from 'react';

export function useDialogCleanup(isOpen: boolean) {
  useEffect(() => {
    // Când dialogul se închide, forțează cleanup după un delay
    if (!isOpen) {
      const cleanup = () => {
        // Găsește toate overlay-urile Radix UI rămase
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        overlays.forEach(overlay => {
          (overlay as HTMLElement).remove();
        });
        
        // Curăță body styles
        document.body.style.pointerEvents = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Șterge class-urile Radix
        document.body.classList.remove('overflow-hidden');
        
        console.log('✅ Dialog cleanup executat');
      };
      
      // Cleanup imediat
      cleanup();
      
      // Și încă unul după 100ms pentru siguranță
      setTimeout(cleanup, 100);
    }
  }, [isOpen]);
}

export default useDialogCleanup;
