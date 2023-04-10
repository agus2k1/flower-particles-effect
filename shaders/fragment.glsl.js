const fragmentShader = /* glsl */ `
    varying vec2 vUv;

    uniform sampler2D uTexture;
    uniform sampler2D uTexture1;
    uniform float uProgress;

    void main() {
        vec4 texture1 = texture2D(uTexture1, vUv);
        vec4 texture = texture2D(uTexture, vUv);
        
        vec4 finalTexture = mix(texture, texture1, uProgress);

        gl_FragColor = finalTexture;

        if (gl_FragColor.r < 0.1 && gl_FragColor.g < 0.1 && gl_FragColor.b < 0.1 ) discard;
    }
`;

export default fragmentShader;
