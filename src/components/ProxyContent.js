import React, { useEffect, useState, useRef, Suspense } from "react";
import styled from "styled-components";
import mammoth from "mammoth";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

const ExcelViewer = React.lazy(() => import("./ExcelViewer"));

// Basic styling (unchanged)
const TabContainer = styled.div`
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 2px solid #e0e0e0;
  padding: 0;
  margin: 0;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
`;

const TabButton = styled.button`
  padding: 6px 12px;
  background-color: ${(props) => (props.$active ? "#ffffff" : "#f5f5f5")};
  color: ${(props) => (props.$active ? "#1a73e8" : "#333")};
  border: none;
  border-bottom: ${(props) => (props.$active ? "2px solid #1a73e8" : "none")};
  font-size: 14px;
  font-family: 'Arial', sans-serif;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background-color: ${(props) => (props.$active ? "#ffffff" : "#e8e8e8")};
    color: #1a73e8;
  }

  &:focus {
    outline: none;
  }
`;

// Base TabContent for non-patent content
const TabContent = styled.div`
  flex: 1;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background: #fff;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  text-align: left;
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  height: calc(100vh - 60px);
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-break: break-word;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #1a73e8;
    margin-bottom: 15px;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 5px;
  }

  h3 {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin: 10px 0;
  }

  p {
    margin: 8px 0;
    color: #555;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  strong {
    font-weight: 600;
    color: #333;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
  }

  img {
    max-width: 100%;
    margin: 10px 0;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }

  ul, ol {
    padding-left: 20px;
    margin: 10px 0;
  }

  li {
    margin: 5px 0;
    color: #555;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    table-layout: fixed;
  }

  th, td {
    padding: 8px;
    border: 1px solid #e0e0e0;
    text-align: left;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
  }

  th {
    background-color: #f5f5f5;
    font-weight: 600;
  }

  a {
    color: #1a73e8;
    text-decoration: none;
    cursor: pointer;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
  }

  a:hover {
    text-decoration: underline;
  }

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
`;

// ScrollWrapper (unchanged)
const ScrollWrapper = styled.div`
  width: 100%;
  height: calc(100vh - 60px);
  overflow-x: auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
`;

// PatentTabContent (unchanged)
const PatentTabContent = styled.div`
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background: #fff;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-wrap: break-word;
  word-break: break-word;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #1a73e8;
    margin-bottom: 15px;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 5px;
    white-space: normal;
  }

  h3 {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin: 10px 0;
    white-space: normal;
  }

  p {
    margin: 8px 0;
    color: #555;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
    white-space: normal;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  strong {
    font-weight: 600;
    color: #333;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
    white-space: normal;
  }

  img {
    max-width: 100%;
    margin: 10px 0;
  }

  ul, ol {
    padding-left: 20px;
    margin: 10px 0;
  }

  li {
    margin: 5px 0;
    color: #555;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
    white-space: normal;
  }

  table {
    max-width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    table-layout: fixed;
  }

  th, td {
    padding: 8px;
    border: 1px solid #e0e0e0;
    text-align: left;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
    white-space: normal;
  }

  th {
    background-color: #f5f5f5;
    font-weight: 600;
  }

  a {
    color: #1a73e8;
    text-decoration: none;
    cursor: pointer;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
    white-space: normal;
  }

  a:hover {
    text-decoration: underline;
  }
`;

// Rest of the styled components (unchanged)
const ContentWrapper = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
`;

const PatentIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  box-sizing: border-box;
`;

const DocViewer = styled.div`
  width: 100%;
  height: 100%;
  font-family: 'Arial', sans-serif;
  padding: 10px;
  box-sizing: border-box;

  & > div {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  img, table, p, div {
    max-width: 100%;
    height: auto;
    box-sizing: border-box;
  }
`;

const FallbackMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
  font-family: 'Arial', sans-serif;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin: 10px;
`;

const DownloadLink = styled.a`
  color: #1a73e8;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  font-size: 16px;
  color: #5f6368;
  font-family: 'Arial', sans-serif;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 10px;
`;

const RetryButton = styled.button`
  padding: 8px 16px;
  background-color: #555;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-family: 'Arial', sans-serif;
  &:hover {
    background-color: #666;
  }
`;

const ProxyContent = ({ url, backendUrl, onLinkClick, isFileUpload, fileName }) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [patentData, setPatentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [directIframe, setDirectIframe] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [availableTabs, setAvailableTabs] = useState([]);
  const iframeRef = useRef(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const isPatentUrl = (urlToCheck) => {
    try {
      return urlToCheck && new URL(urlToCheck).hostname === "patents.google.com" && urlToCheck.includes("/patent");
    } catch {
      return false;
    }
  };

  const isDownloadLink = (urlToCheck) => {
    try {
      return (
        urlToCheck &&
        !urlToCheck.endsWith(".pdf") &&
        !urlToCheck.includes("/patent/pdf/") &&
        urlToCheck.includes("download")
      );
    } catch {
      return false;
    }
  };

  const isPdfUrl = (urlToCheck) => {
    try {
      return (
        urlToCheck &&
        (urlToCheck.toLowerCase().endsWith(".pdf") || urlToCheck.includes("/patent/pdf/"))
      );
    } catch {
      return false;
    }
  };

  const fetchWithRetry = async (fetchUrl, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(fetchUrl, {
          headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.5",
            Referer: "https://patents.google.com/",
          },
        });

        if (response.ok) {
          return response;
        }

        throw new Error(`Fetch failed: ${response.status} - ${response.statusText}`);
      } catch (err) {
        if (i === retries - 1) throw err;
        console.log(`Retrying fetch (${i + 1}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const fetchPdfAsBlob = async (pdfUrl) => {
    try {
      const proxyUrl = `${backendUrl}/api/proxy?url=${encodeURIComponent(pdfUrl)}`;
      const response = await fetch(proxyUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Referer: "https://patents.google.com/",
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} - ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);
      return blobUrl;
    } catch (err) {
      console.error("PDF fetch error:", err);
      throw err;
    }
  };

  const handleWordFile = async (blob, fileName) => {
    try {
      const maxSize = 10 * 1024 * 1024;
      if (blob.size > maxSize) {
        throw new Error("File size exceeds 10MB limit. Please upload a smaller file.");
      }

      const fileExt = fileName.split(".").pop().toLowerCase();
      if (!["doc", "docx"].includes(fileExt)) {
        throw new Error("Unsupported file type. Please upload a .doc or .docx file.");
      }

      const arrayBuffer = await blob.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer }).catch((err) => {
        console.error("Mammoth conversion error:", err);
        throw new Error(`Failed to convert Word document: ${err.message || "Unknown error"}`);
      });

      if (!result || !result.value) {
        throw new Error("Failed to convert Word document: Empty or invalid content.");
      }

      setContent({
        type: "html",
        data: `<div style="padding: 20px; font-family: 'Arial', sans-serif; max-width: 100%; box-sizing: border-box;">${result.value}</div>`,
      });
    } catch (err) {
      console.error("Error in handleWordFile:", err);
      setError(
        err.message || "Failed to process Word document. Try downloading the file instead."
      );
      setContent({
        type: "download",
        url: URL.createObjectURL(blob),
        message: "Unable to render Word document. Please download to view.",
      });
    }
  };

  const handlePptFile = async (blob, fileName) => {
    try {
      const maxSize = 10 * 1024 * 1024;
      if (blob.size > maxSize) {
        throw new Error("File size exceeds 10MB limit. Please upload a smaller file.");
      }

      const fileExt = fileName.split(".").pop().toLowerCase();
      if (!["ppt", "pptx"].includes(fileExt)) {
        throw new Error("Unsupported file type. Please upload a .ppt or .pptx file.");
      }

      if (fileExt === "ppt") {
        throw new Error("Legacy .ppt files are not supported for rendering. Please download to view.");
      }

      const arrayBuffer = await blob.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Parse XML content
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
      });

      // Extract slide files
      const slideFiles = Object.keys(zip.files).filter((file) =>
        file.match(/^ppt\/slides\/slide\d+\.xml$/)
      );

      if (!slideFiles.length) {
        throw new Error("No slides found in the PowerPoint file.");
      }

      // Sort slides by number
      slideFiles.sort((a, b) => {
        const aNum = parseInt(a.match(/slide(\d+)\.xml$/)[1], 10);
        const bNum = parseInt(b.match(/slide(\d+)\.xml$/)[1], 10);
        return aNum - bNum;
      });

      // Extract images from ppt/media/
      const mediaFiles = Object.keys(zip.files).filter((file) =>
        file.match(/^ppt\/media\/image\d+\.(png|jpeg|jpg|gif)$/i)
      );

      const mediaDataUrls = {};
      for (const mediaFile of mediaFiles) {
        const mediaBlob = await zip.file(mediaFile).async("blob");
        const mediaUrl = URL.createObjectURL(mediaBlob);
        const mediaId = mediaFile.match(/image\d+\./)[0].replace(".", "");
        mediaDataUrls[mediaId] = mediaUrl;
      }

      // Extract theme information (for colors, fonts, etc.)
      const themeFiles = Object.keys(zip.files).filter((file) =>
        file.match(/^ppt\/theme\/theme\d+\.xml$/)
      );
      let themeData = {};
      if (themeFiles.length > 0) {
        const themeContent = await zip.file(themeFiles[0]).async("string");
        themeData = parser.parse(themeContent);
      }

      // Extract slide master for default styles
      const slideMasterFiles = Object.keys(zip.files).filter((file) =>
        file.match(/^ppt\/slideMasters\/slideMaster\d+\.xml$/)
      );
      let slideMasterData = {};
      if (slideMasterFiles.length > 0) {
        const slideMasterContent = await zip.file(slideMasterFiles[0]).async("string");
        slideMasterData = parser.parse(slideMasterContent);
      }

      // Extract slide layout for positioning
      const slideLayoutFiles = Object.keys(zip.files).filter((file) =>
        file.match(/^ppt\/slideLayouts\/slideLayout\d+\.xml$/)
      );
      let slideLayoutData = {};
      if (slideLayoutFiles.length > 0) {
        const slideLayoutContent = await zip.file(slideLayoutFiles[0]).async("string");
        slideLayoutData = parser.parse(slideLayoutContent);
      }

      // Extract presentation.xml for slide size
      let slideWidth = 960; // Default 4:3 aspect ratio (10 inches at 96 DPI)
      let slideHeight = 720;
      const presentationFile = "ppt/presentation.xml";
      if (zip.files[presentationFile]) {
        const presentationContent = await zip.file(presentationFile).async("string");
        const presentationData = parser.parse(presentationContent);
        const sldSz = presentationData?.["p:presentation"]?.["p:sldSz"];
        if (sldSz) {
          const cx = parseInt(sldSz["@_cx"]) || 9144000; // Default 10 inches in EMUs
          const cy = parseInt(sldSz["@_cy"]) || 6858000; // Default 7.5 inches in EMUs
          slideWidth = (cx / 914400) * 96; // Convert EMUs to pixels
          slideHeight = (cy / 914400) * 96;
        }
      }

      let htmlContent = `
        <div style="padding: 20px; font-family: 'Arial', sans-serif; max-width: 100%; box-sizing: border-box;">
      `;

      for (let i = 0; i < slideFiles.length; i++) {
        const slideContent = await zip.file(slideFiles[i]).async("string");
        let slideData;
        try {
          slideData = parser.parse(slideContent);
        } catch (parseErr) {
          console.error(`Failed to parse slide ${i + 1}:`, parseErr);
          continue;
        }

        // Extract background color (if available)
        let backgroundColor = "#ffffff"; // Default to white
        const bgFill = slideData?.["p:sld"]?.["p:cSld"]?.["p:bg"]?.["p:bgPr"]?.["a:solidFill"];
        if (bgFill?.["a:srgbClr"]) {
          backgroundColor = `#${bgFill["a:srgbClr"]["@_val"]}`;
        } else if (bgFill?.["a:schemeClr"]) {
          const schemeClr = bgFill["a:schemeClr"]["@_val"];
          const colorMap = themeData?.["a:theme"]?.["a:themeElements"]?.["a:clrScheme"];
          if (colorMap && colorMap[schemeClr]) {
            const srgbClr = colorMap[schemeClr]["a:srgbClr"]?.["@_val"];
            if (srgbClr) {
              backgroundColor = `#${srgbClr}`;
            }
          }
        }

        // Start slide container with fixed dimensions and background color
        htmlContent += `
          <div style="position: relative; border: 2px solid #d3d3d3; border-radius: 6px; padding: 15px; margin-bottom: 20px; background: ${backgroundColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.15); width: ${slideWidth}px; height: ${slideHeight}px; max-width: 100%; max-height: calc(100vh - 100px); overflow: hidden; transform-origin: top left; transform: scale(${Math.min(1, 960 / slideWidth)});">
            <h2 style="font-size: 16px; color: #1a73e8; margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 1px solid #e0e0e0;">Slide ${i + 1}</h2>
        `;

        // Extract text with styling and positioning
        const texts = [];
        let lastY = 40; // Start below the "Slide X" header
        const occupiedPositions = []; // Track occupied positions to prevent overlap
        const pNodes = slideData?.["p:sld"]?.["p:cSld"]?.["p:spTree"]?.["p:sp"] || [];

        const shapes = Array.isArray(pNodes) ? pNodes : [pNodes].filter(Boolean);
        shapes.forEach((shape, shapeIndex) => {
          if (shape["p:txBody"]) {
            // Get position (if available)
            let x = 0, y = 0, width = slideWidth - 30, height = "auto";
            if (shape["p:spPr"]?.["a:xfrm"]) {
              const xfrm = shape["p:spPr"]["a:xfrm"];
              x = (xfrm["a:off"]?.["@_x"] || 0) / 914400 * 96; // Convert EMUs to pixels
              y = (xfrm["a:off"]?.["@_y"] || 0) / 914400 * 96;
              width = ((xfrm["a:ext"]?.["@_cx"] || 0) / 914400 * 96) || width;
              height = ((xfrm["a:ext"]?.["@_cy"] || 0) / 914400 * 96) || height;
            } else {
              // Fallback positioning to avoid overlap
              x = 15;
              y = lastY;
            }

            // Check for overlap and adjust position
            let adjustedY = y;
            for (const pos of occupiedPositions) {
              if (
                x < pos.x + pos.width &&
                x + width > pos.x &&
                adjustedY < pos.y + pos.height &&
                adjustedY + (height !== "auto" ? height : 50) > pos.y
              ) {
                adjustedY = pos.y + pos.height + 10; // Add padding to avoid overlap
              }
            }
            y = adjustedY;
            occupiedPositions.push({ x, y, width, height: height !== "auto" ? height : 50 });

            const paragraphs = shape["p:txBody"]["a:p"];
            const paraArray = Array.isArray(paragraphs) ? paragraphs : [paragraphs].filter(Boolean);
            let paragraphText = [];
            let paragraphStyle = {};

            paraArray.forEach((para) => {
              let textAlign = "left";
              let lineHeight = "1.2";
              let listStyle = "none"; // For bullets
              let marginLeft = "0px";

              if (para["a:pPr"]) {
                const pPr = para["a:pPr"];
                textAlign = pPr["@_algn"] || textAlign; // left, ctr, right
                if (pPr["a:lnSpc"]) {
                  const lnSpc = pPr["a:lnSpc"]["a:spcPct"]?.["@_val"];
                  if (lnSpc) {
                    lineHeight = parseInt(lnSpc) / 100000;
                  }
                }
                if (pPr["@_lvl"]) {
                  const level = parseInt(pPr["@_lvl"]) || 0;
                  marginLeft = `${level * 20}px`;
                  if (pPr["a:buChar"]) {
                    listStyle = "disc";
                  } else if (pPr["a:buAutoNum"]) {
                    listStyle = "decimal";
                  }
                }
              }

              if (para["a:r"]) {
                const runs = Array.isArray(para["a:r"]) ? para["a:r"] : [para["a:r"]].filter(Boolean);
                let runText = [];
                runs.forEach((run) => {
                  if (run["a:t"] && typeof run["a:t"] === "string") {
                    const text = run["a:t"];
                    const rPr = run["a:rPr"] || {};

                    // Extract text styling
                    let fontFamily = "Arial";
                    let fontSize = "14px";
                    let color = "#000000";
                    let isBold = false;
                    let isItalic = false;
                    let letterSpacing = "normal";

                    // Font family mapping for web-safe fonts
                    if (rPr["@_latin"]) {
                      fontFamily = rPr["@_latin"]["@_typeface"] || fontFamily;
                    } else if (rPr["@_typeface"]) {
                      fontFamily = rPr["@_typeface"];
                    }
                    const fontMap = {
                      "Calibri": "'Calibri', 'Arial', sans-serif",
                      "Times New Roman": "'Times New Roman', 'Times', serif",
                      "Arial": "'Arial', sans-serif",
                      "Verdana": "'Verdana', sans-serif",
                      "Helvetica": "'Helvetica', 'Arial', sans-serif",
                      "Cambria": "'Cambria', 'Georgia', serif",
                      "Garamond": "'Garamond', 'Times New Roman', serif",
                    };
                    fontFamily = fontMap[fontFamily] || `'${fontFamily}', 'Arial', sans-serif`;

                    if (rPr["@_sz"]) {
                      const sz = parseInt(rPr["@_sz"]) / 100; // Convert to points
                      fontSize = `${sz}px`;
                    }

                    if (rPr["a:solidFill"]) {
                      if (rPr["a:solidFill"]["a:srgbClr"]) {
                        color = `#${rPr["a:solidFill"]["a:srgbClr"]["@_val"]}`;
                      } else if (rPr["a:solidFill"]["a:schemeClr"]) {
                        const schemeClr = rPr["a:solidFill"]["a:schemeClr"]["@_val"];
                        const colorMap = themeData?.["a:theme"]?.["a:themeElements"]?.["a:clrScheme"];
                        if (colorMap && colorMap[schemeClr]) {
                          const srgbClr = colorMap[schemeClr]["a:srgbClr"]?.["@_val"];
                          if (srgbClr) {
                            color = `#${srgbClr}`;
                          }
                        }
                      }
                    }

                    if (rPr["@_spc"]) {
                      const spc = parseInt(rPr["@_spc"]) / 100; // Convert to points
                      letterSpacing = `${spc}px`;
                    }

                    isBold = rPr["@_b"] === "1";
                    isItalic = rPr["@_i"] === "1";

                    runText.push({
                      text: text.trim(),
                      style: {
                        fontFamily,
                        fontSize,
                        color,
                        fontWeight: isBold ? "bold" : "normal",
                        fontStyle: isItalic ? "italic" : "normal",
                        letterSpacing,
                      },
                    });
                  }
                });

                if (runText.length > 0) {
                  paragraphText.push(runText);
                  paragraphStyle = {
                    position: "absolute",
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${width}px`,
                    height: height !== "auto" ? `${height}px` : "auto",
                    textAlign: textAlign === "ctr" ? "center" : textAlign === "r" ? "right" : "left",
                    lineHeight,
                    whiteSpace: "pre-wrap",
                    overflow: "hidden",
                    textShadow: "0 1px 1px rgba(0,0,0,0.1)",
                    listStyleType: listStyle,
                    marginLeft,
                    paddingLeft: listStyle !== "none" ? "20px" : "0px",
                  };
                }
              }
            });

            if (paragraphText.length > 0) {
              texts.push({ paragraphs: paragraphText, style: paragraphStyle });
              lastY = y + (height !== "auto" ? height : 50);
            }
          }
        });

        // Extract images associated with this slide
        const slideRelsFile = `ppt/slides/_rels/slide${i + 1}.xml.rels`;
        let images = [];
        if (zip.files[slideRelsFile]) {
          const relsContent = await zip.file(slideRelsFile).async("string");
          const relsData = parser.parse(relsContent);
          const relationships = relsData?.Relationships?.Relationship || [];
          const relArray = Array.isArray(relationships) ? relationships : [relationships].filter(Boolean);

          images = relArray
            .filter((rel) => rel["@_Target"]?.includes("../media/image"))
            .map((rel) => {
              const target = rel["@_Target"];
              const imageId = target.match(/image\d+/i)?.[0];
              const imageUrl = mediaDataUrls[imageId];

              // Get image position
              const shape = shapes.find((s) =>
                s["p:spPr"]?.["a:blipFill"]?.["a:blip"]?.["@_r:embed"] === rel["@_Id"]
              );
              let x = 0, y = 0, width = "auto", height = "auto";
              if (shape?.["p:spPr"]?.["a:xfrm"]) {
                const xfrm = shape["p:spPr"]["a:xfrm"];
                x = (xfrm["a:off"]?.["@_x"] || 0) / 914400 * 96;
                y = (xfrm["a:off"]?.["@_y"] || 0) / 914400 * 96;
                width = (xfrm["a:ext"]?.["@_cx"] || 0) / 914400 * 96;
                height = (xfrm["a:ext"]?.["@_cy"] || 0) / 914400 * 96;
              }

              return { url: imageUrl, x, y, width, height };
            })
            .filter((img) => img.url);
        }

        // Add images if available
        if (images.length > 0) {
          images.forEach((image, idx) => {
            htmlContent += `
              <img
                src="${image.url}"
                alt="Slide ${i + 1} Image ${idx + 1}"
                style="
                  position: absolute;
                  left: ${image.x}px;
                  top: ${image.y}px;
                  width: ${image.width !== "auto" ? `${image.width}px` : "auto"};
                  height: ${image.height !== "auto" ? `${image.height}px` : "auto"};
                  max-width: 100%;
                  max-height: 100%;
                  border: 1px solid #e0e0e0;
                  border-radius: 4px;
                "
              />
            `;
          });
        }

        // Add text content
        if (texts.length > 0) {
          texts.forEach((textObj, idx) => {
            const style = Object.entries(textObj.style)
              .map(([key, value]) => `${key}: ${value}`)
              .join("; ");
            const listTag = textObj.style.listStyleType !== "none" ? (textObj.style.listStyleType === "disc" ? "ul" : "ol") : "div";
            htmlContent += `<${listTag} style="${style}">`;
            textObj.paragraphs.forEach((para) => {
              if (textObj.style.listStyleType !== "none") {
                htmlContent += `<li style="margin: 0;">`;
              } else {
                htmlContent += `<p style="margin: 0;">`;
              }
              para.forEach((run) => {
                const runStyle = Object.entries(run.style)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join("; ");
                htmlContent += `<span style="${runStyle}">${run.text}</span>`;
              });
              htmlContent += textObj.style.listStyleType !== "none" ? `</li>` : `</p>`;
            });
            htmlContent += `</${listTag}>`;
          });
        } else {
          htmlContent += `<p style="color: #666; font-size: 14px;">No text content found on this slide.</p>`;
        }

        htmlContent += `</div>`;
      }

      htmlContent += `</div>`;

      setContent({
        type: "html",
        data: htmlContent,
      });
    } catch (err) {
      console.error("Error in handlePptFile:", err);
      setError(
        err.message || "Failed to process PowerPoint file. Try downloading the file instead."
      );
      setContent({
        type: "download",
        url: URL.createObjectURL(blob),
        message: "Unable to render PowerPoint file. Please download to view.",
      });
    }
  };

  const fetchContent = async () => {
    if (!url) {
      setError("No URL or link provided");
      setLoading(false);
      return;
    }

    console.log("Fetching content for URL:", url);
    setContent(null);
    setPatentData(null);
    setError(null);
    setLoading(true);
    setDirectIframe(false);
    setAvailableTabs([]);
    setActiveTab(null);
    setPdfBlobUrl(null);

    try {
      let response;
      let blob;

      if (isFileUpload && fileName) {
        try {
          response = await fetch(url, { mode: "cors" });
          if (!response.ok) throw new Error(`Blob fetch failed: ${response.status} - ${response.statusText}`);
          blob = await response.blob();

          const fileExt = fileName.split(".").pop().toLowerCase();

          if (["xlsx", "xls"].includes(fileExt)) {
            setContent({ type: "excel", blob });
          } else if (["doc", "docx"].includes(fileExt)) {
            await handleWordFile(blob, fileName);
          } else if (["ppt", "pptx"].includes(fileExt)) {
            await handlePptFile(blob, fileName);
          } else if (fileExt === "pdf") {
            setContent({ type: "pdf", url: `${url}#view=FitH` });
          } else {
            setContent({
              type: "download",
              url,
              message: "This file type is not directly renderable. Please download to view.",
            });
          }
        } catch (err) {
          throw new Error(`Failed to process file: ${err.message}`);
        }
      } else if (isPatentUrl(url)) {
        const proxyUrl = `${backendUrl}/api/proxy?url=${encodeURIComponent(url)}`;
        response = await fetchWithRetry(proxyUrl);
        const data = await response.json();

        if (data.type === "patent" && data.data) {
          setPatentData(data.data);
          console.log("Frontend Received Patent Data:", JSON.stringify(data.data, null, 2));
        } else {
          throw new Error("Unexpected response format");
        }
      } else if (url.includes("docs.google.com") || url.includes("drive.google.com")) {
        setDirectIframe(true);
        setContent({ type: "iframe", url });
      } else if (isPdfUrl(url)) {
        console.log("Detected PDF URL, fetching as blob:", url);
        const blobUrl = await fetchPdfAsBlob(url);
        setContent({ type: "pdf", url: `${blobUrl}#view=FitH` });
      } else {
        const fetchUrl = `${backendUrl}/api/proxy?url=${encodeURIComponent(url)}`;
        await handleProxyContent(fetchUrl);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Failed to load content: ${err.message}. Try opening in a new tab.`);
    } finally {
      setLoading(false);
    }
  };

  const handleProxyContent = async (fetchUrl) => {
    const response = await fetchWithRetry(fetchUrl);
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";

    if (contentType.includes("text/html")) {
      const html = await response.text();
      setContent({ type: "html", data: processHtml(html, url) });
    } else {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      if (contentType.includes("application/pdf")) {
        setContent({ type: "pdf", url: `${blobUrl}#view=FitH` });
      } else if (
        contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
        contentType.includes("application/vnd.ms-excel")
      ) {
        setContent({ type: "excel", blob });
      } else if (
        contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
        contentType.includes("application/msword")
      ) {
        await handleWordFile(blob, "downloaded_document.docx");
      } else if (
        contentType.includes("application/vnd.openxmlformats-officedocument.presentationml.presentation") ||
        contentType.includes("application/vnd.ms-powerpoint")
      ) {
        await handlePptFile(blob, "downloaded_presentation.pptx");
      } else {
        setContent({
          type: "download",
          url: blobUrl,
          message: "This file type is not directly renderable. Please download to view.",
        });
      }
    }
  };

  const processHtml = (html, baseUrl) => {
    let processedHtml = html;

    let domain = "";
    try {
      const urlObj = new URL(baseUrl);
      domain = `${urlObj.protocol}//${urlObj.hostname}`;
    } catch (e) {
      console.error("Invalid URL:", baseUrl);
    }

    if (domain) {
      processedHtml = processedHtml.replace(/(href|src)="\/([^"]*)"/g, `$1="${domain}/$2"`);

      processedHtml =
        processedHtml +
        `
        <script>
          document.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' && e.target.href) {
              e.preventDefault();
              window.parent.postMessage({
                type: 'linkClick',
                url: e.target.href
              }, '*');
            }
          });
        </script>
      `;
    }

    return processedHtml;
  };

  // Fetch content when props change
  useEffect(() => {
    console.log("useEffect triggered with URL:", url);
    fetchContent();
  }, [url, backendUrl, isFileUpload, fileName]);

  // Clean up pdfBlobUrl to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    };
  }, [pdfBlobUrl]);

  // Handle link clicks from iframes
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === "linkClick" && event.data.url) {
        console.log("Received linkClick event with URL:", event.data.url);
        if (isDownloadLink(event.data.url)) {
          const link = document.createElement("a");
          link.href = event.data.url;
          link.download = fileName || "file";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          onLinkClick(event.data.url);
          setContent(null);
          setPatentData(null);
          setError(null);
          setLoading(true);
          setDirectIframe(false);
          fetchContent();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onLinkClick, fileName]);

  // Initialize tabs when patentData changes
  useEffect(() => {
    if (patentData && !activeTab) {
      const possibleTabs = [
        {
          name: "Overview",
          hasData:
            patentData.title ||
            patentData.abstract ||
            patentData.inventors?.length ||
            patentData.publicationNumber,
        },
        { name: "PDF", hasData: !!patentData.pdfUrl },
        { name: "Images", hasData: patentData.drawings?.length > 0 },
        { name: "Claims", hasData: !!patentData.claims },
        { name: "Description", hasData: !!patentData.description },
        { name: "Classifications", hasData: patentData.classifications?.length > 0 },
        { name: "Citations", hasData: patentData.citations?.length > 0 },
        { name: "Cited By", hasData: patentData.citedBy?.length > 0 },
        { name: "Legal Events", hasData: patentData.legalEvents?.length > 0 },
        { name: "Patent Family", hasData: patentData.patentFamily?.length > 0 },
        { name: "Similar Documents", hasData: patentData.similarDocs?.length > 0 },
      ];

      const tabs = possibleTabs.filter((tab) => tab.hasData);
      if (tabs.length > 0) {
        setActiveTab(tabs[0].name);
        setAvailableTabs(tabs.map((tab) => tab.name));
      }
    }
  }, [patentData]);

  const renderTabbedInterface = () => {
    if (!patentData) return null;

    const handleCitationClick = (number) => {
      const citationUrl = `https://patents.google.com/patent/${number}`;
      console.log("Citation clicked, triggering onLinkClick with URL:", citationUrl);
      onLinkClick(citationUrl);
      fetchContent();
    };

    const renderTabContent = () => {
      switch (activeTab) {
        case "Overview":
          const publicationNumbers = patentData.publicationNumber
            ? patentData.publicationNumber.split(/,\s*/).filter(Boolean)
            : [];
          const publicationDates = patentData.publicationDate
            ? patentData.publicationDate.split(/,\s*/).filter(Boolean)
            : [];

          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Overview</h2>
                {patentData.title && <h3>{patentData.title}</h3>}
                {publicationNumbers.length > 0 && (
                  <p>
                    <strong>Publication Number:</strong>{" "}
                    {publicationNumbers.map((number, index) => (
                      <span key={index}>
                        {number}
                        {index < publicationNumbers.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                )}
                {publicationDates.length > 0 && (
                  <p>
                    <strong>Publication Date:</strong>{" "}
                    {publicationDates.map((date, index) => (
                      <span key={index}>
                        {date}
                        {index < publicationDates.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                )}
                {patentData.filingDate && (
                  <p>
                    <strong>Filing Date:</strong> {patentData.filingDate}
                  </p>
                )}
                {patentData.priorityDate && (
                  <p>
                    <strong>Priority Date:</strong> {patentData.priorityDate}
                  </p>
                )}
                {patentData.inventors?.length > 0 && (
                  <p>
                    <strong>Inventors:</strong> {patentData.inventors.join(", ")}
                  </p>
                )}
                {patentData.assignee && (
                  <p>
                    <strong>Assignee:</strong> {patentData.assignee}
                  </p>
                )}
                {patentData.status && (
                  <p>
                    <strong>Status:</strong> {patentData.status}
                  </p>
                )}
                {patentData.abstract && (
                  <p>
                    <strong>Abstract:</strong> {patentData.abstract}
                  </p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "PDF":
          const pdfUrl = patentData.pdfUrl;
          if (pdfUrl) {
            console.log("PDF tab clicked, triggering onLinkClick with URL:", pdfUrl);
            onLinkClick(pdfUrl);
            return <TabContent><LoadingIndicator>Redirecting to PDF...</LoadingIndicator></TabContent>;
          }
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <FallbackMessage>
                  PDF link not available.
                </FallbackMessage>
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Images":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Images</h2>
                {patentData.drawings?.length > 0 ? (
                  patentData.drawings.map((drawing, index) => (
                    <img
                      key={index}
                      src={drawing}
                      alt={`Drawing ${index + 1}`}
                      style={{ maxWidth: "100%" }}
                    />
                  ))
                ) : (
                  <p>No images found.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Claims":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                {patentData.claims ? (
                  <div dangerouslySetInnerHTML={{ __html: patentData.claims }} />
                ) : (
                  <p>No claims found.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Description":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                {patentData.description ? (
                  <div dangerouslySetInnerHTML={{ __html: patentData.description }} />
                ) : (
                  <p>No description found.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Classifications":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Classifications</h2>
                {patentData.classifications?.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patentData.classifications.map((cls, index) => (
                        <tr key={index}>
                          <td>{cls.code || "N/A"}</td>
                          <td>{cls.description || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No classifications found.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Citations":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Citations</h2>
                {patentData.citations?.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Publication Number</th>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patentData.citations.map((citation, index) => (
                        <tr key={index}>
                          <td>
                            {citation.number ? (
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleCitationClick(citation.number);
                                }}
                              >
                                {citation.number}
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>{citation.date || "N/A"}</td>
                          <td>{citation.title || "N/A"}</td>
                          <td>{citation.assignee || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No citations found.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Cited By":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Cited By</h2>
                {patentData.citedBy?.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Publication Number</th>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patentData.citedBy.map((cite, index) => (
                        <tr key={index}>
                          <td>
                            {cite.number ? (
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleCitationClick(cite.number);
                                }}
                              >
                                {cite.number}
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>{cite.date || "N/A"}</td>
                          <td>{cite.title || "N/A"}</td>
                          <td>{cite.assignee || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No cited by documents found.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Legal Events":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Legal Events</h2>
                {patentData.legalEvents?.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patentData.legalEvents.map((event, index) => (
                        <tr key={index}>
                          <td>{event.date || "N/A"}</td>
                          <td>{event.description || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No legal events found.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Patent Family":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Patent Family</h2>
                {patentData.patentFamily?.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Publication Number</th>
                        <th>Date</th>
                        <th>Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patentData.patentFamily.map((family, index) => (
                        <tr key={index}>
                          <td>{family.number || "N/A"}</td>
                          <td>{family.date || "N/A"}</td>
                          <td>{family.country || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No patent family found.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Similar Documents":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Similar Documents</h2>
                {patentData.similarDocs?.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Publication Number</th>
                        <th>Date</th>
                        <th>Title</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patentData.similarDocs.map((doc, index) => (
                        <tr key={index}>
                          <td>{doc.number || "N/A"}</td>
                          <td>{doc.date || "N/A"}</td>
                          <td>{doc.title || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No similar documents found.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        default:
          return (
            <ScrollWrapper>
              <PatentTabContent>Select a tab to view content.</PatentTabContent>
            </ScrollWrapper>
          );
      }
    };

    return (
      <ContentWrapper>
        <TabContainer>
          {availableTabs.map((tab) => (
            <TabButton
              key={tab}
              $active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </TabButton>
          ))}
        </TabContainer>
        {activeTab && renderTabContent()}
      </ContentWrapper>
    );
  };

  if (loading) {
    return <LoadingIndicator>Loading content...</LoadingIndicator>;
  }

  if (error) {
    return (
      <ContentWrapper>
        <ErrorContainer>
          <div
            style={{
              color: "#d93025",
              padding: 12,
              background: "#fce8e6",
              borderRadius: "8px",
              textAlign: "center",
              fontSize: "16px",
              marginBottom: "10px",
              width: "100%",
            }}
          >
            {error}
          </div>

          {content?.type === "download" && (
            <DownloadLink href={content.url} download={fileName || "document"}>
              Download File
            </DownloadLink>
          )}

          <RetryButton onClick={fetchContent}>Retry Loading</RetryButton>

          <RetryButton
            onClick={() => window.open(url, "_blank")}
            style={{ backgroundColor: "#34a853" }}
          >
            Open in New Tab
          </RetryButton>
        </ErrorContainer>
      </ContentWrapper>
    );
  }

  if (isPatentUrl(url) && patentData) {
    return renderTabbedInterface();
  }

  if (directIframe || content?.type === "iframe") {
    return (
      <ContentWrapper>
        <PatentIframe
          ref={iframeRef}
          src={content?.url || url}
          title="External Content"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </ContentWrapper>
    );
  }

  if (content?.type === "excel") {
    return (
      <Suspense fallback={<LoadingIndicator>Loading Excel content...</LoadingIndicator>}>
        <ExcelViewer blob={content.blob} />
      </Suspense>
    );
  }

  if (content?.type === "html") {
    return (
      <ContentWrapper>
        <DocViewer dangerouslySetInnerHTML={{ __html: content.data }} />
      </ContentWrapper>
    );
  }

  if (content?.type === "pdf") {
    return (
      <ContentWrapper>
        <PatentIframe
          ref={iframeRef}
          src={content.url}
          title="PDF Content"
          type="application/pdf"
        />
      </ContentWrapper>
    );
  }

  if (content?.type === "download") {
    return (
      <ContentWrapper>
        <FallbackMessage>
          {content.message || "This file type is not directly renderable. Please download to view."}{" "}
          <DownloadLink href={content.url} download={fileName || "file"}>
            Download File
          </DownloadLink>
        </FallbackMessage>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper>
      <FallbackMessage>Unsupported content type</FallbackMessage>
    </ContentWrapper>
  );
};

export default ProxyContent;