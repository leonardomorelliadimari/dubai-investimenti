import * as THREE from "three";

/** Uniform condivisi da tutte le facciate: la notte accende le finestre. */
export const facadeUniforms = {
  uNight: { value: 0 },
};

/** Limita valori estremi in uscita (protezione da pixel "bruciati"). */
export function clampMaterial<T extends THREE.Material>(m: T): T {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (s, r) => {
    prev.call(m, s, r);
    s.fragmentShader = s.fragmentShader.replace("#include <dithering_fragment>", "#include <dithering_fragment>\n  gl_FragColor.rgb = clamp(gl_FragColor.rgb, 0.0, 14.0);");
  };
  return m;
}

export type FacadeStyle = "glass" | "residential" | "landmark";

type Opts = {
  style: FacadeStyle;
  floorH: number;
  colW: number;
  /** colore dei vetri (stile plastico: pannelli colorati, non riflettenti) */
  glass: THREE.ColorRepresentation;
  litRatio?: number;
};

const STYLE = {
  // [inizio fascia vetrata, fine fascia vetrata, spessore montante]
  glass: [0.1, 0.9, 0.07],
  residential: [0.32, 0.84, 0.18],
  landmark: [0.08, 0.92, 0.09],
} as const;

/**
 * Facciata stilizzata "da modello architettonico": finestre come pannelli di colore,
 * marcapiani e balconi chiari, base leggermente ombreggiata, luci calde di notte.
 * Calcolata in coordinate mondo, compatibile con InstancedMesh.
 */
export function facadeMaterial(base: THREE.MeshStandardMaterialParameters, o: Opts) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...base });
  const glass = new THREE.Color(o.glass);
  const [b0, b1, mw] = STYLE[o.style];
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uNight: facadeUniforms.uNight,
      uFloorH: { value: o.floorH },
      uColW: { value: o.colW },
      uGlass: { value: glass },
      uLit: { value: o.litRatio ?? 0.35 },
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
        float fWin; float fWinSharp; vec2 fCell;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          float side = 1.0 - step(0.55, abs(vWNor.y));
          float fy = fract(vWPos.y / uFloorH);
          float band = smoothstep(${b0.toFixed(3)}, ${(b0 + 0.03).toFixed(3)}, fy) * (1.0 - smoothstep(${(b1 - 0.03).toFixed(3)}, ${b1.toFixed(3)}, fy));
          float hc = abs(vWNor.x) > abs(vWNor.z) ? vWPos.z : vWPos.x;
          float fx = fract(hc / uColW);
          float mull = smoothstep(0.0, ${mw.toFixed(3)}, fx) * (1.0 - smoothstep(${(1 - mw).toFixed(3)}, 1.0, fx));
          float aa = clamp(1.0 - max(fwidth(vWPos.y / uFloorH), fwidth(hc / uColW)) * 1.3, 0.0, 1.0);
          fCell = vec2(floor(hc / uColW), floor(vWPos.y / uFloorH)) + floor(vWPos.xz / 60.0) * 13.7;
          fWin = mix(${((b1 - b0) * 0.75).toFixed(3)}, band * mull, aa) * side;
          fWinSharp = band * mull * side * aa;
          float slab = (1.0 - smoothstep(0.0, 0.06, fy)) * side * aa;
          vec3 base = diffuseColor.rgb;
          ${o.style === "residential" ? "vec3 g = uGlass;" : "vec3 g = mix(uGlass, base, 0.35);"}
          g *= mix(0.92, 1.08, fHash(fCell));
          diffuseColor.rgb = mix(base, g, fWin);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), slab * 0.55 * (1.0 - uNight * 0.8));
          diffuseColor.rgb *= 1.0 - uNight * 0.35;
          // base dell'edificio leggermente in ombra (occlusione "dipinta")
          diffuseColor.rgb *= mix(0.72, 1.0, smoothstep(0.0, 5.0, vWPos.y));
        }`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.45, fWin);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          float lit = step(1.0 - uLit * 0.7, fHash(fCell * 0.731 + 3.1)) * fWinSharp;
          vec3 warm = mix(vec3(1.0, 0.78, 0.36), vec3(1.0, 0.92, 0.7), fHash(fCell.yx + 7.0));
          totalEmissiveRadiance += warm * lit * uNight * 1.25;
        }`,
      );
  };
  clampMaterial(m);
  m.customProgramCacheKey = () => `facade-toy-${o.style}`;
  return m;
}
