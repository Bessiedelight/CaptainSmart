"use client";

import { useState, useEffect, useRef } from "react";
import { AnimationPerformance } from "@/lib/utils/animations";

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export default function PerformanceMonitor({
  enabled = process.env.NODE_ENV === "development",
  position = "bottom-right",
}: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<
    Record<string, { average: number; count: number }>
  >({});
  const [fps, setFps] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() });

  // FPS monitoring
  useEffect(() => {
    if (!enabled) return;

    let animationId: number;

    const measureFPS = () => {
      fpsRef.current.frames++;
      const now = performance.now();

      if (now >= fpsRef.current.lastTime + 1000) {
        setFps(
          Math.round(
            (fpsRef.current.frames * 1000) / (now - fpsRef.current.lastTime)
          )
        );
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = now;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled]);

  // Metrics monitoring
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      const currentMetrics = AnimationPerformance.getMetrics();
      setMetrics(currentMetrics);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return "text-green-500";
    if (fps >= 30) return "text-yellow-500";
    return "text-red-500";
  };

  const getPerformanceColor = (avgTime: number) => {
    if (avgTime <= 16) return "text-green-500"; // 60fps
    if (avgTime <= 33) return "text-yellow-500"; // 30fps
    return "text-red-500"; // < 30fps
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-xs font-mono hover:bg-opacity-90 transition-all"
        title="Performance Monitor"
      >
        📊 {fps} FPS
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="mt-2 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs font-mono min-w-[300px] max-h-[400px] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">Performance Monitor</h3>
            <button
              onClick={() => {
                AnimationPerformance.clearMetrics();
                setMetrics({});
              }}
              className="text-gray-400 hover:text-white"
              title="Clear metrics"
            >
              🗑️
            </button>
          </div>

          {/* FPS Display */}
          <div className="mb-3 p-2 bg-gray-800 rounded">
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className={getFPSColor(fps)}>{fps}</span>
            </div>
          </div>

          {/* Animation Metrics */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-300 border-b border-gray-600 pb-1">
              Animation Metrics
            </h4>

            {Object.keys(metrics).length === 0 ? (
              <div className="text-gray-400 text-center py-2">
                No animation metrics yet
              </div>
            ) : (
              Object.entries(metrics).map(([name, data]) => (
                <div key={name} className="p-2 bg-gray-800 rounded">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-300 text-xs truncate flex-1 mr-2">
                      {name}
                    </span>
                    <div className="text-right">
                      <div
                        className={`${getPerformanceColor(data.average)} font-semibold`}
                      >
                        {data.average.toFixed(1)}ms
                      </div>
                      <div className="text-gray-400 text-xs">
                        {data.count} calls
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Memory Usage (if available) */}
          {(performance as any).memory && (
            <div className="mt-3 space-y-1">
              <h4 className="text-xs font-semibold text-gray-300 border-b border-gray-600 pb-1">
                Memory Usage
              </h4>
              <div className="p-2 bg-gray-800 rounded text-xs">
                <div className="flex justify-between">
                  <span>Used:</span>
                  <span>
                    {Math.round(
                      (performance as any).memory.usedJSHeapSize / 1024 / 1024
                    )}
                    MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>
                    {Math.round(
                      (performance as any).memory.totalJSHeapSize / 1024 / 1024
                    )}
                    MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Limit:</span>
                  <span>
                    {Math.round(
                      (performance as any).memory.jsHeapSizeLimit / 1024 / 1024
                    )}
                    MB
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tips */}
          <div className="mt-3 p-2 bg-gray-800 rounded">
            <h4 className="text-xs font-semibold text-gray-300 mb-1">Tips</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Keep animations under 16ms for 60fps</li>
              <li>• Use transform and opacity for best performance</li>
              <li>• Avoid animating layout properties</li>
              <li>• Use will-change for complex animations</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
