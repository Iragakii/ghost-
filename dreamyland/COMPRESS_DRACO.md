# Draco Compression Commands

Compress models one by one using Draco compression only (no Meshopt).

## Commands for each model:

```bash
# Compress gl.glb
npx @gltf-transform/cli optimize public/pinklocation/gl.glb public/pinklocation/gl.glb --compress draco --texture-compress webp

# Compress iceb.glb
npx @gltf-transform/cli optimize public/pinklocation/iceb.glb public/pinklocation/iceb.glb --compress draco --texture-compress webp

# Compress icee.glb
npx @gltf-transform/cli optimize public/pinklocation/icee.glb public/pinklocation/icee.glb --compress draco --texture-compress webp

# Compress iceo.glb
npx @gltf-transform/cli optimize public/pinklocation/iceo.glb public/pinklocation/iceo.glb --compress draco --texture-compress webp

# Compress icev.glb
npx @gltf-transform/cli optimize public/pinklocation/icek.glb public/pinklocation/icek.glb --compress draco --texture-compress webp

npx @gltf-transform/cli optimize public/pinklocation/icer.glb public/pinklocation/icev.glb --compress draco --texture-compress webp
# Compress luvu.glb
npx @gltf-transform/cli optimize public/luvu.glb public/luvu.glb --compress draco --texture-compress webp
# Compress biar.glb
npx @gltf-transform/cli optimize public/playground/biar.glb public/playground/biar.glb --compress draco --texture-compress webp

# Compress biab.glb
npx @gltf-transform/cli optimize public/playground/biab.glb public/playground/biab.glb --compress draco --texture-compress webp
npx @gltf-transform/cli optimize public/playground/ippoac.glb public/playground/ippoac.glb --compress draco --texture-compress webp
npx @gltf-transform/cli optimize public/playground/monkeytemp.glb public/playground/monkeytemp.glb --compress draco --texture-compress webp
npx @gltf-transform/cli optimize public/pinklocation/minescar.glb public/pinklocation/minescar.glb --compress draco --texture-compress webp
npx @gltf-transform/cli optimize public/pinklocation/retrotv.glb public/pinklocation/retrotv.glb --compress draco --texture-compress webp
npx @gltf-transform/cli optimize public/pinklocation/gock.glb public/pinklocation/gock.glb --compress draco --texture-compress webp
npx @gltf-transform/cli optimize public/pinklocation/handeye.glb public/pinklocation/handeye.glb --compress draco --texture-compress webp

npx @gltf-transform/cli optimize public/pinklocation/icer.glb public/pinklocation/icev.glb --compress draco --texture-compress webp
```

## Note:
- `--compress draco` = use Draco compression (not Meshopt which changes model details)
- `--texture-compress webp` = compress textures to WebP format
- The command overwrites the original file, so make backups first if needed

