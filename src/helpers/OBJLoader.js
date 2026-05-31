// Parses a .obj file and returns geometry ready for WebGL

export async function loadOBJ(url) {
  const text = await fetch(url).then(r => r.text());
  const lines = text.split('\n');

  const positions = [];
  const normals   = [];
  const texCoords = [];

  const finalPositions = [];
  const finalNormals   = [];
  const finalTexCoords = [];
  const indices        = [];

  const vertCache = {};
  let indexCount = 0;

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === 'v') {
      positions.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
    } else if (parts[0] === 'vn') {
      normals.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
    } else if (parts[0] === 'vt') {
      texCoords.push([parseFloat(parts[1]), parseFloat(parts[2])]);
    } else if (parts[0] === 'f') {
      // Triangulate face (handles quads too)
      const verts = parts.slice(1).map(v => {
        const [pi, ti, ni] = v.split('/').map(x => parseInt(x) - 1);
        return { pi, ti: isNaN(ti) ? 0 : ti, ni: isNaN(ni) ? 0 : ni };
      });
      // Fan triangulation
      for (let i = 1; i < verts.length - 1; i++) {
        for (const vert of [verts[0], verts[i], verts[i+1]]) {
          const key = `${vert.pi}/${vert.ti}/${vert.ni}`;
          if (vertCache[key] === undefined) {
            vertCache[key] = indexCount++;
            const p = positions[vert.pi] || [0,0,0];
            const t = texCoords[vert.ti] || [0,0];
            const n = normals[vert.ni]   || [0,1,0];
            finalPositions.push(...p);
            finalTexCoords.push(...t);
            finalNormals.push(...n);
          }
          indices.push(vertCache[key]);
        }
      }
    }
  }

  return {
    positions: new Float32Array(finalPositions),
    normals:   new Float32Array(finalNormals),
    texCoords: new Float32Array(finalTexCoords),
    indices:   new Uint32Array(indices),  // Uint32 for large meshes
  };
}