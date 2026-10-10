// The picture slot. It starts EMPTY: the engine puts the preloaded <img> into it at the start of each
// scene (so only the current + next picture are ever in memory) and animates the slot with GSAP.
// The surrounding layers hold the scene's colour wash / darkness, and the burn + crack overlays.
export default function ImageLayer() {
  return (
    <>
      <div className="ov bg" data-ref="bg" />
      <div className="ov slot" data-ref="slot" />
      <div className="ov shards" data-ref="shards" />
      <canvas className="ov burn" data-ref="burn" aria-hidden="true" />
      <div className="ov overlay" data-ref="overlay" />
      <div className="ov dark" data-ref="dark" />
    </>
  );
}
