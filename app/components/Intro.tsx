import React, { forwardRef } from "react";

const Intro = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div
      ref={ref}
      className="fixed inset-0 z-60 flex items-center justify-center overflow-hidden pointer-events-none invisible"
      style={{ backgroundColor: "#000000" }}
    >
      <div className="intro-text text-white font-sans font-light text-3xl md:text-5xl tracking-wide opacity-0 text-center max-w-4xl px-4 leading-normal relative z-10" />
    </div>
  );
});

Intro.displayName = "Intro";

export default Intro;
