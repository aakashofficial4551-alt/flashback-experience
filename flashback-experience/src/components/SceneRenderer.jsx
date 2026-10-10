import { forwardRef } from 'react';
import ImageLayer from './ImageLayer.jsx';
import TextLayer from './TextLayer.jsx';
import Effects from './Effects.jsx';

// The full-screen stage. It renders once; the engine animates the elements marked data-ref / data-cue.
// "camera" wraps picture + text, so a camera shake moves both together.
const SceneRenderer = forwardRef(function SceneRenderer({ scenes }, ref) {
  return (
    <div className="stage-root" ref={ref}>
      <div className="camera" data-ref="camera">
        <ImageLayer />
        <TextLayer scenes={scenes} />
      </div>
      <Effects />
      {/* Screen-reader text: the engine writes the current line here (no React re-render). */}
      <p className="visually-hidden" aria-live="polite" data-ref="live" />
    </div>
  );
});

export default SceneRenderer;
