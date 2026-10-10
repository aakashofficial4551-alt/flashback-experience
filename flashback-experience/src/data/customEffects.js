// Your own effects. Reference one from a scene with  custom: [{ name: 'heartbeat', at: 3.2 }]
//
// Each function gets (tl, api):
//   tl            the master GSAP timeline (add tweens with tl.add(tween, time))
//   api.at        time (seconds on the master timeline) where this effect was placed
//   api.scene     the scene config      api.refs   named stage elements (camera, slot, flash ...)
//   api.effect(name, group)  looks up a built-in effect  (group: 'image' | 'screen' | 'text')
//   api.audio / api.haptics  managers      api.reducedMotion  true if the visitor asked for less motion
//   api.gsap      the gsap library

export const customEffects = {
  // Two soft vignette pulses and two short buzzes, like a heartbeat.
  heartbeat(tl, { at, refs, effect, haptics, reducedMotion }) {
    const pulse = effect('vignettePulse', 'screen');
    [0, 0.9].forEach((offset) => {
      if (pulse && !reducedMotion) tl.add(pulse.fn(refs, 0.9, { duration: 0.7 }), at + offset);
      tl.call(() => haptics.vibrate([35, 50, 35]), null, at + offset);
    });
  },
};
