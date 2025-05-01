import React, { useState, useEffect, Suspense } from "react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.css";
import styled from "styled-components";
import * as XLSX from "xlsx";

// Register all Handsontable modules
registerAllModules();

// Dynamically import HotTable using React.lazy
const HotTable = React.lazy(() => import("@handsontable/react").then((mod) => ({ default: mod.HotTable })));

const ExcelContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  overflow: hidden;
`;

const SheetTabs = styled.div`
  display: flex;
  overflow-x: auto;
  background-color: #1e6f3e;
  border-bottom: 1px solid #d1d1d1;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #c1c1c1;
    border-radius: 3px;
  }
`;

const SheetTab = styled.button`
  padding: 10px 20px;
  background-color: ${(props) => (props.active ? "#ffffff" : "#1e6f3e")};
  color: ${(props) => (props.active ? "#000000" : "#ffffff")};
  border: none;
  border-right: 1px solid #d1d1d1;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: ${(props) => (props.active ? "#f0f0f0" : "#2e8b57")};
  }

  &:focus {
    outline: none;
  }
`;

const TableContainer = styled.div`
  flex: 1;
  overflow: auto;
  min-width: 1500px; /* Ensure wide content to trigger horizontal scrollbar in SplitScreen */

  .handsontable {
    font-family: "Calibri", sans-serif;
  }

  .handsontable th {
    background-color: #f3f3f3;
    color: #000;
    font-weight: bold;
    text-align: center;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .handsontable td {
    padding: 0 4px;
    vertical-align: middle;
  }

  .handsontable .htDimmed {
    color: #000;
  }

  .handsontable .currentRow {
    background-color: #e6f2ff;
  }

  .handsontable .currentCol {
    background-color: #e6f2ff;
  }
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 16px;
  color: #666;
`;

const ErrorMessage = styled.div`
  padding: 20px;
  margin: 20px;
  background-color: #fff3f3;
  border: 1px solid #ffcaca;
  border-radius: 4px;
  color: #d32f2f;
  text-align: center;
`;

const ExcelViewer = ({ blob }) => {
  const [workbook, setWorkbook] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [data, setData] = useState([]);
  const [mergeCells, setMergeCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cellStyles, setCellStyles] = useState({});
  const [columnWidths, setColumnWidths] = useState([]);
  const [rowHeights, setRowHeights] = useState([]);
  const [isReady, setIsReady] = useState(false);

  // Load the Excel file
  useEffect(() => {
    const loadExcel = async () => {
      try {
        setLoading(true);

        if (!blob) {
          throw new Error("No file provided");
        }

        console.log("Excel blob:", blob);
        const arrayBuffer = await blob.arrayBuffer();
        const wb = XLSX.read(new Uint8Array(arrayBuffer), {
          type: "array",
          cellStyles: true,
          cellDates: true,
          cellNF: true,
        });

        if (!wb.SheetNames || wb.SheetNames.length === 0) {
          throw new Error("No sheets found in the Excel file");
        }

        console.log("Loaded workbook with sheets:", wb.SheetNames, "Size:", blob.size);

        setWorkbook(wb);
        setSheets(wb.SheetNames);
        setSelectedSheet(wb.SheetNames[0]);
      } catch (err) {
        console.error("Excel loading error:", err);
        setError(`Failed to load Excel file: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadExcel();
  }, [blob]);

  // Load sheet data when the selected sheet changes
  useEffect(() => {
    if (!workbook || !selectedSheet) return;

    try {
      const worksheet = workbook.Sheets[selectedSheet];
      if (!worksheet) {
        throw new Error(`Sheet ${selectedSheet} not found`);
      }

      if (!worksheet["!ref"]) {
        throw new Error(`Sheet ${selectedSheet} has no valid cell range`);
      }

      // Convert sheet to JSON (array of arrays)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        defval: "",
      });

      // Validate data
      if (!jsonData.length || !jsonData[0].length) {
        throw new Error(`Sheet ${selectedSheet} contains no valid data`);
      }

      const maxCols = Math.max(...jsonData.map((row) => row.length));
      console.log(`Processing sheet: ${selectedSheet}, range: ${worksheet["!ref"]}, rows: ${jsonData.length}, cols: ${maxCols}`);

      // Process merged cells
      const merges = worksheet["!merges"] || [];
      const mergedCellsData = merges.map((merge) => ({
        row: merge.s.r,
        col: merge.s.c,
        rowspan: merge.e.r - merge.s.r + 1,
        colspan: merge.e.c - merge.s.c + 1,
      }));

      // Process cell styles
      const styles = {};
      const range = XLSX.utils.decode_range(worksheet["!ref"]);

      // Calculate column widths based on the Excel's default width
      const colWidths = new Array(maxCols).fill(100);
      for (let col = range.s.c; col <= range.e.c && col - range.s.c < maxCols; col++) {
        const colInfo = worksheet["!cols"]?.[col];
        const width = colInfo?.width ? colInfo.width * 7 : 100;
        colWidths[col - range.s.c] = Math.min(Math.max(width, 60), 300);
      }

      // Calculate row heights
      const rowHts = new Array(range.e.r - range.s.r + 1).fill(20);
      for (let row = range.s.r; row <= range.e.r; row++) {
        const rowInfo = worksheet["!rows"]?.[row];
        const height = rowInfo?.hpt ? rowInfo.hpt : 20;
        rowHts[row - range.s.r] = height;
      }

      // Extract cell styles
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];

          if (cell && cell.s) {
            styles[cellAddress] = {
              bold: cell.s.font?.bold || false,
              italic: cell.s.font?.italic || false,
              underline: cell.s.font?.underline || false,
              fontSize: cell.s.font?.sz || 11,
              fontFamily: cell.s.font?.name || "Calibri",
              textColor: cell.s.font?.color?.rgb ? `#${cell.s.font.color.rgb.substring(2)}` : "#000000",
              bgColor: cell.s.fill?.fgColor?.rgb ? `#${cell.s.fill.fgColor.rgb.substring(2)}` : "#ffffff",
              alignment: cell.s.alignment?.horizontal || "left",
              vertical: cell.s.alignment?.vertical || "bottom",
              wrapText: cell.s.alignment?.wrapText || false,
              border: {
                top: cell.s.border?.top?.style ? true : false,
                right: cell.s.border?.right?.style ? true : false,
                bottom: cell.s.border?.bottom?.style ? true : false,
                left: cell.s.border?.left?.style ? true : false,
              },
            };
          }
        }
      }

      setData(jsonData);
      setMergeCells(mergedCellsData);
      setCellStyles(styles);
      setColumnWidths(colWidths);
      setRowHeights(rowHts);
    } catch (err) {
      console.error("Sheet loading error:", err);
      setError(`Failed to load sheet ${selectedSheet}: ${err.message}`);
    }
  }, [workbook, selectedSheet]);

  // Delay rendering to ensure DOM stability
  useEffect(() => {
    if (data.length && !error) {
      setTimeout(() => setIsReady(true), 100);
    } else {
      setIsReady(false);
    }
  }, [data, error]);

  // Custom cell renderer to apply Excel-like styling
  const cellRenderer = (instance, td, row, col, prop, value, cellProperties) => {
    td.innerHTML = value !== null && value !== undefined ? value : "";

    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    const style = cellStyles[cellAddress];

    if (style) {
      if (style.bold) td.style.fontWeight = "bold";
      if (style.italic) td.style.fontStyle = "italic";
      if (style.underline) td.style.textDecoration = "underline";
      if (style.fontSize) td.style.fontSize = `${style.fontSize}px`;
      if (style.fontFamily) td.style.fontFamily = style.fontFamily;
      if (style.textColor) td.style.color = style.textColor;
      if (style.bgColor) td.style.backgroundColor = style.bgColor;
      if (style.alignment) td.style.textAlign = style.alignment;
      if (style.vertical) {
        switch (style.vertical) {
          case "top":
            td.style.verticalAlign = "top";
            break;
          case "center":
            td.style.verticalAlign = "middle";
            break;
          case "bottom":
            td.style.verticalAlign = "bottom";
            break;
        }
      }
      if (style.wrapText) td.style.whiteSpace = "normal";

      if (style.border) {
        if (style.border.top) td.style.borderTop = "1px solid #000";
        if (style.border.right) td.style.borderRight = "1px solid #000";
        if (style.border.bottom) td.style.borderBottom = "1px solid #000";
        if (style.border.left) td.style.borderLeft = "1px solid #000";
      }
    }

    return td;
  };

  if (loading) {
    return <LoadingMessage>Loading Excel file...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  if (!data || data.length === 0 || !isReady) {
    return <ErrorMessage>No data available in the selected sheet.</ErrorMessage>;
  }

  return (
    <ExcelContainer>
      <SheetTabs>
        {sheets.map((sheet) => (
          <SheetTab
            key={sheet}
            active={sheet === selectedSheet}
            onClick={() => setSelectedSheet(sheet)}
          >
            {sheet}
          </SheetTab>
        ))}
      </SheetTabs>

      <TableContainer>
        <Suspense fallback={<LoadingMessage>Loading table...</LoadingMessage>}>
          <HotTable
            data={data}
            colHeaders={data.length && data[0].length ? Array.from({ length: data[0].length }, (_, i) => String.fromCharCode(65 + i)) : true}
            rowHeaders={true}
            width="100%"
            height="100%"
            stretchH="all"
            licenseKey="non-commercial-and-evaluation"
            readOnly={true}
            mergeCells={mergeCells}
            manualColumnResize={true}
            manualRowResize={true}
            contextMenu={false}
            comments={false}
            fillHandle={false}
            colWidths={columnWidths}
            rowHeights={rowHeights}
            cells={(row, col) => ({
              renderer: cellRenderer,
            })}
          />
        </Suspense>
      </TableContainer>
    </ExcelContainer>
  );
};

export default ExcelViewer;