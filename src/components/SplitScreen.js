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
  overflow-x: auto; /* Enable native horizontal scrollbar */
  overflow-y: auto; /* Enable vertical scrolling */
  border: 1px solid #e0e0e0;
  background: #f9f9f9;
  transition: width 0.3s ease;
  position: relative;
  scroll-behavior: smooth; /* Smooth scrolling */
  -webkit-overflow-scrolling: touch; /* Momentum-based scrolling for touch devices */

  &:first-child {
    border-right: none;
  }

  &:last-child {
    border-left: none;
  }

  /* Ensure content inside panel allows scrolling */
  & > * {
    min-width: fit-content; /* Ensure content doesn't shrink */
  }

  /* Customize the scrollbar for better visibility */
  &::-webkit-scrollbar {
    height: 14px; /* Increased height for better usability */
  }

  &::-webkit-scrollbar-track {
    background: #e0e0e0; /* Lighter track color */
    border-radius: 7px;
    margin: 5px; /* Add some margin for better appearance */
  }

  &::-webkit-scrollbar-thumb {
    background: #4a90e2; /* Blue thumb to match modern UI */
    border-radius: 7px;
    border: 2px solid #e0e0e0; /* Add border for contrast */
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #357abd; /* Darker blue on hover */
  }

  /* Firefox scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color:rgb(122, 127, 133) #e0e0e0;
`;

const ResizeHandle = styled.div`
  width: 3px;
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

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
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

      const scrollAmount = 50; // Pixels to scroll per key press
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
      const scrollAmount = e.deltaY * 0.5; // Adjust scroll speed based on vertical wheel movement
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