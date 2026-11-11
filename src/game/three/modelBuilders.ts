import * as THREE from 'three';
import { BuildingType } from '../types';

// Shared materials cache to minimize draw calls and WebGL state switches
const matCache = new Map<string, THREE.Material>();

function getMat(
  color: number,
  roughness: number = 0.7,
  metalness: number = 0.1,
  emissive?: number
): THREE.MeshStandardMaterial {
  const key = `${color}_${roughness}_${metalness}_${emissive || 0}`;
  if (!matCache.has(key)) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissive ? 0.6 : 0,
      flatShading: true,
    });
    matCache.set(key, mat);
  }
  return matCache.get(key) as THREE.MeshStandardMaterial;
}

// Shadow disc
export function createContactShadow(radius: number = 0.5): THREE.Mesh {
  const geo = new THREE.CircleGeometry(radius, 16);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x0a140d,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  return mesh;
}

// 2.5D Pokemon Sprite Textures & Billboard Entities
const textureLoader = new THREE.TextureLoader();
const spriteTextureCache = new Map<string, THREE.Texture>();

export function getPokemonSpriteTexture(speciesId: string): THREE.Texture {
  if (!spriteTextureCache.has(speciesId)) {
    const tex = textureLoader.load(`/sprites/${speciesId}.png`);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    spriteTextureCache.set(speciesId, tex);
  }
  return spriteTextureCache.get(speciesId)!;
}

export interface PokemonSpriteEntity {
  group: THREE.Group;
  sprite: THREE.Sprite;
  shadow: THREE.Mesh;
  aura?: THREE.Mesh;
  pointLight?: THREE.PointLight;
  tailFlame?: THREE.Mesh;
}

export function buildPokemonSpriteGroup(
  speciesId: string,
  scale: number = 1.0,
  isBoss: boolean = false
): PokemonSpriteEntity {
  const group = new THREE.Group();
  group.name = isBoss ? 'alpha_boss_charizard' : `pokemon_${speciesId}`;

  // 1. Ground contact shadow
  const shadowRadius = isBoss ? 1.5 : 0.5 * scale;
  const shadow = createContactShadow(shadowRadius);
  group.add(shadow);

  // 2. High-res billboard sprite
  const texture = getPokemonSpriteTexture(speciesId);
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(mat);
  const spriteW = isBoss ? 3.8 : 1.75 * scale;
  const spriteH = isBoss ? 3.8 : 1.75 * scale;
  sprite.scale.set(spriteW, spriteH, 1);
  sprite.position.y = spriteH * 0.48;
  group.add(sprite);

  let aura: THREE.Mesh | undefined;
  let pointLight: THREE.PointLight | undefined;

  if (isBoss) {
    // Red glowing fiery ground ring for Alpha Boss
    const ringGeo = new THREE.RingGeometry(1.3, 1.7, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    aura = new THREE.Mesh(ringGeo, ringMat);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.04;
    group.add(aura);

    // Warm fire light
    pointLight = new THREE.PointLight(0xf97316, 3.2, 16);
    pointLight.position.set(0, 2.2, 0);
    group.add(pointLight);
  }

  return { group, sprite, shadow, aura, pointLight };
}

/**
 * Builds composite Survivor Player model (3-8 parts)
 */
export function buildPlayerModel(): {
  group: THREE.Group;
  rightArm: THREE.Group;
  toolHolder: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = 'player';

  // Shadow
  group.add(createContactShadow(0.55));

  // Torso (leather survival vest)
  const torsoGeo = new THREE.BoxGeometry(0.5, 0.65, 0.35);
  const vestMat = getMat(0x78350f, 0.8, 0.1); // leather brown
  const torso = new THREE.Mesh(torsoGeo, vestMat);
  torso.position.y = 0.8;
  torso.castShadow = true;
  group.add(torso);

  // Belt / pouch
  const beltGeo = new THREE.BoxGeometry(0.54, 0.1, 0.38);
  const belt = new THREE.Mesh(beltGeo, getMat(0x292524, 0.6, 0.2));
  belt.position.y = 0.52;
  group.add(belt);

  // Head
  const headGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
  const skinMat = getMat(0xfbcfe8, 0.6, 0.0); // skin
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.35;
  head.castShadow = true;
  group.add(head);

  // Hair / Bandana (survival headband)
  const hairGeo = new THREE.BoxGeometry(0.42, 0.16, 0.42);
  const hair = new THREE.Mesh(hairGeo, getMat(0xb91c1c, 0.7, 0.1)); // red bandana
  hair.position.y = 1.48;
  group.add(hair);

  // Left arm
  const armGeo = new THREE.BoxGeometry(0.16, 0.5, 0.16);
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.35, 0.8, 0);
  group.add(leftArm);

  // Right arm (animated for tools/attack)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 1.0, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
  rightArmMesh.position.set(0, -0.25, 0);
  rightArm.add(rightArmMesh);

  // Tool holder in right hand
  const toolHolder = new THREE.Group();
  toolHolder.position.set(0, -0.45, 0.15);
  rightArm.add(toolHolder);
  group.add(rightArm);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
  const pantsMat = getMat(0x3f3f46, 0.8, 0.1);

  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.15, 0.25, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.15, 0.25, 0);
  group.add(rightLeg);

  return { group, rightArm, toolHolder, leftLeg, rightLeg };
}

/**
 * Builds tool meshes for player hand
 */
export function buildToolMesh(type: string): THREE.Group {
  const tool = new THREE.Group();
  if (type === 'fists') return tool;

  if (type === 'stone_axe') {
    // Handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7), getMat(0x78350f));
    handle.rotation.x = Math.PI / 4;
    tool.add(handle);
    // Axe head
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.06), getMat(0x64748b, 0.5, 0.3));
    blade.position.set(0, 0.25, 0.25);
    blade.rotation.x = Math.PI / 4;
    tool.add(blade);
  } else if (type === 'stone_pickaxe') {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75), getMat(0x78350f));
    handle.rotation.x = Math.PI / 4;
    tool.add(handle);
    const pick = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), getMat(0x475569, 0.4, 0.4));
    pick.position.set(0, 0.28, 0.28);
    pick.rotation.x = Math.PI / 4;
    tool.add(pick);
  } else if (type === 'wooden_club') {
    const club = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.04, 0.7), getMat(0x573a08));
    club.rotation.x = Math.PI / 4;
    tool.add(club);
  } else if (type === 'wooden_spear') {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2), getMat(0x78350f));
    shaft.rotation.x = Math.PI / 4;
    tool.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), getMat(0x94a3b8));
    tip.position.set(0, 0.5, 0.5);
    tip.rotation.x = Math.PI / 4;
    tool.add(tip);
  } else if (type === 'torch') {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6), getMat(0x451a03));
    handle.rotation.x = Math.PI / 4;
    tool.add(handle);
    const flame = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), getMat(0xf97316, 0.3, 0, 0xf97316));
    flame.position.set(0, 0.28, 0.28);
    tool.add(flame);
  } else if (type.includes('sphere')) {
    const sphere = buildCaptureSphereMesh(type === 'mega_sphere' ? 0x2563eb : 0xdc2626);
    sphere.scale.set(0.6, 0.6, 0.6);
    tool.add(sphere);
  }

  return tool;
}

export function buildCaptureSphereMesh(accentColor: number = 0xdc2626): THREE.Group {
  const sphere = new THREE.Group();
  const radius = 0.22;
  // Top half (red or blue)
  const topGeo = new THREE.SphereGeometry(radius, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const topMesh = new THREE.Mesh(topGeo, getMat(accentColor, 0.3, 0.2));
  sphere.add(topMesh);

  // Bottom half (white)
  const bottomGeo = new THREE.SphereGeometry(radius, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const bottomMesh = new THREE.Mesh(bottomGeo, getMat(0xf8fafc, 0.4, 0.1));
  sphere.add(bottomMesh);

  // Middle belt
  const beltGeo = new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, 0.04, 16);
  const beltMesh = new THREE.Mesh(beltGeo, getMat(0x18181b, 0.5, 0.5));
  sphere.add(beltMesh);

  // Button
  const btnGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8);
  const btnMesh = new THREE.Mesh(btnGeo, getMat(0xffffff, 0.2, 0.8));
  btnMesh.rotation.x = Math.PI / 2;
  btnMesh.position.z = radius * 0.98;
  sphere.add(btnMesh);

  return sphere;
}

/**
 * Composite multi-part 3D Pokemon Builders
 */
export function buildPokemonGroup(modelType: string): { group: THREE.Group; tailFlame?: THREE.Mesh } {
  const group = new THREE.Group();
  group.add(createContactShadow(0.45));

  let tailFlame: THREE.Mesh | undefined;

  if (modelType === 'charmander') {
    // Orange body
    const bodyGeo = new THREE.CylinderGeometry(0.28, 0.35, 0.55, 8);
    const body = new THREE.Mesh(bodyGeo, getMat(0xf97316, 0.6, 0.1));
    body.position.y = 0.35;
    group.add(body);

    // Cream belly patch
    const bellyGeo = new THREE.SphereGeometry(0.26, 8, 8, 0, Math.PI, 0, Math.PI);
    const belly = new THREE.Mesh(bellyGeo, getMat(0xfef08a, 0.7, 0));
    belly.position.set(0, 0.33, 0.16);
    belly.rotation.x = -Math.PI / 2;
    belly.scale.set(0.7, 0.25, 0.9);
    group.add(belly);

    // Head
    const headGeo = new THREE.BoxGeometry(0.38, 0.35, 0.38);
    const head = new THREE.Mesh(headGeo, getMat(0xf97316, 0.6, 0.1));
    head.position.set(0, 0.75, 0.05);
    group.add(head);

    // Cute snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.15), getMat(0xf97316, 0.6, 0.1));
    snout.position.set(0, 0.68, 0.27);
    group.add(snout);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.09, 0.02);
    const eyeMat = getMat(0x0284c7); // blue eyes
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, 0.78, 0.24);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, 0.78, 0.24);
    group.add(leftEye, rightEye);

    // Tail
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 0.4, 6), getMat(0xf97316));
    tail.position.set(0, 0.25, -0.3);
    tail.rotation.x = -Math.PI / 3;
    group.add(tail);

    // Flame on tail tip (emissive animated)
    tailFlame = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.1),
      getMat(0xef4444, 0.3, 0, 0xf97316)
    );
    tailFlame.position.set(0, 0.42, -0.45);
    group.add(tailFlame);

    // Limbs
    const legGeo = new THREE.BoxGeometry(0.14, 0.22, 0.16);
    const leftLeg = new THREE.Mesh(legGeo, getMat(0xf97316));
    leftLeg.position.set(-0.2, 0.12, 0);
    const rightLeg = new THREE.Mesh(legGeo, getMat(0xf97316));
    rightLeg.position.set(0.2, 0.12, 0);
    group.add(leftLeg, rightLeg);
  } else if (modelType === 'bulbasaur') {
    // Quadruped turquoise body
    const bodyGeo = new THREE.BoxGeometry(0.48, 0.38, 0.58);
    const body = new THREE.Mesh(bodyGeo, getMat(0x14b8a6, 0.6, 0.1));
    body.position.y = 0.26;
    group.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.34, 0.38);
    const head = new THREE.Mesh(headGeo, getMat(0x14b8a6, 0.6, 0.1));
    head.position.set(0, 0.4, 0.35);
    group.add(head);

    // Pointed ears
    const earGeo = new THREE.ConeGeometry(0.08, 0.16, 4);
    const leftEar = new THREE.Mesh(earGeo, getMat(0x14b8a6));
    leftEar.position.set(-0.16, 0.6, 0.3);
    leftEar.rotation.z = 0.3;
    const rightEar = new THREE.Mesh(earGeo, getMat(0x14b8a6));
    rightEar.position.set(0.16, 0.6, 0.3);
    rightEar.rotation.z = -0.3;
    group.add(leftEar, rightEar);

    // Plant Bulb on back
    const bulbGeo = new THREE.DodecahedronGeometry(0.24);
    const bulb = new THREE.Mesh(bulbGeo, getMat(0x15803d, 0.5, 0.1)); // vibrant forest green
    bulb.position.set(0, 0.52, -0.06);
    bulb.scale.set(1.1, 1.2, 1.1);
    group.add(bulb);

    // 4 sturdy legs
    const legGeo = new THREE.BoxGeometry(0.14, 0.22, 0.14);
    const legMat = getMat(0x14b8a6);
    const fl = new THREE.Mesh(legGeo, legMat);
    fl.position.set(-0.2, 0.11, 0.22);
    const fr = new THREE.Mesh(legGeo, legMat);
    fr.position.set(0.2, 0.11, 0.22);
    const bl = new THREE.Mesh(legGeo, legMat);
    bl.position.set(-0.2, 0.11, -0.22);
    const br = new THREE.Mesh(legGeo, legMat);
    br.position.set(0.2, 0.11, -0.22);
    group.add(fl, fr, bl, br);
  } else if (modelType === 'squirtle') {
    // Sky blue body
    const bodyGeo = new THREE.SphereGeometry(0.32, 8, 8);
    const body = new THREE.Mesh(bodyGeo, getMat(0x38bdf8, 0.6, 0.1));
    body.position.y = 0.35;
    group.add(body);

    // Turtle Shell on back
    const shellGeo = new THREE.SphereGeometry(0.3, 8, 8, 0, Math.PI, 0, Math.PI);
    const shell = new THREE.Mesh(shellGeo, getMat(0xb45309, 0.6, 0.1)); // brown shell
    shell.position.set(0, 0.35, -0.15);
    shell.rotation.x = Math.PI / 2;
    shell.scale.set(0.9, 0.5, 1.1);
    group.add(shell);

    // Shell white rim
    const rimGeo = new THREE.TorusGeometry(0.28, 0.04, 6, 12);
    const rim = new THREE.Mesh(rimGeo, getMat(0xf8fafc));
    rim.position.set(0, 0.35, -0.06);
    group.add(rim);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), getMat(0x38bdf8));
    head.position.set(0, 0.68, 0.12);
    group.add(head);

    // Tail (swirl)
    const tail = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.04, 6, 8), getMat(0x38bdf8));
    tail.position.set(0, 0.28, -0.34);
    group.add(tail);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.12, 0.2, 0.12);
    const leftLeg = new THREE.Mesh(legGeo, getMat(0x38bdf8));
    leftLeg.position.set(-0.18, 0.1, 0);
    const rightLeg = new THREE.Mesh(legGeo, getMat(0x38bdf8));
    rightLeg.position.set(0.18, 0.1, 0);
    group.add(leftLeg, rightLeg);
  } else if (modelType === 'pikachu') {
    // Yellow mouse body
    const bodyGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.45, 8);
    const body = new THREE.Mesh(bodyGeo, getMat(0xfacc15, 0.6, 0.1));
    body.position.y = 0.3;
    group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), getMat(0xfacc15));
    head.position.set(0, 0.65, 0.05);
    group.add(head);

    // Red cheeks
    const cheekGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 6);
    const cheekMat = getMat(0xef4444);
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(-0.18, 0.6, 0.2);
    leftCheek.rotation.y = -Math.PI / 4;
    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.position.set(0.18, 0.6, 0.2);
    rightCheek.rotation.y = Math.PI / 4;
    group.add(leftCheek, rightCheek);

    // Long ears with black tips
    const earGeo = new THREE.ConeGeometry(0.06, 0.28, 4);
    const leftEar = new THREE.Mesh(earGeo, getMat(0xfacc15));
    leftEar.position.set(-0.16, 0.95, 0);
    leftEar.rotation.z = 0.35;
    const rightEar = new THREE.Mesh(earGeo, getMat(0xfacc15));
    rightEar.position.set(0.16, 0.95, 0);
    rightEar.rotation.z = -0.35;
    group.add(leftEar, rightEar);

    // Lightning bolt tail
    const tailSeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.02), getMat(0xd97706));
    tailSeg1.position.set(0, 0.25, -0.25);
    tailSeg1.rotation.x = -Math.PI / 4;
    const tailSeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.02), getMat(0xfacc15));
    tailSeg2.position.set(0, 0.45, -0.32);
    group.add(tailSeg1, tailSeg2);
  } else if (modelType === 'geodude') {
    // Rocky boulder body (granite facets)
    const rockGeo = new THREE.DodecahedronGeometry(0.38, 1);
    const rockMat = getMat(0x78716c, 0.85, 0.1);
    const body = new THREE.Mesh(rockGeo, rockMat);
    body.position.y = 0.45;
    group.add(body);

    // Glowing eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.04, 0.02);
    const eyeMat = getMat(0xffffff, 0.2, 0, 0xffffff);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, 0.48, 0.36);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, 0.48, 0.36);
    group.add(leftEye, rightEye);

    // Floating muscular stone arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.14, 0.38);
    const leftArm = new THREE.Mesh(armGeo, rockMat);
    leftArm.position.set(-0.55, 0.45, 0.1);
    leftArm.rotation.y = Math.PI / 6;
    const rightArm = new THREE.Mesh(armGeo, rockMat);
    rightArm.position.set(0.55, 0.45, 0.1);
    rightArm.rotation.y = -Math.PI / 6;
    group.add(leftArm, rightArm);
  } else if (modelType === 'pidgey') {
    // Avian body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), getMat(0x92400e));
    body.position.y = 0.35;
    group.add(body);

    // Beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 4), getMat(0xf59e0b));
    beak.position.set(0, 0.42, 0.28);
    beak.rotation.x = Math.PI / 2;
    group.add(beak);

    // Wings
    const wingGeo = new THREE.BoxGeometry(0.35, 0.04, 0.2);
    const leftWing = new THREE.Mesh(wingGeo, getMat(0x78350f));
    leftWing.position.set(-0.28, 0.38, 0);
    leftWing.rotation.z = -0.2;
    const rightWing = new THREE.Mesh(wingGeo, getMat(0x78350f));
    rightWing.position.set(0.28, 0.38, 0);
    rightWing.rotation.z = 0.2;
    group.add(leftWing, rightWing);
  }

  return { group, tailFlame };
}

/**
 * Builds the fearsome Alpha Titan Charizard Boss (2.2x scale, obsidian crimson scales, fiery horns, grand wings)
 */
export function buildAlphaBossGroup(): { group: THREE.Group; flameMesh: THREE.Mesh } {
  const group = new THREE.Group();
  group.name = 'alpha_boss';
  group.add(createContactShadow(1.8));

  const darkScaleMat = getMat(0x1e1b4b, 0.7, 0.2); // obsidian dark indigo scales
  const orangeUnderMat = getMat(0xd97706, 0.6, 0.1); // molten ember belly

  // Massive Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.6, 8), darkScaleMat);
  torso.position.y = 1.2;
  torso.castShadow = true;
  group.add(torso);

  // Molten belly plate
  const belly = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.3), orangeUnderMat);
  belly.position.set(0, 1.1, 0.6);
  group.add(belly);

  // Dragon Head with horns
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.75, 1.1), darkScaleMat);
  head.position.set(0, 2.2, 0.6);
  head.castShadow = true;
  group.add(head);

  // Fiery glowing horns
  const hornMat = getMat(0xef4444, 0.2, 0, 0xf97316);
  const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.8, 5), hornMat);
  leftHorn.position.set(-0.35, 2.7, 0.2);
  leftHorn.rotation.set(-0.4, 0, -0.3);
  const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.8, 5), hornMat);
  rightHorn.position.set(0.35, 2.7, 0.2);
  rightHorn.rotation.set(-0.4, 0, 0.3);
  group.add(leftHorn, rightHorn);

  // Glowing eyes
  const eyeMat = getMat(0xfacc15, 0.1, 0, 0xfacc15);
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), eyeMat);
  eyeL.position.set(-0.3, 2.3, 1.1);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), eyeMat);
  eyeR.position.set(0.3, 2.3, 1.1);
  group.add(eyeL, eyeR);

  // Great Draconic Wings
  const wingMat = getMat(0x450a0a, 0.8, 0.05);
  const wingGeo = new THREE.BoxGeometry(1.6, 0.08, 0.9);
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-1.1, 1.8, -0.4);
  leftWing.rotation.set(0.3, 0.3, -0.4);
  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(1.1, 1.8, -0.4);
  rightWing.rotation.set(0.3, -0.3, 0.4);
  group.add(leftWing, rightWing);

  // Heavy tail with roaring flame
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.45, 1.4, 6), darkScaleMat);
  tail.position.set(0, 0.8, -0.9);
  tail.rotation.x = -Math.PI / 3;
  group.add(tail);

  const flameMesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.35),
    getMat(0xef4444, 0.2, 0, 0xf97316)
  );
  flameMesh.position.set(0, 1.4, -1.6);
  group.add(flameMesh);

  return { group, flameMesh };
}

/**
 * Composite Trees (Trunk + 3 layered pine foliage cones)
 */
export function buildTreeMesh(): THREE.Group {
  const tree = new THREE.Group();
  tree.add(createContactShadow(1.1));

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.38, 1.8, 6);
  const trunkMat = getMat(0x451a03, 0.9, 0.05);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.9;
  trunk.castShadow = true;
  tree.add(trunk);

  // 3 Layers of foliage
  const leafMat = getMat(0x166534, 0.75, 0.05);
  const layer1 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.2, 6), leafMat);
  layer1.position.y = 1.9;
  layer1.castShadow = true;

  const layer2 = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.1, 6), leafMat);
  layer2.position.y = 2.6;
  layer2.castShadow = true;

  const layer3 = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.9, 6), leafMat);
  layer3.position.y = 3.2;
  layer3.castShadow = true;

  tree.add(layer1, layer2, layer3);
  return tree;
}

/**
 * Composite Rock / Boulder
 */
export function buildRockMesh(isBoulder: boolean = false): THREE.Group {
  const rock = new THREE.Group();
  const scale = isBoulder ? 1.6 : 0.9;
  rock.add(createContactShadow(scale * 0.8));

  const rockMat = getMat(0x57534e, 0.85, 0.15);

  const m1 = new THREE.Mesh(new THREE.DodecahedronGeometry(scale * 0.5, 0), rockMat);
  m1.position.set(0, scale * 0.35, 0);
  m1.rotation.set(0.2, 0.5, 0.1);
  m1.castShadow = true;

  const m2 = new THREE.Mesh(new THREE.DodecahedronGeometry(scale * 0.35, 0), rockMat);
  m2.position.set(scale * 0.3, scale * 0.25, scale * 0.2);
  m2.rotation.set(-0.3, 0.2, 0.5);

  const m3 = new THREE.Mesh(new THREE.DodecahedronGeometry(scale * 0.3, 0), rockMat);
  m3.position.set(-scale * 0.25, scale * 0.2, -scale * 0.15);

  rock.add(m1, m2, m3);
  return rock;
}

/**
 * Composite Bush with red berry spheres
 */
export function buildBushMesh(): THREE.Group {
  const bush = new THREE.Group();
  bush.add(createContactShadow(0.65));

  const bushMat = getMat(0x15803d, 0.8, 0.05);

  const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), bushMat);
  c1.position.set(0, 0.35, 0);
  c1.castShadow = true;

  const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), bushMat);
  c2.position.set(0.25, 0.28, 0.15);

  const c3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), bushMat);
  c3.position.set(-0.25, 0.28, -0.1);

  bush.add(c1, c2, c3);

  // Red berries
  const berryMat = getMat(0xdc2626, 0.3, 0.1);
  const berryGeo = new THREE.SphereGeometry(0.07, 6, 6);
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(berryGeo, berryMat);
    const angle = (i / 5) * Math.PI * 2;
    b.position.set(Math.cos(angle) * 0.35, 0.3 + (i % 2) * 0.15, Math.sin(angle) * 0.35);
    bush.add(b);
  }

  return bush;
}

/**
 * Composite Structures (Base building)
 */
export function buildStructureMesh(type: BuildingType): { group: THREE.Group; light?: THREE.PointLight } {
  const group = new THREE.Group();
  let light: THREE.PointLight | undefined;

  if (type === 'foundation') {
    const geo = new THREE.BoxGeometry(2.0, 0.2, 2.0);
    const woodPlankMat = getMat(0x854d0e, 0.85, 0.05);
    const floor = new THREE.Mesh(geo, woodPlankMat);
    floor.position.y = 0.1;
    floor.receiveShadow = true;
    group.add(floor);

    // Cross beams
    const beamGeo = new THREE.BoxGeometry(2.05, 0.08, 0.12);
    const beamMat = getMat(0x573a08, 0.9, 0.05);
    const b1 = new THREE.Mesh(beamGeo, beamMat);
    b1.position.set(0, 0.22, -0.6);
    const b2 = new THREE.Mesh(beamGeo, beamMat);
    b2.position.set(0, 0.22, 0.6);
    group.add(b1, b2);
  } else if (type === 'wall') {
    // Palisade wall of timber posts
    const wallGroup = new THREE.Group();
    const woodMat = getMat(0x713f12, 0.9, 0.05);
    for (let i = -0.9; i <= 0.9; i += 0.45) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.8, 6), woodMat);
      post.position.set(i, 0.9, 0);
      post.castShadow = true;
      wallGroup.add(post);
    }
    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.1), woodMat);
    crossBar.position.set(0, 1.0, 0.12);
    wallGroup.add(crossBar);
    group.add(wallGroup);
  } else if (type === 'campfire') {
    group.add(createContactShadow(0.8));
    // Circle of stones
    const stoneMat = getMat(0x57534e);
    for (let i = 0; i < 8; i++) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), stoneMat);
      const angle = (i / 8) * Math.PI * 2;
      stone.position.set(Math.cos(angle) * 0.45, 0.1, Math.sin(angle) * 0.45);
      group.add(stone);
    }
    // Wooden logs criss-crossed
    const logMat = getMat(0x381e05);
    const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), logMat);
    log1.rotation.z = Math.PI / 4;
    log1.position.y = 0.15;
    const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), logMat);
    log2.rotation.z = -Math.PI / 4;
    log2.rotation.y = Math.PI / 2;
    log2.position.y = 0.15;
    group.add(log1, log2);

    // Glowing fire ember
    const fireMesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.18),
      getMat(0xf97316, 0.2, 0, 0xf97316)
    );
    fireMesh.position.y = 0.25;
    group.add(fireMesh);

    // Warm campfire light
    light = new THREE.PointLight(0xff7722, 2.5, 9);
    light.position.set(0, 0.6, 0);
    group.add(light);
  } else if (type === 'storage_chest') {
    group.add(createContactShadow(0.6));
    // Box
    const chestBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.45), getMat(0x854d0e));
    chestBody.position.y = 0.2;
    chestBody.castShadow = true;
    // Lid
    const chestLid = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.12, 0.48), getMat(0x713f12));
    chestLid.position.y = 0.44;
    // Iron latch
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.04), getMat(0x27272a, 0.4, 0.8));
    latch.position.set(0, 0.35, 0.24);
    group.add(chestBody, chestLid, latch);
  } else if (type === 'pal_bed') {
    group.add(createContactShadow(0.9));
    // Straw bedding
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.9), getMat(0xfde047, 0.9, 0.05));
    bed.position.y = 0.1;
    // Wood border
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.12, 0.98), getMat(0x78350f));
    frame.position.y = 0.06;
    group.add(frame, bed);
  } else if (type === 'torch_post') {
    group.add(createContactShadow(0.4));
    // Tall post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.8, 6), getMat(0x451a03));
    post.position.y = 0.9;
    post.castShadow = true;
    // Basket
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.2, 6), getMat(0x27272a, 0.4, 0.8));
    basket.position.y = 1.8;
    // Flame
    const flame = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.12),
      getMat(0xf97316, 0.2, 0, 0xf97316)
    );
    flame.position.y = 1.95;
    group.add(post, basket, flame);

    light = new THREE.PointLight(0xff8833, 2.0, 8);
    light.position.set(0, 2.0, 0);
    group.add(light);
  }

  return { group, light };
}
