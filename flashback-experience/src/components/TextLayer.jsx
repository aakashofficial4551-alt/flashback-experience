import { Fragment, memo } from 'react';

// Every text cue of every scene is rendered ONCE (hidden). GSAP shows / animates them by reference,
// so playing the sequence never re-renders React. Words are .w and letters are .c for the text effects.
const Cue = memo(function Cue({ cue }) {
  const lines = cue.text.split('\n');
  return (
    <div className={`cue-box cue-box--${cue.position}`}>
      <p className={`cue cue--${cue.style}`} data-cue={cue.id}>
        {lines.map((line, li) => (
          <Fragment key={li}>
            {li > 0 && <br />}
            {line.split(/\s+/).filter(Boolean).map((word, wi, arr) => (
              <Fragment key={wi}>
                <span className="w">
                  {[...word].map((ch, ci) => <span className="c" key={ci}>{ch}</span>)}
                </span>
                {wi < arr.length - 1 && ' '}
              </Fragment>
            ))}
          </Fragment>
        ))}
      </p>
    </div>
  );
});

export default function TextLayer({ scenes }) {
  return (
    <div className="text-layer" aria-hidden="true">
      {scenes.flatMap((s) => s.texts).map((cue) => <Cue key={cue.id} cue={cue} />)}
    </div>
  );
}
