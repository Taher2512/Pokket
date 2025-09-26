"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import jsQR from "jsqr";
import PaymentModal from "./PaymentModal";

interface QRPayload {
  name: string;
  ethAddress: string;
  solAddress: string;
}

export default function QRPaymentFlow() {
  const [isScanning, setIsScanning] = useState(false);
  const [paymentData, setPaymentData] = useState<QRPayload | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const validateQRPayload = (data: unknown): data is QRPayload => {
    if (typeof data !== "object" || data === null) {
      return false;
    }

    const payload = data as Record<string, unknown>;

    // Check if all required fields exist and are strings
    if (
      typeof payload.name !== "string" ||
      typeof payload.ethAddress !== "string" ||
      typeof payload.solAddress !== "string"
    ) {
      return false;
    }

    // Validate Ethereum address format (0x + 40 hex chars)
    const ethRegex = /^0x[a-fA-F0-9]{40}$/i;
    if (!payload.ethAddress.match(ethRegex)) {
      return false;
    }

    // Validate Solana address (Base58, typically 32-44 chars)
    if (payload.solAddress.length < 32 || payload.solAddress.length > 44) {
      return false;
    }

    return true;
  };

  const processQRCode = useCallback((qrText: string) => {
    // Sanitize the QR text by removing control characters
    const sanitizedText = qrText
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove control characters
      .trim(); // Remove leading/trailing whitespace

    try {
      const parsed = JSON.parse(sanitizedText);

      if (validateQRPayload(parsed)) {
        setPaymentData(parsed);
        setError("");
        stopCamera();
      } else {
        setError(
          "Invalid QR code format. Please ensure it contains valid name, ethAddress, and solAddress fields."
        );
      }
    } catch (err) {
      setError("Invalid QR code. Please scan a valid payment QR code.");
    }
  }, []);

  const startCamera = async () => {
    try {
      setError("");

      // Stop any existing camera first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device");
      }

      // Set scanning to true FIRST so video element renders
      setIsScanning(true);
      setIsLoading(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640, min: 480 },
          height: { ideal: 480, min: 320 },
        },
      });

      streamRef.current = stream;

      // Wait a bit for React to render the video element
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (videoRef.current) {
        console.log("🎥 Setting up video element...");

        const video = videoRef.current;

        // Reset video element
        video.srcObject = null;

        // Set up promise-based loading
        const setupVideo = new Promise<void>((resolve, reject) => {
          const onLoadedMetadata = () => {
            console.log("📹 Video metadata loaded:", {
              width: video.videoWidth,
              height: video.videoHeight,
              readyState: video.readyState,
            });
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            resolve();
          };

          const onError = (err: Event) => {
            console.error("❌ Video error during setup:", err);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            reject(new Error("Video setup failed"));
          };

          video.addEventListener("loadedmetadata", onLoadedMetadata);
          video.addEventListener("error", onError);

          // Assign the stream
          video.srcObject = stream;
        });

        // Wait for video to be ready
        await setupVideo;

        console.log("✅ Video setup complete, starting scan");
        setIsLoading(false);

        // Ensure scanning state is still active (in case of race condition)
        setIsScanning(true);

        // Start scanning after a short delay
        setTimeout(() => {
          console.log("🔍 Starting QR scan loop");
          // Force start scanning by checking current refs instead of state
          if (videoRef.current && canvasRef.current && streamRef.current) {
            console.log("🔍 All requirements met, starting scan");
            scanQRCode();
          } else {
            console.log("❌ Missing requirements for scan:", {
              hasVideo: !!videoRef.current,
              hasCanvas: !!canvasRef.current,
              hasStream: !!streamRef.current,
            });
          }
        }, 200);
      } else {
        throw new Error("Video element still not found after render delay");
      }
    } catch (error) {
      console.error("❌ Camera error:", error);
      setError(
        "Unable to access camera. Please ensure you've granted camera permissions and try uploading an image instead."
      );
      setIsLoading(false);
      setIsScanning(false); // Reset scanning state on error

      // Clean up stream on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const scanQRCode = useCallback(() => {
    // Check current state directly instead of relying on closure
    const currentIsScanning = streamRef.current !== null;

    if (!currentIsScanning || !videoRef.current || !canvasRef.current) {
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.log("❌ No canvas context available");
      return;
    }

    // Check if video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log(
        "📹 Video not ready, readyState:",
        video.readyState,
        "HAVE_ENOUGH_DATA:",
        video.HAVE_ENOUGH_DATA
      );
      if (streamRef.current) {
        // Continue if stream is active
        requestAnimationFrame(scanQRCode);
      }
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (canvas.width === 0 || canvas.height === 0) {
      console.log("❌ Canvas dimensions are zero:", {
        width: canvas.width,
        height: canvas.height,
      });
      if (streamRef.current) {
        // Continue if stream is active
        requestAnimationFrame(scanQRCode);
      }
      return;
    }

    try {
      // Draw the video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data and scan for QR code
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Add periodic logging every ~2 seconds
      if (Math.random() < 0.03) {
        // ~3% of frames
        console.log("🔍 Scanning frame:", {
          canvasSize: `${canvas.width}x${canvas.height}`,
          imageDataLength: imageData.data.length,
          videoReadyState: video.readyState,
        });
      }

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        console.log("✅ QR Code detected in video stream:", code.data);
        processQRCode(code.data);
        return; // Stop scanning after finding a code
      }
    } catch (error) {
      console.error("❌ Error during QR scanning:", error);
    }

    // Continue scanning if still active
    if (streamRef.current) {
      requestAnimationFrame(scanQRCode);
    }
  }, [processQRCode]); // Removed isScanning dependency

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name, file.type);

    setIsLoading(true);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          setError("Canvas not available");
          setIsLoading(false);
          return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Canvas context not available");
          setIsLoading(false);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        console.log("🔍 Canvas dimensions:", canvas.width, "x", canvas.height);
        console.log("🔍 ImageData:", imageData.width, "x", imageData.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height);
        console.log("🔍 jsQR result:", code);

        if (code && code.data) {
          console.log("✅ QR Code found in uploaded image");
          console.log("🔍 QR data from upload:", code.data);
          processQRCode(code.data);
        } else {
          console.log("❌ No QR code detected in image");
          setError(
            "No QR code found in the image. Please try a clearer image or ensure it contains a valid QR code."
          );
        }
        setIsLoading(false);
      };

      img.onerror = () => {
        setError("Failed to load image. Please try a different image.");
        setIsLoading(false);
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };

    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
      setIsLoading(false);
    };

    reader.readAsDataURL(file);

    // Reset the input so the same file can be selected again
    event.target.value = "";
  };

  const resetFlow = () => {
    setPaymentData(null);
    setError("");
    stopCamera();
  };

  return (
    <>
      <div className="max-w-2xl mx-auto">
        {!paymentData && (
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h5.01M4 20h5.01"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Scan Payment QR Code
              </h2>
              <p className="text-gray-600">
                Scan or upload a QR code to get started with your payment
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-800 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!isScanning && !isLoading && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Scan QR Code */}
                <button
                  onClick={startCamera}
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-orange-500 hover:bg-orange-50/50 transition-all duration-300"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 group-hover:bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
                      <svg
                        className="w-6 h-6 text-gray-600 group-hover:text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Scan QR Code
                    </h3>
                    <p className="text-sm text-gray-600">
                      Use your camera to scan the payment QR code
                    </p>
                  </div>
                </button>

                {/* Upload Image */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-orange-500 hover:bg-orange-50/50 transition-all duration-300"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 group-hover:bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
                      <svg
                        className="w-6 h-6 text-gray-600 group-hover:text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Upload Image
                    </h3>
                    <p className="text-sm text-gray-600">
                      Select a QR code image from your device
                    </p>
                  </div>
                </button>
              </div>
            )}

            {(isScanning || isLoading) && (
              <div className="text-center py-8">
                {isLoading && (
                  <>
                    <div className="w-16 h-16 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Processing...</p>
                  </>
                )}

                {isScanning && (
                  <>
                    <div className="relative mx-auto mb-6 inline-block">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-80 h-60 object-cover rounded-2xl border-2 border-orange-500"
                        style={{ transform: "scaleX(-1)" }}
                      />
                      <div className="absolute inset-0 border-4 border-orange-500 rounded-2xl pointer-events-none">
                        <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-orange-500"></div>
                        <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-orange-500"></div>
                        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-orange-500"></div>
                        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-orange-500"></div>
                        {/* Scanning indicator */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">
                      Position the QR code within the frame
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      🔍 Actively scanning for QR codes...
                    </p>
                    <button onClick={stopCamera} className="btn-secondary">
                      Stop Scanning
                    </button>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Hidden canvas for QR processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Payment Modal */}
      {paymentData && (
        <PaymentModal paymentData={paymentData} onClose={resetFlow} />
      )}
    </>
  );
}
