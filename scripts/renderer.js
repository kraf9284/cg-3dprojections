import * as CG from './transforms.js';
import { Matrix, Vector } from "./matrix.js";

const LEFT =   32; // binary 100000
const RIGHT =  16; // binary 010000
const BOTTOM = 8;  // binary 001000
const TOP =    4;  // binary 000100
const FAR =    2;  // binary 000010
const NEAR =   1;  // binary 000001
const FLOAT_EPSILON = 0.000001;

class Renderer {
    // canvas:              object ({id: __, width: __, height: __})
    // scene:               object (...see description on Canvas)
    constructor(canvas, scene) {
        this.canvas = document.getElementById(canvas.id);
        this.canvas.width = canvas.width;
        this.canvas.height = canvas.height;
        this.ctx = this.canvas.getContext('2d');
        this.scene = this.processScene(scene);
        this.enable_animation = false;  // <-- disabled for easier debugging; enable for animation
        this.start_time = null;
        this.prev_time = null;
    }

    updateTransforms(time, delta_time) {
        // TODO: update any transformations needed for animation
    }

    rotateLeft() {
    }
    
    rotateRight() {

    }
    
    moveLeft() {
        let toUpdate = new Matrix(4, 4);
        CG.mat4x4Identity(toUpdate);
        this.scene.view.prp = Matrix.multiply([this.scene.view.prp, CG.mat4x4Translate(toUpdate, this.scene.view.prp[0], this.scene.view.prp[1], this.scene.view.prp[2]-1)]);
        CG.mat4x4Identity(toUpdate);
        this.scene.view.srp = Matrix.multiply([this.scene.view.srp, CG.mat4x4Translate(toUpdate, this.scene.view.srp[0], this.scene.view.srp[1], this.scene.view.srp[2]-1)]);
    }
    
    moveRight() {
        let toUpdate = new Matrix(4, 4);
        CG.mat4x4Identity(toUpdate);
        this.scene.view.prp = Matrix.multiply([this.scene.view.prp, CG.mat4x4Translate(toUpdate, this.scene.view.prp[0], this.scene.view.prp[1], this.scene.view.prp[2]+1)]);
        CG.mat4x4Identity(toUpdate);
        this.scene.view.srp = Matrix.multiply([this.scene.view.srp, CG.mat4x4Translate(toUpdate, this.scene.view.srp[0], this.scene.view.srp[1], this.scene.view.srp[2]+1)]);
    }
    
    moveBackward() {
        let toUpdate = new Matrix(4, 4);
        CG.mat4x4Identity(toUpdate);
        this.scene.view.prp = Matrix.multiply([this.scene.view.prp, CG.mat4x4Translate(toUpdate, this.scene.view.prp[0]-1, this.scene.view.prp[1] + 1, this.scene.view.prp[2])]);
        CG.mat4x4Identity(toUpdate);
        this.scene.view.srp = Matrix.multiply([this.scene.view.srp, CG.mat4x4Translate(toUpdate, this.scene.view.srp[0]-1, this.scene.view.srp[1] + 1, this.scene.view.srp[2])]);
    }
    
    moveForward() {
        let toUpdate = new Matrix(4, 4);
        CG.mat4x4Identity(toUpdate);
        this.scene.view.prp = Matrix.multiply([this.scene.view.prp, CG.mat4x4Translate(toUpdate, this.scene.view.prp[0]+1, this.scene.view.prp[1] + 1, this.scene.view.prp[2])]);
        CG.mat4x4Identity(toUpdate);
        this.scene.view.srp = Matrix.multiply([this.scene.view.srp, CG.mat4x4Translate(toUpdate, this.scene.view.srp[0]+1, this.scene.view.srp[1] + 1, this.scene.view.srp[2])]);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        let perspMat = CG.mat4x4Perspective(this.scene.view.prp, this.scene.view.srp, this.scene.view.vup, this.scene.view.clip);
        let mPerMat = CG.mat4x4MPer();
        let vpMat = CG.mat4x4Viewport(this.canvas.width, this.canvas.height);

        // For each model
        for (let m = 0; m < this.scene.models.length; m++) {
            let model = this.scene.models[m];
            // Transform vertices to canonical view volume and then to viewport
            let new_verts = [];
            for (let i=0; i < model.vertices.length; i++) {
                // Transform endpoints to canonical view volume & project to 2D
                let vert = model.vertices[i];
                let perspVert = Matrix.multiply([perspMat, vert]);
                let newVert = Matrix.multiply([mPerMat, perspVert]);
                new_verts.push(newVert);
            };
    
            // For each line segment in each edge
            for (let i = 0; i < model.edges.length; i++) {
                let edge = model.edges[i];

                for (let j = 0; j < edge.length - 1; j++) {
                    let v1 = new_verts[edge[j]];
                    let v2 = new_verts[edge[j + 1]];
                    
                    // Translate/scale to viewport
                    let vpVert1 = Matrix.multiply([vpMat, v1]);
                    let vpVert2 = Matrix.multiply([vpMat, v2]);
                    this.drawLine(vpVert1.x / vpVert1.w, vpVert1.y / vpVert1.w, vpVert2.x / vpVert2.w, vpVert2.y / vpVert2.w);
                }
            }
        }

        // Clip in 2D
    }
    
    
    // Helper function to draw a line between two points
    drawLine(point1, point2) {
        this.ctx.beginPath();
        this.ctx.moveTo(point1[0], point1[1]);
        this.ctx.lineTo(point2[0], point2[1]);
        this.ctx.stroke();
    }
    

    // Get outcode for a vertex
    // vertex:       Vector4 (transformed vertex in homogeneous coordinates)
    // z_min:        float (near clipping plane in canonical view volume)
    outcodePerspective(vertex, z_min) {
        let outcode = 0;
        if (vertex.x < (vertex.z - FLOAT_EPSILON)) {
            outcode += LEFT;
        }
        else if (vertex.x > (-vertex.z + FLOAT_EPSILON)) {
            outcode += RIGHT;
        }
        if (vertex.y < (vertex.z - FLOAT_EPSILON)) {
            outcode += BOTTOM;
        }
        else if (vertex.y > (-vertex.z + FLOAT_EPSILON)) {
            outcode += TOP;
        }
        if (vertex.z < (-1.0 - FLOAT_EPSILON)) {
            outcode += FAR;
        }
        else if (vertex.z > (z_min + FLOAT_EPSILON)) {
            outcode += NEAR;
        }
        return outcode;
    }

    // Clip line - should either return a new line (with two endpoints inside view volume)
    //             or null (if line is completely outside view volume)
    // line:         object {pt0: Vector4, pt1: Vector4}
    // z_min:        float (near clipping plane in canonical view volume)
    clipLinePerspective(line, z_min) {
        let result = null;
        let p0 = CG.Vector3(line.pt0.x, line.pt0.y, line.pt0.z); 
        let p1 = CG.Vector3(line.pt1.x, line.pt1.y, line.pt1.z);
        let out0 = this.outcodePerspective(p0, z_min);
        let out1 = this.outcodePerspective(p1, z_min);
        
        // TODO: implement clipping here!
        
        return result;
    }

    //
    animate(timestamp) {
        // Get time and delta time for animation
        if (this.start_time === null) {
            this.start_time = timestamp;
            this.prev_time = timestamp;
        }
        let time = timestamp - this.start_time;
        let delta_time = timestamp - this.prev_time;

        // Update transforms for animation
        this.updateTransforms(time, delta_time);

        // Draw slide
        this.draw();

        // Invoke call for next frame in animation
        if (this.enable_animation) {
            window.requestAnimationFrame((ts) => {
                this.animate(ts);
            });
        }

        // Update previous time to current one for next calculation of delta time
        this.prev_time = timestamp;
    }

    //
    updateScene(scene) {
        this.scene = this.processScene(scene);
        if (!this.enable_animation) {
            this.draw();
        }
    }

    //
    processScene(scene) {
        let processed = {
            view: {
                prp: CG.Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]),
                srp: CG.Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]),
                vup: CG.Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]),
                clip: [...scene.view.clip]
            },
            models: []
        };

        for (let i = 0; i < scene.models.length; i++) {
            let model = { type: scene.models[i].type };
            if (model.type === 'generic') {
                model.vertices = [];
                model.edges = JSON.parse(JSON.stringify(scene.models[i].edges));
                for (let j = 0; j < scene.models[i].vertices.length; j++) {
                    model.vertices.push(CG.Vector4(scene.models[i].vertices[j][0],
                                                   scene.models[i].vertices[j][1],
                                                   scene.models[i].vertices[j][2],
                                                   1));
                    if (scene.models[i].hasOwnProperty('animation')) {
                        model.animation = JSON.parse(JSON.stringify(scene.models[i].animation));
                    }
                }
            } else if (model.type === 'cube') {
                let cube = scene.models[i];

                let halfWidth = cube.width / 2;
                let halfHeight = cube.height / 2;
                let halfDepth = cube.depth / 2;

                let centerX = model.center[0];
                let centerY = model.center[1];
                let centerZ = model.center[2];

                model.vertices = [];
                for (let s = 1; s >= -1; s -= 2) {
                    model.vertices.push(CG.Vector4(
                                        centerX - halfWidth,
                                        centerY + halfHeight,
                                        centerZ + s * halfDepth,
                                        1));
                    model.vertices.push(CG.Vector4(
                                        centerX + halfWidth,
                                        centerY + halfHeight,
                                        centerZ + s * halfDepth,
                                        1));
                    model.vertices.push(CG.Vector4(
                                        centerX + halfWidth,
                                        centerY - halfHeight,
                                        centerZ + s * halfDepth,
                                        1));
                    model.vertices.push(CG.Vector4(
                                        centerX - halfWidth,
                                        centerY - halfHeight,
                                        centerZ + s * halfDepth,
                                        1));
                }
                model.edges = [];
                model.edges.push([0, 1, 2, 3, 0]);
                model.edges.push([4, 5, 6, 7, 4]);
                
                model.edges.push([0, 4]);
                model.edges.push([1, 5]);
                model.edges.push([2, 6]);
                model.edges.push([3, 7]);

                if (scene.models[i].hasOwnProperty('animation')) {
                    model.animation = JSON.parse(JSON.stringify(scene.models[i].animation));
                }
                
            } else {
                model.center = CG.Vector4(scene.models[i].center[0],
                                       scene.models[i].center[1],
                                       scene.models[i].center[2],
                                       1);
                for (let key in scene.models[i]) {
                    if (scene.models[i].hasOwnProperty(key) && key !== 'type' && key != 'center') {
                        model[key] = JSON.parse(JSON.stringify(scene.models[i][key]));
                    }
                }
            }
            model.matrix = new Matrix(4, 4);
            processed.models.push(model);
        }

        return processed;
    }
    
    // x0:           float (x coordinate of p0)
    // y0:           float (y coordinate of p0)
    // x1:           float (x coordinate of p1)
    // y1:           float (y coordinate of p1)
    drawLine(x0, y0, x1, y1) {
        this.ctx.strokeStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();

        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(x0 - 2, y0 - 2, 4, 4);
        this.ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
    }
};

export { Renderer };
