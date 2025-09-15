import React from "react";

const WerewolfIframe = () => (
  <div
    style={{
      width: "100%",
      height: "100vh",
      overflow: "hidden",
      background: "#18171c",
      margin: 0,
      padding: 0,
    }}
  >
    <iframe
      src="https://play-werewolf.app/"
      style={{
        width: "100%",
        height: "100%",
        border: 0,
        borderRadius: 0,
        display: "block",
        margin: 0,
        padding: 0,
      }}
      loading="lazy"
      title="Werewolf Game"
      allowFullScreen
    />
  </div>
);

export default WerewolfIframe;
