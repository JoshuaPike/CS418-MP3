/**
 * @file A rendering of the Utah teapot in WebGL
 * @author Josh Pike <joshuap5@illinois.edu>
 *
 * @Doomguy Doomguy <https://www.youtube.com/watch?v=p2qgIlpcZ1w>
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program for the skybox*/
var skyboxShaderProgram;

/** @global A simple GLSL shader program for the teapot*/
var teapotShaderProgram;

/** @global The Skybox's Modelview matrix */
var mvMatrixSky = mat4.create();

/** @global The Teapots's Modelview matrix */
var mvMatrixTea = mat4.create();

/** @global The View matrix */
var vMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The Skybox's Normal matrix */
var nMatrixSky = mat3.create();

/** @global The Teapot's Normal matrix */
var nMatrixTea = mat3.create();

/** @global The matrix stack for hierarchical modeling */
var mvMatrixStack = [];

/** @global An object holding the geometry for a skybox */
var superSwaggySkybox;

/** @global An object holding the geometry for a 3D teapot mesh */
var teapotMesh;


// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(0.0,0.0,2.5);
/** @global Direction of the view in world coordinates */
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Shouldnt be using these for cube
//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [1,1,1];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0.1,0.1,0.1];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [0.5,0.5,0.5];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[1.,1.,1.];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [0.3,0.3,0.3];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [100.0/255.0,50.0/255.0,63.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [1.0,1.0,1.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 23;


//Model parameters
/** @global Variable representing zoom of camera*/
var eulerY = 0;
/** @global Orbit angle*/
var theta = 0;
/** @global Orbit radius */
var radius = Math.sqrt(Math.pow(eyePt[0], 2) + Math.pow(eyePt[1], 2) + Math.pow(eyePt[2], 2));

//Skybox parameters
/** @global Cubemap of the skybox*/
var skyboxTexture;
/** @global Location of the skybox*/
var skyboxTextureLocation;




//-------------------------------------------------------------------------
/**
 * Asynchronously read a server-side text file
 */
function asyncGetFile(url) {
    console.log("Getting text file");
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onload = () => resolve(xhr.responseText);
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
        console.log("Made promise");
    });
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    for (var i=0; i < names.length; i++) {
        try {
            context = canvas.getContext(names[i]);
        } catch(e) {}
        if (context) {
            break;
        }
    }
    if (context) {
        context.viewportWidth = canvas.width;
        context.viewportHeight = canvas.height;
    } else {
        alert("Failed to create WebGL context!");
    }
    return context;
}

//----------------------------------------------------------------------------------
/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 * @param{string} filename name of the file to be read
 */
function setupMesh(filename) {
    //Your code here
    myMesh = new TriMesh();
    myPromise = asyncGetFile(filename);
    // We define what to do when the promise is resolved with the then() call,
    // and whjat to do when the promise is rejected with the catch() call
    myPromise.then((retrievedText) => {
        myMesh.loadFromOBJ(retrievedText);
        console.log("Yay! got the file");
    })
        .catch(
        // Log the rejection reason
        (reason) => {
            console.log('Handle rejected promise ('+reason+') here.');
        });
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
    //console.log("function draw()")

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), 
                     gl.viewportWidth / gl.viewportHeight,
                     0.1, 500.0);
    
    // Axis Aligned Bounding Box Stuff
    var minXYZ = [0, 0, 0];
    var maxXYZ = [0, 0, 0];
    //console.log("Getting AABB");
    teapotMesh.getAABB(minXYZ, maxXYZ);
    
    var teaXCenter = ((maxXYZ[0] + minXYZ[0])/2);
    var teaYCenter = (maxXYZ[1] + minXYZ[1])/2;
    var teaZCenter = ((maxXYZ[2] + minXYZ[2])/2);


    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    
    
    // Then generate the lookat matrix and initialize the view matrix to that view
    mat4.lookAt(vMatrix,eyePt,viewPt,up);

    console.log("vX: " + viewPt[0]);
    console.log("vY: " + viewPt[1]);
    console.log("vZ: " + viewPt[2]);

    
    console.log("X: " + teaXCenter);
    console.log("Y: " + teaYCenter);
    console.log("Z: " + teaZCenter);
    var teaTrans = vec3.fromValues(-teaXCenter, -teaYCenter, teaZCenter);
    
    

    //Draw Mesh
    //ADD an if statement to prevent early drawing of myMesh
    superSwaggySkybox.mvPushMatrix();
    teapotMesh.mvPushMatrix();
    
    // Translate teapot to origin
    mat4.translate(mvMatrixTea, mvMatrixTea, teaTrans);
    
    
    // Changing A/D to rotate teapot
    mat4.rotateY(mvMatrixTea, mvMatrixTea, degToRad(eulerY));
    
    
    var centerToEye = vec3.create();
    vec3.sub(centerToEye, eyePt, teaTrans);
    
    // Orbit Teapot stuff
    
    //mat4.translate(vMatrix, vMatrix, transOrbit);
    mat4.rotateY(vMatrix, vMatrix, degToRad(theta));
    
    
    mat4.multiply(mvMatrixTea,vMatrix,mvMatrixTea);
    mat4.multiply(mvMatrixSky,vMatrix,mvMatrixSky);
    
    
    gl.depthFunc(gl.LEQUAL);

    if (superSwaggySkybox.loaded() && teapotMesh.loaded()) {
        if ((document.getElementById("shaded").checked))
        {
            // Use light position = [1, 1, 1] to check if relfective
            lightPosition = [1.0, 1.0, 1.0];
            
            gl.useProgram(skyboxShaderProgram);
            superSwaggySkybox.setMatrixUniforms();
            superSwaggySkybox.drawSkybox();
            
            
            gl.useProgram(teapotShaderProgram);
            teapotMesh.setMaterialUniforms(shininess,kAmbient,
                                kTerrainDiffuse,kSpecular); 
            teapotMesh.setMatrixUniforms();
            teapotMesh.setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);
            teapotMesh.drawTeapot();
        }
        if(document.getElementById("reflective").checked)
        {   
            // Use light position = [0, 0, 0] to check if relfective
            // This is a really jank way of doing it but ¯\_(ツ)_/¯
            lightPosition = [0.0, 0.0, 0.0];
            
            gl.useProgram(skyboxShaderProgram);
            superSwaggySkybox.setMatrixUniforms();
            superSwaggySkybox.drawSkybox();
            
            
            gl.useProgram(teapotShaderProgram);
            teapotMesh.setMaterialUniforms(shininess,kAmbient,
                                kTerrainDiffuse,kSpecular); 
            teapotMesh.setMatrixUniforms();
            teapotMesh.setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);
            teapotMesh.drawTeapot();
        }   

        if(document.getElementById("refractive").checked)
        {
            // Use light position = [0.55, 0.55, 0.55] to check if relfective
            lightPosition = [0.55, 0.55, 0.55];
            
            gl.useProgram(skyboxShaderProgram);
            superSwaggySkybox.setMatrixUniforms();
            superSwaggySkybox.drawSkybox();
            
            
            gl.useProgram(teapotShaderProgram);
            teapotMesh.setMaterialUniforms(shininess,kAmbient,
                                kTerrainDiffuse,kSpecular); 
            teapotMesh.setMatrixUniforms();
            teapotMesh.setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);
            teapotMesh.drawTeapot();
        }   
        
        teapotMesh.mvPopMatrix();
        superSwaggySkybox.mvPopMatrix();
    }


}

//----------------------------------------------------------------------------------
//Code to handle user interaction
var currentlyPressedKeys = {};

/**
 * Handles when a key is released in the browser
 * @param {Object} Carries information about certain events that are happening in the browser
 */
function handleKeyDown(event) {
    //console.log("Key down ", event.key, " code ", event.code);
    currentlyPressedKeys[event.key] = true;
    if (currentlyPressedKeys["a"]) {
        // key A
        eulerY-= 1;
    } else if (currentlyPressedKeys["d"]) {
        // key D
        eulerY+= 1;
    } 

    if (currentlyPressedKeys["ArrowUp"]){
        // Up cursor key
        event.preventDefault();
        eyePt[2]+= 0.01;
    } else if (currentlyPressedKeys["ArrowDown"]){
        event.preventDefault();
        // Down cursor key
        eyePt[2]-= 0.01;
    } 
    
    if (currentlyPressedKeys["ArrowLeft"]){
        // Left cursor key
        event.preventDefault();
        theta += 1;
        
    } else if (currentlyPressedKeys["ArrowRight"]){
        event.preventDefault();
        // Right cursor key
        theta += -1;
    } 

}

function handleKeyUp(event) {
    //console.log("Key up ", event.key, " code ", event.code);
    currentlyPressedKeys[event.key] = false;
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
function startup() {
    canvas = document.getElementById("myGLCanvas");
    gl = createGLContext(canvas);

    // Setup skybox stuff
    superSwaggySkybox = new Skybox();
    superSwaggySkybox.populateBuffers();
    superSwaggySkybox.setupShaders();
    
    // Setup teapot stuff
    teapotMesh = new Teapot();
    teapotMesh.setupMesh("https://raw.githubusercontent.com/illinois-cs418/cs418CourseMaterial/master/Meshes/teapot_0.obj");
    teapotMesh.setupShaders();
    

    // make function to setup all shaders
    //setupShaders();

    //setupMesh("cow.obj");
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    tick();
}


//----------------------------------------------------------------------------------
/**
  * Update any model transformations
  */
function animate() {
    //console.log(eulerX, " ", eulerY, " ", eulerZ); 
    document.getElementById("eY").value=eulerY;
    document.getElementById("eZ").value=eyePt[2];
    document.getElementById("theta").value=theta;
}


//----------------------------------------------------------------------------------
/**
 * Keeping drawing frames....
 */
function tick() {
    requestAnimFrame(tick);
    animate();
    draw();
}