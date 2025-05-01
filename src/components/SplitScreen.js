import React, { useState, useRef, useEffect } from "react";
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
  overflow-x: auto; /* Enable horizontal scrolling */
  overflow-y: auto; /* Enable vertical scrolling */
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

  /* Ensure content inside panel is wide enough to trigger scrolling */
  & > * {
    min-width: 1500px; /* Match iframe min-width to ensure content is scrollable */
    width: fit-content; /* Allow content to take its natural width */
  }

  /* Always show horizontal scrollbar */
  &::-webkit-scrollbar {
    height: 14px;
    display: block !important; /* Force scrollbar visibility */
  }

  &::-webkit-scrollbar-track {
    background: #e0e0e0;
    border-radius: 7px;
    margin: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: #4a90e2;
    border-radius: 7px;
    border: 2px solid #e0e0e0;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #357abd;
  }

  /* Firefox scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color:rgb(100, 103, 107) #e0e0e0;
`;

const ResizeHandle = styled.div`
  width: 5px; /* Slightly wider for better usability */
  background: #e0e0e0;
  cursor: col-resize;
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  z-index: 2;
  transition: background 0.2s ease;

  &:hover {
    background: #4a90e2;
  }

  &:active {
    background: #357abd;
  }
`;

const SplitScreen = ({ children, screenMode }) => {
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);
  const handleRef = useRef(null);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);

  const [left, right] = children;

  // Handle resizing with throttling for smoother performance
  useEffect(() => {
    let lastUpdate = 0;
    const throttleMs = 16; // ~60fps

    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      const now = Date.now();
      if (now - lastUpdate < throttleMs) return;
      lastUpdate = now;

      const containerRect = containerRef.current.getBoundingClientRect();
      let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      newWidth = Math.max(10, Math.min(90, newWidth));
      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Handle keyboard scrolling
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

  // Handle mouse wheel scrolling (horizontal)
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
  };

  const rightStyle = {
    width: screenMode === "right" ? "100%" : screenMode === "left" ? "0%" : `${100 - leftWidth}%`,
    display: screenMode === "left" ? "none" : "block",
  };

  const handleVisibility = screenMode === "both" ? "visible" : "hidden";

  return (
    <SplitScreenContainer ref={containerRef}>
      <Panel ref={leftPanelRef} style={leftStyle}>
        {left}
      </Panel>
      <ResizeHandle
        ref={handleRef}
        onMouseDown={() => setIsResizing(true)}
        style={{ visibility: handleVisibility }}
      />
      <Panel ref={rightPanelRef} style={rightStyle}>
        {right}
      </Panel>
    </SplitScreenContainer>
  );
};

export default SplitScreen;