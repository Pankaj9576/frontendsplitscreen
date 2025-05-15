import mammoth from "mammoth";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

export const handleWordFile = async (blob, fileName, setContent, setError) => {
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

    const blobUrl = URL.createObjectURL(blob); // Create blob URL for download
    setContent({
      type: "html",
      data: `<div style="padding: 20px; font-family: 'Arial', sans-serif; max-width: 100%; box-sizing: border-box;">${result.value}</div>`,
      blobUrl, // Include the blob URL in the content state
      fileName, // Include the file name for download
    });
  } catch (err) {
    console.error("Error in handleWordFile:", err);
    setError(
      err.message || "Failed to process Word document. Try downloading the file instead."
    );
    const blobUrl = URL.createObjectURL(blob);
    setContent({
      type: "download",
      url: blobUrl,
      message: "Unable to render Word document. Please download to view.",
      fileName,
    });
  }
};

export const handlePptFile = async (blob, fileName, setContent, setError, setSlides) => {
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

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    const slideFiles = Object.keys(zip.files).filter((file) =>
      file.match(/^ppt\/slides\/slide\d+\.xml$/)
    );

    if (!slideFiles.length) {
      throw new Error("No slides found in the PowerPoint file.");
    }

    slideFiles.sort((a, b) => {
      const aNum = parseInt(a.match(/slide(\d+)\.xml$/)[1], 10);
      const bNum = parseInt(b.match(/slide(\d+)\.xml$/)[1], 10);
      return aNum - bNum;
    });

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

    const themeFiles = Object.keys(zip.files).filter((file) =>
      file.match(/^ppt\/theme\/theme\d+\.xml$/)
    );
    let themeData = {};
    if (themeFiles.length > 0) {
      const themeContent = await zip.file(themeFiles[0]).async("string");
      themeData = parser.parse(themeContent);
    }

    const slideMasterFiles = Object.keys(zip.files).filter((file) =>
      file.match(/^ppt\/slideMasters\/slideMaster\d+\.xml$/)
    );
    let slideMasterData = {};
    if (slideMasterFiles.length > 0) {
      const slideMasterContent = await zip.file(slideMasterFiles[0]).async("string");
      slideMasterData = parser.parse(slideMasterContent);
    }

    const slideLayoutFiles = Object.keys(zip.files).filter((file) =>
      file.match(/^ppt\/slideLayouts\/slideLayout\d+\.xml$/)
    );
    let slideLayoutData = {};
    if (slideLayoutFiles.length > 0) {
      const slideLayoutContent = await zip.file(slideLayoutFiles[0]).async("string");
      slideLayoutData = parser.parse(slideLayoutContent);
    }

    let slideWidth = 960;
    let slideHeight = 720;
    const presentationFile = "ppt/presentation.xml";
    if (zip.files[presentationFile]) {
      const presentationContent = await zip.file(presentationFile).async("string");
      const presentationData = parser.parse(presentationContent);
      const sldSz = presentationData?.["p:presentation"]?.["p:sldSz"];
      if (sldSz) {
        const cx = parseInt(sldSz["@_cx"]) || 9144000;
        const cy = parseInt(sldSz["@_cy"]) || 6858000;
        slideWidth = (cx / 914400) * 96;
        slideHeight = (cy / 914400) * 96;
      }
    }

    const slideContents = [];

    for (let i = 0; i < slideFiles.length; i++) {
      const slideContent = await zip.file(slideFiles[i]).async("string");
      let slideData;
      try {
        slideData = parser.parse(slideContent);
      } catch (parseErr) {
        console.error(`Failed to parse slide ${i + 1}:`, parseErr);
        continue;
      }

      let backgroundColor = "#ffffff";
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

      let slideHtml = `
        <div style="position: relative; border: 2px solid #d3d3d3; border-radius: 6px; padding: 15px; background: ${backgroundColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.15); width: ${slideWidth}px; height: ${slideHeight}px; max-width: 100%; max-height: calc(100vh - 150px); overflow: hidden; transform-origin: top left; transform: scale(${Math.min(1, 960 / slideWidth)})">
      `;

      const texts = [];
      let lastY = 15;
      const occupiedPositions = [];
      const pNodes = slideData?.["p:sld"]?.["p:cSld"]?.["p:spTree"]?.["p:sp"] || [];

      const shapes = Array.isArray(pNodes) ? pNodes : [pNodes].filter(Boolean);
      shapes.forEach((shape, shapeIndex) => {
        if (shape["p:txBody"]) {
          let x = 0, y = 0, width = slideWidth - 30, height = "auto";
          let rotation = 0;
          if (shape["p:spPr"]?.["a:xfrm"]) {
            const xfrm = shape["p:spPr"]["a:xfrm"];
            x = (xfrm["a:off"]?.["@_x"] || 0) / 914400 * 96;
            y = (xfrm["a:off"]?.["@_y"] || 0) / 914400 * 96;
            width = ((xfrm["a:ext"]?.["@_cx"] || 0) / 914400 * 96) || width;
            height = ((xfrm["a:ext"]?.["@_cy"] || 0) / 914400 * 96) || height;
            rotation = parseInt(xfrm["@_rot"]) || 0;
            rotation = rotation / 60000;
          } else {
            x = 15;
            y = lastY;
          }

          let adjustedY = y;
          let adjustedX = x;
          for (const pos of occupiedPositions) {
            const overlapX = adjustedX < pos.x + pos.width && adjustedX + width > pos.x;
            const overlapY = adjustedY < pos.y + pos.height && adjustedY + (height !== "auto" ? height : 50) > pos.y;
            if (overlapX && overlapY) {
              adjustedY = pos.y + pos.height + 10;
              if (adjustedY + (height !== "auto" ? height : 50) > slideHeight - 30) {
                adjustedX = pos.x + pos.width + 10;
                adjustedY = 15;
              }
            }
          }
          x = adjustedX;
          y = adjustedY;
          occupiedPositions.push({ x, y, width, height: height !== "auto" ? height : 50 });

          const paragraphs = shape["p:txBody"]["a:p"];
          const paraArray = Array.isArray(paragraphs) ? paragraphs : [paragraphs].filter(Boolean);
          let paragraphText = [];
          let paragraphStyle = {};

          paraArray.forEach((para) => {
            let textAlign = "left";
            let lineHeight = "1.2";
            let listStyle = "none";
            let marginLeft = "0px";

            if (para["a:pPr"]) {
              const pPr = para["a:pPr"];
              textAlign = pPr["@_algn"] || textAlign;
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

                  let fontFamily = "Arial";
                  let fontSize = "14px";
                  let color = "#000000";
                  let isBold = false;
                  let isItalic = false;
                  let letterSpacing = "normal";

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
                    const sz = parseInt(rPr["@_sz"]) / 100;
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
                    const spc = parseInt(rPr["@_spc"]) / 100;
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
                  transform: rotation ? `rotate(${rotation}deg)` : "none",
                  transformOrigin: "top left",
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

            const shape = shapes.find((s) =>
              s["p:spPr"]?.["a:blipFill"]?.["a:blip"]?.["@_r:embed"] === rel["@_Id"]
            );
            let x = 0, y = 0, width = "auto", height = "auto";
            let rotation = 0;
            if (shape?.["p:spPr"]?.["a:xfrm"]) {
              const xfrm = shape["p:spPr"]["a:xfrm"];
              x = (xfrm["a:off"]?.["@_x"] || 0) / 914400 * 96;
              y = (xfrm["a:off"]?.["@_y"] || 0) / 914400 * 96;
              width = (xfrm["a:ext"]?.["@_cx"] || 0) / 914400 * 96;
              height = (xfrm["a:ext"]?.["@_cy"] || 0) / 914400 * 96;
              rotation = parseInt(xfrm["@_rot"]) || 0;
              rotation = rotation / 60000;
            }

            return { url: imageUrl, x, y, width, height, rotation };
          })
          .filter((img) => img.url);
      }

      if (images.length > 0) {
        images.forEach((image, idx) => {
          slideHtml += `
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
                transform: ${image.rotation ? `rotate(${image.rotation}deg)` : "none"};
                transform-origin: center;
              "
            />
          `;
        });
      }

      if (texts.length > 0) {
        texts.forEach((textObj, idx) => {
          const style = Object.entries(textObj.style)
            .map(([key, value]) => `${key}: ${value}`)
            .join("; ");
          const listTag = textObj.style.listStyleType !== "none" ? (textObj.style.listStyleType === "disc" ? "ul" : "ol") : "div";
          slideHtml += `<${listTag} style="${style}">`;
          textObj.paragraphs.forEach((para) => {
            if (textObj.style.listStyleType !== "none") {
              slideHtml += `<li style="margin: 0;">`;
            } else {
              slideHtml += `<p style="margin: 0;">`;
            }
            para.forEach((run) => {
              const runStyle = Object.entries(run.style)
                .map(([key, value]) => `${key}: ${value}`)
                .join("; ");
              slideHtml += `<span style="${runStyle}">${run.text}</span>`;
            });
            slideHtml += textObj.style.listStyleType !== "none" ? `</li>` : `</p>`;
          });
          slideHtml += `</${listTag}>`;
        });
      } else {
        slideHtml += `<p style="color: #666; font-size: 14px; text-align: center; margin-top: 20px;">No text content found on this slide.</p>`;
      }

      slideHtml += `</div>`;
      slideContents.push(slideHtml);
    }

    setSlides(slideContents);
    setContent({ type: "ppt" });
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