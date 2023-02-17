/**
 * @fileoverview Skybox - A class which implements a skybox in WebGL
 * @author Josh Pike <joshuap5@illinois.edu>
 *
 * @someWeirdScientist Gordon Freeman <https://www.youtube.com/watch?v=tcwgX7gQPf0>
 */

/** Class implementing skybox. */
class Skybox {
    /**
    * Initialize members of a Skybox object
    */
    constructor(){
        this.isLoaded = false;


        this.numFaces=0;
        this.numVertices=0;

        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];

        console.log("Skybox: Allocated buffers");


        // Get extension for 4 byte integer indices for drawElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
        else{
            console.log("OES_element_index_uint is supported!");
        }
    }
    
    /**
    * Return if the JS arrays have been populated with data
    */
    loaded(){
        return this.isLoaded;
    }

    //-------------------------------------------------------------------------
    /**
    * Populates the skybox's buffers with the geometry for a cube.
    */
    populateBuffers() {
        var len = 300;
        //Your code here
        this.vBuffer =
            [
            -len, -len,  -len,
            -len,  len,  -len,
            len, -len,  -len,
            -len,  len,  -len,
            len,  len,  -len,
            len, -len,  -len,

            -len, -len,   len,
            len, -len,   len,
            -len,  len,   len,
            -len,  len,   len,
            len, -len,   len,
            len,  len,   len,

            -len,   len, -len,
            -len,   len,  len,
            len,   len, -len,
            -len,   len,  len,
            len,   len,  len,
            len,   len, -len,

            -len,  -len, -len,
            len,  -len, -len,
            -len,  -len,  len,
            -len,  -len,  len,
            len,  -len, -len,
            len,  -len,  len,

            -len,  -len, -len,
            -len,  -len,  len,
            -len,   len, -len,
            -len,  -len,  len,
            -len,   len,  len,
            -len,   len, -len,

            len,  -len, -len,
            len,   len, -len,
            len,  -len,  len,
            len,  -len,  len,
            len,   len, -len,
            len,   len,  len,

        ];
        this.numVertices = 36;

        this.fBuffer =
            [
            0,  1,  2,
            3,  4,  5,
            6,  7,  8,
            9,  10, 11,
            12, 13, 14,
            15, 16, 17,
            18, 19, 20,
            21, 22, 23,
            24, 25, 26,
            27, 28, 29,
            30, 31, 32,
            33, 34, 35,
        ];
        this.numFaces = 12;

        this.numNormals = this.numVertices;

        this.nBuffer = 
            [
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,

            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,

            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,

            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
        ];




        //----------------
        console.log("Skybox: Loaded ", this.numFaces, " triangles.");
        console.log("Skybox: Loaded ", this.numVertices, " vertices.");
        console.log("Skybox: Generated normals");
        
        superSwaggySkybox.loadBuffers();
        this.isLoaded = true;
        
        superSwaggySkybox.createSkyboxCubemap();
        console.log("Skybox: Created cubemap");
    }

    //-------------------------------------------------------------------------
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

    //-------------------------------------------------------------------------
    /**
    * Render the skybox 
    */
    drawSkybox(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(skyboxShaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                               gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(skyboxShaderProgram.vertexNormalAttribute, 
                               this.VertexNormalBuffer.itemSize,
                               gl.FLOAT, false, 0, 0);   

        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }

    //-------------------------------------------------------------------------
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
    * Setup the fragment and vertex shaders for skybox
    */
    setupShaders() {
        this.vertexShader = loadShaderFromDOM("skybox-shader-vs");
        this.fragmentShader = loadShaderFromDOM("skybox-shader-fs");

        skyboxShaderProgram = gl.createProgram();
        gl.attachShader(skyboxShaderProgram, this.vertexShader);
        gl.attachShader(skyboxShaderProgram, this.fragmentShader);
        gl.linkProgram(skyboxShaderProgram);

        if (!gl.getProgramParameter(skyboxShaderProgram, gl.LINK_STATUS)) {
            alert("Failed to setup shaders");
        }

        gl.useProgram(skyboxShaderProgram);

        skyboxShaderProgram.vertexPositionAttribute = gl.getAttribLocation(skyboxShaderProgram, "aVertexPositionSky");
        gl.enableVertexAttribArray(skyboxShaderProgram.vertexPositionAttribute);

        skyboxShaderProgram.vertexNormalAttribute = gl.getAttribLocation(skyboxShaderProgram, "aVertexNormalSky");
        gl.enableVertexAttribArray(skyboxShaderProgram.vertexNormalAttribute);

        skyboxShaderProgram.mvMatrixUniform = gl.getUniformLocation(skyboxShaderProgram, "uMVMatrixSky");
        skyboxShaderProgram.pMatrixUniform = gl.getUniformLocation(skyboxShaderProgram, "uPMatrix");
        skyboxShaderProgram.nMatrixUniform = gl.getUniformLocation(skyboxShaderProgram, "uNMatrixSky");

        // skybox setup
        skyboxShaderProgram.uniformSkyboxTextureLocation = gl.getUniformLocation(skyboxShaderProgram, "uSkyboxTexture");
        

    }

    //-------------------------------------------------------------------------
    /**
    * Sends Skybox Modelview matrix to skybox shader
    */
    uploadModelViewMatrixToShader() {
        gl.uniformMatrix4fv(skyboxShaderProgram.mvMatrixUniform, false, mvMatrixSky);
    }

    //-------------------------------------------------------------------------
    /**
    * Sends skybox projection matrix to skybox shader
    */
    uploadProjectionMatrixToShader() {
        gl.uniformMatrix4fv(skyboxShaderProgram.pMatrixUniform, 
                            false, pMatrix);
    }

    //-------------------------------------------------------------------------
    /**
    * Generates and sends the skybox normal matrix to the skybox shader
    */
    uploadNormalMatrixToShader() {
        mat3.fromMat4(nMatrixSky, mvMatrixSky);
        mat3.transpose(nMatrixSky, nMatrixSky);
        mat3.invert(nMatrixSky, nMatrixSky);
        gl.uniformMatrix3fv(skyboxShaderProgram.nMatrixUniform, false, nMatrixSky);
    }

    //----------------------------------------------------------------------------------
    /**
    * Pushes matrix onto modelview matrix stack
    */
    mvPushMatrix() {
        var copy = mat4.clone(mvMatrixSky);
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
        mvMatrixSky = mvMatrixStack.pop();
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
    }

    /**
    * Sends skybox information to the skybox shader
    */
    setSkyboxUniforms() {
        gl.uniform1i(skyboxShaderProgram.uniformSkyboxTextureLocation, 0);
    }

    /**
    * Creates the cubemap for the skybox using the London images
    */
    createSkyboxCubemap() {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

        const faceInfos = [
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                url: 'London/pos-x.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                url: 'London/neg-x.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                url: 'London/pos-y.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                url: 'London/neg-y.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                url: 'London/pos-z.png',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                url: 'London/neg-z.png',
            },
        ];
        faceInfos.forEach((faceInfo) => {
            const {target, url} = faceInfo;

            // Upload the canvas to the cubemap face.
            const level = 0;
            const internalFormat = gl.RGBA;
            const width = 512;
            const height = 512;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;

            // setup each face so it's immediately renderable
            gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

            // Asynchronously load an image
            const image = new Image();
            image.src = url;
            image.addEventListener('load', function() {
                // Now that the image has loaded, uploaded it to the texture
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.texImage2D(target, level, internalFormat, format, type, image);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            });
        });
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }

}