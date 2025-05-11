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
  background: rgb(67, 12, 27);
  cursor: col-resize;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 1000;
  transition: background 0.2s ease, left 0.1s ease-out;

  &:hover {
    background: rgb(67, 12, 27);
  }

  &:active {
    background: rgb(67, 12, 27);
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
  const timeoutRef = useRef(null);

  const [left, right] = children;

  useEffect(() => {
    console.log("SplitScreen - screenMode:", screenMode);
    console.log("Handle visibility:", screenMode === "both" ? "visible" : "hidden");
  }, [screenMode]);

  const handleResize = useCallback((e) => {
    if (!containerRef.current) return;

    const now = performance.now();
    if (now - lastUpdateRef.current < 10) return;

    lastUpdateRef.current = now;

    const containerRect = containerRef.current.getBoundingClientRect();
    let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    newWidth = Math.max(10, Math.min(90, newWidth));
    setLeftWidth(newWidth);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsResizing(false);
    }, 50);
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

    const handlePointerUp = (e) => {
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
      </Panel>
    </SplitScreenContainer>
  );
};

export default SplitScreen;