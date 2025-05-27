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
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #e0e0e0;
    border-radius: 4px;
    margin: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(87, 92, 99);
    border-radius: 4px;
    border: 1px solid #e0e0e0;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgb(70, 76, 83);
  }

  scrollbar-width: thin;
  scrollbar-color: rgb(67, 70, 75) #e0e0e0;
`;

const ResizeHandle = styled.div`
  width: 4px; /* Slightly wider for better clickability */
  background: green;
  cursor: col-resize;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 1000;
  transition: background 0.2s ease; /* Removed left transition for smoother dragging */

  &:hover {
    background: rgb(76, 129, 65);
  }

  &:active {
    background: rgb(101, 163, 65);
  }

  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
`;

const SplitScreen = ({ children, screenMode }) => {
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);
  const handleRef = useRef(null);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const rafRef = useRef(null);

  const handleResize = useCallback((e) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    newWidth = Math.max(10, Math.min(90, newWidth)); // Keep within 10-90% bounds
    setLeftWidth(newWidth);
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      if (!isResizing) return;
      // Use requestAnimationFrame for smooth updates
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => handleResize(e));
    },
    [isResizing, handleResize]
  );

  useEffect(() => {
    const handlePointerDown = (e) => {
      setIsResizing(true);
      if (handleRef.current) {
        handleRef.current.setPointerCapture(e.pointerId);
      }
      // Prevent text selection during drag
      document.body.style.userSelect = "none";
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Restore text selection
      document.body.style.userSelect = "";
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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.body.style.userSelect = "";
    };
  }, [handlePointerMove]);

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
        {children[0]}
      </Panel>
      <ResizeHandle
        ref={handleRef}
        style={{
          left: screenMode === "both" ? `calc(${leftWidth}% - 3px)` : "50%", 
          visibility: handleVisibility,
        }}
      />
      <Panel ref={rightPanelRef} style={rightStyle}>
        {children[1]}
      </Panel>
    </SplitScreenContainer>
  );
};

export default SplitScreen;