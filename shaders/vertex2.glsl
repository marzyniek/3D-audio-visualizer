export default /* glsl */ `
    uniform vec3 u_base;
    uniform float u_avg_freq;
    uniform float u_max_avg_freq;
    uniform float[512] u_data_array;
    varying vec4 vColor;
    uniform float u_power;
    uniform float u_amp_power;
    uniform float u_min_amp;
    uniform float u_max_amp;
    
    float map(float value, float min1, float max1, float min2, float max2) {
        return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
    }
    void main() {
        
        vec3 newPos = position;
        for (int z = 0; z < 8; z++) {
            for (int y = 0; y < 8; y++) {
                for (int x = 0; x < 8; x++) {
                    float amp = map(u_data_array[z*64 + y*8 + x], 0.0, 255.0, u_min_amp, u_max_amp);
                    amp = pow(amp, u_amp_power) - 1.0;
                    float force = map(u_avg_freq, u_max_avg_freq / 2.0, u_max_avg_freq, 1.0, 1.5);
                     //Mapping force field to each octant
                    newPos += (position - vec3(x, y, z) * force) * amp * min(pow(1.0 / distance(vec3(x, y, z) * force, position), 150.0), u_power);
                    newPos += (position - vec3(-x, y, z) * force) * amp * min(pow(1.0 / distance(vec3(-x, y, z) * force, position), 150.0), u_power);
                    newPos += (position - vec3(x, -y, z) * force) * amp * min(pow(1.0 / distance(vec3(x, -y, z) * force, position), 150.0), u_power);
                    newPos += (position - vec3(x, y, -z) * force) * amp * min(pow(1.0 / distance(vec3(x, y, -z) * force, position), 150.0), u_power);
                    newPos += (position - vec3(-x, -y, z) * force) * amp * min(pow(1.0 / distance(vec3(-x, -y, z) * force, position), 150.0), u_power);
                    newPos += (position - vec3(x, -y, -z) * force) * amp * min(pow(1.0 / distance(vec3(x, -y, -z) * force, position), 150.0), u_power);
                    newPos += (position - vec3(-x, y, -z) * force) * amp * min(pow(1.0 / distance(vec3(-x, y, -z) * force, position), 150.0), u_power);
                    newPos += (position - vec3(-x, -y, -z) * force) * amp * min(pow(1.0 / distance(vec3(-x, -y, -z) * force, position), 150.0), u_power);
                   
                }
            }
        }
        float travel = map(distance(newPos, position), 0.0, 1.0, 0.0, 1.0);
        vColor = vec4(travel, 0.0, 1.0 - travel, 1.0);
        vColor = vec4(1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4( newPos, 1.0);
        gl_PointSize = 0.5;
    }
`