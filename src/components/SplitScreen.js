import React, { useState, useRef, useEffect, useCallback } from "react";
import styled from "styled-components";

const SplitScreenContainer = styled.div`
  display: flex;
  flex: 1;
  height: calc(100% - 60px); /* Adjust based on header height */
  overflow: hidden;
  position: relative;
  margin: 0;
  padding: 0;
  background: #f9fafb;
`

const Panel = styled.div`
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  border: none;
  background: #ffffff;
  transition: width 0.3s ease;
  position: relative;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;

  & > * {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f3f4;
    border-radius: 6px;
    margin: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #6b7280;
    border-radius: 6px;
    border: 2px solid #f1f3f4;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #4b5563;
  }

  scrollbar-width: thin;
  scrollbar-color: #6b7280 #f1f3f4;
`

const ResizeHandle = styled.div`
  width: 4px;
  background: #6b7280;
  cursor: col-resize;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 1000;
  transition: background 0.2s ease, left 0.1s ease-out;

  &:hover {
    background: #4b5563;
  }

  &:active {
    background: #374151;
  }

  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
`

const CustomScrollbar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 12px;
  background: #f1f3f4;
  border-top: 1px solid #e5e7eb;
  overflow-x: auto;
  overflow-y: hidden;
  z-index: 1;

  &::-webkit-scrollbar {
    height: 12px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f3f4;
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #6b7280;
    border-radius: 6px;
    border: 2px solid #f1f3f4;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #4b5563;
  }

  scrollbar-width: thin;
  scrollbar-color: #6b7280 #f1f3f4;
`

const ScrollbarContent = styled.div`
  height: 12px;
  width: ${({ $scrollWidth }) => $scrollWidth}px;
`

const SplitScreen = ({ children, screenMode }) => {
  const [leftWidth, setLeftWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef(null)
  const handleRef = useRef(null)
  const leftPanelRef = useRef(null)
  const rightPanelRef = useRef(null)
  const leftScrollRef = useRef(null)
  const rightScrollRef = useRef(null)
  const [leftScrollWidth, setLeftScrollWidth] = useState(0)
  const [rightScrollWidth, setRightScrollWidth] = useState(0)
  const lastUpdateRef = useRef(0)
  const timeoutRef = useRef(null)

  const [left, right] = children

  useEffect(() => {
    console.log("SplitScreen - screenMode:", screenMode)
    console.log("Handle visibility:", screenMode === "both" ? "visible" : "hidden")
  }, [screenMode])

  const handleResize = useCallback((e) => {
    if (!containerRef.current) return

    const now = performance.now()
    if (now - lastUpdateRef.current < 10) return

    lastUpdateRef.current = now

    const containerRect = containerRef.current.getBoundingClientRect()
    let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
    newWidth = Math.max(10, Math.min(90, newWidth))
    setLeftWidth(newWidth)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsResizing(false)
    }, 50)
  }, [])

  useEffect(() => {
    const handlePointerDown = (e) => {
      setIsResizing(true)
      if (handleRef.current) {
        handleRef.current.setPointerCapture(e.pointerId)
      }
    }

    const handlePointerMove = (e) => {
      if (!isResizing) return
      handleResize(e)
    }

    const handlePointerUp = () => {
      setIsResizing(false)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    if (handleRef.current) {
      handleRef.current.addEventListener("pointerdown", handlePointerDown)
      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
    }

    return () => {
      if (handleRef.current) {
        handleRef.current.removeEventListener("pointerdown", handlePointerDown)
      }
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isResizing, handleResize])

  useEffect(() => {
    const updateScrollWidth = () => {
      if (leftPanelRef.current) {
        const contentWidth = leftPanelRef.current.scrollWidth
        const panelWidth = leftPanelRef.current.clientWidth
        const minScrollWidth = panelWidth
        setLeftScrollWidth(Math.max(contentWidth, minScrollWidth))
      }
      if (rightPanelRef.current) {
        const contentWidth = rightPanelRef.current.scrollWidth
        const panelWidth = rightPanelRef.current.clientWidth
        const minScrollWidth = panelWidth
        setRightScrollWidth(Math.max(contentWidth, minScrollWidth))
      }
    }

    updateScrollWidth()

    const resizeObserver = new ResizeObserver(updateScrollWidth)
    if (leftPanelRef.current) resizeObserver.observe(leftPanelRef.current)
    if (rightPanelRef.current) resizeObserver.observe(rightPanelRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [children, screenMode])

  useEffect(() => {
    const handleLeftPanelScroll = () => {
      if (leftPanelRef.current && leftScrollRef.current) {
        leftScrollRef.current.scrollLeft = leftPanelRef.current.scrollLeft
      }
    }

    const handleRightPanelScroll = () => {
      if (rightPanelRef.current && rightScrollRef.current) {
        rightScrollRef.current.scrollLeft = rightPanelRef.current.scrollLeft
      }
    }

    const handleLeftCustomScroll = () => {
      if (leftPanelRef.current && leftScrollRef.current) {
        leftPanelRef.current.scrollLeft = leftScrollRef.current.scrollLeft
      }
    }

    const handleRightCustomScroll = () => {
      if (rightPanelRef.current && rightScrollRef.current) {
        rightPanelRef.current.scrollLeft = rightScrollRef.current.scrollLeft
      }
    }

    if (leftPanelRef.current) leftPanelRef.current.addEventListener("scroll", handleLeftPanelScroll)
    if (rightPanelRef.current) rightPanelRef.current.addEventListener("scroll", handleRightPanelScroll)
    if (leftScrollRef.current) leftScrollRef.current.addEventListener("scroll", handleLeftCustomScroll)
    if (rightScrollRef.current) rightScrollRef.current.addEventListener("scroll", handleRightCustomScroll)

    return () => {
      if (leftPanelRef.current) leftPanelRef.current.removeEventListener("scroll", handleLeftPanelScroll)
      if (rightPanelRef.current) rightPanelRef.current.removeEventListener("scroll", handleRightPanelScroll)
      if (leftScrollRef.current) leftScrollRef.current.removeEventListener("scroll", handleLeftCustomScroll)
      if (rightScrollRef.current) rightScrollRef.current.removeEventListener("scroll", handleRightCustomScroll)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeElement = document.activeElement
      const isInputFocused = activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA"
      if (isInputFocused) return

      const scrollAmount = 50
      if (e.key === "ArrowLeft") {
        if (leftPanelRef.current && screenMode !== "right") {
          leftPanelRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" })
        }
        if (rightPanelRef.current && screenMode !== "left") {
          rightPanelRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" })
        }
      } else if (e.key === "ArrowRight") {
        if (leftPanelRef.current && screenMode !== "right") {
          leftPanelRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
        }
        if (rightPanelRef.current && screenMode !== "left") {
          rightPanelRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [screenMode])

  useEffect(() => {
    const handleWheel = (e) => {
      const scrollAmount = e.deltaY * 0.5
      if (leftPanelRef.current && screenMode !== "right" && e.target.closest(`[ref="${leftPanelRef.current}"]`)) {
        leftPanelRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
        e.preventDefault()
      }
      if (rightPanelRef.current && screenMode !== "left" && e.target.closest(`[ref="${rightPanelRef.current}"]`)) {
        rightPanelRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
        e.preventDefault()
      }
    }

    if (leftPanelRef.current) leftPanelRef.current.addEventListener("wheel", handleWheel, { passive: false })
    if (rightPanelRef.current) rightPanelRef.current.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      if (leftPanelRef.current) leftPanelRef.current.removeEventListener("wheel", handleWheel)
      if (rightPanelRef.current) rightPanelRef.current.removeEventListener("wheel", handleWheel)
    }
  }, [screenMode])

  const leftStyle = {
    width: screenMode === "left" ? "100%" : screenMode === "right" ? "0%" : `${leftWidth}%`,
    display: screenMode === "right" ? "none" : "block",
    position: "relative",
  }

  const rightStyle = {
    width: screenMode === "right" ? "100%" : screenMode === "left" ? "0%" : `${100 - leftWidth}%`,
    display: screenMode === "left" ? "none" : "block",
    position: "relative",
  }

  const handleVisibility = screenMode === "both" ? "visible" : "hidden"

  return (
    <SplitScreenContainer ref={containerRef}>
      <Panel ref={leftPanelRef} style={leftStyle}>
        {left}
        <CustomScrollbar ref={leftScrollRef}>
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
        <CustomScrollbar ref={rightScrollRef}>
          <ScrollbarContent $scrollWidth={rightScrollWidth} />
        </CustomScrollbar>
      </Panel>
    </SplitScreenContainer>
  )
}

export default SplitScreen