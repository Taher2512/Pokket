"use client";

import React, { useEffect, useRef } from "react";
import QRCode from "react-qr-code";

interface QRWithLogoProps {
  value: string;
  size?: number;
  network?: string;
}

export default function QRWithLogo({
  value,
  size = 200,
  network = "pokket",
}: QRWithLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!containerRef.current || !value) return;

    const generateQRWithLogo = async () => {
      try {
        // Wait for QR code to render
        await new Promise((resolve) => setTimeout(resolve, 100));

        const svgElement = containerRef.current?.querySelector("svg");
        if (!svgElement || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = size;
        canvas.height = size;

        // Convert SVG to canvas
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();

        img.onload = () => {
          // Draw QR code
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);

          // Draw logo in center
          const logoSize = size * 0.15;
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;

          // White background with padding for visibility
          const padding = 6;
          ctx.fillStyle = "white";
          ctx.fillRect(
            x - padding,
            y - padding,
            logoSize + padding * 2,
            logoSize + padding * 2
          );

          // Draw border
          ctx.strokeStyle = "#e5e7eb";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            x - padding,
            y - padding,
            logoSize + padding * 2,
            logoSize + padding * 2
          );

          // Load and draw the actual logo
          const logoImg = new Image();
          logoImg.crossOrigin = "anonymous";

          logoImg.onload = () => {
            ctx.drawImage(logoImg, x, y, logoSize, logoSize);
          };

          logoImg.onerror = () => {
            // Fallback to simple shapes if logo fails to load
            if (network === "pokket") {
              ctx.fillStyle = "#F97316";
              ctx.fillRect(x, y, logoSize, logoSize);
              ctx.fillStyle = "white";
              ctx.font = `bold ${logoSize * 0.6}px Arial`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("P", x + logoSize / 2, y + logoSize / 2);
            } else if (network === "ethereum") {
              // Ethereum diamond
              ctx.fillStyle = "#627EEA";
              ctx.beginPath();
              ctx.moveTo(x + logoSize / 2, y + 2);
              ctx.lineTo(x + logoSize - 2, y + logoSize / 2);
              ctx.lineTo(x + logoSize / 2, y + logoSize - 2);
              ctx.lineTo(x + 2, y + logoSize / 2);
              ctx.closePath();
              ctx.fill();
            } else if (network === "solana") {
              // Solana bars
              const gradient = ctx.createLinearGradient(
                x,
                y,
                x + logoSize,
                y + logoSize
              );
              gradient.addColorStop(0, "#9945FF");
              gradient.addColorStop(1, "#14F195");
              ctx.fillStyle = gradient;
              const barHeight = logoSize / 6;
              const barSpacing = logoSize / 12;
              ctx.fillRect(x + 2, y + barSpacing, logoSize - 4, barHeight);
              ctx.fillRect(
                x + 2,
                y + barSpacing * 2 + barHeight,
                logoSize - 4,
                barHeight
              );
              ctx.fillRect(
                x + 2,
                y + barSpacing * 3 + barHeight * 2,
                logoSize - 4,
                barHeight
              );
            }
          };

          // Set the logo source based on network
          if (network === "pokket") {
            logoImg.src = "/logo1.svg";
          } else if (network === "ethereum") {
            // Use a proper Ethereum logo SVG data URI
            logoImg.src =
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDNMMzEuNSAyMUwyMCAyN0w4LjUgMjFMMjAgM1oiIGZpbGw9IiM2MjdFRUEiLz4KPHBhdGggZD0iTTIwIDI5TDMxLjUgMjMuNUwyMCAzN0w4LjUgMjMuNUwyMCAyOVoiIGZpbGw9IiM2MjdFRUEiLz4KPC9zdmc+";
          } else if (network === "solana") {
            // Use a proper Solana logo SVG data URI
            logoImg.src =
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGR0ZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InNvbGFuYS1ncmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzk5NDVGRiIvPgo8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxNEYxOTUiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8cGF0aCBkPSJNNi4yIDI4LjVDNi42IDI3LjkgNy4zIDI3LjUgOC4xIDI3LjVIMzQuN0MzNS4zIDI3LjUgMzUuNyAyOC4yIDM1LjMgMjguOEwzMS42IDMzLjVDMzEuMiAzNC4xIDMwLjUgMzQuNSAyOS43IDM0LjVIM0MzLjQgMzQuNSAzIDMzLjggMy40IDMzLjJMNi4yIDI4LjVaIiBmaWxsPSJ1cmwoI3NvbGFuYS1ncmFkKSIvPgo8cGF0aCBkPSJNNi4yIDYuNUM2LjYgNS45IDcuMyA1LjUgOC4xIDUuNUgzNC43QzM1LjMgNS41IDM1LjcgNi4yIDM1LjMgNi44TDMxLjYgMTEuNUMzMS4yIDEyLjEgMzAuNSAxMi41IDI5LjcgMTIuNUgzQzMuNCAxMi41IDMgMTEuOCAzLjQgMTEuMkw2LjIgNi41WiIgZmlsbD0idXJsKCNzb2xhbmEtZ3JhZCkiLz4KPHA+dGggZD0iTTMxLjYgMTcuNUMzMS4yIDE2LjkgMzAuNSAxNi41IDI5LjcgMTYuNUgzQzIuNyAxNi41IDIuNiAxOC4yIDMuNCAxOC44TDYuMiAyMy41QzYuNiAyNC4xIDcuMyAyNC41IDguMSAyNC41SDM0LjdDMzUuMyAyNC41IDM1LjcgMjMuOCAzNS4zIDIzLjJMMzEuNiAxNy41WiIgZmlsbD0idXJsKCNzb2xhbmEtZ3JhZCkiLz4KPC9zdmc+";
          }
        };

        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
      } catch (error) {
        console.error("Error generating QR with logo:", error);
      }
    };

    generateQRWithLogo();
  }, [value, size, network]);

  return (
    <div style={{ position: "relative" }}>
      {/* Hidden QR code for data extraction */}
      <div
        ref={containerRef}
        style={{ position: "absolute", visibility: "hidden", top: -9999 }}
      >
        <QRCode value={value} size={size} level="M" />
      </div>

      {/* Visible canvas with logo */}
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: "100%",
          height: "auto",
        }}
      />
    </div>
  );
}
