import type { FC } from "react";
import { useRef, useState } from "react";

interface ImageBackgroundRemoverProps {
  onBackHome: () => void;
}

export const ImageBackgroundRemover: FC<ImageBackgroundRemoverProps> = ({ onBackHome }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tolerance, setTolerance] = useState(30); // 颜色容差值
  const [edgeSamples, setEdgeSamples] = useState(5); // 边缘采样像素数
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      alert("请选择一张图片文件");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setOriginalImage(dataUrl);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);
  };

  // 计算两个颜色的距离（RGB空间）
  const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number => {
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  };

  // 移除背景的核心算法
  const removeBackground = () => {
    if (!originalImage || !canvasRef.current) return;

    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsProcessing(false);
        return;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 方法1：边缘采样法 - 从图片四个边缘采样，推断背景色
      const edgeColors: Array<{ r: number; g: number; b: number }> = [];
      const sampleCount = edgeSamples;

      // 上边缘
      for (let x = 0; x < canvas.width && edgeColors.length < sampleCount * 4; x += Math.floor(canvas.width / sampleCount)) {
        const idx = (0 * canvas.width + x) * 4;
        edgeColors.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
      // 下边缘
      for (let x = 0; x < canvas.width && edgeColors.length < sampleCount * 8; x += Math.floor(canvas.width / sampleCount)) {
        const idx = ((canvas.height - 1) * canvas.width + x) * 4;
        edgeColors.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
      // 左边缘
      for (let y = 0; y < canvas.height && edgeColors.length < sampleCount * 12; y += Math.floor(canvas.height / sampleCount)) {
        const idx = (y * canvas.width + 0) * 4;
        edgeColors.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
      // 右边缘
      for (let y = 0; y < canvas.height && edgeColors.length < sampleCount * 16; y += Math.floor(canvas.height / sampleCount)) {
        const idx = (y * canvas.width + (canvas.width - 1)) * 4;
        edgeColors.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }

      // 计算边缘颜色的平均值作为背景色
      let avgR = 0, avgG = 0, avgB = 0;
      edgeColors.forEach(c => {
        avgR += c.r;
        avgG += c.g;
        avgB += c.b;
      });
      avgR = Math.round(avgR / edgeColors.length);
      avgG = Math.round(avgG / edgeColors.length);
      avgB = Math.round(avgB / edgeColors.length);

      // 遍历所有像素，移除与背景色相似的像素
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const distance = colorDistance(r, g, b, avgR, avgG, avgB);

        // 如果颜色距离小于容差值，设为透明
        if (distance < tolerance) {
          data[i + 3] = 0; // alpha = 0 (透明)
        }
      }

      // 方法2：如果边缘采样效果不好，可以尝试四角采样
      // 这里我们先用边缘采样，如果用户不满意可以调整容差值

      ctx.putImageData(imageData, 0, 0);
      const processedDataUrl = canvas.toDataURL("image/png");
      setProcessedImage(processedDataUrl);
      setIsProcessing(false);
    };

    img.src = originalImage;
  };

  const handleDownload = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.download = "pet-transparent.png";
    link.href = processedImage;
    link.click();
  };

  return (
    <div className="wechat-page">
      <header className="wechat-header wechat-header-with-back">
        <button
          type="button"
          className="wechat-back-btn"
          onClick={onBackHome}
        >
          <span className="wechat-back-arrow">‹</span>
          <span>返回</span>
        </button>
        <div className="wechat-header-title">
          <div className="wechat-header-main">图片背景移除</div>
          <div className="wechat-header-sub">将桌宠图片处理成透明背景立绘</div>
        </div>
      </header>

      <main className="wechat-main pet-main-scroll">
        <section className="soft-card-minimal">
          <div className="pet-section-title">上传图片</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="primary-pill-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            选择图片文件
          </button>
          {originalImage && (
            <div style={{ marginTop: "12px" }}>
              <div className="pet-section-title" style={{ marginBottom: "6px" }}>原图预览</div>
              <img
                src={originalImage}
                alt="原图"
                style={{
                  maxWidth: "100%",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 195, 224, 0.5)"
                }}
              />
            </div>
          )}
        </section>

        {originalImage && (
          <section className="soft-card-minimal">
            <div className="pet-section-title">处理参数</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-sub)", marginBottom: "4px", display: "block" }}>
                  颜色容差: {tolerance} (值越大，移除的背景越多，但可能误删主体)
                </label>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-sub)", marginBottom: "4px", display: "block" }}>
                  边缘采样数: {edgeSamples} (采样越多，背景色判断越准确)
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={edgeSamples}
                  onChange={(e) => setEdgeSamples(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
            <button
              type="button"
              className="primary-pill-btn"
              onClick={removeBackground}
              disabled={isProcessing}
              style={{ marginTop: "12px" }}
            >
              {isProcessing ? "处理中..." : "开始移除背景"}
            </button>
          </section>
        )}

        {processedImage && (
          <section className="soft-card-minimal">
            <div className="pet-section-title">处理结果</div>
            <div
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), repeating-linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)",
                backgroundPosition: "0 0, 10px 10px",
                backgroundSize: "20px 20px",
                padding: "12px",
                borderRadius: "12px",
                marginBottom: "12px"
              }}
            >
              <img
                src={processedImage}
                alt="处理后"
                style={{
                  maxWidth: "100%",
                  display: "block"
                }}
              />
            </div>
            <button
              type="button"
              className="primary-pill-btn"
              onClick={handleDownload}
            >
              下载透明背景图片 (PNG)
            </button>
            <p style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: "8px", lineHeight: "1.5" }}>
              提示：如果效果不理想，可以调整容差值后重新处理。如果背景是纯色（如白色、绿色），效果会更好。
            </p>
          </section>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </main>
    </div>
  );
};

