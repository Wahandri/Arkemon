import * as THREE from 'three';
import {
  PokemonInstance,
  ResourceNode,
  PlacedBuilding,
  BuildingType,
  DamageNumber,
  BossInstance,
  ElementalProjectile,
  ElementType,
} from '../types';
import { POKEMON_SPECIES } from '../pokemonData';
import {
  buildPlayerModel,
  buildToolMesh,
  buildPokemonSpriteGroup,
  PokemonSpriteEntity,
  buildTreeMesh,
  buildRockMesh,
  buildBushMesh,
  buildStructureMesh,
  buildCaptureSphereMesh,
} from './modelBuilders';
import { sound } from '../audio';

export interface ThrownSphere {
  mesh: THREE.Group;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  targetEntityId: string;
  orbType: string;
  progress: number;
  duration: number;
  state: 'flying' | 'wobbling' | 'captured' | 'failed';
  wobbleCount: number;
  wobbleTimer: number;
  captureChance: number;
}

export class SceneManager {
  private container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.OrthographicCamera;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Environment & Lighting
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  public timeOfDay: number = 10; // 0 to 24 hours (10 = 10:00 AM)
  public daySpeed: number = 0.05; // hours per second (~8 mins per full day)

  // Player 3D
  private playerGroup!: THREE.Group;
  private playerRightArm!: THREE.Group;
  private playerToolHolder!: THREE.Group;
  private playerLeftLeg!: THREE.Mesh;
  private playerRightLeg!: THREE.Mesh;
  private currentEquippedTool: string = 'fists';
  public playerAttackAnim: number = 0; // 0 to 1

  // Raycasting & Ground
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  public mouseWorldPos = new THREE.Vector3(0, 0, 0);

  // Entities meshes maps
  private pokemonMeshes = new Map<string, PokemonSpriteEntity>();
  private resourceMeshes = new Map<string, THREE.Group>();
  private buildingMeshes = new Map<string, { group: THREE.Group; light?: THREE.PointLight }>();

  // Boss Mesh & Projectiles
  private bossMesh: PokemonSpriteEntity | null = null;
  public activeProjectiles: { data: ElementalProjectile; mesh: THREE.Mesh }[] = [];
  public trauma: number = 0; // camera shake

  // Thrown capture spheres
  public activeSpheres: ThrownSphere[] = [];

  // Particles
  private particles: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];

  // Building ghost preview
  private ghostGroup: THREE.Group | null = null;
  public activeGhostType: BuildingType | null = null;
  public ghostValid: boolean = true;

  // Callbacks to UI
  public onDamageNumber?: (d: DamageNumber) => void;
  public onPokemonCaptured?: (pokemonId: string, speciesId: string, level: number) => void;
  public onPokemonCaptureFailed?: (pokemonId: string) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7dd3fc); // sky blue
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.015);

    // 2. Camera setup (True 2.5D Isometric Orthographic)
    const aspect = container.clientWidth / Math.max(1, container.clientHeight);
    const frustumSize = 22;
    this.camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      200
    );
    // Classical isometric angle (45° azimuth, ~35.264° elevation)
    this.camera.position.set(24, 28, 24);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // 4. Lighting & Environment
    this.setupLighting();

    // 5. World Terrain & Boundaries
    this.buildTerrain();

    // 6. Player 3D Mesh
    this.setupPlayer();

    // 7. Event listeners
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);

    // 8. Start loop
    this.lastTime = performance.now();
    this.renderLoop();
  }

  private setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x14532d, 0.85);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfef08a, 1.4);
    this.dirLight.position.set(30, 45, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 120;
    this.dirLight.shadow.camera.left = -30;
    this.dirLight.shadow.camera.right = 30;
    this.dirLight.shadow.camera.top = 30;
    this.dirLight.shadow.camera.bottom = -30;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);
  }

  private buildTerrain() {
    // Main playable island terrain (80x80)
    const groundGeo = new THREE.PlaneGeometry(90, 90, 32, 32);
    // Add subtle elevation variation
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const distFromCenter = Math.sqrt(x * x + y * y);
      let height = Math.sin(x * 0.15) * 0.2 + Math.cos(y * 0.15) * 0.2;
      if (distFromCenter > 38) {
        // Taper down to ocean/water edge
        height -= (distFromCenter - 38) * 0.4;
      }
      pos.setZ(i, height);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c0f, // rich ARK wild meadow green
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';
    this.scene.add(ground);

    // Surrounding Ocean Water Plane
    const waterGeo = new THREE.PlaneGeometry(160, 160);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // vibrant sea cyan
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.35;
    this.scene.add(water);

    // Grid helper overlay for building snapping
    const grid = new THREE.GridHelper(80, 40, 0x1e3a1e, 0x1e3a1e);
    grid.position.y = 0.03;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.12;
    this.scene.add(grid);
  }

  private setupPlayer() {
    const { group, rightArm, toolHolder, leftLeg, rightLeg } = buildPlayerModel();
    this.playerGroup = group;
    this.playerRightArm = rightArm;
    this.playerToolHolder = toolHolder;
    this.playerLeftLeg = leftLeg;
    this.playerRightLeg = rightLeg;
    this.scene.add(this.playerGroup);
  }

  public setEquippedTool(toolId: string) {
    if (this.currentEquippedTool === toolId) return;
    this.currentEquippedTool = toolId;

    // Clear old tool mesh
    while (this.playerToolHolder.children.length > 0) {
      this.playerToolHolder.remove(this.playerToolHolder.children[0]);
    }

    if (toolId && toolId !== 'fists') {
      const toolMesh = buildToolMesh(toolId);
      this.playerToolHolder.add(toolMesh);
    }
  }

  public triggerPlayerAttack() {
    this.playerAttackAnim = 1.0;
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = Math.max(1, this.container.clientHeight);
    const aspect = width / height;
    const frustumSize = 22;

    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    const intersect = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, intersect)) {
      this.mouseWorldPos.copy(intersect);
    }
  };

  public syncPokemon(instances: PokemonInstance[]) {
    const currentIds = new Set(instances.map((p) => p.id));

    // Remove deleted
    for (const [id, data] of this.pokemonMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(data.group);
        this.pokemonMeshes.delete(id);
      }
    }

    const t = performance.now() * 0.005;

    // Add or update
    for (const p of instances) {
      let data = this.pokemonMeshes.get(p.id);
      const species = POKEMON_SPECIES[p.speciesId];
      const scale = species?.scale || 1.0;
      const baseW = 1.75 * scale;
      const baseH = 1.75 * scale;

      if (!data) {
        data = buildPokemonSpriteGroup(p.speciesId, scale, false);
        this.scene.add(data.group);
        this.pokemonMeshes.set(p.id, data);
      }

      // Smoothly update position
      data.group.position.set(p.x, 0, p.z);

      // Subtle breathing and idle hop
      const hash = (p.x * 3.7 + p.z * 5.1) % 10;
      const isMoving = p.behavior === 'aggressive' || p.behavior === 'follow';
      const hop = isMoving ? Math.abs(Math.sin(t * 8 + hash)) * 0.12 : Math.sin(t * 3 + hash) * 0.04;
      data.sprite.position.y = baseH * 0.48 + hop;

      // Facing orientation: flip sprite horizontally based on rotation / movement direction
      const facingRight = Math.sin(p.rotation) >= 0;
      data.sprite.scale.x = facingRight ? baseW : -baseW;
    }
  }

  public syncResources(nodes: ResourceNode[]) {
    const currentIds = new Set(nodes.map((n) => n.id));

    for (const [id, mesh] of this.resourceMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.resourceMeshes.delete(id);
      }
    }

    for (const node of nodes) {
      let mesh = this.resourceMeshes.get(node.id);
      if (!mesh) {
        if (node.type === 'tree') {
          mesh = buildTreeMesh();
        } else if (node.type === 'rock') {
          mesh = buildRockMesh(false);
        } else if (node.type === 'boulder') {
          mesh = buildRockMesh(true);
        } else {
          mesh = buildBushMesh();
        }
        mesh.position.set(node.x, 0, node.z);
        this.scene.add(mesh);
        this.resourceMeshes.set(node.id, mesh);
      }

      // Scale or tilt on damage
      const hpRatio = Math.max(0.1, node.hp / node.maxHp);
      mesh.scale.set(1, 0.7 + hpRatio * 0.3, 1);
    }
  }

  public syncBuildings(buildings: PlacedBuilding[]) {
    const currentIds = new Set(buildings.map((b) => b.id));

    for (const [id, item] of this.buildingMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(item.group);
        this.buildingMeshes.delete(id);
      }
    }

    for (const b of buildings) {
      let item = this.buildingMeshes.get(b.id);
      if (!item) {
        item = buildStructureMesh(b.type);
        item.group.position.set(b.x, 0, b.z);
        item.group.rotation.y = b.rotation;
        this.scene.add(item.group);
        this.buildingMeshes.set(b.id, item);
      }
    }
  }

  public setGhostPreview(type: BuildingType | null, isValid: boolean = true) {
    this.activeGhostType = type;
    this.ghostValid = isValid;

    if (!type) {
      if (this.ghostGroup) {
        this.scene.remove(this.ghostGroup);
        this.ghostGroup = null;
      }
      return;
    }

    if (!this.ghostGroup || this.ghostGroup.name !== type) {
      if (this.ghostGroup) this.scene.remove(this.ghostGroup);
      const built = buildStructureMesh(type);
      this.ghostGroup = built.group;
      this.ghostGroup.name = type;

      // Make translucent ghost
      this.ghostGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshBasicMaterial({
            color: isValid ? 0x22c55e : 0xef4444,
            transparent: true,
            opacity: 0.55,
            wireframe: false,
          });
        }
      });
      this.scene.add(this.ghostGroup);
    }

    // Snap to 1m grid
    if (this.ghostGroup) {
      const snapX = Math.round(this.mouseWorldPos.x);
      const snapZ = Math.round(this.mouseWorldPos.z);
      this.ghostGroup.position.set(snapX, 0, snapZ);
    }
  }

  public throwSphere(
    startPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    targetEntityId: string,
    orbType: string,
    captureChance: number
  ) {
    const mesh = buildCaptureSphereMesh(orbType === 'mega_sphere' ? 0x2563eb : 0xdc2626);
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    this.activeSpheres.push({
      mesh,
      startPos: startPos.clone(),
      targetPos: targetPos.clone(),
      targetEntityId,
      orbType,
      progress: 0,
      duration: 0.65,
      state: 'flying',
      wobbleCount: 0,
      wobbleTimer: 0,
      captureChance,
    });

    sound.playSphereThrow();
  }

  public spawnParticles(
    pos: THREE.Vector3,
    color: number = 0xef4444,
    count: number = 8,
    speed: number = 2.5
  ) {
    const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        Math.random() * speed * 0.8 + 1.0,
        (Math.random() - 0.5) * speed
      );

      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= 9.8 * dt; // gravity
      p.mesh.position.addScaledVector(p.velocity, dt);
      const scale = Math.max(0.01, 1 - p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  private updateSpheres(dt: number) {
    for (let i = this.activeSpheres.length - 1; i >= 0; i--) {
      const s = this.activeSpheres[i];

      if (s.state === 'flying') {
        s.progress += dt / s.duration;
        const t = Math.min(1.0, s.progress);

        // Arc trajectory
        s.mesh.position.lerpVectors(s.startPos, s.targetPos, t);
        s.mesh.position.y += Math.sin(t * Math.PI) * 2.5;
        s.mesh.rotation.x += dt * 15;
        s.mesh.rotation.y += dt * 12;

        if (t >= 1.0) {
          // Arrived at target!
          s.state = 'wobbling';
          s.mesh.position.copy(s.targetPos);
          s.mesh.position.y = 0.25;
          sound.playSphereWobble();
          this.spawnParticles(s.targetPos, 0x38bdf8, 12, 3.5);
        }
      } else if (s.state === 'wobbling') {
        s.wobbleTimer += dt;
        // Wobble tilt animation
        s.mesh.rotation.z = Math.sin(s.wobbleTimer * 12) * 0.45;

        if (s.wobbleTimer >= 0.7) {
          s.wobbleTimer = 0;
          s.wobbleCount++;
          sound.playSphereWobble();

          if (s.wobbleCount >= 3) {
            // Check success!
            const roll = Math.random() * 100;
            if (roll <= s.captureChance) {
              s.state = 'captured';
              sound.playCaptureSuccess();
              this.spawnParticles(s.mesh.position, 0xfacc15, 24, 4.0);
              this.onPokemonCaptured?.(s.targetEntityId, '', 1);
            } else {
              s.state = 'failed';
              sound.playDamage();
              this.spawnParticles(s.mesh.position, 0xef4444, 16, 4.0);
              this.onPokemonCaptureFailed?.(s.targetEntityId);
            }

            // Remove sphere mesh after a beat
            setTimeout(() => {
              this.scene.remove(s.mesh);
            }, 600);
            this.activeSpheres.splice(i, 1);
          }
        }
      }
    }
  }

  public addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public syncBoss(boss: BossInstance | null) {
    if (!boss) {
      if (this.bossMesh) {
        this.scene.remove(this.bossMesh.group);
        this.bossMesh = null;
      }
      return;
    }

    if (!this.bossMesh) {
      this.bossMesh = buildPokemonSpriteGroup('charizard', 1.0, true);
      this.scene.add(this.bossMesh.group);
    }

    this.bossMesh.group.position.set(boss.x, 0, boss.z);

    const t = performance.now() * 0.006;
    const baseH = 3.8;
    this.bossMesh.sprite.position.y = baseH * 0.48 + Math.sin(t * 3) * 0.08;

    // Flip horizontally based on facing direction towards player
    const facingRight = Math.sin(boss.rotation) >= 0;
    this.bossMesh.sprite.scale.x = facingRight ? 3.8 : -3.8;

    if (this.bossMesh.pointLight) {
      this.bossMesh.pointLight.intensity = 2.8 + Math.sin(t * 8) * 0.6;
    }
    if (this.bossMesh.aura) {
      this.bossMesh.aura.rotation.z += 0.01;
    }
  }

  public spawnElementalProjectile(data: ElementalProjectile) {
    const geo = new THREE.DodecahedronGeometry(0.25);
    const color =
      data.element === 'fire'
        ? 0xf97316
        : data.element === 'water'
        ? 0x38bdf8
        : data.element === 'grass'
        ? 0x22c55e
        : data.element === 'electric'
        ? 0xfacc15
        : 0x78716c;

    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(data.x, data.y, data.z);
    this.scene.add(mesh);

    this.activeProjectiles.push({ data, mesh });
  }

  private updateProjectiles(dt: number) {
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const p = this.activeProjectiles[i];
      p.data.life += dt;
      if (p.data.life >= p.data.maxLife) {
        this.spawnParticles(p.mesh.position, 0xf59e0b, 6, 2.0);
        this.scene.remove(p.mesh);
        this.activeProjectiles.splice(i, 1);
        continue;
      }

      p.data.x += p.data.vx * dt;
      p.data.y += p.data.vy * dt;
      p.data.z += p.data.vz * dt;
      p.mesh.position.set(p.data.x, p.data.y, p.data.z);

      // Trail particle
      if (Math.random() < 0.4) {
        this.spawnParticles(p.mesh.position, 0xfef08a, 1, 0.5);
      }
    }
  }

  public updatePlayer(
    x: number,
    z: number,
    rotation: number,
    isMoving: boolean,
    dt: number,
    isMounted: boolean = false,
    mountScale: number = 1.0
  ) {
    if (!this.playerGroup) return;

    // If mounted, raise player onto the creature's saddle!
    const playerY = isMounted ? 0.65 * mountScale : 0;
    this.playerGroup.position.set(x, playerY, z);
    this.playerGroup.rotation.y = rotation;

    // Walking leg swing animation
    if (isMounted) {
      // Sitting riding pose
      this.playerLeftLeg.rotation.x = -Math.PI / 4;
      this.playerRightLeg.rotation.x = -Math.PI / 4;
    } else if (isMoving) {
      const walkCycle = Math.sin(performance.now() * 0.012);
      this.playerLeftLeg.rotation.x = walkCycle * 0.65;
      this.playerRightLeg.rotation.x = -walkCycle * 0.65;
    } else {
      this.playerLeftLeg.rotation.x = 0;
      this.playerRightLeg.rotation.x = 0;
    }

    // Attack tool swing animation
    if (this.playerAttackAnim > 0) {
      this.playerAttackAnim = Math.max(0, this.playerAttackAnim - dt * 4.0);
      const swing = Math.sin(this.playerAttackAnim * Math.PI);
      this.playerRightArm.rotation.x = -swing * 1.5;
    } else if (isMoving && !isMounted) {
      this.playerRightArm.rotation.x = -Math.sin(performance.now() * 0.012) * 0.5;
    } else {
      this.playerRightArm.rotation.x = 0;
    }

    // Smooth camera follow (fixed 2.5D offset: +20, 26, +20)
    const targetCamX = x + 20;
    const targetCamZ = z + 20;
    const targetCamY = 26;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.12;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.12;
    this.camera.position.y = targetCamY;

    // Apply Camera Screen Shake (Trauma)
    if (this.trauma > 0) {
      const shake = this.trauma * this.trauma;
      this.camera.position.x += (Math.random() - 0.5) * shake * 1.6;
      this.camera.position.z += (Math.random() - 0.5) * shake * 1.6;
      this.camera.position.y += (Math.random() - 0.5) * shake * 0.8;
      this.trauma = Math.max(0, this.trauma - dt * 2.2);
    }

    this.camera.lookAt(x, 0.5, z);

    // Keep directional sunlight centered around player
    this.dirLight.position.set(x + 25, 40, z + 20);
    this.dirLight.target.position.set(x, 0, z);
    this.dirLight.target.updateMatrixWorld();
  }

  private updateDayNightCycle(dt: number) {
    this.timeOfDay = (this.timeOfDay + this.daySpeed * dt) % 24;

    // Solar angle: 6:00 is sunrise, 12:00 midday, 18:00 sunset, 0:00 midnight
    const isDay = this.timeOfDay >= 5.5 && this.timeOfDay < 19.5;
    const sunProgress = (this.timeOfDay - 6) / 12; // 0 to 1 during daylight

    if (isDay) {
      const sunHeight = Math.sin(Math.max(0, Math.min(Math.PI, sunProgress * Math.PI)));
      this.dirLight.intensity = 0.5 + sunHeight * 1.0;
      this.hemiLight.intensity = 0.4 + sunHeight * 0.45;

      // Warm daytime sky & fog
      const skyHex = sunHeight > 0.3 ? 0x7dd3fc : 0xf97316; // sunset orange or sky blue
      this.scene.background = new THREE.Color(skyHex);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(skyHex);
      }
    } else {
      // Nighttime: Deep indigo blue moonlight
      this.dirLight.intensity = 0.15;
      this.dirLight.color.setHex(0x93c5fd); // cool moon blue
      this.hemiLight.intensity = 0.18;
      const nightHex = 0x090d16;
      this.scene.background = new THREE.Color(nightHex);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(nightHex);
      }
    }
  }

  private renderLoop = () => {
    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05); // clamped simulation step
    this.lastTime = now;

    // Day/night progression
    this.updateDayNightCycle(dt);

    // Dynamic particles, projectiles & thrown spheres
    this.updateParticles(dt);
    this.updateSpheres(dt);
    this.updateProjectiles(dt);

    // Ghost building snap position update
    if (this.ghostGroup && this.activeGhostType) {
      const snapX = Math.round(this.mouseWorldPos.x);
      const snapZ = Math.round(this.mouseWorldPos.z);
      this.ghostGroup.position.set(snapX, 0, snapZ);
    }

    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(this.renderLoop);
  };

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.dispose();
  }
}
