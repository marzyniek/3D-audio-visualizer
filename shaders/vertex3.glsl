export default /* glsl */ `
    uniform float u_time;
    uniform vec3 u_base;
    uniform float u_avg_freq;
    uniform float[128] u_data_array;
    uniform float u_bass;
    uniform float u_mids1;
    uniform float u_mids2;
    uniform float u_treble;
    varying vec4 vColor;
    uniform vec3 u_dirs[20]; 

    float map(float value, float min1, float max1, float min2, float max2) {
        return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
    }
    
    void main() {
        
        vec3 newPos = position;
        float start_dist = distance(position, u_base); 
        for (int i = 0; i < 20; i++){
            float amp = map(u_data_array[i], 0.0, 255.0, 0.0, 0.5);
            newPos += u_dirs[i] *  80.0 * amp * pow(1.0/distance(2.0 * u_dirs[i], position), 2.3);
        }

        vec3 dir = normalize(u_base - newPos);
        newPos -= dir * u_avg_freq * 0.02;

        vColor = vec4
        (
            1.0 - (distance(newPos, u_base) - start_dist) / 40.0, 
            (distance(newPos, u_base) - start_dist) / 10.0, 
            1.0 - (distance(newPos, u_base) - start_dist) / 5.0 , 
            1.0
        );
       
        gl_Position = projectionMatrix * modelViewMatrix * vec4( newPos, 1.0);
        gl_PointSize = 0.5;
    }
`