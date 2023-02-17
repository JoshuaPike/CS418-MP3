/**
 * @fileoverview Skybox - A class which implements the Utah Teapot in WebGL
 * @author Josh Pike <joshuap5@illinois.edu>
 * @nostalgia Tron 2.0 <https://www.youtube.com/watch?v=9vbgVehHSdY>
 */

/** Class implementing Utah Teapot. */
class Teapot {
    /**
    * Initialize members of a Skybox object
    */
    constructor() {
        this.isLoaded = false;
        this.minXYZ=[0,0,0];
        this.maxXYZ=[0,0,0];

        this.numFaces=0;
        this.numVertices=0;

        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];

        console.log("Teapot: Allocated buffers");


        // Get extension for 4 byte integer indices for drawElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
        else{
            console.log("OES_element_index_uint is supported!");
        }
    }

    //----------------------------------------------------------------------------------
    /**
    * Populate buffers with data
    */
    setupMesh(filename) {
        //Your code here
        var myPromise = asyncGetFile(filename);
        // We define what to do when the promise is resolved with the then() call,
        // and whjat to do when the promise is rejected with the catch() call
        myPromise.then((retrievedText) => {
            teapotMesh.loadFromOBJ(retrievedText);
            console.log("Yay! got the file");
        })
            .catch(
            // Log the rejection reason
            (reason) => {
                console.log('Handle rejected promise ('+reason+') here.');
            });
    }

    /**
    * Return if the JS arrays have been populated with data
    */
    loaded(){
        return this.isLoaded;
    }

    /**
    * Return an axis-aligned bounding box
    * @param {Object} an array object of length 3 to fill win min XYZ coords
    * @param {Object} an array object of length 3 to fill win max XYZ coords
    */
    getAABB(minXYZ,maxXYZ){
        //console.log("In getAABB");
        minXYZ[0] = this.minXYZ[0];
        minXYZ[1] = this.minXYZ[1];
        minXYZ[2] = this.minXYZ[2];

        maxXYZ[0] = this.maxXYZ[0];
        maxXYZ[1] = this.maxXYZ[1];
        maxXYZ[2] = this.maxXYZ[2];
    }

    /**
    * Populate the JS arrays by parsing a string containing an OBJ file
    * @param {string} text of an OBJ file
    */
    loadFromOBJ(fileText)
    {

        //Your code here
        var lines = fileText.split('\n');
        var firstV = true;

        for (var i = 0; i < lines.length; i++) {
            if (lines[i].charAt(0) == '#') {
                // Handle comment
                console.log(lines[i]);
            } else if (lines[i].charAt(0) == 'v') {
                // Handle vertices 
                var curLine = lines[i].split(/\b\s+(?!$)/);
                var x = parseFloat(curLine[1]);
                var y = parseFloat(curLine[2]);
                var z = parseFloat(curLine[3]);

                if (firstV) {
                    firstV = false;
                    this.minXYZ[0] = x;
                    this.minXYZ[1] = y;
                    this.minXYZ[2] = z;

                    this.maxXYZ[0] = x;
                    this.maxXYZ[1] = y;
                    this.maxXYZ[2] = z;
                }

                if (x < this.minXYZ[0]) { this.minXYZ[0] = x; }                    
                if (y < this.minXYZ[1]) { this.minXYZ[1] = y; }
                if (z < this.minXYZ[2]) { this.minXYZ[2] = z; }

                if (x > this.maxXYZ[0]) { this.maxXYZ[0] = x; }
                if (y > this.maxXYZ[1]) { this.maxXYZ[1] = y; }
                if (z > this.maxXYZ[2]) { this.maxXYZ[2] = z; }

                this.vBuffer.push(x);
                this.vBuffer.push(y);
                this.vBuffer.push(z);
                this.numVertices++;

            } else if (lines[i].charAt(0) == 'f') {
                // Handle faces
                var curLine = lines[i].split(/\b\s+(?!$)/);
                this.fBuffer.push(parseInt(curLine[1]) - 1);
                this.fBuffer.push(parseInt(curLine[2]) - 1);
                this.fBuffer.push(parseInt(curLine[3]) - 1);
                this.numFaces++;
            }
        }

        //----------------
        console.log("Teapot: Loaded ", this.numFaces, " triangles.");
        console.log("Teapot: Loaded ", this.numVertices, " vertices.");

        this.generateNormals();
        console.log("Teapot: Generated normals");

        this.loadBuffers();
        this.isLoaded = true;
    }

    /**
    * Send the buffer objects to WebGL for rendering 
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        //console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");

        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                      gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        //console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");

        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                      gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        //console.log("Loaded ", this.IndexTriBuffer.numItems/3, " triangles");
    }

    /**
    * Render the teapot
    */
    drawTeapot(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(teapotShaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                               gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(teapotShaderProgram.vertexNormalAttribute, 
                               this.VertexNormalBuffer.itemSize,
                               gl.FLOAT, false, 0, 0);   

        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }

    /**
    * Print vertices and triangles to console for debugging
    */
    printBuffers()
    {

        for(var i=0;i<this.numVertices;i++)
        {
            console.log("v ", this.vBuffer[i*3], " ", 
                        this.vBuffer[i*3 + 1], " ",
                        this.vBuffer[i*3 + 2], " ");

        }

        for(var i=0;i<this.numFaces;i++)
        {
            console.log("f ", this.fBuffer[i*3], " ", 
                        this.fBuffer[i*3 + 1], " ",
                        this.fBuffer[i*3 + 2], " ");

        }

    }

    /**
    * Set the x,y,z coords of a vertex at location id
    * @param {number} the index of the vertex to set 
    * @param {number} x coordinate
    * @param {number} y coordinate
    * @param {number} z coordinate
    */
    setVertex(id,x,y,z){
        var vid = 3*id;
        this.vBuffer[vid]=x;
        this.vBuffer[vid+1]=y;
        this.vBuffer[vid+2]=z;
    }

    /**
    * Return the x,y,z coords of a vertex at location id
    * @param {number} the index of the vertex to return
    * @param {Object} a length 3 array to populate withx,y,z coords
    */    
    getVertex(id, v){
        var vid = 3*id;
        v[0] = this.vBuffer[vid];
        v[1] = this.vBuffer[vid+1];
        v[2] = this.vBuffer[vid+2];
    }

    //----------------------------------------------------------------------------------
    /**
    * Setup the fragment and vertex shaders for steapot
    */
    setupShaders() {
        this.vertexShader = loadShaderFromDOM("teapot-shader-vs");
        this.fragmentShader = loadShaderFromDOM("teapot-shader-fs");

        teapotShaderProgram = gl.createProgram();
        gl.attachShader(teapotShaderProgram, this.vertexShader);
        gl.attachShader(teapotShaderProgram, this.fragmentShader);
        gl.linkProgram(teapotShaderProgram);

        if (!gl.getProgramParameter(teapotShaderProgram, gl.LINK_STATUS)) {
            alert("Failed to setup shaders");
        }

        gl.useProgram(teapotShaderProgram);

        teapotShaderProgram.vertexPositionAttribute = gl.getAttribLocation(teapotShaderProgram, "aVertexPositionTea");
        gl.enableVertexAttribArray(teapotShaderProgram.vertexPositionAttribute);

        teapotShaderProgram.vertexNormalAttribute = gl.getAttribLocation(teapotShaderProgram, "aVertexNormalTea");
        gl.enableVertexAttribArray(teapotShaderProgram.vertexNormalAttribute);

        teapotShaderProgram.mvMatrixUniform = gl.getUniformLocation(teapotShaderProgram, "uMVMatrixTea");
        teapotShaderProgram.pMatrixUniform = gl.getUniformLocation(teapotShaderProgram, "uPMatrix");
        teapotShaderProgram.nMatrixUniform = gl.getUniformLocation(teapotShaderProgram, "uNMatrixTea");
        teapotShaderProgram.uniformLightPositionLoc = gl.getUniformLocation(teapotShaderProgram, "uLightPosition");    
        teapotShaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(teapotShaderProgram, "uAmbientLightColor");  
        teapotShaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(teapotShaderProgram, "uDiffuseLightColor");
        teapotShaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(teapotShaderProgram, "uSpecularLightColor");
        teapotShaderProgram.uniformShininessLoc = gl.getUniformLocation(teapotShaderProgram, "uShininess");    
        teapotShaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(teapotShaderProgram, "uKAmbient");  
        teapotShaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(teapotShaderProgram, "uKDiffuse");
        teapotShaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(teapotShaderProgram, "uKSpecular");

        // teapot setup
        teapotShaderProgram.uniformSkyboxTextureLocation = gl.getUniformLocation(teapotShaderProgram, "uSkyboxTexture");
        teapotShaderProgram.uniformCameraLocation = gl.getUniformLocation(teapotShaderProgram, "u_worldCameraPosition");

    }



    //-------------------------------------------------------------------------
    /**
    * Sends Teapot Modelview matrix to skybox shader
    */
    uploadModelViewMatrixToShader() {
        gl.uniformMatrix4fv(teapotShaderProgram.mvMatrixUniform, false, mvMatrixTea);
    }

    //-------------------------------------------------------------------------
    /**
    * Sends Teapot projection matrix to skybox shader
    */
    uploadProjectionMatrixToShader() {
        gl.uniformMatrix4fv(teapotShaderProgram.pMatrixUniform, 
                            false, pMatrix);
    }

    //-------------------------------------------------------------------------
    /**
    * Generates and sends the skybox normal matrix to the skybox shader
    */
    uploadNormalMatrixToShader() {
        mat3.fromMat4(nMatrixTea, mvMatrixTea);
        mat3.transpose(nMatrixTea, nMatrixTea);
        mat3.invert(nMatrixTea, nMatrixTea);
        gl.uniformMatrix3fv(teapotShaderProgram.nMatrixUniform, false, nMatrixTea);
    }

    //----------------------------------------------------------------------------------
    /**
    * Pushes matrix onto modelview matrix stack
    */
    mvPushMatrix() {
        var copy = mat4.clone(mvMatrixTea);
        mvMatrixStack.push(copy);
    }


    //----------------------------------------------------------------------------------
    /**
    * Pops matrix off of modelview matrix stack
    */
    mvPopMatrix() {
        if (mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
        mvMatrixTea = mvMatrixStack.pop();
    }

    //----------------------------------------------------------------------------------
    /**
    * Sends projection/modelview matrices to shader
    */
    setMatrixUniforms() {
        this.uploadModelViewMatrixToShader();
        this.uploadNormalMatrixToShader();
        this.uploadProjectionMatrixToShader();
        this.setSkyboxUniforms();
        gl.uniform3fv(teapotShaderProgram.uniformCameraLocation, eyePt);
    }
    
    /**
    * Sends skybox information to the skybox shader
    * @param {mat4} viewDirProjMat projection matrix multiplied by view matrix
    */
    setSkyboxUniforms() {
        gl.uniform1i(teapotShaderProgram.uniformSkyboxTextureLocation, 0);
    }

    //-------------------------------------------------------------------------
    /**
    * Sends material information to the shader
    * @param {Float32} alpha shininess coefficient
    * @param {Float32Array} a Ambient material color
    * @param {Float32Array} d Diffuse material color
    * @param {Float32Array} s Specular material color
    */
    setMaterialUniforms(alpha,a,d,s) {
        gl.uniform1f(teapotShaderProgram.uniformShininessLoc, alpha);
        gl.uniform3fv(teapotShaderProgram.uniformAmbientMaterialColorLoc, a);
        gl.uniform3fv(teapotShaderProgram.uniformDiffuseMaterialColorLoc, d);
        gl.uniform3fv(teapotShaderProgram.uniformSpecularMaterialColorLoc, s);
    }

    //-------------------------------------------------------------------------
    /**
    * Sends light information to the shader
    * @param {Float32Array} loc Location of light source
    * @param {Float32Array} a Ambient light strength
    * @param {Float32Array} d Diffuse light strength
    * @param {Float32Array} s Specular light strength
    */
    setLightUniforms(loc,a,d,s) {
        gl.uniform3fv(teapotShaderProgram.uniformLightPositionLoc, loc);
        gl.uniform3fv(teapotShaderProgram.uniformAmbientLightColorLoc, a);
        gl.uniform3fv(teapotShaderProgram.uniformDiffuseLightColorLoc, d);
        gl.uniform3fv(teapotShaderProgram.uniformSpecularLightColorLoc, s);
    }

    /**
    * Compute per-vertex normals for a mesh
    */   
    generateNormals(){
        //per vertex normals
        this.numNormals = this.numVertices;
        this.nBuffer = new Array(this.numNormals*3);

        for(var i=0;i<this.nBuffer.length;i++)
        {
            this.nBuffer[i]=0;
        }

        for(var i=0;i<this.numFaces;i++)
        {
            // Get vertex coodinates
            var v1 = this.fBuffer[3*i]; 
            var v1Vec = vec3.fromValues(this.vBuffer[3*v1], this.vBuffer[3*v1+1],                                           this.vBuffer[3*v1+2]);
            var v2 = this.fBuffer[3*i+1]; 
            var v2Vec = vec3.fromValues(this.vBuffer[3*v2], this.vBuffer[3*v2+1],                                           this.vBuffer[3*v2+2]);
            var v3 = this.fBuffer[3*i+2]; 
            var v3Vec = vec3.fromValues(this.vBuffer[3*v3], this.vBuffer[3*v3+1],                                           this.vBuffer[3*v3+2]);

            // Create edge vectors
            var e1=vec3.create();
            vec3.subtract(e1,v2Vec,v1Vec);
            var e2=vec3.create();
            vec3.subtract(e2,v3Vec,v1Vec);

            // Compute  normal
            var n = vec3.fromValues(0,0,0);
            vec3.cross(n,e1,e2);

            // Accumulate
            for(var j=0;j<3;j++){
                this.nBuffer[3*v1+j]+=n[j];
                this.nBuffer[3*v2+j]+=n[j];
                this.nBuffer[3*v3+j]+=n[j];
            }         

        }
        for(var i=0;i<this.numNormals;i++)
        {
            var n = vec3.fromValues(this.nBuffer[3*i],
                                    this.nBuffer[3*i+1],
                                    this.nBuffer[3*i+2]);
            vec3.normalize(n,n);
            this.nBuffer[3*i] = n[0];
            this.nBuffer[3*i+1]=n[1];
            this.nBuffer[3*i+2]=n[2];  
        }
    }
}