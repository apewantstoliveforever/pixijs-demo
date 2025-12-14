"use client";

import { Application, extend, useTick } from "@pixi/react";
import { Container, Graphics } from "pixi.js";
import { useCallback, useState } from "react";
import { BunnySprite } from "./BunnySprite";

extend({
  Container,
  Graphics,
});

export default function HorseTracks() {
  const trackHeight = 60;
  const trackWidth = 800;
  const finishX = 50 + trackWidth - 20; // vạch đích

  const colors = ["red", "blue", "green", "orange"];

  // lưu thứ tự về đích
  const [results, setResults] = useState<string[]>([]);

  // function khi bunny về đích
  const handleFinish = (index: number) => {
    setResults((prev) => {
      const newList = [...prev, `Bunny ${index + 1}`];

      if (newList.length === 4) {
        console.log("🏆 KẾT QUẢ CHUNG CUỘC:", newList);
      }

      return newList;
    });
  };

  const drawTrack = (color: string) =>
    useCallback((g: Graphics) => {
      g.clear();
      g.setFillStyle({ color });
      g.rect(0, 0, trackWidth, trackHeight);
      g.fill();
    }, []);

  return (
    <Application width={1000} height={600}>
      <pixiContainer x={50} y={30}>
        {colors.map((color, index) => (
          <pixiGraphics
            key={index}
            y={index * (trackHeight + 10)}
            draw={drawTrack(color)}
          />
        ))}

        {/* Bunny chạy */}
        {colors.map((_, index) => (
          <BunnySprite
            key={`bunny-${index}`}
            x={20}
            y={index * (trackHeight + 10) + trackHeight / 2}
            speed={Math.random() * 3 + 1} // tốc độ random 1–4
            finishX={finishX}
            onFinish={() => handleFinish(index)}
          />
        ))}
      </pixiContainer>
    </Application>
  );
}
