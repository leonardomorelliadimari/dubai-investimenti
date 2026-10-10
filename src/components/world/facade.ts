import * as THREE from "three";

/** Uniform condivisi da tutte le facciate: la notte accende le finestre. */
export const facadeUniforms = {
  uNight: { value: 0 },
};

type Opts = { floorH: number; colW: number; glassTint: THREE.ColorRepresentation; glassAmt: number; litRatio?: number; vertical?: boolean };

/**
 * Applica a un MeshStandardMaterial un pattern di facciata in coordinate mondo:
 * marcapiani, montanti, vetri più riflettenti e finestre illuminate di notte.
 * Funziona anche con InstancedMesh.
 */
export function facadeMaterial(base: THREE.MeshStandardMaterialParameters, o: Opts) {
  const m = new THREE.MeshStandardMaterial(base);
  const tint = new THREE.Color(o.glassTint);
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = facadeUniforms.uNight;
    shader.uniforms.uFloorH = { value: o.floorH };
    shader.uniforms.uColW = { value: o.colW };
    shader.uniforms.uTint = { value: tint };
    shader.uniforms.uGlass = { value: o.glassAmt };
    shader.uniforms.uLit = { value: o.litRatio ?? 0.45 };
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
        uniform float uNight; uniform float uFloorH; uniform float uColW; uniform vec3 uTint; uniform float uGlass; uniform float uLit;
        float fHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float fWin; vec2 fCell;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          float side = 1.0 - step(0.55, abs(vWNor.y));
          float fy = fract(vWPos.y / uFloorH);
          float band = smoothstep(0.0, 0.1, fy) * (1.0 - smoothstep(0.82, 0.92, fy));
          float hc = abs(vWNor.x) > abs(vWNor.z) ? vWPos.z : vWPos.x;
          float fx = fract(hc / uColW);
          float mull = smoothstep(0.0, 0.08, fx) * (1.0 - smoothstep(0.92, 1.0, fx));
          fWin = band * mull * side;
          float aa = clamp(1.0 - max(fwidth(vWPos.y / uFloorH), fwidth(hc / uColW)) * 1.4, 0.0, 1.0);
          fWin = mix(0.5 * side, fWin, aa);
          fCell = vec2(floor(hc / uColW), floor(vWPos.y / uFloorH));
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * uTint, fWin * uGlass);
          diffuseColor.rgb *= mix(1.0, 0.9, (1.0 - band) * side * 0.6 * aa);
        }`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.06, fWin * uGlass);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          float r = fHash(fCell + floor(vWPos.xz / 40.0) * 7.31);
          float lit = step(1.0 - uLit, r) * fWin;
          vec3 warm = mix(vec3(1.0, 0.72, 0.42), vec3(0.85, 0.92, 1.0), step(0.85, fHash(fCell.yx)));
          totalEmissiveRadiance += warm * lit * uNight * (0.6 + 0.6 * fHash(fCell * 1.7));
        }`,
      );
  };
  m.customProgramCacheKey = () => `facade-${o.floorH}-${o.colW}-${o.glassAmt}`;
  return m;
}
