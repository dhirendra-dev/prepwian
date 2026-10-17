// @ts-nocheck
import {
  useCallback,
  useEffect,
  useState,
} from "react";

export type FloatingPlayerPosition = {
  x: number;
  y: number;
};

export type FloatingPlayerSize = {
  width: number;
  height: number;
};

type UseFloatingYouTubePlayerOptions = {
  initialPosition?: FloatingPlayerPosition;
  initialSize?: FloatingPlayerSize;
};

type UseFloatingYouTubePlayerReturn = {
  position: FloatingPlayerPosition;
  size: FloatingPlayerSize;
  isMinimized: boolean;
  setPosition: (
    position: FloatingPlayerPosition,
  ) => void;
  setSize: (
    size: FloatingPlayerSize,
  ) => void;
  setIsMinimized: (
    value: boolean,
  ) => void;
  startDrag: (
    event: React.PointerEvent,
  ) => void;
};

const DEFAULT_WIDTH = 420;
const DEFAULT_HEIGHT = 300;

const clamp = (
  value: number,
  min: number,
  max: number,
) => {
  return Math.min(
    Math.max(value, min),
    Math.max(min, max),
  );
};

export function useFloatingYouTubePlayer({
  initialPosition = {
    x: 20,
    y: 20,
  },
  initialSize = {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  },
}: UseFloatingYouTubePlayerOptions = {}): UseFloatingYouTubePlayerReturn {
  const [position, setPositionState] =
    useState<FloatingPlayerPosition>(
      initialPosition,
    );

  const [size, setSizeState] =
    useState<FloatingPlayerSize>(
      initialSize,
    );

  const [isMinimized, setIsMinimized] =
    useState(false);

  const setPosition = useCallback(
    (nextPosition: FloatingPlayerPosition) => {
      setPositionState({
        x: Math.max(0, nextPosition.x),
        y: Math.max(0, nextPosition.y),
      });
    },
    [],
  );

  const setSize = useCallback(
    (nextSize: FloatingPlayerSize) => {
      setSizeState({
        width: Math.max(
          280,
          nextSize.width,
        ),
        height: Math.max(
          180,
          nextSize.height,
        ),
      });
    },
    [],
  );

  const startDrag = useCallback(
    (
      event: React.PointerEvent,
    ) => {
      if (
        event.pointerType === "mouse" &&
        event.button !== 0
      ) {
        return;
      }

      const startPointerX =
        event.clientX;

      const startPointerY =
        event.clientY;

      const startX = position.x;
      const startY = position.y;

      const handlePointerMove = (
        moveEvent: PointerEvent,
      ) => {
        const deltaX =
          moveEvent.clientX -
          startPointerX;

        const deltaY =
          moveEvent.clientY -
          startPointerY;

        const viewportWidth =
          window.innerWidth;

        const viewportHeight =
          window.innerHeight;

        const maxX = Math.max(
          0,
          viewportWidth -
            size.width -
            8,
        );

        const maxY = Math.max(
          0,
          viewportHeight -
            size.height -
            8,
        );

        setPositionState({
          x: clamp(
            startX + deltaX,
            8,
            maxX,
          ),
          y: clamp(
            startY + deltaY,
            8,
            maxY,
          ),
        });
      };

      const handlePointerUp = () => {
        window.removeEventListener(
          "pointermove",
          handlePointerMove,
        );

        window.removeEventListener(
          "pointerup",
          handlePointerUp,
        );
      };

      window.addEventListener(
        "pointermove",
        handlePointerMove,
      );

      window.addEventListener(
        "pointerup",
        handlePointerUp,
        { once: true },
      );
    },
    [position, size],
  );

  useEffect(() => {
    const handleResize = () => {
      const viewportWidth =
        window.innerWidth;

      const viewportHeight =
        window.innerHeight;

      const maxX = Math.max(
        8,
        viewportWidth -
          size.width -
          8,
      );

      const maxY = Math.max(
        8,
        viewportHeight -
          size.height -
          8,
      );

      setPositionState(
        (currentPosition) => ({
          x: clamp(
            currentPosition.x,
            8,
            maxX,
          ),
          y: clamp(
            currentPosition.y,
            8,
            maxY,
          ),
        }),
      );
    };

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, [size]);

  return {
    position,
    size,
    isMinimized,
    setPosition,
    setSize,
    setIsMinimized,
    startDrag,
  };
}