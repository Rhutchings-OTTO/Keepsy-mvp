import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FRAUNCES, MANROPE } from "../KeepsyReel/fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Q_FRAMES    = 120; // 4s per question
const WIPE_FRAMES = 8;

const QUESTIONS = [
  {
    question: "Best gift for a dog mum?",
    optionA: { label: "A portrait of her dog",  correct: true  },
    optionB: { label: "Another lint roller",     correct: false },
  },
  {
    question: "Wedding gift sorted?",
    optionA: { label: "A John Lewis voucher",        correct: false },
    optionB: { label: "Their moment, on canvas",     correct: true  },
  },
  {
    question: "New baby present?",
    optionA: { label: "Something they'll treasure",  correct: true  },
    optionB: { label: "Another babygrow (the 47th)", correct: false },
  },
  {
    question: "Friend's birthday?",
    optionA: { label: "Panic-buy on Amazon",          correct: false },
    optionB: { label: "A gift that's actually personal", correct: true },
  },
] as const;

// Pulse grows the correct option scale slightly
const PULSE_START = 75; // 2.5s into each question — gives time to read before reveal

interface PollButtonProps {
  label: string;
  correct: boolean;
  localFrame: number;
  fps: number;
  delay: number;
}

const PollButton: React.FC<PollButtonProps> = ({ label, correct, localFrame, fps, delay }) => {
  const enterSpring = spring({
    frame: Math.max(0, localFrame - delay),
    fps,
    config: { damping: 200, stiffness: 160, mass: 0.7 },
    from: 0,
    to: 1,
  });
  const slideX  = interpolate(enterSpring, [0, 1], [60, 0]);
  const opacity = interpolate(enterSpring, [0, 0.5], [0, 1], clamp);

  // Correct pulse — gentle scale up
  const pulseSpring = spring({
    frame: Math.max(0, localFrame - PULSE_START),
    fps,
    config: { damping: 140, stiffness: 200, mass: 0.55 },
    from: 0,
    to: 1,
  });
  const pulseScale = correct
    ? interpolate(pulseSpring, [0, 1], [1, 1.04])
    : 1;

  // Correct glow — shadow-like border brightens
  const glowOp = correct
    ? interpolate(localFrame, [PULSE_START, PULSE_START + 18], [0, 1], clamp)
    : 0;

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${slideX}px) scale(${pulseScale})`,
        transformOrigin: "center center",
        backgroundColor: correct ? BRAND.terracotta : BRAND.white,
        border: correct
          ? `3px solid transparent`
          : `3px solid ${BRAND.ink}22`,
        borderRadius: 20,
        padding: "28px 40px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 20,
        boxShadow: correct
          ? `0 0 0 ${4 * glowOp}px ${BRAND.gold}55`
          : "none",
      }}
    >
      {/* Dot indicator */}
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          backgroundColor: correct ? BRAND.white : BRAND.ink,
          opacity: correct ? 1 : 0.2,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          fontFamily: MANROPE,
          fontWeight: correct ? 600 : 500,
          fontSize: 38,
          color: correct ? BRAND.white : BRAND.ink,
          lineHeight: 1.2,
          letterSpacing: "-0.3px",
        }}
      >
        {label}
      </div>
      {/* Checkmark for correct after pulse */}
      {correct && (
        <div
          style={{
            marginLeft: "auto",
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: glowOp,
            flexShrink: 0,
          }}
        >
          {/* Simple checkmark using two divs */}
          <div style={{ position: "relative", width: 20, height: 14 }}>
            <div style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: 7,
              height: 3,
              backgroundColor: BRAND.white,
              borderRadius: 2,
              transform: "rotate(45deg)",
              transformOrigin: "left bottom",
            }} />
            <div style={{
              position: "absolute",
              right: 0,
              bottom: 2,
              width: 14,
              height: 3,
              backgroundColor: BRAND.white,
              borderRadius: 2,
              transform: "rotate(-50deg)",
              transformOrigin: "right bottom",
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

interface QuestionCardProps {
  q: typeof QUESTIONS[number];
  localFrame: number;
  fps: number;
  isLast: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ q, localFrame, fps, isLast }) => {
  // Question text scales up
  const qSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 240, stiffness: 200, mass: 0.6 },
    from: 0,
    to: 1,
  });
  const qScale   = interpolate(qSpring, [0, 1], [0.78, 1]);
  const qOpacity = interpolate(qSpring, [0, 0.5], [0, 1], clamp);

  // Terracotta wipe exit
  const exitStart = Q_FRAMES - WIPE_FRAMES;
  const isExiting = !isLast && localFrame >= exitStart;
  const wl = localFrame - exitStart;
  const wipeHalf = WIPE_FRAMES / 2;
  const wipeIn   = interpolate(wl, [0, wipeHalf],      [0, 1], clamp);
  const wipeOut  = interpolate(wl, [wipeHalf, WIPE_FRAMES], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.creamDark,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 72px",
        gap: 32,
      }}
    >
      {/* Q number pill */}
      <div
        style={{
          opacity: qOpacity,
          alignSelf: "flex-start",
          backgroundColor: BRAND.forest,
          borderRadius: 100,
          padding: "8px 24px",
          fontFamily: MANROPE,
          fontWeight: 600,
          fontSize: 26,
          color: BRAND.white,
          letterSpacing: "1px",
        }}
      >
        QUESTION
      </div>

      {/* Question */}
      <div
        style={{
          opacity: qOpacity,
          transform: `scale(${qScale})`,
          transformOrigin: "left center",
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontSize: 76,
          color: BRAND.ink,
          lineHeight: 1.08,
          letterSpacing: "-1.8px",
          alignSelf: "flex-start",
        }}
      >
        {q.question}
      </div>

      {/* Poll options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
        <PollButton
          label={q.optionA.label}
          correct={q.optionA.correct}
          localFrame={localFrame}
          fps={fps}
          delay={14}
        />
        <PollButton
          label={q.optionB.label}
          correct={q.optionB.correct}
          localFrame={localFrame}
          fps={fps}
          delay={22}
        />
      </div>

      {/* Terracotta wipe exit */}
      {isExiting && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: wipeOut > 0 ? `${wipeOut * 100}%` : 0,
            width: wipeOut > 0 ? `${(1 - wipeOut) * 100}%` : `${wipeIn * 100}%`,
            backgroundColor: BRAND.terracotta,
            zIndex: 50,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export const QuestionsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const qIndex     = Math.min(QUESTIONS.length - 1, Math.floor(frame / Q_FRAMES));
  const localFrame = frame % Q_FRAMES;

  return (
    <AbsoluteFill>
      <QuestionCard
        key={qIndex}
        q={QUESTIONS[qIndex]}
        localFrame={localFrame}
        fps={fps}
        isLast={qIndex === QUESTIONS.length - 1}
      />
    </AbsoluteFill>
  );
};
