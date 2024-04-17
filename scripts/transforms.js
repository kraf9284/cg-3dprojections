import { Matrix, Vector } from "./matrix.js";

// create a 4x4 matrix to the perspective projection / view matrix
function mat4x4Perspective(prp, srp, vup, clip) {    
    // 1. Translate PRP to origin
    const translationMatrix = [
        [1, 0, 0, -prp[0]],
        [0, 1, 0, -prp[1]],
        [0, 0, 1, -prp[2]],
        [0, 0, 0, 1]
    ];

    // 2. Rotate VRC such that (u,v,n) align with (x,y,z)
    const zAxis = prp.subtract(srp).normalize();    // Compute the view plane normal (n)
    const xAxis = vup.cross(zAxis).normalize();     // Compute the view plane x-axis (u)
    const yAxis = zAxis.cross(xAxis);              // Compute the view plane y-axis (v)
    const rotationMatrix = [
        [xAxis[0], xAxis[1], xAxis[2], 0],
        [yAxis[0], yAxis[1], yAxis[2], 0],
        [zAxis[0], zAxis[1], zAxis[2], 0],
        [0, 0, 0, 1]
    ];

    // 3. Shear such that CW is on the z-axis (Clip Window)
    const shearMatrix = [
        [1, 0, clip[0] / clip[2], 0],
        [0, 1, clip[1] / clip[2], 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];

    // 4. Scale such that view volume bounds are ([z,-z], [z,-z], [-1,zmin])
    const scaleMatrix = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, -1 / (clip[2] - clip[3]), -clip[3] / (clip[2] - clip[3])],
        [0, 0, 0, 1]
    ];

    // Combine all transformations
    const transform = Matrix.multiply(scaleMatrix, shearMatrix, rotationMatrix, translationMatrix);

    return transform;
}

// create a 4x4 matrix to project a perspective image on the z=-1 plane
function mat4x4MPer() {
    let mper = new Matrix(4, 4);
    mper.values = [[1, 0, 0, 0],
                     [0, 1, 0, 0],
                     [0, 0, 1, 0],
                     [0, 0, -1, 0]];
    return mper;
}

// create a 4x4 matrix to translate/scale projected vertices to the viewport (window)
function mat4x4Viewport(width, height) {
    // Create a new 4x4 identity matrix
    let viewport = mat4x4Identity();

    // Translate to the center of the viewport
    viewport[0][3] = width / 2;
    viewport[1][3] = height / 2;

    // Scale to fit the viewport
    viewport[0][0] = width / 2;
    viewport[1][1] = height / 2;

    return viewport;
}


///////////////////////////////////////////////////////////////////////////////////
// 4x4 Transform Matrices                                                         //
///////////////////////////////////////////////////////////////////////////////////

// set values of existing 4x4 matrix to the identity matrix
function mat4x4Identity(mat4x4) {
    mat4x4.values = [[1, 0, 0, 0],
                     [0, 1, 0, 0],
                     [0, 0, 1, 0],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the translate matrix
function mat4x4Translate(mat4x4, tx, ty, tz) {
    mat4x4.values = [[1, 0, 0, tx],
                     [0, 1, 0, ty],
                     [0, 0, 1, tz],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the scale matrix
function mat4x4Scale(mat4x4, sx, sy, sz) {
    mat4x4.values = [[sx, 0, 0, 0],
                     [0, sy, 0, 0],
                     [0, 0, sz, 0],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the rotate about x-axis matrix
function mat4x4RotateX(mat4x4, theta) {
    mat4x4.values = [[1, 0, 0, 0],
                     [0, Math.cos(theta), -Math.sin(theta), 0],
                     [0, Math.sin(theta), Math.cos(theta), 0],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the rotate about y-axis matrix
function mat4x4RotateY(mat4x4, theta) {
    mat4x4.values = [[Math.cos(theta), 0, Math.sin(theta), 0],
                     [0, 1, 0, 0],
                     [-Math.sin(theta), 0, Math.cos(theta), 0],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the rotate about z-axis matrix
function mat4x4RotateZ(mat4x4, theta) {
    mat4x4.values = [[Math.cos(theta), -Math.sin(theta), 0, 0],
                     [Math.sin(theta), Math.cos(theta), 0, 0],
                     [0, 0, 1, 0],
                     [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the shear parallel to the xy-plane matrix
function mat4x4ShearXY(mat4x4, shx, shy) {
    mat4x4.values = [[1, 0, shx, 0],
                     [0, 1, shy, 0],
                     [0, 0, 1, 0],
                     [0, 0, 0, 1]];
}

// create a new 3-component vector with values x,y,z
function Vector3(x, y, z) {
    let vec3 = new Vector(3);
    vec3.values = [x, y, z];
    return vec3;
}

// create a new 4-component vector with values x,y,z,w
function Vector4(x, y, z, w) {
    let vec4 = new Vector(4);
    vec4.values = [x, y, z, w];
    return vec4;
}

export {
    mat4x4Perspective,
    mat4x4MPer,
    mat4x4Viewport,
    mat4x4Identity,
    mat4x4Translate,
    mat4x4Scale,
    mat4x4RotateX,
    mat4x4RotateY,
    mat4x4RotateZ,
    mat4x4ShearXY,
    Vector3,
    Vector4
};
