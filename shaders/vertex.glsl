export default /* glsl */ `
    uniform float u_time;
    uniform vec3 u_base;
    uniform float u_avg_freq;
    uniform float[32] u_data_array;
    uniform float u_bass;
    uniform float u_mids1;
    uniform float u_mids2;
    uniform float u_treble;
    varying vec4 vColor;
    uniform vec3[32] u_verts; 
    uniform int u_vert_count;
    uniform vec3 u_color_a;
    uniform vec3 u_color_b;


    float map(float value, float min1, float max1, float min2, float max2) {
        return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
    }
    void main() {
        
        vec3 newPos = position;
        float start_dist = distance(position, u_base); 
        for (int i = 0; i < u_vert_count; i++){
            float amp = map(u_data_array[i], 0.0, 255.0, 0.0, 0.5);
            newPos -= u_verts[i] *  80.0 * amp * pow(1.0/distance(2.0 * u_verts[i], position), 2.3);
        }

        vec3 dir = normalize(u_base - newPos);
        newPos -= dir * u_avg_freq * 0.02;

        float final_dist = distance(position, u_base);
        vColor = vec4
        (
           map(final_dist, 0.7, 0.8, u_color_a.r, u_color_b.r),
           map(final_dist, 0.7, 0.8, u_color_a.g, u_color_b.g),
           map(final_dist, 0.7, 0.8, u_color_a.b, u_color_b.b),
           1.0 
        );
       
        gl_Position = projectionMatrix * modelViewMatrix * vec4( newPos, 1.0);
        gl_PointSize = 1.0;
    }
`