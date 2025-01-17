let supportWebgl: boolean = null;

export default function checkWebGL(): boolean {
  if (supportWebgl === null) {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    // Report the result.
    if (gl && gl instanceof WebGLRenderingContext) {
      supportWebgl = true;
    } else {
      supportWebgl = false;
    }
  }
  return supportWebgl;
}
