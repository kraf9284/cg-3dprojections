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
        // Translate the PRP left along the x-axis
        let t1 = new Matrix(4, 4);
        CG.mat4x4Translate(t1, prp.x-1, prp.y, prp.z);
    
        // Translate the SRP left along the x-axis
        let t2 = new Matrix(4, 4);
        CG.mat4x4Translate(t2, srp.x-1, srp.y, srp.z);
    }    
    
    moveRight() {
        // Translate the PRP right along the x-axis
        let t1 = new Matrix(4, 4);
        CG.mat4x4Translate(t1, prp.x+1, prp.y, prp.z);
    
        // Translate the SRP right along the x-axis
        let t2 = new Matrix(4, 4);
        CG.mat4x4Translate(t2, srp.x+1, srp.y, srp.z);
    }
    
    moveBackward() {
        
    }
    
    moveForward() {
        
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
            for (let i = 0; i < model.vertices.length; i++) {
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
        //both are in the window
        if((out0 == 0) && (out1 == 0)){return line}
        //both are out the window
        else if(out0 == out1){return result}
        // at least some part of the line is in the window
        else{
            //both points are outside of window but part of the line is within the window
            if(out0 != 0 && out1 != 0){
                
            }
           // else one of them is outside the window
            else {
                let outLook = null;
                 //out0 is outside of window and out1 is inside window
                if(out0 != 0){
                    outLook = out0;
                }
                //out1 is outside of window and out0 is inside window
                else{
                    outLook = out1;
                }
                // if outlook is on top T = (y0+z0)/(-deltaY - deltaZ)
                if(outLook == TOP){
                   
                }
                // if outlook is on bottom T=(-y0+z0)/(deltaY - deltaz)
                else if(outLook == BOTTOM){

                }
                // outlook is right T = (x0+z0)/(-deltaX - deltaz)
                else if(outLook == RIGHT){

                }
                // outlook is left T = (-x0+z0)/(deltaX - deltaZ)
                else if(outLook == LEFT){

                }
                //outlook is near T =(z0-zMin)/(-deltaZ)
                else if(outLook == NEAR){

                }
                // outlook is far T = (-z0-1)/(deltaZ)
                else{

                }
            }    
        return result;
        }
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

                let centerX = cube.center[0];
                let centerY = cube.center[1];
                let centerZ = cube.center[2];

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
                
            } else if (model.type === 'cylinder') {
                let cyl = scene.models[i];

                let centerX = cyl.center[0];
                let centerY = cyl.center[1];
                let centerZ = cyl.center[2];

                let radius = cyl.radius;
                let height = cyl.height;
                let sides = cyl.sides;
            
                model.vertices = [];

                // Vertices for the bottom circle
                for (let j = 0; j < sides; j++) {
                    let angle = (j / sides) * Math.PI * 2;
                    let x = centerX + radius * Math.cos(angle);
                    let y = centerY - height / 2;
                    let z = centerZ + radius * Math.sin(angle);
                    model.vertices.push(CG.Vector4(x, y, z, 1));
                }
            
                // Vertices for the top circle
                for (let j = 0; j < sides; j++) {
                    let angle = (j / sides) * Math.PI * 2;
                    let x = centerX + radius * Math.cos(angle);
                    let y = centerY + height / 2;
                    let z = centerZ + radius * Math.sin(angle);
                    model.vertices.push(CG.Vector4(x, y, z, 1));
                }
            
                model.edges = [];

                // Connect bottom and top circles
                for (let j = 0; j < sides; j++) {
                    model.edges.push([j, (j + 1) % sides]);
                    model.edges.push([j + sides, ((j + 1) % sides) + sides]);
                    model.edges.push([j, j + sides]);
                }

                if (scene.models[i].hasOwnProperty('animation')) {
                    model.animation = JSON.parse(JSON.stringify(scene.models[i].animation));
                }
                
            } else if (model.type === 'sphere') {
                let sphere = scene.models[i];
                let centerX = sphere.center[0];
                let centerY = sphere.center[1];
                let centerZ = sphere.center[2];

                let radius = sphere.radius;
                let slices = sphere.slices;
                let stacks = sphere.stacks;
            
                model.vertices = [];  
                // Generate vertices
                for (let j = 0; j <= slices; j++) {
                    let sliceAngle = (j / slices) * Math.PI;
                    let sliceRadius = radius * Math.sin(sliceAngle);
                    let y = centerY + radius * Math.cos(sliceAngle);
            
                    for (let k = 0; k < stacks; k++) {
                        let stackAngle = (k / stacks) * 2 * Math.PI;
                        let x = centerX + sliceRadius * Math.cos(stackAngle);
                        let z = centerZ + sliceRadius * Math.sin(stackAngle);
                        model.vertices.push(CG.Vector4(x, y, z, 1));
                    }
                }
                
                model.edges = [];
                // Generate edges
                for (let j = 0; j < slices; j++) {
                    for (let j = 0; j < stacks; j++) {
                        let nextSliceInd = (j + 1) * stacks;
                        let nextStackInd = (j + 1) % stacks;
            
                        let currentVertInd = j * stacks + j;
                        let nextSliceVertInd = nextSliceInd + j;
                        let nextStackVertInd = j * stacks + nextStackInd;
            
                        model.edges.push([currentVertInd, nextSliceVertInd]);
                        model.edges.push([currentVertInd, nextStackVertInd]);
            
                        // If not the last slice, connect to the next slice
                        if (j !== slices - 1) {
                            let nextSliceStackInd = nextSliceInd + nextStackInd;
                            model.edges.push([currentVertInd, nextSliceStackInd]);
                        }
                    }
                }
            } else if (model.type === 'cone') {
                let cone = scene.models[i];
                let centerX = cone.center[0];
                let centerY = cone.center[1];
                let centerZ = cone.center[2];

                let radius = cone.radius;
                let height = cone.height;
                let sides = cone.sides;
            
                model.vertices = [];            
                // Vertex for the tip
                let tipVertex = CG.Vector4(centerX, centerY + height / 2, centerZ, 1);
                model.vertices.push(tipVertex);
            
                // Vertices for the base circle
                for (let j = 0; j < sides; j++) {
                    let angle = (j / sides) * Math.PI * 2;
                    let x = centerX + radius * Math.cos(angle);
                    let y = centerY - height / 2;
                    let z = centerZ + radius * Math.sin(angle);
                    model.vertices.push(CG.Vector4(x, y, z, 1));
                }
                
                model.edges = [];
                // Connect tip to base vertices
                for (let j = 1; j <= sides; j++) {
                    model.edges.push([0, j]);
                }
            
                // Connect base vertices to form the circular base
                for (let j = 1; j < sides; j++) {
                    model.edges.push([j, j + 1]);
                }
                model.edges.push([sides, 1]); // Connect last base vertex to the first

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
