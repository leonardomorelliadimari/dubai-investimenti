import * as THREE from "three";

/** Uniform condivisi da tutte le facciate: la notte accende le finestre. */
export const facadeUniforms = {
  uNight: { value: 0 },
};

/** Evita valori HDR estremi (riflessi speculari) che in post-produzione diventano pixel neri. */
export const CLAMP_CHUNK = `#include <dithering_fragment>
  {
    vec3 cc = gl_FragColor.rgb;
    if (any(isnan(cc)) || any(isinf(cc))) cc = vec3(0.5);
    gl_FragColor.rgb = min(cc, vec3(14.0));
  }`;
export function clampMaterial<T extends THREE.Material>(m: T): T {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (s, r) => { prev.call(m, s, r); s.fragmentShader = s.fragmentShader.replace("#include <dithering_fragment>", CLAMP_CHUNK); };
  return m;
}

export type FacadeStyle = "glass" | "residential" | "landmark";

type Opts = {
  style: FacadeStyle;
  floorH: number;
  colW: number;
  /** colore del vetro (tinta del riflesso) */
  glass: THREE.ColorRepresentation;
  litRatio?: number;
};

const STYLE = {
  // [inizio fascia vetrata, fine fascia vetrata, spessore montante, metallicità vetro]
  glass: [0.06, 0.94, 0.05, 0.75],
  residential: [0.3, 0.86, 0.16, 0.55],
  landmark: [0.05, 0.95, 0.07, 0.85],
} as const;

/**
 * MeshStandardMaterial con facciata procedurale in coordinate mondo:
 * vetri riflettenti (con piccole variazioni per finestra, come nella realtà),
 * marcapiani/balconi, montanti, e luci interne di notte. Compatibile con InstancedMesh.
 */
export function facadeMaterial(base: THREE.MeshStandardMaterialParameters, o: Opts) {
  const m = new THREE.MeshStandardMaterial(base);
  const glass = new THREE.Color(o.glass);
  const [b0, b1, mw, gm] = STYLE[o.style];
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uNight: facadeUniforms.uNight,
      uFloorH: { value: o.floorH },
      uColW: { value: o.colW },
      uGlass: { value: glass },
      uLit: { value: o.litRatio ?? 0.3 },
    });
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNor;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec4 fwp = vec4(transformed, 1.0);
        vec3 fwn = objectNormal;
        #ifdef USE_INSTANCING
          fwp = instanceMatrix * fwp;
          fwn = mat3(instanceMatrix) * fwn;
        #endif
        fwp = modelMatrix * fwp;
        vWPos = fwp.xyz;
        vWNor = normalize(mat3(modelMatrix) * fwn);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWPos; varying vec3 vWNor;
        uniform float uNight; uniform float uFloorH; uniform float uColW; uniform vec3 uGlass; uniform float uLit;
        float fHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float fWin; vec2 fCell; float fVar; float fSlab;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          float side = 1.0 - step(0.55, abs(vWNor.y));
          float fy = fract(vWPos.y / uFloorH);
          float band = smoothstep(${b0.toFixed(3)}, ${(b0 + 0.04).toFixed(3)}, fy) * (1.0 - smoothstep(${(b1 - 0.04).toFixed(3)}, ${b1.toFixed(3)}, fy));
          float hc = abs(vWNor.x) > abs(vWNor.z) ? vWPos.z : vWPos.x;
          float fx = fract(hc / uColW);
          float mull = smoothstep(0.0, ${mw.toFixed(3)}, fx) * (1.0 - smoothstep(${(1 - mw).toFixed(3)}, 1.0, fx));
          float aa = clamp(1.0 - max(fwidth(vWPos.y / uFloorH), fwidth(hc / uColW)) * 1.3, 0.0, 1.0);
          fCell = vec2(floor(hc / uColW), floor(vWPos.y / uFloorH)) + floor(vWPos.xz / 60.0) * 13.7;
          fVar = fHash(fCell);
          fWin = mix(${((b1 - b0) * 0.8).toFixed(3)}, band * mull, aa) * side;
          fSlab = (1.0 - band) * side * aa;
          // vetro: tinta + variazione per singola finestra (tende, riflessi diversi)
          vec3 g = ${o.style === "residential" ? "uGlass" : "uGlass * diffuseColor.rgb"} * mix(0.9, 1.08, fVar);
          g = mix(g, vec3(0.92, 0.9, 0.86), step(0.93, fVar) * 0.55);
          vec3 frame = ${o.style === "residential" ? "diffuseColor.rgb" : "vec3(0.83, 0.85, 0.87)"};
          diffuseColor.rgb = mix(frame, g, fWin);
          diffuseColor.rgb *= 1.0 - fSlab * 0.12;
          // occlusione ambientale "cotta": la base degli edifici riceve meno luce
          diffuseColor.rgb *= mix(0.58, 1.0, smoothstep(0.0, 6.0, vWPos.y));
        }`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, mix(0.03, 0.14, fHash(fCell * 1.31)), fWin);`,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, ${gm.toFixed(2)}, fWin);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          float lit = step(1.0 - uLit, fHash(fCell * 0.731 + 3.1)) * fWin;
          vec3 warm = mix(vec3(1.0, 0.68, 0.38), vec3(0.82, 0.9, 1.0), step(0.82, fHash(fCell.yx + 7.0)));
          totalEmissiveRadiance += warm * lit * uNight * (0.9 + 1.1 * fHash(fCell * 1.7));
        }`,
      );
  };
  clampMaterial(m);
  m.customProgramCacheKey = () => `facade-${o.style}`;
  return m;
}
