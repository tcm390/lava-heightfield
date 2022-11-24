import * as THREE from 'three';

const _createWaterMaterial = () => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: {
        value: 0
      },
      eye: {
        value: new THREE.Vector3()
      },
      flowmapTexture: {
        value: null
      },
      noiseTexture: {
        value: null
      },
      mainTexture: {
        value: null
      },
      lavaEmissiveTexture: {
        value: null
      },
      lavaNormalTexture: {
        value: null
      },
      lavaHeightTexture: {
        value: null
      },
    },
    vertexShader: `\
        
      ${THREE.ShaderChunk.common}
      ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
      uniform float uTime;
      uniform sampler2D flowmapTexture;
      uniform sampler2D noiseTexture;
      uniform sampler2D lavaHeightTexture;
      

      varying vec3 vPos;
      varying vec3 vWorldPosition;
      varying vec3 uvwA;
      varying vec3 uvwB;

      vec3 FlowUVW (vec2 uv, vec2 flowVector, vec2 jump, float flowOffset, float tiling, float time, bool flowB) {
        float phaseOffset = flowB ? 0.5 : 0.;
        float progress = fract(time + phaseOffset);
        vec3 uvw;
        uvw.xy = uv - flowVector * (progress + flowOffset);
        uvw.xy *= tiling;
        uvw.xy += phaseOffset;
        uvw.xy += (time - progress) * jump;
        uvw.z = 1. - abs(1. - 2. * progress);
        return uvw;
      }

      void main() {
        vec3 pos = position;
        vPos = position;

        vec2 jump = vec2(0.24, 0.2);
        float tiling = 1.;
        float speed = 0.05;
        float flowStrength = 0.1;
        float flowOffset = 0.;

        vec2 posUv = (modelMatrix * vec4(pos, 1.0)).xz * 0.006;
        vec2 flowVector = texture2D(flowmapTexture, posUv).rg * 2. - 1.;
        flowVector *= flowStrength;
        float flowmap = texture2D(flowmapTexture, posUv * 0.1).a;
        float time = uTime * speed + flowmap;

        
        uvwA = FlowUVW(posUv, flowVector, jump, flowOffset, tiling, time, false);
        uvwB = FlowUVW(posUv, flowVector, jump, flowOffset, tiling, time, true);

        vec3 heightA = texture2D(lavaHeightTexture, uvwA.xy).xyz * uvwA.z;
        vec3 heightB = texture2D(lavaHeightTexture, uvwB.xy).xyz * uvwB.z;
        pos.y += (heightA + heightB).x;

        vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectionPosition = projectionMatrix * viewPosition;
        vWorldPosition = modelPosition.xyz;
        gl_Position = projectionPosition;

        
        ${THREE.ShaderChunk.logdepthbuf_vertex}
      }
    `,
    fragmentShader: `\
        ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
        
        varying vec3 vWorldPosition;
        varying vec3 uvwA;
        varying vec3 uvwB;
        varying vec3 vPos;

        uniform float uTime;
        uniform vec3 eye;
        uniform sampler2D mainTexture;
        uniform sampler2D lavaEmissiveTexture;
        uniform sampler2D lavaNormalTexture;

        void main() {
          vec4 texA = texture2D(mainTexture, uvwA.xy + uTime * 0.01) * uvwA.z;
          vec4 texB = texture2D(mainTexture, uvwB.xy + uTime * 0.01) * uvwB.z;

          gl_FragColor = texA + texB;
          

          vec4 emissiveA = texture2D(lavaEmissiveTexture, uvwA.xy + uTime * 0.01) * uvwA.z;
          vec4 emissiveB = texture2D(lavaEmissiveTexture, uvwB.xy + uTime * 0.01) * uvwB.z;
          vec4 emissiveColor = emissiveA + emissiveB;
          gl_FragColor += emissiveColor;
          gl_FragColor.rgb *= 1.5;

          vec3 normalA = texture2D(lavaNormalTexture, uvwA.xy + uTime * 0.01).xyz * uvwA.z;
          vec3 normalB = texture2D(lavaNormalTexture, uvwB.xy + uTime * 0.01).xyz * uvwB.z;
          vec3 surfaceNormal = normalize(normalA + normalB);
          vec3 viewIncidentDir = normalize(vec3(0.7579705245610807, 0.6382203660633491, 0.1347421546456965));
          vec3 viewReflectDir = reflect(viewIncidentDir, surfaceNormal);
          float theta = max(dot(viewIncidentDir, viewReflectDir), 0.0);
          float rf0 = 0.3;
          float reflectance = rf0 + (1.0 - rf0) * pow((1.0 - theta ), 5.0);
          gl_FragColor = mix(vec4(1.0), gl_FragColor, reflectance * 1.5);

          
          ${THREE.ShaderChunk.logdepthbuf_fragment}
        }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    // depthWrite: false,
    // blending: THREE.AdditiveBlending,
  });
  return material;
};

export default _createWaterMaterial;