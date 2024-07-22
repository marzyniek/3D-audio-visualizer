export default /* glsl */ `
    varying vec4 vColor;
    
    void main() {
        vec3 color = vec3(1.0);

        gl_FragColor = vColor;
    }
`