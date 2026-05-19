// Mesh builders: box, grid, and VAO factory

export function buildBox(w=1, h=1, d=1) {
  const hw=w/2, hh=h/2, hd=d/2;
  // 6 faces × 4 verts each
  const faces = [
    // pos x
    { n:[1,0,0],  verts:[[hw,-hh,-hd],[hw, hh,-hd],[hw, hh, hd],[hw,-hh, hd]] },
    // neg x
    { n:[-1,0,0], verts:[[-hw,-hh, hd],[-hw, hh, hd],[-hw, hh,-hd],[-hw,-hh,-hd]] },
    // pos y
    { n:[0,1,0],  verts:[[-hw, hh,-hd],[-hw, hh, hd],[ hw, hh, hd],[ hw, hh,-hd]] },
    // neg y
    { n:[0,-1,0], verts:[[-hw,-hh, hd],[-hw,-hh,-hd],[ hw,-hh,-hd],[ hw,-hh, hd]] },
    // pos z
    { n:[0,0,1],  verts:[[-hw,-hh, hd],[ hw,-hh, hd],[ hw, hh, hd],[-hw, hh, hd]] },
    // neg z
    { n:[0,0,-1], verts:[[ hw,-hh,-hd],[-hw,-hh,-hd],[-hw, hh,-hd],[ hw, hh,-hd]] },
  ];
  const positions=[], normals=[], texCoords=[], indices=[];
  let base=0;
  const uvs=[[0,0],[1,0],[1,1],[0,1]];
  for (const f of faces) {
    for (let i=0;i<4;i++) {
      positions.push(...f.verts[i]);
      normals.push(...f.n);
      texCoords.push(...uvs[i]);
    }
    indices.push(base,base+1,base+2, base,base+2,base+3);
    base+=4;
  }
  return {
    positions: new Float32Array(positions),
    normals:   new Float32Array(normals),
    texCoords: new Float32Array(texCoords),
    indices:   new Uint16Array(indices)
  };
}

export function buildGrid(size=40, divisions=40) {
  // Flat XZ grid plane — thin quads along grid lines
  // We'll just use a single flat box scaled to be a thin plane
  return buildBox(size, 0.02, size);
}

export function createMesh(gl, prog, geo) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  function buf(data, attrib, size) {
    const loc = gl.getAttribLocation(prog, attrib);
    if (loc < 0) return;
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }

  buf(geo.positions, 'aPosition', 3);
  buf(geo.normals,   'aNormal',   3);
  buf(geo.texCoords, 'aTexCoord', 2);

  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);

  gl.bindVertexArray(null);
  return { vao, count: geo.indices.length };
}
