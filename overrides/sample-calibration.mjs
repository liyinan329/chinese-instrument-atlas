// Playback-only compensation; original recording data and playing dynamics remain untouched.
export function sampleGain(sample){const gain=sample?.playbackGain;return Number.isFinite(gain)&&gain>0?Math.max(.25,Math.min(2,gain)):1;}
export const calibratedVelocity=(sample,velocity)=>Math.max(0,Number(velocity)||0)*sampleGain(sample);
