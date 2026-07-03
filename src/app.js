import * as THREE from 'https://esm.sh/three@0.164.1';
import { OrbitControls } from 'https://esm.sh/three@0.164.1/examples/jsm/controls/OrbitControls.js';
import { geoAlbersUsa } from 'https://esm.sh/d3-geo@3.1.1';

const DATA = window.COMPLAINT_DATA;
const fmt = new Intl.NumberFormat('en-US');
const $ = (id) => document.getElementById(id);

const stateNames = {
  AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California', CO:'Colorado', CT:'Connecticut', DE:'Delaware', DC:'District of Columbia', FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina', SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming', PR:'Puerto Rico'
};
const nameToCode = Object.fromEntries(Object.entries(stateNames).map(([k,v]) => [v, k]));

function initStats(){
  $('sampleRows').textContent = fmt.format(DATA.meta.sampleRows);
  const total = Object.values(DATA.states).reduce((s,d)=>s+d.count,0);
  const topState = Object.entries(DATA.states).sort((a,b)=>b[1].count-a[1].count)[0];
  $('stats').innerHTML = [
    [fmt.format(DATA.meta.sampleRows), 'public complaint rows sampled'],
    [fmt.format(total), 'rows with state codes'],
    [DATA.products[0][0].replace('Credit reporting or other personal consumer reports','Credit reporting'), 'top complaint product'],
    [`${topState[0]}`, `${stateNames[topState[0]]} screams loudest in sample`],
  ].map(([n,l])=>`<div class="stat"><b>${n}</b><span>${l}</span></div>`).join('');
}

function initBoards(){
  $('productWall').innerHTML = DATA.products.slice(0,8).map(([name,count],i)=>`<div class="poster"><small>#${i+1} product</small><b>${shortProduct(name)}</b><p>${fmt.format(count)} complaints. ${snark(name)}</p></div>`).join('');
  $('companyBoard').innerHTML = DATA.companies.slice(0,10).map(([name,count],i)=>`<div class="rank-row"><b>${i+1}</b><span>${name}</span><b>${fmt.format(count)}</b></div>`).join('');
  const issueCards = DATA.issues.slice(0,9).map(([issue,count],i)=>({issue,count, text: issue}));
  $('storyCards').innerHTML = issueCards.map((d,i)=>`<div class="story"><small>Issue #${i+1} · ${fmt.format(d.count)}</small><strong>${d.issue}</strong><p>${storyForIssue(d.issue, d.count)}</p></div>`).join('');
}
function shortProduct(s){return s.replace('Credit reporting or other personal consumer reports','Credit reporting').replace('Credit reporting, credit repair services, or other personal consumer reports','Credit reporting').replace('Money transfer, virtual currency, or money service','Money transfer / crypto').replace('Checking or savings account','Checking / savings');}
function snark(s){
  if(s.includes('Credit reporting')) return 'The algorithmic reputation machine is apparently not beloved.';
  if(s.includes('Debt collection')) return 'A genre of phone call nobody asked to receive.';
  if(s.includes('Checking')) return 'Where did the money go? A classic bank mystery.';
  if(s.includes('Credit card')) return 'Plastic rectangle, plot twist included.';
  return 'Fine print found a new way to become a personality.';
}
function storyForIssue(issue, count){
  const prefix = `${fmt.format(count)} complaints in this sample are coded here. `;
  if(/Incorrect information/i.test(issue)) return prefix + 'Consumers are disputing records they say are inaccurate, incomplete, duplicated, outdated, or attached to the wrong person.';
  if(/problem with.*investigation|investigation/i.test(issue)) return prefix + 'Consumers say the company did not adequately review, explain, or correct a dispute after they challenged the information.';
  if(/debt.*not yours|debt/i.test(issue)) return prefix + 'These complaints involve collection activity, disputed debts, verification problems, or attempts to collect money the consumer says is not owed.';
  if(/Improper use/i.test(issue)) return prefix + 'Consumers report their credit report or personal financial data was accessed, used, or shared in a way they believe was improper.';
  if(/Problem with a company's investigation/i.test(issue)) return prefix + 'Consumers say the company response to a dispute did not resolve the underlying credit-reporting problem.';
  if(/account/i.test(issue)) return prefix + 'Consumers are reporting trouble opening, closing, accessing, managing, or correcting a bank or financial account.';
  if(/payment/i.test(issue)) return prefix + 'Consumers are reporting payments that were misapplied, delayed, not credited, or difficult to stop or verify.';
  if(/communication|contact/i.test(issue)) return prefix + 'Consumers are reporting problems with how or when a company contacted them, including confusing, repeated, or unwanted contact.';
  if(/fees?|interest/i.test(issue)) return prefix + 'Consumers are reporting charges, fees, interest, or pricing that they say was unexpected, incorrect, or poorly explained.';
  if(/closing|escrow|servicing|mortgage/i.test(issue)) return prefix + 'These complaints relate to mortgage servicing, closing, escrow, payoff, or loan-administration problems.';
  if(/fraud|scam|identity/i.test(issue)) return prefix + 'Consumers are reporting suspected fraud, identity theft, or transactions they say they did not authorize.';
  return prefix + 'This is the CFPB issue category assigned to the complaint; it summarizes the consumer-reported problem without using private narrative text.';
}

class ComplaintMap3D{
  constructor(container){
    this.container=container; this.meshes=[]; this.hovered=null; this.selected=null;
    this.lockedView = {
      cameraPosition: new THREE.Vector3(18.33, -296.18, 824.73),
      controlsTarget: new THREE.Vector3(10.72, -163.29, 0.95),
      groupPosition: new THREE.Vector3(37.37, -146.26, -20),
      groupRotation: new THREE.Euler(THREE.MathUtils.degToRad(-5), 0, 0),
      groupScale: new THREE.Vector3(0.74, 0.74, 0.74)
    };
    // Desktop is intentionally locked to the approved composition above.
    // This mobile-only view keeps the same angle, but pulls the map back so
    // the full USA fits inside the narrow phone canvas.
    this.mobileLockedView = {
      cameraPosition: this.lockedView.cameraPosition.clone(),
      controlsTarget: this.lockedView.controlsTarget.clone(),
      groupPosition: new THREE.Vector3(44, -145, -20),
      groupRotation: this.lockedView.groupRotation.clone(),
      groupScale: new THREE.Vector3(0.60, 0.60, 0.60)
    };
    this.equalStateDepth = 42;
    this.scene=new THREE.Scene();
    this.scene.fog=new THREE.Fog(0x04031f, 520, 1350);
    this.camera=new THREE.PerspectiveCamera(45,1,1,3000);
    this.camera.position.copy(this.lockedView.cameraPosition);
    this.renderer=new THREE.WebGLRenderer({antialias:true, alpha:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.shadowMap.enabled=true;
    container.appendChild(this.renderer.domElement);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=false; this.controls.enableRotate=false; this.controls.enablePan=false; this.controls.enableZoom=false;
    this.controls.target.copy(this.lockedView.controlsTarget);
    this.camera.lookAt(this.controls.target);
    this.raycaster=new THREE.Raycaster(); this.pointer=new THREE.Vector2();
    this.group=new THREE.Group(); this.scene.add(this.group);
    this.maxCount=Math.max(...Object.values(DATA.states).map(d=>d.count));
    this.addLights(); this.addBase(); this.bind(); this.resize();
    fetch('./src/us-states.json').then(r=>r.json()).then(g=>this.build(g));
    requestAnimationFrame(()=>this.animate());
  }
  addLights(){
    this.scene.add(new THREE.AmbientLight(0x26105a,.95));
    const key=new THREE.DirectionalLight(0x37f6ff,1.35); key.position.set(-240,-280,600); key.castShadow=true; this.scene.add(key);
    const pink=new THREE.PointLight(0xff1bbd,1.75,950); pink.position.set(-420,-360,280); this.scene.add(pink);
    const orange=new THREE.PointLight(0xff7a2f,1.15,850); orange.position.set(320,120,360); this.scene.add(orange);
    const blue=new THREE.PointLight(0x2878ff,.9,900); blue.position.set(120,-500,260); this.scene.add(blue);
  }
  addBase(){
    // Grid intentionally removed so the USA floats cleanly in the neon scene.
  }
  bind(){
    window.addEventListener('resize',()=>this.resize());
    this.renderer.domElement.addEventListener('pointermove',e=>this.onMove(e));
    this.renderer.domElement.addEventListener('click',e=>this.onClick(e));
  }

  activeView(){
    const sceneWidth=this.container.getBoundingClientRect().width;
    const viewportWidth=Math.min(window.innerWidth || sceneWidth, document.documentElement.clientWidth || sceneWidth);
    const shouldUseMobileView=viewportWidth <= 900 || sceneWidth <= 760 || window.matchMedia('(max-width: 900px)').matches;
    return shouldUseMobileView ? this.mobileLockedView : this.lockedView;
  }
  applyView(){
    const view=this.activeView();
    this.camera.position.copy(view.cameraPosition);
    this.controls.target.copy(view.controlsTarget);
    this.group.position.copy(view.groupPosition);
    this.group.rotation.copy(view.groupRotation);
    this.group.scale.copy(view.groupScale);
    this.camera.lookAt(this.controls.target);
  }
  resize(){
    const r=this.container.getBoundingClientRect(); this.camera.aspect=r.width/r.height; this.camera.updateProjectionMatrix(); this.renderer.setSize(r.width,r.height,false); this.applyView();
  }
  build(geojson){
    const projection=geoAlbersUsa().scale(1180).translate([0,0]);
    const materialBase=new THREE.MeshStandardMaterial({color:0x18f7ff, roughness:.42, metalness:.22, emissive:0x070018});
    const edgeMat=new THREE.LineBasicMaterial({color:0x18f7ff, transparent:true, opacity:.72});
    for(const f of geojson.features){
      const code=nameToCode[f.properties.name]; if(!code || !DATA.states[code]) continue;
      const state=DATA.states[code];
      const depth=this.equalStateDepth;
      const shapes=this.featureToShapes(f, projection);
      for(const shape of shapes){
        const geom=new THREE.ExtrudeGeometry(shape,{depth, bevelEnabled:true, bevelThickness:1.5, bevelSize:1.8, bevelSegments:1});
        const mat=materialBase.clone(); mat.color.set(this.colorForCount(state.count));
        const mesh=new THREE.Mesh(geom,mat); mesh.castShadow=true; mesh.receiveShadow=true; mesh.userData={code,state,baseZ:0,baseY:0,targetZ:0,targetY:0,selected:false,depth};
        const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geom), edgeMat); mesh.add(edges);
        this.group.add(mesh); this.meshes.push(mesh);
      }
    }
    this.group.position.copy(this.lockedView.groupPosition);
    this.group.rotation.copy(this.lockedView.groupRotation);
    this.group.scale.copy(this.lockedView.groupScale);
    this.selectState('CA');
  }
  featureToShapes(feature, projection){
    const polys=feature.geometry.type==='Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    const shapes=[];
    for(const poly of polys){
      const exterior=this.ring(poly[0],projection); if(exterior.length<3) continue;
      const shape=new THREE.Shape(exterior);
      for(const hole of poly.slice(1)){ const h=this.ring(hole,projection); if(h.length>2) shape.holes.push(new THREE.Path(h)); }
      shapes.push(shape);
    }
    return shapes;
  }
  ring(coords, projection){
    const pts=[];
    for(const c of coords){ const p=projection(c); if(p) pts.push(new THREE.Vector2(p[0],-p[1])); }
    return pts;
  }
  colorForCount(count){
    const t=count/this.maxCount;
    if(t>.65) return 0xff3f8f; if(t>.35) return 0xff7a2f; if(t>.18) return 0x7b1dff; if(t>.08) return 0x18f7ff; return 0x2852ff;
  }
  setPointer(e){ const r=this.renderer.domElement.getBoundingClientRect(); this.pointer.x=((e.clientX-r.left)/r.width)*2-1; this.pointer.y=-((e.clientY-r.top)/r.height)*2+1; }
  intersect(){ this.raycaster.setFromCamera(this.pointer,this.camera); return this.raycaster.intersectObjects(this.meshes,false)[0]?.object; }
  onMove(e){ this.setPointer(e); const hit=this.intersect(); if(hit!==this.hovered){ if(this.hovered && !this.hovered.userData.selected) this.hovered.material.emissive.set(0x070018); this.hovered=hit; if(hit && !hit.userData.selected) hit.material.emissive.set(0x2b0044); this.container.style.cursor=hit?'pointer':'default'; } }
  onClick(e){ this.setPointer(e); const hit=this.intersect(); if(hit) this.selectState(hit.userData.code); }
  selectState(code){
    for(const m of this.meshes){ m.userData.selected=false; m.userData.targetZ=0; m.userData.targetY=0; m.material.emissive.set(0x070018); }
    const selected=this.meshes.filter(m=>m.userData.code===code);
    selected.forEach(m=>{m.userData.selected=true; m.userData.targetZ=95; m.userData.targetY=-45; m.material.emissive.set(0x4f0050);});
    this.selected=selected[0]; this.updateDossier(code);
  }
  updateDossier(code){
    const d=DATA.states[code], name=stateNames[code]||code;
    $('stateName').textContent=`${code} / ${name}`; $('stateCaption').textContent=d.caption; $('stateCount').textContent=fmt.format(d.count);
    $('stateDetails').innerHTML=`
      <div class="detail"><b>Top product</b><span>${shortProduct(d.topProduct)}</span></div>
      <div class="detail"><b>Top issue</b><span>${d.topIssue}</span></div>
      <div class="detail"><b>Most named company</b><span>${d.topCompany}</span></div>
      <div class="detail"><b>Issue stack</b><span>${d.issues.slice(0,3).map(x=>`${x[0]} (${fmt.format(x[1])})`).join('<br>')}</span></div>`;
  }
  animate(){
    requestAnimationFrame(()=>this.animate());
    for(const m of this.meshes){ m.position.z += (m.userData.targetZ-m.position.z)*.09; m.position.y += (m.userData.targetY-m.position.y)*.09; }
    const view=this.activeView();
    this.camera.position.copy(view.cameraPosition);
    this.controls.target.copy(view.controlsTarget);
    this.group.position.copy(view.groupPosition);
    this.group.rotation.copy(view.groupRotation);
    this.group.scale.copy(view.groupScale);
    this.controls.update(); this.renderer.render(this.scene,this.camera);
  }
}

initStats(); initBoards();
window.complaintMap = new ComplaintMap3D($('scene'));
