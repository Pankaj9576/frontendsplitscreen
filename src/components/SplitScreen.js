import React, { useState, useRef, useEffect, useCallback } from "react";
import styled from "styled-components";

const SplitScreenContainer = styled.div`
  display: flex;
  flex: 1;
  height: 100%;
  overflow: hidden;
  flex-grow: 1;
  position: relative;
`;

const Panel = styled.div`
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  background: #f9f9f9;
  transition: width 0.3s ease;
  position: relative;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;

  &:first-child {
    border-right: none;
  }

  &:last-child {
    border-left: none;
  }

  & > * {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  &::-webkit-scrollbar {
    width: 14px;
  }

  &::-webkit-scrollbar-track {
    background: #e0e0e0;
    border-radius: 7px;
    margin: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(87, 92, 99);
    border-radius: 7px;
    border: 2px solid #e0e0e0;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgb(70, 76, 83);
  }

  scrollbar-width: thin;
  scrollbar-color: rgb(67, 70, 75) #e0e0e0;
`;

const ResizeHandle = styled.div`
  width: 6px;
  background: #000; /* Changed to black */
  cursor: col-resize;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 1000;
  transition: background 0.2s ease, left 0.3s ease;

  &:hover {
    background: #333; /* Darker shade on hover */
  }

  &:active {
    background: #555; /* Even darker shade on active */
  }

  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
`;

const CustomScrollbar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 16px;
  background: #e0e0e0;
  border-top: 1px solid #d1d1d1;
  overflow-x: auto;
  overflow-y: hidden;
  z-index: 1;
  display: block;

  ${({ disabled }) =>
    disabled &&
    `
    pointer-events: none;
    opacity: 0.5;
  `}

  &::-webkit-scrollbar {
    height: 16px;
  }

  &::-webkit-scrollbar-track {
    background: #e0e0e0;
    border-radius: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(86, 91, 97);
    border-radius: 8px;
    border: 2px solid #e0e0e0;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgb(81, 88, 95);
  }

  scrollbar-width: thin;
  scrollbar-color: rgb(91, 96, 103) #e0e0e0;
`;

const ScrollbarContent = styled.div`
  height: 16px;
  width: ${({ $scrollWidth }) => $scrollWidth}px;
`;

const SplitScreen = ({ children, screenMode }) => {
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);
  const handleRef = useRef(null);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const [leftScrollWidth, setLeftScrollWidth] = useState(0);
  const [rightScrollWidth, setRightScrollWidth] = useState(0);
  const [leftScrollable, setLeftScrollable] = useState(false);
  const [rightScrollable, setRightScrollable] = useState(false);
  const lastUpdateRef = useRef(0);
  const timeoutRef = useRef(null);

  const [left, right] = children;

  useEffect(() => {
    console.log("SplitScreen - screenMode:", screenMode);
    console.log("Handle visibility:", screenMode === "both" ? "visible" : "hidden");
  }, [screenMode]);

  const handleResize = useCallback((e) => {
    if (!containerRef.current) return;

    const now = performance.now();
    if (now - lastUpdateRef.current < 16) return;

    lastUpdateRef.current = now;

    requestAnimationFrame(() => {
      const containerRect = containerRef.current.getBoundingClientRect();
      let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      newWidth = Math.max(10, Math.min(90, newWidth));
      setLeftWidth(newWidth);
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsResizing(false);
    }, 100);
  }, []);

  useEffect(() => {
    const handlePointerDown = (e) => {
      setIsResizing(true);
      if (handleRef.current) {
        handleRef.current.setPointerCapture(e.pointerId);
      }
    };

    const handlePointerMove = (e) => {
      if (!isResizing) return;
      handleResize(e);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    if (handleRef.current) {
      handleRef.current.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      if (handleRef.current) {
        handleRef.current.removeEventListener("pointerdown", handlePointerDown);
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isResizing, handleResize]);

  useEffect(() => {
    const updateScrollWidth = () => {
      if (leftPanelRef.current) {
        const contentWidth = leftPanelRef.current.scrollWidth;
        const panelWidth = leftPanelRef.current.clientWidth;
        const minScrollWidth = panelWidth;
        setLeftScrollWidth(Math.max(contentWidth, minScrollWidth));
        setLeftScrollable(contentWidth > panelWidth);
      }
      if (rightPanelRef.current) {
        const contentWidth = rightPanelRef.current.scrollWidth;
        const panelWidth = rightPanelRef.current.clientWidth;
        const minScrollWidth = panelWidth;
        setRightScrollWidth(Math.max(contentWidth, minScrollWidth));
        setRightScrollable(contentWidth > panelWidth);
      }
    };

    updateScrollWidth();

    const resizeObserver = new ResizeObserver(updateScrollWidth);
    if (leftPanelRef.current) resizeObserver.observe(leftPanelRef.current);
    if (rightPanelRef.current) resizeObserver.observe(rightPanelRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [children, screenMode]);

  useEffect(() => {
    const handleLeftPanelScroll = () => {
      if (leftPanelRef.current && leftScrollRef.current) {
        leftScrollRef.current.scrollLeft = leftPanelRef.current.scrollLeft;
      }
    };

    const handleRightPanelScroll = () => {
      if (rightPanelRef.current && rightScrollRef.current) {
        rightScrollRef.current.scrollLeft = rightPanelRef.current.scrollLeft;
      }
    };

    const handleLeftCustomScroll = () => {
      if (leftPanelRef.current && leftScrollRef.current) {
        leftPanelRef.current.scrollLeft = leftScrollRef.current.scrollLeft;
      }
    };

    const handleRightCustomScroll = () => {
      if (rightPanelRef.current && rightScrollRef.current) {
        rightPanelRef.current.scrollLeft = rightScrollRef.current.scrollLeft;
      }
    };

    if (leftPanelRef.current) leftPanelRef.current.addEventListener("scroll", handleLeftPanelScroll);
    if (rightPanelRef.current) rightPanelRef.current.addEventListener("scroll", handleRightPanelScroll);
    if (leftScrollRef.current) leftScrollRef.current.addEventListener("scroll", handleLeftCustomScroll);
    if (rightScrollRef.current) rightScrollRef.current.addEventListener("scroll", handleRightCustomScroll);

    return () => {
      if (leftPanelRef.current) leftPanelRef.current.removeEventListener("scroll", handleLeftPanelScroll);
      if (rightPanelRef.current) rightPanelRef.current.removeEventListener("scroll", handleRightPanelScroll);
      if (leftScrollRef.current) leftScrollRef.current.removeEventListener("scroll", handleLeftCustomScroll);
      if (rightScrollRef.current) rightScrollRef.current.removeEventListener("scroll", handleRightCustomScroll);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA";
      if (isInputFocused) return;

      const scrollAmount = 50;
      if (e.key === "ArrowLeft") {
        if (leftPanelRef.current && screenMode !== "right") {
          leftPanelRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        }
        if (rightPanelRef.current && screenMode !== "left") {
          rightPanelRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        }
      } else if (e.key === "ArrowRight") {
        if (leftPanelRef.current && screenMode !== "right") {
          leftPanelRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
        if (rightPanelRef.current && screenMode !== "left") {
          rightPanelRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screenMode]);

  useEffect(() => {
    const handleWheel = (e) => {
      const scrollAmount = e.deltaY * 0.5;
      if (leftPanelRef.current && screenMode !== "right" && e.target.closest(`[ref="${leftPanelRef.current}"]`)) {
        leftPanelRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        e.preventDefault();
      }
      if (rightPanelRef.current && screenMode !== "left" && e.target.closest(`[ref="${rightPanelRef.current}"]`)) {
        rightPanelRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        e.preventDefault();
      }
    };

    if (leftPanelRef.current) leftPanelRef.current.addEventListener("wheel", handleWheel, { passive: false });
    if (rightPanelRef.current) rightPanelRef.current.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      if (leftPanelRef.current) leftPanelRef.current.removeEventListener("wheel", handleWheel);
      if (rightPanelRef.current) rightPanelRef.current.removeEventListener("wheel", handleWheel);
    };
  }, [screenMode]);

  const leftStyle = {
    width: screenMode === "left" ? "100%" : screenMode === "right" ? "0%" : `${leftWidth}%`,
    display: screenMode === "right" ? "none" : "block",
    position: "relative",
  };

  const rightStyle = {
    width: screenMode === "right" ? "100%" : screenMode === "left" ? "0%" : `${100 - leftWidth}%`,
    display: screenMode === "left" ? "none" : "block",
    position: "relative",
  };

  const handleVisibility = screenMode === "both" ? "visible" : "hidden";

  return (
    <SplitScreenContainer ref={containerRef}>
      <Panel ref={leftPanelRef} style={leftStyle}>
        {left}
        <CustomScrollbar ref={leftScrollRef} disabled={!leftScrollable}>
          <ScrollbarContent $scrollWidth={leftScrollWidth} />
        </CustomScrollbar>
      </Panel>
      <ResizeHandle
        ref={handleRef}
        style={{
          left: screenMode === "both" ? `${leftWidth}%` : "50%",
          visibility: handleVisibility,
        }}
      />
      <Panel ref={rightPanelRef} style={rightStyle}>
        {right}
        <CustomScrollbar ref={rightScrollRef} disabled={!rightScrollable}>
          <ScrollbarContent $scrollWidth={rightScrollWidth} />
        </CustomScrollbar>
      </Panel>
    </SplitScreenContainer>
  );
};

export default SplitScreen;