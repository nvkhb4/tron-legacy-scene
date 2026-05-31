// Loads 6 face images and creates a WebGL cube map texture

export function loadCubeMap(gl, basePath) {
  const faces = [
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: `${basePath}/px.png` },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: `${basePath}/nx.png` },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: `${basePath}/py.png` },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: `${basePath}/ny.png` },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: `${basePath}/pz.png` },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: `${basePath}/nz.png` },
  ];

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);

  // Placeholder for each face while loading
  for (const f of faces) {
    gl.texImage2D(f.target, 0, gl.RGBA, 1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 5, 10, 255]));
  }

  // Load each face
  const promises = faces.map(f => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
      gl.texImage2D(f.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      resolve();
    };
    img.onerror = () => reject(new Error(`Failed to load cube face: ${f.url}`));
    img.src = f.url;
  }));

  // Once all 6 loaded, generate mipmaps
  Promise.all(promises).then(() => {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  });

  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

  return tex;
}