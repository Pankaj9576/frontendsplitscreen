import React, { useEffect, useState, useRef, Suspense } from "react";
import mammoth from "mammoth";
import JSZip from "jszip";

import {
  TabContainer,
  TabButton,
  TabContent,
  ScrollWrapper,
  PatentTabContent,
  ContentWrapper,
  PatentIframe,
  DocViewer,
  SlideContainer,
  SlideText,
  SlideImage,
  SlideBackgroundImage,
  NavigationContainer,
  NavButton,
  SlideCounter,
  FallbackMessage,
  DownloadLink,
  LoadingIndicator,
  ErrorContainer,
  RetryButton,
  SlideshowContainer,
  SlideshowImage,
  ImageModal,
  ModalImage,
  ModalNavButton,
  CloseButton,
  NavigationBar,
} from "./Styleproxy";

const ExcelViewer = React.lazy(() => import("./ExcelViewer"));

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [slideDimensions, setSlideDimensions] = useState({ width: 960, height: 720 });
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [pdfDisplayUrl, setPdfDisplayUrl] = useState(null);
  const [previousUrl, setPreviousUrl] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Modal ke liye states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [isPortrait, setIsPortrait] = useState(true);

  // Modal kholne aur band karne ke functions
  const openModal = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setIsModalOpen(true);
    setIsPortrait(true); // Default portrait mode
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImageUrl("");
  };

  const setPortraitMode = () => {
    setIsPortrait(true);
  };

  const setLandscapeMode = () => {
    setIsPortrait(false);
  };

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
        data: `<div style="padding: 20px; font-family: 'Arial', sans-serif; max-width: 100%; box-sizing: border-box; margin: 0; position: static;">${result.value}</div>`,
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

      const arrayBuffer = await blob.arrayBuffer();
      let zip;
      try {
        zip = await JSZip.loadAsync(arrayBuffer);
      } catch (err) {
        if (fileExt === "ppt") {
          console.warn("Detected .ppt file, which is not directly supported for rendering in the browser.");
          setContent({
            type: "download",
            url: URL.createObjectURL(blob),
            message: "Legacy .ppt files are not supported for rendering in the browser. Please download to view or convert to .pptx.",
          });
          return;
        }
        throw new Error("Failed to load PowerPoint file: " + err.message);
      }

      let slideWidth = 960;
      let slideHeight = 720;
      const presentationFile = "ppt/presentation.xml";
      if (zip.files[presentationFile]) {
        const presentationContent = await zip.file(presentationFile).async("string");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(presentationContent, "text/xml");
        const sldSz = xmlDoc.getElementsByTagName("p:sldSz")[0];
        if (sldSz) {
          const cx = parseInt(sldSz.getAttribute("cx")) || 9144000;
          const cy = parseInt(sldSz.getAttribute("cy")) || 6858000;
          slideWidth = (cx / 914400) * 96;
          slideHeight = (cy / 914400) * 96;
        }
      }
      setSlideDimensions({ width: slideWidth, height: slideHeight });

      const themeFiles = Object.keys(zip.files).filter((file) =>
        file.match(/^ppt\/theme\/theme\d+\.xml$/i)
      );
      const themeData = {};
      for (const themeFile of themeFiles) {
        const themeContent = await zip.file(themeFile).async("string");
        const parser = new DOMParser();
        const themeDoc = parser.parseFromString(themeContent, "text/xml");
        const themeId = themeFile.match(/theme\d+/)[0];
        const fontScheme = themeDoc.getElementsByTagName("a:fontScheme")[0];
        const majorFont = fontScheme?.getElementsByTagName("a:majorFont")[0]?.getElementsByTagName("a:latin")[0]?.getAttribute("typeface") || "Arial";
        const minorFont = fontScheme?.getElementsByTagName("a:minorFont")[0]?.getElementsByTagName("a:latin")[0]?.getAttribute("typeface") || "Arial";
        const clrScheme = themeDoc.getElementsByTagName("a:clrScheme")[0];
        const colors = {};
        const schemeColors = clrScheme?.getElementsByTagName("*") || [];
        for (const clr of schemeColors) {
          const name = clr.tagName.split(":")[1];
          const srgbClr = clr.getElementsByTagName("a:srgbClr")[0];
          if (srgbClr) {
            colors[name] = `#${srgbClr.getAttribute("val")}`;
          }
        }
        themeData[themeId] = { majorFont, minorFont, colors };
      }

      const slideMasters = Object.keys(zip.files).filter((file) =>
        file.match(/^ppt\/slideMasters\/slideMaster\d+\.xml$/i)
      );
      const slideLayouts = Object.keys(zip.files).filter((file) =>
        file.match(/^ppt\/slideLayouts\/slideLayout\d+\.xml$/i)
      );
      const slideMasterRels = Object.keys(zip.files).filter((file) =>
        file.match(/^ppt\/slideMasters\/_rels\/slideMaster\d+\.xml\.rels$/i)
      );
      const slideLayoutRels = Object.keys(zip.files).filter((file) =>
        file.match(/^ppt\/slideLayouts\/_rels\/slideLayout\d+\.xml\.rels$/i)
      );

      const masterData = {};
      for (const masterFile of slideMasters) {
        const masterId = masterFile.match(/slideMaster\d+/)[0];
        const masterContent = await zip.file(masterFile).async("string");
        const parser = new DOMParser();
        const masterDoc = parser.parseFromString(masterContent, "text/xml");

        const masterRelFile = `ppt/slideMasters/_rels/${masterId}.xml.rels`;
        let themeId = null;
        if (zip.files[masterRelFile]) {
          const relContent = await zip.file(masterRelFile).async("string");
          const relDoc = parser.parseFromString(relContent, "text/xml");
          const relationships = relDoc.getElementsByTagName("Relationship");
          for (const rel of relationships) {
            const target = rel.getAttribute("Target");
            if (target.includes("theme")) {
              themeId = target.match(/theme\d+/)[0];
              break;
            }
          }
        }

        let background = { color: null, images: [] };
        const bgNode = masterDoc.getElementsByTagName("p:bg")[0];
        if (bgNode) {
          const bgPr = bgNode.getElementsByTagName("p:bgPr")[0];
          if (bgPr) {
            const solidFill = bgPr.getElementsByTagName("a:solidFill")[0];
            if (solidFill) {
              const srgbClr = solidFill.getElementsByTagName("a:srgbClr")[0];
              if (srgbClr) {
                background.color = `#${srgbClr.getAttribute("val")}`;
              } else {
                const schemeClr = solidFill.getElementsByTagName("a:schemeClr")[0];
                if (schemeClr) {
                  const val = schemeClr.getAttribute("val");
                  background.color = themeData[themeId]?.colors[val] || "#fff";
                }
              }
            }
            const blipFill = bgPr.getElementsByTagName("a:blipFill")[0];
            if (blipFill) {
              const blip = blipFill.getElementsByTagName("a:blip")[0];
              const rId = blip?.getAttribute("r:embed");
              if (rId && zip.files[masterRelFile]) {
                const relContent = await zip.file(masterRelFile).async("string");
                const relDoc = parser.parseFromString(relContent, "text/xml");
                const relationship = Array.from(relDoc.getElementsByTagName("Relationship")).find(
                  (rel) => rel.getAttribute("Id") === rId
                );
                if (relationship) {
                  const target = relationship.getAttribute("Target");
                  const imagePath = `ppt/${target.replace("../", "")}`;
                  const imageId = imagePath.match(/image\d+\./)?.[0]?.replace(".", "") || "";
                  const imageUrl = mediaDataUrls[imageId];
                  if (imageUrl) {
                    const alphaModFix = blip.getElementsByTagName("a:alphaModFix")[0];
                    const opacity = alphaModFix ? parseInt(alphaModFix.getAttribute("amt")) / 100000 : 1;
                    background.images.push({
                      url: imageUrl,
                      opacity,
                    });
                  }
                }
              }
            }
          }
        }

        const placeholders = {};
        const shapes = masterDoc.getElementsByTagName("p:sp");
        for (const shape of shapes) {
          const nvSpPr = shape.getElementsByTagName("p:nvSpPr")[0];
          const cNvPr = nvSpPr?.getElementsByTagName("p:cNvPr")[0];
          const id = cNvPr?.getAttribute("id");
          const name = cNvPr?.getAttribute("name");
          if (id && name && name.includes("Placeholder")) {
            const xfrm = shape.getElementsByTagName("a:xfrm")[0];
            const off = xfrm?.getElementsByTagName("a:off")[0];
            const x = off ? parseInt(off.getAttribute("x")) / 914400 * 96 : 0;
            const y = off ? parseInt(off.getAttribute("y")) / 914400 * 96 : 0;
            const ext = xfrm?.getElementsByTagName("a:ext")[0];
            const width = ext ? parseInt(ext.getAttribute("cx")) / 914400 * 96 : null;
            const height = ext ? parseInt(ext.getAttribute("cy")) / 914400 * 96 : null;
            placeholders[id] = { x, y, width, height };
          }
        }

        masterData[masterId] = {
          themeId,
          background,
          placeholders,
        };
      }

      const layoutData = {};
      for (const layoutFile of slideLayouts) {
        const layoutId = layoutFile.match(/slideLayout\d+/)[0];
        const layoutContent = await zip.file(layoutFile).async("string");
        const parser = new DOMParser();
        const layoutDoc = parser.parseFromString(layoutContent, "text/xml");

        const layoutRelFile = `ppt/slideLayouts/_rels/${layoutId}.xml.rels`;
        let masterId = null;
        if (zip.files[layoutRelFile]) {
          const relContent = await zip.file(layoutRelFile).async("string");
          const relDoc = parser.parseFromString(relContent, "text/xml");
          const relationships = relDoc.getElementsByTagName("Relationship");
          for (const rel of relationships) {
            const target = rel.getAttribute("Target");
            if (target.includes("slideMaster")) {
              masterId = target.match(/slideMaster\d+/)[0];
              break;
            }
          }
        }

        let background = { color: null, images: [] };
        const bgNode = layoutDoc.getElementsByTagName("p:bg")[0];
        if (bgNode) {
          const bgPr = bgNode.getElementsByTagName("p:bgPr")[0];
          if (bgPr) {
            const solidFill = bgPr.getElementsByTagName("a:solidFill")[0];
            if (solidFill) {
              const srgbClr = solidFill.getElementsByTagName("a:srgbClr")[0];
              if (srgbClr) {
                background.color = `#${srgbClr.getAttribute("val")}`;
              } else {
                const schemeClr = solidFill.getElementsByTagName("a:schemeClr")[0];
                if (schemeClr) {
                  const val = schemeClr.getAttribute("val");
                  background.color = themeData[masterData[masterId]?.themeId]?.colors[val] || "#fff";
                }
              }
            }
            const blipFill = bgPr.getElementsByTagName("a:blipFill")[0];
            if (blipFill) {
              const blip = blipFill.getElementsByTagName("a:blip")[0];
              const rId = blip?.getAttribute("r:embed");
              if (rId && zip.files[layoutRelFile]) {
                const relContent = await zip.file(layoutRelFile).async("string");
                const relDoc = parser.parseFromString(relContent, "text/xml");
                const relationship = Array.from(relDoc.getElementsByTagName("Relationship")).find(
                  (rel) => rel.getAttribute("Id") === rId
                );
                if (relationship) {
                  const target = relationship.getAttribute("Target");
                  const imagePath = `ppt/${target.replace("../", "")}`;
                  const imageId = imagePath.match(/image\d+\./)?.[0]?.replace(".", "") || "";
                  const imageUrl = mediaDataUrls[imageId];
                  if (imageUrl) {
                    const alphaModFix = blip.getElementsByTagName("a:alphaModFix")[0];
                    const opacity = alphaModFix ? parseInt(alphaModFix.getAttribute("amt")) / 100000 : 1;
                    background.images.push({
                      url: imageUrl,
                      opacity,
                    });
                  }
                }
              }
            }
          }
        } else {
          background = masterData[masterId]?.background || { color: null, images: [] };
        }

        const placeholders = {};
        const shapes = layoutDoc.getElementsByTagName("p:sp");
        for (const shape of shapes) {
          const nvSpPr = shape.getElementsByTagName("p:nvSpPr")[0];
          const cNvPr = nvSpPr?.getElementsByTagName("p:cNvPr")[0];
          const id = cNvPr?.getAttribute("id");
          const name = cNvPr?.getAttribute("name");
          if (id && name && name.includes("Placeholder")) {
            const xfrm = shape.getElementsByTagName("a:xfrm")[0];
            const off = xfrm?.getElementsByTagName("a:off")[0];
            const x = off ? parseInt(off.getAttribute("x")) / 914400 * 96 : 0;
            const y = off ? parseInt(off.getAttribute("y")) / 914400 * 96 : 0;
            const ext = xfrm?.getElementsByTagName("a:ext")[0];
            const width = ext ? parseInt(ext.getAttribute("cx")) / 914400 * 96 : null;
            const height = ext ? parseInt(ext.getAttribute("cy")) / 914400 * 96 : null;
            placeholders[id] = { x, y, width, height };
          }
        }

        layoutData[layoutId] = {
          masterId,
          background,
          placeholders,
        };
      }

      const mediaFiles = Object.keys(zip.files).filter((file) =>
        file.match(/^ppt\/media\/image\d+\.(png|jpeg|jpg|gif)$/i)
      );
      const mediaDataUrls = {};
      for (const mediaFile of mediaFiles) {
        const mediaBlob = await zip.file(mediaFile).async("blob");
        const mediaUrl = URL.createObjectURL(mediaBlob);
        const mediaId = mediaFile.match(/image\d+\./)?.[0]?.replace(".", "") || "";
        mediaDataUrls[mediaId] = mediaUrl;
      }

      const slides = [];
      let slideIndex = 1;
      while (true) {
        const slideFile = `ppt/slides/slide${slideIndex}.xml`;
        const slideRelFile = `ppt/slides/_rels/slide${slideIndex}.xml.rels`;
        if (!zip.files[slideFile]) break;

        const slideContent = await zip.file(slideFile).async("string");
        const parser = new DOMParser();
        const slideDoc = parser.parseFromString(slideContent, "text/xml");

        let layoutId = null;
        if (zip.files[slideRelFile]) {
          const relContent = await zip.file(slideRelFile).async("string");
          const relDoc = parser.parseFromString(relContent, "text/xml");
          const relationships = relDoc.getElementsByTagName("Relationship");
          for (const rel of relationships) {
            const target = rel.getAttribute("Target");
            if (target.includes("slideLayout")) {
              layoutId = target.match(/slideLayout\d+/)[0];
              break;
            }
          }
        }

        let background = { color: null, images: [] };
        const bgNode = slideDoc.getElementsByTagName("p:bg")[0];
        if (bgNode) {
          const bgPr = bgNode.getElementsByTagName("p:bgPr")[0];
          if (bgPr) {
            const solidFill = bgPr.getElementsByTagName("a:solidFill")[0];
            if (solidFill) {
              const srgbClr = solidFill.getElementsByTagName("a:srgbClr")[0];
              if (srgbClr) {
                background.color = `#${srgbClr.getAttribute("val")}`;
              } else {
                const schemeClr = solidFill.getElementsByTagName("a:schemeClr")[0];
                if (schemeClr) {
                  const val = schemeClr.getAttribute("val");
                  const masterId = layoutId ? layoutData[layoutId]?.masterId : null;
                  const themeId = masterId ? masterData[masterId]?.themeId : null;
                  background.color = themeData[themeId]?.colors[val] || "#fff";
                }
              }
            }
            const blipFill = bgPr.getElementsByTagName("a:blipFill")[0];
            if (blipFill) {
              const blip = blipFill.getElementsByTagName("a:blip")[0];
              const rId = blip?.getAttribute("r:embed");
              if (rId && zip.files[slideRelFile]) {
                const relContent = await zip.file(slideRelFile).async("string");
                const relDoc = parser.parseFromString(relContent, "text/xml");
                const relationship = Array.from(relDoc.getElementsByTagName("Relationship")).find(
                  (rel) => rel.getAttribute("Id") === rId
                );
                if (relationship) {
                  const target = relationship.getAttribute("Target");
                  const imagePath = `ppt/${target.replace("../", "")}`;
                  const imageId = imagePath.match(/image\d+\./)?.[0]?.replace(".", "") || "";
                  const imageUrl = mediaDataUrls[imageId];
                  if (imageUrl) {
                    const alphaModFix = blip.getElementsByTagName("a:alphaModFix")[0];
                    const opacity = alphaModFix ? parseInt(alphaModFix.getAttribute("amt")) / 100000 : 1;
                    background.images.push({
                      url: imageUrl,
                      opacity,
                    });
                  }
                }
              }
            }
          }
        } else if (layoutId) {
          background = layoutData[layoutId]?.background || { color: null, images: [] };
        }

        const elements = [];
        const shapeTree = slideDoc.getElementsByTagName("p:cSld")[0]?.getElementsByTagName("p:spTree")[0];
        if (!shapeTree) {
          slideIndex++;
          continue;
        }

        const shapes = shapeTree.getElementsByTagName("p:sp");
        for (let i = 0; i < shapes.length; i++) {
          const shape = shapes[i];
          const nvSpPr = shape.getElementsByTagName("p:nvSpPr")[0];
          const cNvPr = nvSpPr?.getElementsByTagName("p:cNvPr")[0];
          const placeholderId = cNvPr?.getAttribute("id");
          const txBody = shape.getElementsByTagName("p:txBody")[0];
          if (!txBody) continue;

          let x = 15, y = 15, width = null;
          const xfrm = shape.getElementsByTagName("a:xfrm")[0];
          if (xfrm) {
            const off = xfrm.getElementsByTagName("a:off")[0];
            x = off ? parseInt(off.getAttribute("x")) / 914400 * 96 : 15;
            y = off ? parseInt(off.getAttribute("y")) / 914400 * 96 : 15;
            const ext = xfrm?.getElementsByTagName("a:ext")[0];
            width = ext ? parseInt(ext.getAttribute("cx")) / 914400 * 96 : null;
          } else if (placeholderId && layoutId) {
            const placeholder = layoutData[layoutId]?.placeholders[placeholderId] ||
                              masterData[layoutData[layoutId]?.masterId]?.placeholders[placeholderId];
            if (placeholder) {
              x = placeholder.x;
              y = placeholder.y;
              width = placeholder.width;
            }
          }

          let parent = shape.parentNode;
          while (parent && parent.tagName === "p:grpSp") {
            const grpXfrm = parent.getElementsByTagName("a:xfrm")[0];
            if (grpXfrm) {
              const grpOff = grpXfrm.getElementsByTagName("a:off")[0];
              const dx = grpOff ? parseInt(grpOff.getAttribute("x")) / 914400 * 96 : 0;
              const dy = grpOff ? parseInt(grpOff.getAttribute("y")) / 914400 * 96 : 0;
              x += dx;
              y += dy;
            }
            parent = parent.parentNode;
          }

          const paragraphs = txBody.getElementsByTagName("a:p");
          let currentY = y;
          for (let j = 0; j < paragraphs.length; j++) {
            const paragraph = paragraphs[j];
            const pPr = paragraph.getElementsByTagName("a:pPr")[0];
            const textAlign = pPr?.getAttribute("algn") || "left";
            const lvl = parseInt(pPr?.getAttribute("lvl")) || 0;
            const marL = pPr?.getAttribute("marL") ? parseInt(pPr.getAttribute("marL")) / 914400 * 96 : 0;
            const indent = pPr?.getAttribute("indent") ? parseInt(pPr.getAttribute("indent")) / 914400 * 96 : 0;
            const bullet = pPr?.getElementsByTagName("a:buChar")[0]?.getAttribute("char") || null;
            const spaceBefore = pPr?.getElementsByTagName("a:spcBef")[0]?.getElementsByTagName("a:spcPts")[0]?.getAttribute("val") / 100 || 0;
            const lineSpacing = pPr?.getElementsByTagName("a:lnSpc")[0]?.getElementsByTagName("a:spcPct")[0]?.getAttribute("val") / 100000 || 1.2;

            const runs = paragraph.getElementsByTagName("a:r");
            let paragraphElements = [];

            let currentX = x + (marL + indent + lvl * 20);
            for (let k = 0; k < runs.length; k++) {
              const run = runs[k];
              const text = run.getElementsByTagName("a:t")[0]?.textContent || "";
              if (!text.trim()) continue;

              const rPr = run.getElementsByTagName("a:rPr")[0];
              const fontSize = rPr?.getAttribute("sz") ? parseInt(rPr.getAttribute("sz")) / 100 + "px" : "14px";
              const colorNode = rPr?.getElementsByTagName("a:solidFill")[0]?.getElementsByTagName("a:srgbClr")[0];
              let color = colorNode?.getAttribute("val") || "000000";
              if (colorNode?.parentNode.tagName === "a:schemeClr") {
                const schemeColor = colorNode.parentNode.getAttribute("val");
                const masterId = layoutId ? layoutData[layoutId]?.masterId : null;
                const themeId = masterId ? masterData[masterId]?.themeId : null;
                const theme = themeId ? themeData[themeId] : null;
                color = theme?.colors[schemeColor] || `#${color}`;
              } else {
                color = `#${color}`;
              }
              const fontFamilyNode = rPr?.getElementsByTagName("a:latin")[0];
              let fontFamily = fontFamilyNode?.getAttribute("typeface") || null;
              if (fontFamily === "+mj-lt" || fontFamily === "+mn-lt") {
                const masterId = layoutId ? layoutData[layoutId]?.masterId : null;
                const themeId = masterId ? masterData[masterId]?.themeId : null;
                const theme = themeId ? themeData[themeId] : null;
                fontFamily = fontFamily === "+mj-lt" ? theme?.majorFont : theme?.minorFont;
              }
              fontFamily = fontFamily || "'Arial', sans-serif";
              const isBold = rPr?.getAttribute("b") === "1";
              const isItalic = rPr?.getAttribute("i") === "1";
              const underline = rPr?.getAttribute("u") === "sng" ? "underline" : "none";

              const runText = bullet && k === "0" ? `• ${text}` : text;
              paragraphElements.push({
                type: "text",
                content: runText,
                x: currentX,
                y: currentY,
                width,
                fontSize,
                color,
                fontFamily,
                isBold,
                isItalic,
                textAlign,
                lineHeight: lineSpacing,
                padding: bullet && k === "0" ? "0 0 0 20px" : "0",
                textDecoration: underline,
              });

              const fontSizeNum = parseFloat(fontSize) || 14;
              currentX += runText.length * (fontSizeNum * 0.6);
            }

            if (paragraphElements.length > 0) {
              elements.push(...paragraphElements);
              const lineHeightNum = parseFloat(paragraphElements[0].fontSize) * lineSpacing;
              currentY += lineHeightNum + spaceBefore;
            }
          }
        }

        if (zip.files[slideRelFile]) {
          const relContent = await zip.file(slideRelFile).async("string");
          const relDoc = parser.parseFromString(relContent, "text/xml");
          const relationships = relDoc.getElementsByTagName("Relationship");
          const imageNodes = slideDoc.getElementsByTagName("p:pic");
          for (let i = 0; i < imageNodes.length; i++) {
            const imageNode = imageNodes[i];
            const rId = imageNode.getElementsByTagName("a:blip")[0]?.getAttribute("r:embed");
            if (rId) {
              const relationship = Array.from(relationships).find(rel => rel.getAttribute("Id") === rId);
              if (relationship) {
                const target = relationship.getAttribute("Target");
                const imagePath = `ppt/${target.replace("../", "")}`;
                const imageId = imagePath.match(/image\d+\./)?.[0]?.replace(".", "") || "";
                const imageUrl = mediaDataUrls[imageId];
                if (imageUrl) {
                  const xfrm = imageNode.getElementsByTagName("a:xfrm")[0];
                  let x = 0, y = 0, width = "auto", height = "auto";
                  if (xfrm) {
                    const off = xfrm.getElementsByTagName("a:off")[0];
                    x = off ? parseInt(off.getAttribute("x")) / 914400 * 96 : 0;
                    y = off ? parseInt(off.getAttribute("y")) / 914400 * 96 : 0;
                    const ext = xfrm.getElementsByTagName("a:ext")[0];
                    width = ext ? parseInt(ext.getAttribute("cx")) / 914400 * 96 + "px" : "auto";
                    height = ext ? parseInt(ext.getAttribute("cy")) / 914400 * 96 + "px" : "auto";
                  }

                  let parent = imageNode.parentNode;
                  while (parent && parent.tagName === "p:grpSp") {
                    const grpXfrm = parent.getElementsByTagName("a:xfrm")[0];
                    if (grpXfrm) {
                      const grpOff = grpXfrm.getElementsByTagName("a:off")[0];
                      const dx = grpOff ? parseInt(grpOff.getAttribute("x")) / 914400 * 96 : 0;
                      const dy = grpOff ? parseInt(grpOff.getAttribute("y")) / 914400 * 96 : 0;
                      x += dx;
                      y += dy;
                    }
                    parent = parent.parentNode;
                  }

                  elements.push({
                    type: "image",
                    url: imageUrl,
                    x,
                    y,
                    width,
                    height,
                  });
                }
              }
            }
          }
        }

        slides.push({ elements, background });
        slideIndex++;
      }

      setContent({
        type: "ppt-slides",
        data: slides,
        dimensions: { width: slideWidth, height: slideHeight },
      });
      setTotalSlides(slides.length);
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

    if (url === previousUrl) {
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
    setCurrentSlide(0);
    setTotalSlides(0);
    setPdfLoading(false);
    setPdfError(null);
    setPdfDisplayUrl(null);
    setPreviousUrl(url);
    setSelectedImageIndex(0);

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

  useEffect(() => {
    console.log("useEffect triggered with URL:", url);
    fetchContent();
  }, [url, backendUrl, isFileUpload, fileName]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    };
  }, [pdfBlobUrl]);

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
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onLinkClick, fileName]);

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
        { name: "Images", hasData: patentData.drawingsFromCarousel?.length > 0 },
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

  useEffect(() => {
    if (activeTab !== "PDF") {
      if (pdfDisplayUrl) {
        URL.revokeObjectURL(pdfDisplayUrl);
      }
      setPdfLoading(false);
      setPdfError(null);
      setPdfDisplayUrl(null);
    }
  }, [activeTab]);

  const renderTabbedInterface = () => {
    if (!patentData) return null;

    const loadPdf = async (pdfUrl) => {
      setPdfLoading(true);
      setPdfError(null);
      setPdfDisplayUrl(null);
      try {
        const blobUrl = await fetchPdfAsBlob(pdfUrl);
        setPdfDisplayUrl(blobUrl);
      } catch (err) {
        setPdfError("Failed to load PDF: " + err.message);
      } finally {
        setPdfLoading(false);
      }
    };

    const handleCitationClick = (number) => {
      console.log("Original patent number:", number);

      let cleanNumber = number
        .replace(/\s+/g, ' ')
        .replace(/\s*\([^()]+?\)\s*/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .trim();

      console.log("Cleaned patent number:", cleanNumber);

      const citationUrl = `https://patents.google.com/patent/${cleanNumber}`;
      console.log("Citation clicked, triggering onLinkClick with URL:", citationUrl);

      onLinkClick(citationUrl);
    };

    const handlePrevImage = () => {
      setSelectedImageIndex((prev) =>
        prev > 0 ? prev - 1 : patentData.drawingsFromCarousel.length - 1
      );
    };

    const handleNextImage = () => {
      setSelectedImageIndex((prev) =>
        prev < patentData.drawingsFromCarousel.length - 1 ? prev + 1 : 0
      );
    };

    const renderTabContent = () => {
      switch (activeTab) {
        case "Overview":
          const publicationNumbers = patentData.publicationNumber
            ? patentData.publicationNumber
                .split(/,+\s*|\s*,\s*|\s+/)
                .map(item => item.trim())
                .filter(item => item)
            : [];

          const publicationDates = patentData.publicationDate
            ? patentData.publicationDate
                .split(/,+\s*|\s*,\s*|\s+/)
                .map(item => item.trim())
                .filter(item => item)
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
          if (pdfUrl && !pdfDisplayUrl && !pdfLoading && !pdfError) {
            loadPdf(pdfUrl);
          }

          return (
            <TabContent>
              {pdfLoading && <LoadingIndicator>Loading PDF...</LoadingIndicator>}
              {pdfError && (
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
                    {pdfError}
                  </div>
                  <RetryButton onClick={() => loadPdf(pdfUrl)}>Retry Loading PDF</RetryButton>
                  <RetryButton
                    onClick={() => window.open(pdfUrl, "_blank")}
                    style={{ backgroundColor: "#34a853" }}
                  >
                    Open PDF in New Tab
                  </RetryButton>
                </ErrorContainer>
              )}
              {pdfDisplayUrl && (
                <PatentIframe
                  ref={iframeRef}
                  src={`${pdfDisplayUrl}#view=FitH`}
                  title="PDF Content"
                  type="application/pdf"
                  style={{ width: "100%", height: "600px", border: "none" }}
                />
              )}
              {!pdfUrl && (
                <ScrollWrapper>
                  <PatentTabContent>
                    <FallbackMessage>PDF link not available.</FallbackMessage>
                  </PatentTabContent>
                </ScrollWrapper>
              )}
            </TabContent>
          );
        case "Images":
          return (
            <TabContent>
              <h2>Drawings</h2>
              {patentData.drawingsFromCarousel?.length > 0 ? (
                <SlideshowContainer>
                  <SlideshowImage
                    src={patentData.drawingsFromCarousel[selectedImageIndex]}
                    alt={`Drawing ${selectedImageIndex + 1}`}
                    onClick={() => openModal(patentData.drawingsFromCarousel[selectedImageIndex])}
                    onError={(e) => {
                      e.target.src = '/fallback-image.png';
                      console.error(`Failed to load image: ${patentData.drawingsFromCarousel[selectedImageIndex]}`);
                    }}
                  />
                  {patentData.drawingsFromCarousel.length > 1 && (
                    <NavigationContainer>
                      <NavButton onClick={handlePrevImage}>Previous</NavButton>
                      <SlideCounter>
                        Figure {selectedImageIndex + 1} of {patentData.drawingsFromCarousel.length}
                      </SlideCounter>
                      <NavButton onClick={handleNextImage}>Next</NavButton>
                    </NavigationContainer>
                  )}
                </SlideshowContainer>
              ) : (
                <FallbackMessage>No images found.</FallbackMessage>
              )}
              {isModalOpen && (
                <ImageModal onClick={closeModal}>
                  <ModalImage
                    src={modalImageUrl}
                    alt="High Resolution Drawing"
                    style={{
                      maxWidth: isPortrait ? "60%" : "80%",
                      maxHeight: isPortrait ? "80%" : "60%",
                      transition: "all 0.3s ease",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <NavigationBar onClick={(e) => e.stopPropagation()}>
                    <ModalNavButton onClick={setPortraitMode} $isActive={isPortrait}>
                      Portrait
                    </ModalNavButton>
                    <ModalNavButton onClick={setLandscapeMode} $isActive={!isPortrait}>
                      Landscape
                    </ModalNavButton>
                  </NavigationBar>
                  <CloseButton onClick={closeModal}>×</CloseButton>
                </ImageModal>
              )}
            </TabContent>
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

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
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

  if (content?.type === "ppt-slides") {
    const { width, height } = content.dimensions || slideDimensions;
    const currentSlideData = content.data[currentSlide] || { elements: [], background: { color: null, images: [] } };

    return (
      <ContentWrapper>
        <DocViewer>
          {content.data.length > 0 ? (
            <SlideContainer
              width={`${width}px`}
              height={`${height}px`}
              background={currentSlideData.background.color || "#fff"}
            >
              {currentSlideData.background.images.map((bgImage, index) => (
                <SlideBackgroundImage
                  key={`bg-${index}`}
                  src={bgImage.url}
                  opacity={bgImage.opacity}
                  alt={`Slide ${currentSlide + 1} Background Image ${index + 1}`}
                />
              ))}
              {currentSlideData.elements.map((element, index) => {
                if (element.type === "text") {
                  return (
                    <SlideText
                      key={index}
                      x={`${element.x}px`}
                      y={`${element.y}px`}
                      width={`${element.width}px`}
                      fontSize={element.fontSize}
                      color={element.color}
                      fontFamily={element.fontFamily}
                      isBold={element.isBold}
                      isItalic={element.isItalic}
                      textAlign={element.textAlign}
                      lineHeight={element.lineHeight}
                      padding={element.padding}
                      textDecoration={element.textDecoration}
                    >
                      {element.content}
                    </SlideText>
                  );
                } else if (element.type === "image") {
                  return (
                    <SlideImage
                      key={index}
                      src={element.url}
                      x={`${element.x}px`}
                      y={`${element.y}px`}
                      width={element.width}
                      height={element.height}
                      alt={`Slide ${currentSlide + 1} Image ${index + 1}`}
                    />
                  );
                }
                return null;
              })}
            </SlideContainer>
          ) : (
            <FallbackMessage>No slides found in the presentation.</FallbackMessage>
          )}
        </DocViewer>
        {totalSlides > 1 && (
          <NavigationContainer>
            <NavButton onClick={handlePrevSlide}>Previous</NavButton>
            <SlideCounter>
              Slide {currentSlide + 1} of {totalSlides}
            </SlideCounter>
            <NavButton onClick={handleNextSlide}>Next</NavButton>
          </NavigationContainer>
        )}
      </ContentWrapper>
    );
  }

  if (content?.type === "download") {
    return (
      <ContentWrapper>
        <FallbackMessage>
          {content.message}
          <br />
          <DownloadLink href={content.url} download={fileName || "document"}>
            Download File
          </DownloadLink>
        </FallbackMessage>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper>
      <FallbackMessage>
        Unable to render content.{" "}
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open in a new tab
        </a>{" "}
        or{" "}
        <DownloadLink href={url} download={fileName || "document"}>
          download the file
        </DownloadLink>
        .
      </FallbackMessage>
    </ContentWrapper>
  );
};

export default ProxyContent;