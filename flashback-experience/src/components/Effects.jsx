// Screen-level layers that sit above the picture and text: a permanent soft vignette,
// a vignette that can pulse, a white flash and a black blackout. All start invisible.
export default function Effects() {
  return (
    <>
      <div className="vignette" aria-hidden="true" />
      <div className="vignette vignette--pulse" data-ref="vignette" aria-hidden="true" />
      <div className="fx-flash" data-ref="flash" aria-hidden="true" />
      <div className="fx-blackout" data-ref="blackout" aria-hidden="true" />
    </>
  );
}
