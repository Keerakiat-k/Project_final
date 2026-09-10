import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * GlobalTooltip Component
 * Automatically intercepts any element with [title] or [data-tooltip]
 * and renders an ASCG Theme-matching floating tooltip with smart 4-way positioning.
 */
export default function GlobalTooltip() {
  const [tooltipState, setTooltipState] = useState({
    visible: false,
    text: '',
    x: 0,
    y: 0,
    placement: 'top', // 'top' | 'bottom' | 'right' | 'left'
  });

  const timerRef = useRef(null);
  const currentTargetRef = useRef(null);

  useEffect(() => {
    const handleMouseOver = (e) => {
      const target = e.target.closest('[title], [data-tooltip]');
      if (!target) return;

      const rawText = target.getAttribute('data-tooltip') || target.getAttribute('title');
      if (!rawText || !rawText.trim()) return;

      // Swap title with data-tooltip to suppress native browser tooltip
      if (target.hasAttribute('title')) {
        target.setAttribute('data-tooltip', rawText);
        target.removeAttribute('title');
      }

      currentTargetRef.current = target;
      if (timerRef.current) clearTimeout(timerRef.current);

      // Snappy delay (80ms)
      timerRef.current = setTimeout(() => {
        if (!currentTargetRef.current) return;
        const rect = target.getBoundingClientRect();
        
        let placement = 'top';
        let posX = 0;
        let posY = 0;

        // 1. If element is on the left sidebar / left edge (rect.left < 85)
        if (rect.left < 85) {
          placement = 'right';
          posX = rect.right + 10;
          posY = rect.top + rect.height / 2;
        } 
        // 2. If element is near the right edge (rect.right > window.innerWidth - 85)
        else if (rect.right > window.innerWidth - 85) {
          placement = 'left';
          posX = rect.left - 10;
          posY = rect.top + rect.height / 2;
        }
        // 3. If element is near the top edge (rect.top < 60)
        else if (rect.top < 60) {
          placement = 'bottom';
          posX = rect.left + rect.width / 2;
          posY = rect.bottom + 8;
        }
        // 4. Default: above the element
        else {
          placement = 'top';
          posX = rect.left + rect.width / 2;
          posY = rect.top - 8;
        }

        setTooltipState({
          visible: true,
          text: rawText.trim(),
          x: posX,
          y: posY,
          placement,
        });
      }, 80);
    };

    const handleMouseOut = (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target && target === currentTargetRef.current) {
        currentTargetRef.current = null;
        if (timerRef.current) clearTimeout(timerRef.current);
        setTooltipState((prev) => ({ ...prev, visible: false }));
      }
    };

    const handleScrollOrClick = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      currentTargetRef.current = null;
      setTooltipState((prev) => ({ ...prev, visible: false }));
    };

    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    window.addEventListener('scroll', handleScrollOrClick, { passive: true, capture: true });
    window.addEventListener('click', handleScrollOrClick, { passive: true });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('scroll', handleScrollOrClick, { capture: true });
      window.removeEventListener('click', handleScrollOrClick);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!tooltipState.visible || !tooltipState.text) return null;

  // Calculate transform based on placement
  let transformStyle = 'translate(-50%, -100%)';
  if (tooltipState.placement === 'bottom') transformStyle = 'translate(-50%, 0)';
  else if (tooltipState.placement === 'right') transformStyle = 'translate(0, -50%)';
  else if (tooltipState.placement === 'left') transformStyle = 'translate(-100%, -50%)';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: `${tooltipState.x}px`,
        top: `${tooltipState.y}px`,
        transform: transformStyle,
        zIndex: 999999,
        pointerEvents: 'none',
      }}
      className="animate-fade-in transition-all duration-150 ease-out"
    >
      <div className="relative flex items-center gap-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-slate-700/60 text-xs font-medium whitespace-nowrap leading-relaxed">
        {/* Brand Theme Accent Dot */}
        <span className="w-1.5 h-1.5 rounded-full bg-[#f89919] shadow-[0_0_8px_#f89919] shrink-0" />
        
        {/* Tooltip Content */}
        <span className="tracking-wide text-slate-100">{tooltipState.text}</span>

        {/* Caret Arrow */}
        <div
          style={{
            position: 'absolute',
            ...(tooltipState.placement === 'top'
              ? {
                  left: '50%',
                  bottom: '-5px',
                  transform: 'translateX(-50%)',
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid #0f172a',
                }
              : tooltipState.placement === 'bottom'
              ? {
                  left: '50%',
                  top: '-5px',
                  transform: 'translateX(-50%)',
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderBottom: '5px solid #0f172a',
                }
              : tooltipState.placement === 'right'
              ? {
                  left: '-5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                  borderRight: '5px solid #0f172a',
                }
              : {
                  right: '-5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                  borderLeft: '5px solid #0f172a',
                }),
            width: 0,
            height: 0,
          }}
        />
      </div>
    </div>,
    document.body
  );
}
